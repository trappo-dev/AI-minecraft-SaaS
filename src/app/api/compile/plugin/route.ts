import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import * as https from 'https'
import AdmZip from 'adm-zip'

export const runtime = 'nodejs'
export const maxDuration = 60

const execAsync = promisify(exec)

// Cache directory for API jars
const CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'jars')

// PaperMC exact snapshot artifact URLs (Base directories for maven-metadata.xml resolution)
const PAPER_API_URLS: Record<string, string> = {
  '1.21.4': 'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.21.4-R0.1-SNAPSHOT/',
  '1.21.3': 'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.21.3-R0.1-SNAPSHOT/',
  '1.21':   'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.21-R0.1-SNAPSHOT/',
  '1.20.6': 'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.20.6-R0.1-SNAPSHOT/',
  '1.20.4': 'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.20.4-R0.1-SNAPSHOT/',
  '1.20.1': 'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.20.1-R0.1-SNAPSHOT/',
  '1.19.4': 'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.19.4-R0.1-SNAPSHOT/',
  '1.19.2': 'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.19.2-R0.1-SNAPSHOT/',
  '1.18.2': 'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.18.2-R0.1-SNAPSHOT/',
}

// PaperMC exact snapshot artifact URLs for legacy versions
const PAPER_LEGACY_API_URLS: Record<string, string> = {
  '1.17.1': 'https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.17.1-R0.1-SNAPSHOT/paper-api-1.17.1-R0.1-20220414.034903-311.jar',
  '1.16.5': 'https://repo.papermc.io/repository/maven-public/com/destroystokyo/paper/paper-api/1.16.5-R0.1-SNAPSHOT/paper-api-1.16.5-R0.1-20211218.082619-371-shaded.jar',
  '1.16.4': 'https://repo.papermc.io/repository/maven-public/com/destroystokyo/paper/paper-api/1.16.5-R0.1-SNAPSHOT/paper-api-1.16.5-R0.1-20211218.082619-371-shaded.jar',
  '1.12.2': 'https://repo.papermc.io/repository/maven-public/com/destroystokyo/paper/paper-api/1.12.2-R0.1-SNAPSHOT/paper-api-1.12.2-R0.1-20190714.184133-413-shaded.jar',
  '1.8.9':  'https://repo.papermc.io/repository/maven-public/org/github/paperspigot/paperspigot-api/1.8.8-R0.1-SNAPSHOT/paperspigot-api-1.8.8-R0.1-20160806.221350-1-shaded.jar',
  '1.8.8':  'https://repo.papermc.io/repository/maven-public/org/github/paperspigot/paperspigot-api/1.8.8-R0.1-SNAPSHOT/paperspigot-api-1.8.8-R0.1-20160806.221350-1-shaded.jar',
}

const ALL_API_URLS: Record<string, string> = { ...PAPER_API_URLS, ...PAPER_LEGACY_API_URLS }

// Download a file from URL to local path
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(dest)
    const request = https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        // Follow redirect
        downloadFile(response.headers.location!, dest).then(resolve).catch(reject)
        return
      }
      if (response.statusCode !== 200) {
        file.close()
        require('fs').promises.unlink(dest).catch(() => {}) // Cleanup empty file
        reject(new Error(`HTTP ${response.statusCode} downloading ${url}`))
        return
      }
      response.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    })
    request.on('error', (err) => {
      file.close()
      require('fs').promises.unlink(dest).catch(() => {})
      reject(err)
    })
    file.on('error', (err) => {
      file.close()
      require('fs').promises.unlink(dest).catch(() => {})
      reject(err)
    })
  })
}

// Get or download the API jar for a given MC version
async function getApiJar(mcVersion: string): Promise<string> {
  await fs.mkdir(CACHE_DIR, { recursive: true })

  // Find URL — exact match first, then fall back to 1.20.4 Paper API
  let baseUrl = ALL_API_URLS[mcVersion] ?? PAPER_API_URLS['1.20.4']

  // Cache key uses canonical version (1.8.9 → 1.8.8 jar cached as 1.8.9)
  const jarName = `api-${mcVersion}.jar`
  const jarPath = path.join(CACHE_DIR, jarName)
  let isCached = false

  try {
    const stats = await fs.stat(jarPath)
    if (stats.size > 100000) {
      console.log(`[COMPILE] Using cached API jar: ${jarPath} (${stats.size} bytes)`)
      isCached = true
    } else {
      console.log(`[COMPILE] Cached jar ${jarPath} is too small (${stats.size} bytes), redownloading...`)
    }
  } catch {
    // File doesn't exist or is invalid
  }

  if (!isCached) {
    // If URL is a directory, resolve the latest snapshot jar via maven-metadata.xml
    let downloadUrl = baseUrl
    if (baseUrl.endsWith('/')) {
      console.log(`[COMPILE] Resolving maven-metadata.xml for ${mcVersion}...`)
      try {
        const metadataUrl = baseUrl + 'maven-metadata.xml'
        const response = await fetch(metadataUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const xml = await response.text()
        const artifactIdMatch = xml.match(/<artifactId>(.*?)<\/artifactId>/)
        const valueMatch = xml.match(/<value>(.*?)<\/value>/)
        
        if (artifactIdMatch && valueMatch) {
          const jarFilename = `${artifactIdMatch[1]}-${valueMatch[1]}.jar`
          downloadUrl = baseUrl + jarFilename
        } else {
          throw new Error('Failed to parse maven-metadata.xml')
        }
      } catch (e) {
        console.error(`[COMPILE] Error resolving metadata for ${mcVersion}:`, e)
        throw new Error(`Failed to resolve API URL for ${mcVersion}`)
      }
    }

    console.log(`[COMPILE] Downloading API jar for ${mcVersion} from ${downloadUrl}...`)
    await downloadFile(downloadUrl, jarPath)
    
    // Double-check file was downloaded successfully
    const newStats = await fs.stat(jarPath)
    if (newStats.size < 100000) {
      throw new Error('Downloaded jar is invalid or empty')
    }
    console.log(`[COMPILE] Downloaded: ${jarPath} (${newStats.size} bytes)`)
  }

  // Modern Paper versions need Kyori Adventure and BungeeCord Chat in classpath to compile correctly
  const helperJars: string[] = []
  if (!PAPER_LEGACY_API_URLS[mcVersion]) { // Only for modern versions 1.18+ (legacy are shaded)
    const adventureUrl = 'https://repo1.maven.org/maven2/net/kyori/adventure-api/4.17.0/adventure-api-4.17.0.jar'
    const adventureKeyUrl = 'https://repo1.maven.org/maven2/net/kyori/adventure-key/4.17.0/adventure-key-4.17.0.jar'
    const bungeeUrl = 'https://repo1.maven.org/maven2/net/md-5/bungeecord-chat/1.20-R0.2/bungeecord-chat-1.20-R0.2.jar'
    const guavaUrl = 'https://repo1.maven.org/maven2/com/google/guava/guava/32.1.2-jre/guava-32.1.2-jre.jar'
    const gsonUrl = 'https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar'
    
    const adventurePath = path.join(CACHE_DIR, 'adventure-api.jar')
    const adventureKeyPath = path.join(CACHE_DIR, 'adventure-key.jar')
    const bungeePath = path.join(CACHE_DIR, 'bungeecord-chat.jar')
    const guavaPath = path.join(CACHE_DIR, 'guava.jar')
    const gsonPath = path.join(CACHE_DIR, 'gson.jar')

    // Download if missing
    try { await fs.access(adventurePath) } catch { await downloadFile(adventureUrl, adventurePath) }
    try { await fs.access(adventureKeyPath) } catch { await downloadFile(adventureKeyUrl, adventureKeyPath) }
    try { await fs.access(bungeePath) } catch { await downloadFile(bungeeUrl, bungeePath) }
    try { await fs.access(guavaPath) } catch { await downloadFile(guavaUrl, guavaPath) }
    try { await fs.access(gsonPath) } catch { await downloadFile(gsonUrl, gsonPath) }

    helperJars.push(adventurePath, adventureKeyPath, bungeePath, guavaPath, gsonPath)
  }

  return [jarPath, ...helperJars].join(path.delimiter)
}

// Parse generated code into separate files
function parseGeneratedCode(code: string): { javaCode: string; pluginYml: string | null; className: string; packageName: string } {
  const separator = /\/\/\s*={3,}\s*plugin\.yml\s*={3,}/i
  const parts = code.split(separator)

  const javaCode = parts[0].trim()
  const pluginYml = parts[1]?.trim() ?? null

  // Extract package and class name
  const packageMatch = javaCode.match(/^package\s+([\w.]+)\s*;/m)
  const classMatch = javaCode.match(/public\s+class\s+(\w+)/)
  const packageName = packageMatch?.[1] ?? 'com.trappolagiodev.plugin'
  const className = classMatch?.[1] ?? 'MainPlugin'

  return { javaCode, pluginYml, className, packageName }
}

// Generate a default plugin.yml if not present
function generatePluginYml(className: string, packageName: string, pluginName: string): string {
  return `name: ${pluginName}
version: 1.0.0
main: ${packageName}.${className}
api-version: '1.20'
author: TrappolaGIoDev
description: Plugin generato da TrappolaGIoDev AI
`
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { code, mcVersion = '1.20.4', pluginName = 'MioPlugin' } = await request.json() as {
    code: string
    mcVersion?: string
    pluginName?: string
  }

  if (!code?.trim()) {
    return NextResponse.json({ error: 'Codice Java richiesto' }, { status: 400 })
  }

  // Check Java is available
  try {
    await execAsync('javac -version', { timeout: 5000 })
  } catch {
    return NextResponse.json(
      {
        error: 'Java JDK non trovato sul server. Installa JDK 17+ per abilitare la compilazione.',
        javaRequired: true,
      },
      { status: 503 }
    )
  }

  // Parse the generated code
  const { javaCode, pluginYml, className, packageName } = parseGeneratedCode(code)
  const finalPluginYml = pluginYml ?? generatePluginYml(className, packageName, pluginName)

  // Create temp directory
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trappolagio-compile-'))
  const srcDir = path.join(tmpDir, 'src', ...packageName.split('.'))
  const classesDir = path.join(tmpDir, 'classes')
  const jarPath = path.join(tmpDir, `${pluginName}.jar`)
  const manifestPath = path.join(tmpDir, 'manifest.mf')
  const pluginYmlPath = path.join(classesDir, 'plugin.yml')

  try {
    // Create directories
    await fs.mkdir(srcDir, { recursive: true })
    await fs.mkdir(classesDir, { recursive: true })

    // Write Java source file
    const javaFilePath = path.join(srcDir, `${className}.java`)
    await fs.writeFile(javaFilePath, javaCode, 'utf8')

    // Write plugin.yml to classes dir (so it gets included in jar)
    await fs.writeFile(pluginYmlPath, finalPluginYml, 'utf8')

    // Note: Manifest is written directly to memory below when building the zip

    // Get/download API jar
    let apiJarPath: string
    try {
      apiJarPath = await getApiJar(mcVersion)
    } catch (downloadErr) {
      return NextResponse.json(
        { error: `Impossibile scaricare l'API PaperMC ${mcVersion}. Verifica la connessione internet.` },
        { status: 502 }
      )
    }

    // Compile Java source
    // Notice that apiJarPath is now a classpath string containing multiple jars joined by path.delimiter
    const compileCmd = `javac -encoding UTF-8 -classpath "${apiJarPath}" -d "${classesDir}" "${javaFilePath}"`
    try {
      const { stderr } = await execAsync(compileCmd, { timeout: 30000 })
      if (stderr) console.warn('[COMPILE] javac stderr:', stderr)
    } catch (compileErr: unknown) {
      const errMsg = compileErr instanceof Error
        ? compileErr.message
        : String(compileErr)
      // Extract actual compile error from message
      const errorLines = errMsg
        .split('\n')
        .filter(l => l.includes('error:') || l.includes('^') || l.match(/\.java:\d+/))
        .slice(0, 10)
        .join('\n')

      return NextResponse.json(
        {
          error: 'Errore di compilazione Java:',
          details: errorLines || errMsg.slice(0, 500),
          compileError: true,
        },
        { status: 422 }
      )
    }

    // Package into JAR using adm-zip instead of system 'jar' command
    const zip = new AdmZip()
    // Add all compiled classes and plugin.yml
    zip.addLocalFolder(classesDir, '')
    // Add standard Java MANIFEST.MF
    zip.addFile('META-INF/MANIFEST.MF', Buffer.from(`Manifest-Version: 1.0\nCreated-By: TrappolaGIoDev\n`, 'utf8'))
    zip.writeZip(jarPath)

    // Read the compiled JAR
    const jarBuffer = await fs.readFile(jarPath)

    // Return as downloadable binary
    return new NextResponse(jarBuffer, {
      headers: {
        'Content-Type': 'application/java-archive',
        'Content-Disposition': `attachment; filename="${pluginName}.jar"`,
        'Content-Length': jarBuffer.length.toString(),
      },
    })
  } finally {
    // Cleanup temp dir
    try {
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch {
      // ignore cleanup errors
    }
  }
}
