'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { StreamingOutput } from '@/components/generator/streaming-output'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Puzzle, Zap, AlertCircle, ChevronRight, RotateCcw,
  Sparkles, Code2, ExternalLink, Cpu
} from 'lucide-react'

// Lazy-load the heavy IDE (Monaco editor)
const CodeIDE = dynamic(
  () => import('@/components/generator/code-ide').then(m => ({ default: m.CodeIDE })),
  { ssr: false }
)

const MC_VERSIONS = [
  '1.21.4', '1.21.3', '1.21', '1.20.6', '1.20.4', '1.20.1',
  '1.19.4', '1.19.2', '1.18.2', '1.17.1', '1.16.5',
  '1.12.2', '1.8.8',
]

const APIS = ['Spigot', 'PaperMC', 'BungeeCord', 'Velocity']

const EXAMPLE_PROMPTS = [
  'Plugin che mostra un messaggio di benvenuto personalizzato quando un giocatore entra nel server, con particelle e suoni',
  'Sistema di economia con /pay, /balance e /eco per admin. Salva i dati su file YML',
  'Plugin anti-fall damage che disabilita i danni da caduta in determinati mondi configurabili',
  'Sistema di home per i giocatori: /sethome, /home, /delhome con limite configurabile di case per piano',
  'Plugin che ogni ora esegue un comando casuale dalla lista configurabile in config.yml',
]

export default function PluginGeneratorPage() {
  const [pluginName, setPluginName] = useState('')
  const [mcVersion, setMcVersion] = useState('1.20.4')
  const [api, setApi] = useState('Spigot')
  const [prompt, setPrompt] = useState('')

  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creditsUsed, setCreditsUsed] = useState<number | undefined>()
  const [newBalance, setNewBalance] = useState<number | null | undefined>()

  const [ideOpen, setIdeOpen] = useState(false)
  const router = useRouter()

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setOutput('')
    setError(null)
    setIsDone(false)
    setCreditsUsed(undefined)
    setNewBalance(undefined)
    setIsStreaming(true)
    setIdeOpen(false)

    try {
      const response = await fetch('/api/generate/plugin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          pluginName: pluginName.trim() || 'MioPlugin',
          mcVersion,
          api,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        setError(errData.error ?? 'Errore durante la generazione')
        setIsStreaming(false)
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

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
            if (parsed.error) { setError(parsed.error); setIsStreaming(false); return }
            if (parsed.content) setOutput(prev => prev + parsed.content)
            if (parsed.done) {
              setCreditsUsed(parsed.creditsUsed)
              setNewBalance(parsed.newBalance)
              setIsDone(true)
              setIsStreaming(false)
              // Prefetch fresh dashboard data so history updates on nav back
              router.refresh()
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setError('Errore di connessione. Riprova.')
      setIsStreaming(false)
    }
  }, [prompt, pluginName, mcVersion, api])

  const handleReset = () => {
    setOutput('')
    setError(null)
    setIsDone(false)
    setCreditsUsed(undefined)
    setNewBalance(undefined)
    setIdeOpen(false)
  }

  return (
    <>
      {/* Full-screen IDE overlay */}
      {ideOpen && output && (
        <CodeIDE
          initialCode={output}
          pluginName={pluginName.trim() || 'MioPlugin'}
          mcVersion={mcVersion}
          api={api}
          type="plugin"
          onClose={() => setIdeOpen(false)}
        />
      )}

      <div className="flex h-screen flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-8 py-4 bg-card/50 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Puzzle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-foreground leading-none">Plugin Generator</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Powered by <span className="text-primary font-medium">DeepSeek R1</span> · Free · Spigot / PaperMC
            </p>
          </div>
          <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-xs">
            <Zap className="mr-1 h-3 w-3" />
            5 crediti per generazione
          </Badge>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── LEFT: Form ─────────────────────────────────────── */}
          <aside className="w-80 shrink-0 border-r border-border overflow-y-auto bg-card/30 flex flex-col">
            <div className="flex-1 p-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="plugin-name" className="text-xs font-medium">Nome Plugin</Label>
                <Input
                  id="plugin-name"
                  value={pluginName}
                  onChange={e => setPluginName(e.target.value)}
                  placeholder="WelcomePlugin"
                  className="bg-secondary/50 border-border text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Versione Minecraft</Label>
                <Select value={mcVersion} onValueChange={setMcVersion}>
                  <SelectTrigger className="bg-secondary/50 border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {MC_VERSIONS.map(v => (
                      <SelectItem key={v} value={v} className="text-sm">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">API</Label>
                <Select value={api} onValueChange={setApi}>
                  <SelectTrigger className="bg-secondary/50 border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {APIS.map(a => (
                      <SelectItem key={a} value={a} className="text-sm">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plugin-prompt" className="text-xs font-medium">Descrizione Plugin *</Label>
                <Textarea
                  id="plugin-prompt"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Descrivi cosa deve fare il tuo plugin nel dettaglio…"
                  rows={7}
                  className="bg-secondary/50 border-border text-sm resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Esempi rapidi
                </p>
                <div className="space-y-1.5">
                  {EXAMPLE_PROMPTS.map(ex => (
                    <button
                      key={ex}
                      onClick={() => setPrompt(ex)}
                      className="w-full text-left text-xs text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 rounded-lg px-3 py-2 transition-colors leading-relaxed"
                    >
                      {ex.slice(0, 60)}…
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="border-t border-border p-4 space-y-2 shrink-0">
              <Button
                onClick={handleGenerate}
                disabled={isStreaming || !prompt.trim()}
                className="w-full glow-neon font-semibold gap-2"
              >
                {isStreaming ? (
                  <><div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Generando…</>
                ) : (
                  <><Code2 className="h-4 w-4" /> Genera Plugin <ChevronRight className="h-4 w-4 ml-auto" /></>
                )}
              </Button>

              {/* Open IDE button — appears after generation */}
              {isDone && output && (
                <Button
                  onClick={() => setIdeOpen(true)}
                  variant="outline"
                  className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold"
                >
                  <Cpu className="h-4 w-4" />
                  Apri IDE + Compila .jar
                  <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                </Button>
              )}

              {(output || error) && (
                <Button onClick={handleReset} variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground gap-2">
                  <RotateCcw className="h-3.5 w-3.5" /> Nuova generazione
                </Button>
              )}
            </div>
          </aside>

          {/* ── RIGHT: Streaming output ─────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden gradient-border-left">
            <StreamingOutput
              content={output}
              isStreaming={isStreaming}
              isDone={isDone}
              type="plugin"
              creditsUsed={creditsUsed}
              newBalance={newBalance}
              filename={pluginName || 'MioPlugin'}
              placeholder="Il codice Java del tuo plugin apparirà qui. Al termine potrai aprirlo nell'IDE integrato per modifiche e compilazione .jar."
            />
          </div>
        </div>
      </div>
    </>
  )
}
