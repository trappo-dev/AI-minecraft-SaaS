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
  FileCode2, Zap, AlertCircle, ChevronRight, RotateCcw,
  Sparkles, Settings2, Cpu, ExternalLink,
} from 'lucide-react'

const CodeIDE = dynamic(
  () => import('@/components/generator/code-ide').then((m) => ({ default: m.CodeIDE })),
  { ssr: false }
)

const MC_VERSIONS = [
  '1.21.4', '1.21.3', '1.21', '1.20.6', '1.20.4', '1.20.1',
  '1.19.4', '1.19.2', '1.18.2', '1.17.1', '1.16.5',
]

const EXAMPLE_PROMPTS = [
  {
    plugin: 'EssentialsX',
    prompt: 'Configurazione base con messaggi di benvenuto in italiano, economia con valuta "Coin", e protezione dello spawn',
  },
  {
    plugin: 'WorldGuard',
    prompt: 'Configurazione per proteggere la spawn principale, disabilitare il pvp in città, e permettere la costruzione solo nelle regioni autorizzate',
  },
  {
    plugin: 'LuckPerms',
    prompt: 'Configurazione con gruppi: Guest, Membro, VIP, Admin. Con prefissi colorati e permissioni crescenti',
  },
  {
    plugin: 'Vault',
    prompt: 'Configurazione economy integration con EssentialsX come provider principale',
  },
  {
    plugin: 'PlaceholderAPI',
    prompt: 'Configurazione con placeholder personalizzati per livello, coin, tempo di gioco e ultimo accesso',
  },
]

export default function ConfigGeneratorPage() {
  const [pluginName, setPluginName] = useState('')
  const [mcVersion, setMcVersion] = useState('1.20.4')
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
      const response = await fetch('/api/generate/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          pluginName: pluginName.trim() || 'Plugin',
          mcVersion,
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
            if (parsed.content) setOutput((prev) => prev + parsed.content)
            if (parsed.done) {
              setCreditsUsed(parsed.creditsUsed)
              setNewBalance(parsed.newBalance)
              setIsDone(true)
              setIsStreaming(false)
              router.refresh()
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setError('Errore di connessione. Riprova.')
      setIsStreaming(false)
    }
  }, [prompt, pluginName, mcVersion])

  const handleReset = () => {
    setOutput('')
    setError(null)
    setIsDone(false)
    setCreditsUsed(undefined)
    setNewBalance(undefined)
    setIdeOpen(false)
  }

  return (
    <div className="relative flex h-screen flex-col">
      {/* Full-screen IDE overlay */}
      {ideOpen && output && (
        <CodeIDE
          initialCode={output}
          pluginName={pluginName.trim() || 'config'}
          mcVersion={mcVersion}
          type="config"
          onClose={() => setIdeOpen(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-8 py-4 bg-card/50 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10">
          <FileCode2 className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="font-bold text-foreground leading-none">Config Generator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Powered by <span className="text-cyan-400 font-medium">DeepSeek R1</span> · Free · Qualsiasi plugin Minecraft
          </p>
        </div>
        <Badge className="ml-auto bg-cyan-400/10 text-cyan-400 border-cyan-400/20 text-xs">
          <Zap className="mr-1 h-3 w-3" />
          1 credito per generazione
        </Badge>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Form */}
        <aside className="w-80 shrink-0 border-r border-border overflow-y-auto bg-card/30 flex flex-col">
          <div className="flex-1 p-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="config-plugin-name" className="text-xs font-medium">
                Plugin da configurare
              </Label>
              <Input
                id="config-plugin-name"
                value={pluginName}
                onChange={(e) => setPluginName(e.target.value)}
                placeholder="EssentialsX"
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
                  {MC_VERSIONS.map((v) => (
                    <SelectItem key={v} value={v} className="text-sm">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="config-prompt" className="text-xs font-medium">
                Cosa deve fare la configurazione? *
              </Label>
              <Textarea
                id="config-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descrivi cosa vuoi configurare: funzionalità, opzioni, messaggi personalizzati…"
                rows={7}
                className="bg-secondary/50 border-border text-sm resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Esempi rapidi
              </p>
              <div className="space-y-1.5">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.plugin}
                    onClick={() => { setPluginName(ex.plugin); setPrompt(ex.prompt) }}
                    className="w-full text-left border border-border hover:border-cyan-400/30 rounded-lg px-3 py-2.5 transition-colors group"
                  >
                    <span className="text-xs font-mono font-semibold text-cyan-400 group-hover:text-cyan-300">
                      {ex.plugin}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {ex.prompt.slice(0, 55)}…
                    </p>
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
              className="w-full font-semibold gap-2 bg-cyan-500 hover:bg-cyan-400 text-background"
            >
              {isStreaming ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Generando…
                </span>
              ) : (
                <span className="flex items-center gap-2 w-full">
                  <Settings2 className="h-4 w-4" />
                  Genera Config
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </span>
              )}
            </Button>

            {isDone && output && (
              <Button
                onClick={() => setIdeOpen(true)}
                variant="outline"
                className="w-full gap-2 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 font-semibold"
              >
                <Cpu className="h-4 w-4" />
                Apri nell&apos;IDE
                <ExternalLink className="h-3.5 w-3.5 ml-auto" />
              </Button>
            )}

            {(output || error) && (
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Nuova generazione
              </Button>
            )}
          </div>
        </aside>

        {/* RIGHT: Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <StreamingOutput
            content={output}
            isStreaming={isStreaming}
            isDone={isDone}
            type="config"
            creditsUsed={creditsUsed}
            newBalance={newBalance}
            filename={pluginName ? `${pluginName.toLowerCase()}_config` : 'config'}
            placeholder="La configurazione YAML apparirà qui in tempo reale. Poi puoi aprirla nell'IDE per modifiche AI."
          />
        </div>
      </div>
    </div>
  )
}
