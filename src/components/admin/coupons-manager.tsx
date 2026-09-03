'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertCircle, CheckCircle2, Loader2, Plus, Trash2, Tag, Zap,
} from 'lucide-react'
import type { DbCoupon } from '@/lib/types/database'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(d))
}

function isExpired(d: string | null): boolean {
  if (!d) return false
  return new Date(d) < new Date()
}

export function CouponsManager({ initialCoupons }: { initialCoupons: DbCoupon[] }) {
  const [coupons, setCoupons] = useState<DbCoupon[]>(initialCoupons)
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [creditReward, setCreditReward] = useState('50')
  const [maxUses, setMaxUses] = useState('100')
  const [expiresAt, setExpiresAt] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    startTransition(async () => {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          credit_reward: parseInt(creditReward, 10),
          max_uses: parseInt(maxUses, 10),
          expires_at: expiresAt || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok && data.coupon) {
        setCoupons((prev) => [data.coupon, ...prev])
        setCode('')
        setCreditReward('50')
        setMaxUses('100')
        setExpiresAt('')
        setMsg({ type: 'success', text: `Coupon "${data.coupon.code}" creato con successo!` })
      } else {
        setMsg({ type: 'error', text: data.error ?? 'Errore creazione coupon' })
      }
    })
  }

  function handleDelete(id: string, code: string) {
    if (!confirm(`Eliminare il coupon "${code}"?`)) return

    startTransition(async () => {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id))
        setMsg({ type: 'success', text: `Coupon "${code}" eliminato.` })
      } else {
        setMsg({ type: 'error', text: 'Errore eliminazione coupon' })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card className="glass-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" />
            Crea Nuovo Coupon
          </CardTitle>
          <CardDescription>
            Genera codici promozionali per distribuire crediti gratuiti agli utenti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {msg && (
            <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm border mb-4 ${msg.type === 'success' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
              {msg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              {msg.text}
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code" className="text-xs font-medium">Codice *</Label>
              <Input
                id="coupon-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="GIODEV50"
                required
                className="bg-secondary/50 border-border font-mono uppercase tracking-widest text-sm"
              />
              <p className="text-xs text-muted-foreground">Solo lettere e numeri</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit-reward" className="text-xs font-medium">Crediti Reward *</Label>
              <Input
                id="credit-reward"
                type="number"
                min="1"
                value={creditReward}
                onChange={(e) => setCreditReward(e.target.value)}
                required
                className="bg-secondary/50 border-border"
              />
              <p className="text-xs text-muted-foreground">Crediti per utilizzo</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-uses" className="text-xs font-medium">Utilizzi Max *</Label>
              <Input
                id="max-uses"
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                required
                className="bg-secondary/50 border-border"
              />
              <p className="text-xs text-muted-foreground">Totale riscatti ammessi</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires-at" className="text-xs font-medium">Scadenza (opzionale)</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-secondary/50 border-border text-sm"
              />
              <p className="text-xs text-muted-foreground">Lascia vuoto = no scadenza</p>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending || !code.trim()}
                className="gap-2 glow-neon"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4" />
                )}
                Crea Coupon
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Coupons list */}
      <Card className="glass-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4 text-primary" />
            Coupon Esistenti
            <Badge className="ml-auto bg-secondary text-muted-foreground text-xs">
              {coupons.length} totali
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Tag className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nessun coupon creato ancora.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-secondary/30 hover:bg-secondary/30">
                    <TableHead className="text-xs font-medium text-muted-foreground">Codice</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-center w-24">Crediti</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-center w-28">Utilizzi</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground w-32">Scadenza</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground w-24 text-center">Stato</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground w-20 text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon.expires_at)
                    const exhausted = coupon.current_uses >= coupon.max_uses

                    return (
                      <TableRow key={coupon.id} className="border-border hover:bg-secondary/20 transition-colors">
                        <TableCell>
                          <code className="font-mono text-sm font-bold text-foreground bg-secondary px-2 py-0.5 rounded">
                            {coupon.code}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center gap-1 text-primary font-bold text-sm">
                            <Zap className="h-3 w-3" />
                            {coupon.credit_reward}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm">
                            <span className={exhausted ? 'text-destructive font-bold' : 'text-foreground'}>
                              {coupon.current_uses}
                            </span>
                            <span className="text-muted-foreground"> / {coupon.max_uses}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-1 h-1 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${exhausted ? 'bg-destructive' : 'bg-primary'}`}
                              style={{ width: `${Math.min((coupon.current_uses / coupon.max_uses) * 100, 100)}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className={`text-xs ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {formatDate(coupon.expires_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          {expired ? (
                            <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">Scaduto</Badge>
                          ) : exhausted ? (
                            <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">Esaurito</Badge>
                          ) : (
                            <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Attivo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(coupon.id, coupon.code)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
