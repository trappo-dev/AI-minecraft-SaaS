'use client'

import { useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Copy, Download, CheckCheck, Loader2,
  TerminalSquare, Zap
} from 'lucide-react'
import { useState } from 'react'

interface StreamingOutputProps {
  content: string
  isStreaming: boolean
  isDone: boolean
  type: 'plugin' | 'config'
  creditsUsed?: number
  newBalance?: number | null
  filename?: string
  placeholder?: string
}

export function StreamingOutput({
  content,
  isStreaming,
  isDone,
  type,
  creditsUsed,
  newBalance,
  filename = 'output',
  placeholder,
}: StreamingOutputProps) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (isStreaming && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [content, isStreaming])

  const handleCopy = useCallback(async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  const handleDownload = useCallback(() => {
    if (!content) return
    const ext = type === 'plugin' ? '.java' : '.yml'
    const safeName = (filename || 'download').trim().replace(/[^a-zA-Z0-9_-]/g, '_')
    // Removing strict type allows the browser to trust the a.download extension on Windows
    const blob = new Blob([content])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = safeName + ext
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, [content, type, filename])

  const isEmpty = !content && !isStreaming

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-amber-500/50" />
            <div className="h-3 w-3 rounded-full bg-primary/50" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">
            {filename}{type === 'plugin' ? '.java' : '.yml'}
          </span>
          {isStreaming && (
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 animate-pulse">
              <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
              Generando…
            </Badge>
          )}
          {isDone && !isStreaming && content && (
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
              ✓ Completato
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDone && creditsUsed !== undefined && (
            <span className="text-xs text-muted-foreground">
              <span className="text-primary font-semibold">-{creditsUsed}</span> crediti
              {newBalance !== null && newBalance !== undefined && (
                <> · <span className="text-foreground">{newBalance} rimasti</span></>
              )}
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            disabled={!content}
          >
            {copied ? (
              <><CheckCheck className="h-3.5 w-3.5 text-primary" /> Copiato!</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> Copia</>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleDownload}
            disabled={!content || isStreaming}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Code area */}
      <pre
        ref={preRef}
        className="flex-1 overflow-auto p-5 text-xs font-mono leading-relaxed bg-[#0a0a0a] text-left"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <TerminalSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              {placeholder ?? 'Compila il form e premi "Genera" per vedere il codice qui.'}
            </p>
          </div>
        ) : (
          <code
            className={type === 'plugin' ? 'text-emerald-300/90' : 'text-cyan-300/90'}
          >
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
            )}
          </code>
        )}
      </pre>
    </div>
  )
}
