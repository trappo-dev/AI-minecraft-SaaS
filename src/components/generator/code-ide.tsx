'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  X, Send, Download, Copy, CheckCheck, Loader2,
  Package, RefreshCw, AlertCircle, CheckCircle2,
  TerminalSquare, FileCode, FileText, ChevronRight,
  Sparkles, MessageSquare, Cpu, ExternalLink
} from 'lucide-react'

// Dynamic import to avoid SSR issues with Monaco
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
})

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface CodeFile {
  name: string
  content: string
  language: string
}

interface CodeIDEProps {
  initialCode: string
  pluginName: string
  mcVersion: string
  api?: string
  type: 'plugin' | 'config'
  onClose: () => void
}

// Parse raw generated output into separate files
function parseCodeFiles(raw: string, type: 'plugin' | 'config', pluginName: string): CodeFile[] {
  if (type === 'config') {
    // Remove markdown code blocks if any
    const cleaned = raw
      .replace(/^```ya?ml\n?/gm, '')
      .replace(/^```\n?/gm, '')
      .trim()
    return [{ name: `${pluginName.toLowerCase()}_config.yml`, content: cleaned, language: 'yaml' }]
  }

  // Plugin: separate Java from plugin.yml
  const separator = /\/\/\s*={3,}\s*plugin\.yml\s*={3,}/i
  const parts = raw.split(separator)

  const javaRaw = parts[0].trim()
  const pluginYmlRaw = parts[1]?.trim() ?? null

  // Remove markdown code fences
  const javaCode = javaRaw
    .replace(/^```java\n?/gm, '')
    .replace(/^```\n?/gm, '')
    .trim()

  const files: CodeFile[] = [
    { name: 'main.java', content: javaCode, language: 'java' },
  ]

  if (pluginYmlRaw) {
    const yml = pluginYmlRaw
      .replace(/^```ya?ml\n?/gm, '')
      .replace(/^```\n?/gm, '')
      .trim()
    files.push({ name: 'plugin.yml', content: yml, language: 'yaml' })
  }

  return files
}

// Reconstruct full code from files
function reconstructCode(files: CodeFile[], type: 'plugin' | 'config'): string {
  if (type === 'config') return files[0]?.content ?? ''
  const java = files.find(f => f.language === 'java')?.content ?? ''
  const yml = files.find(f => f.name === 'plugin.yml')?.content
  if (yml) return `${java}\n// ===== plugin.yml =====\n${yml}`
  return java
}

export function CodeIDE({ initialCode, pluginName, mcVersion, api, type, onClose }: CodeIDEProps) {
  const [files, setFiles] = useState<CodeFile[]>(() =>
    parseCodeFiles(initialCode, type, pluginName)
  )
  const [activeFile, setActiveFile] = useState(0)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [compileResult, setCompileResult] = useState<{
    type: 'success' | 'error' | 'java-not-found'
    message: string
    details?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  // ── Monaco editor change ───────────────────────────────────────
  const handleEditorChange = useCallback((value: string | undefined) => {
    setFiles(prev => prev.map((f, i) => i === activeFile ? { ...f, content: value ?? '' } : f))
  }, [activeFile])

  // ── Copy current file ──────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(files[activeFile]?.content ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [files, activeFile])

  // ── Download current file ──────────────────────────────────────
  const handleDownloadFile = useCallback(() => {
    const file = files[activeFile]
    if (!file) return
    const blob = new Blob([file.content])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    // Assicurati che non ci siano spazi vuoti che confondono Windows
    a.download = file.name.trim()
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, [files, activeFile])

  // ── Compile to JAR ─────────────────────────────────────────────
  const handleCompile = useCallback(async () => {
    setIsCompiling(true)
    setCompileResult(null)

    const fullCode = reconstructCode(files, type)

    try {
      const response = await fetch('/api/compile/plugin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode, mcVersion, pluginName }),
      })

      if (response.ok) {
        // Trigger download of the .jar
        const rawBlob = await response.blob()
        const blob = new Blob([rawBlob], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        // Sanitize pluginName to avoid spaces breaking the .jar extension
        const safeName = pluginName.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
        a.download = `${safeName}.jar`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 2000)
        setCompileResult({ type: 'success', message: `${pluginName}.jar compilato e scaricato con successo!` })
      } else {
        const data = await response.json()
        if (data.javaRequired) {
          setCompileResult({ type: 'java-not-found', message: data.error })
        } else {
          setCompileResult({
            type: 'error',
            message: data.error ?? 'Errore di compilazione',
            details: data.details,
          })
        }
      }
    } catch {
      setCompileResult({ type: 'error', message: 'Errore di connessione al server di compilazione.' })
    } finally {
      setIsCompiling(false)
    }
  }, [files, type, mcVersion, pluginName])

  // ── AI Chat modification ───────────────────────────────────────
  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isChatLoading) return

    const userMsg: ChatMessage = { role: 'user', content: userInput.trim() }
    setChat(prev => [...prev, userMsg])
    setUserInput('')
    setIsChatLoading(true)

    const currentCode = reconstructCode(files, type)

    // Add streaming assistant message
    const assistantMsgIndex = chat.length + 1
    setChat(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }])

    try {
      const response = await fetch('/api/generate/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentCode,
          userRequest: userMsg.content,
          mcVersion,
          api,
          type,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        setChat(prev => prev.map((m, i) =>
          i === assistantMsgIndex ? { ...m, content: `❌ ${errData.error}`, isStreaming: false } : m
        ))
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.content) {
              fullContent += parsed.content
              setChat(prev => prev.map((m, i) =>
                i === assistantMsgIndex ? { ...m, content: fullContent } : m
              ))
            }
            if (parsed.done) {
              setChat(prev => prev.map((m, i) =>
                i === assistantMsgIndex ? { ...m, isStreaming: false } : m
              ))
              // Extract and apply the code from the response
              const newFiles = parseCodeFiles(fullContent, type, pluginName)
              if (newFiles.length > 0 && newFiles[0].content.length > 50) {
                setFiles(newFiles)
                setChat(prev => [...prev.filter(m => m.content !== ''), {
                  role: 'assistant',
                  content: '✅ Codice aggiornato nell\'editor!',
                  isStreaming: false,
                }])
              }
            }
            if (parsed.error) {
              setChat(prev => prev.map((m, i) =>
                i === assistantMsgIndex ? { ...m, content: `❌ ${parsed.error}`, isStreaming: false } : m
              ))
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setChat(prev => prev.map((m, i) =>
        i === assistantMsgIndex ? { ...m, content: '❌ Errore di connessione', isStreaming: false } : m
      ))
    } finally {
      setIsChatLoading(false)
    }
  }, [userInput, isChatLoading, files, type, mcVersion, api, pluginName, chat.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSendMessage()
    }
  }

  const FILE_ICONS: Record<string, typeof FileCode> = {
    java: FileCode,
    yaml: FileText,
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0d0d] text-sm">
      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border bg-card/80 px-4 py-2 shrink-0">
        {/* IDE branding */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20">
            <Cpu className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-bold text-xs text-foreground">TrappolaGIoDev IDE</span>
          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 px-1.5">
            {mcVersion}
          </Badge>
          {api && (
            <Badge className="text-[10px] bg-secondary text-muted-foreground border-0 px-1.5">
              {api}
            </Badge>
          )}
        </div>

        {/* File tabs */}
        <div className="flex items-center gap-1 ml-4">
          {files.map((file, idx) => {
            const Icon = FILE_ICONS[file.language] ?? FileCode
            return (
              <button
                key={file.name}
                onClick={() => setActiveFile(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeFile === idx
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-3 w-3" />
                {file.name}
              </button>
            )
          })}
        </div>

        {/* Right toolbar */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiato!' : 'Copia'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownloadFile}
            className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Scarica {files[activeFile]?.name.split('.').pop()}
          </Button>
          {type === 'plugin' && (
            <Button
              size="sm"
              onClick={handleCompile}
              disabled={isCompiling}
              className="h-7 px-3 text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold"
            >
              {isCompiling ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Compilando…</>
              ) : (
                <><Package className="h-3.5 w-3.5" /> Compila .jar</>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── COMPILE RESULT BANNER ──────────────────────────────── */}
      {compileResult && (
        <div className={`flex items-start gap-2 px-4 py-2.5 text-xs border-b shrink-0 ${
          compileResult.type === 'success'
            ? 'bg-primary/10 border-primary/20 text-primary'
            : compileResult.type === 'java-not-found'
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          {compileResult.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-semibold">{compileResult.message}</span>
            {compileResult.details && (
              <pre className="mt-1 font-mono text-[10px] opacity-80 whitespace-pre-wrap">{compileResult.details}</pre>
            )}
            {compileResult.type === 'java-not-found' && (
              <a
                href="https://adoptium.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 underline opacity-80 hover:opacity-100"
              >
                Installa JDK 17+ da Adoptium <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <button onClick={() => setCompileResult(null)} className="opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── MAIN SPLIT: EDITOR + CHAT ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Monaco Editor ─────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={files[activeFile]?.language ?? 'java'}
            value={files[activeFile]?.content ?? ''}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
              fontLigatures: true,
              lineHeight: 1.7,
              minimap: { enabled: true, scale: 1, maxColumn: 80 },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
              tabSize: 2,
              renderLineHighlight: 'gutter',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              bracketPairColorization: { enabled: true },
              formatOnType: true,
              formatOnPaste: true,
              suggest: { showKeywords: true },
              quickSuggestions: { strings: true, comments: false, other: true },
            }}
          />
        </div>

        {/* ── RIGHT: AI Chat ───────────────────────────────────── */}
        <div className="w-80 shrink-0 border-l border-border flex flex-col bg-card/30">
          {/* Chat header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">AI Assistant</span>
            <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-primary/20">
              DeepSeek R1
            </Badge>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chat.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Chiedi all&apos;AI di modificare il codice nell&apos;editor.
                </p>
                <div className="space-y-1.5 w-full">
                  {[
                    'Aggiungi un comando /reload',
                    'Aggiungi un config.yml',
                    'Ottimizza le performance',
                    type === 'plugin' ? 'Aggiungi permessi per admin' : 'Aggiungi più opzioni',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setUserInput(suggestion)}
                      className="w-full text-left text-xs text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 rounded-lg px-3 py-2 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chat.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {msg.role === 'user' ? 'T' : 'AI'}
                </div>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-secondary text-foreground'
                }`}>
                  {msg.isStreaming ? (
                    <span className="text-muted-foreground italic text-[10px]">
                      <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                      Aggiornando il codice…
                    </span>
                  ) : (
                    <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-border p-3 space-y-2 shrink-0">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descrivi la modifica… (Ctrl+Enter per inviare)"
              rows={3}
              className="text-xs bg-secondary/50 border-border resize-none leading-relaxed"
              disabled={isChatLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isChatLoading}
              size="sm"
              className="w-full gap-2 text-xs glow-neon"
            >
              {isChatLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Elaborando…</>
              ) : (
                <><Send className="h-3.5 w-3.5" /> Invia Modifica</>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Il codice nell&apos;editor verrà aggiornato automaticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
