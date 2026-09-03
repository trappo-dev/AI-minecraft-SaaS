'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Loader2,
  ShieldOff,
  ShieldCheck,
  PlusCircle,
  MinusCircle,
  Search,
  Crown,
  Rocket,
  Zap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface UserRow {
  id: string
  email: string
  subscription_status: string
  role: string
  is_suspended: boolean
  created_at: string
  credits: { available_credits: number } | null
}

const PLAN_CONFIG = {
  free: { label: 'Free', icon: Zap, color: 'text-muted-foreground', bg: 'bg-secondary' },
  pro: { label: 'Pro', icon: Crown, color: 'text-primary', bg: 'bg-primary/10' },
  ultra: { label: 'Ultra', icon: Rocket, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  canceled: { label: 'Cancellato', icon: Zap, color: 'text-destructive', bg: 'bg-destructive/10' },
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(d))
}

export function UsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  // Credit dialog state
  const [creditDialog, setCreditDialog] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null })
  const [creditAmount, setCreditAmount] = useState('10')
  const [creditOp, setCreditOp] = useState<'add' | 'remove' | 'set'>('add')
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.subscription_status.toLowerCase().includes(search.toLowerCase())
  )

  // ── Suspend/Unsuspend ────────────────────────────────────────────
  function handleSuspend(user: UserRow) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_suspended: !user.is_suspended }),
      })
      const data = await res.json()
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => u.id === user.id ? { ...u, is_suspended: !user.is_suspended } : u)
        )
      } else {
        alert(data.error ?? 'Errore')
      }
    })
  }

  // ── Adjust Credits ───────────────────────────────────────────────
  function openCreditDialog(user: UserRow) {
    setCreditDialog({ open: true, user })
    setCreditAmount('10')
    setCreditOp('add')
    setActionMsg(null)
  }

  function handleCreditSubmit() {
    if (!creditDialog.user) return
    const amount = parseInt(creditAmount, 10)
    if (!amount || amount <= 0) return

    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${creditDialog.user!.id}/credits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, operation: creditOp }),
      })
      const data = await res.json()
      if (res.ok) {
        setActionMsg({ type: 'success', text: `Crediti aggiornati: ora ha ${data.new_credits} crediti.` })
        setUsers((prev) =>
          prev.map((u) =>
            u.id === creditDialog.user!.id
              ? { ...u, credits: { available_credits: data.new_credits } }
              : u
          )
        )
      } else {
        setActionMsg({ type: 'error', text: data.error ?? 'Errore aggiornamento crediti' })
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per email o piano…"
          className="pl-9 bg-secondary/50 border-border"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-secondary/30 hover:bg-secondary/30">
              <TableHead className="text-xs font-medium text-muted-foreground">Email</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground w-24">Piano</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground w-24 text-center">Crediti</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground w-24 text-center">Stato</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground w-24 text-center">Ruolo</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground w-28">Registrato</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground w-36 text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                  Nessun utente trovato.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const planKey = (user.subscription_status as keyof typeof PLAN_CONFIG) ?? 'free'
                const plan = PLAN_CONFIG[planKey] ?? PLAN_CONFIG.free
                const PlanIcon = plan.icon

                return (
                  <TableRow
                    key={user.id}
                    className={`border-border transition-colors ${user.is_suspended ? 'bg-destructive/5' : 'hover:bg-secondary/20'}`}
                  >
                    <TableCell className="py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{user.email}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{user.id.slice(0, 8)}…</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={`text-xs ${plan.bg} ${plan.color} border-0`}>
                        <PlanIcon className="mr-1 h-3 w-3 inline" />
                        {plan.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className={`text-sm font-bold ${plan.color}`}>
                        {user.credits?.available_credits ?? 0}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      {user.is_suspended ? (
                        <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                          Sospeso
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                          Attivo
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        className={`text-xs ${user.role === 'admin' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-secondary text-muted-foreground border-0'}`}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Credits button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1 text-primary border-primary/20 hover:bg-primary/10"
                          onClick={() => openCreditDialog(user)}
                          disabled={isPending}
                        >
                          <PlusCircle className="h-3 w-3" />
                          Crediti
                        </Button>

                        {/* Suspend/Unsuspend */}
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-7 px-2 text-xs gap-1 ${user.is_suspended ? 'text-primary border-primary/20 hover:bg-primary/10' : 'text-destructive border-destructive/20 hover:bg-destructive/10'}`}
                            onClick={() => handleSuspend(user)}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : user.is_suspended ? (
                              <><ShieldCheck className="h-3 w-3" /> Riattiva</>
                            ) : (
                              <><ShieldOff className="h-3 w-3" /> Sospendi</>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total count */}
      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} di {users.length} utenti
      </p>

      {/* ── Credit Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={creditDialog.open}
        onOpenChange={(open) => setCreditDialog({ open, user: open ? creditDialog.user : null })}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Gestisci Crediti</DialogTitle>
            <DialogDescription>
              Utente: <span className="text-foreground font-medium">{creditDialog.user?.email}</span>
              <br />
              Crediti attuali:{' '}
              <span className="text-primary font-bold">
                {creditDialog.user?.credits?.available_credits ?? 0}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {actionMsg && (
              <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm border ${actionMsg.type === 'success' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                {actionMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                {actionMsg.text}
              </div>
            )}

            {/* Operation selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Operazione</Label>
              <div className="flex gap-2">
                {(['add', 'remove', 'set'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setCreditOp(op)}
                    className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${creditOp === op ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                  >
                    {op === 'add' ? '+ Aggiungi' : op === 'remove' ? '- Rimuovi' : '= Imposta'}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="credit-amount" className="text-sm font-medium">Quantità</Label>
              <Input
                id="credit-amount"
                type="number"
                min="1"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreditSubmit}
                disabled={isPending || !creditAmount || parseInt(creditAmount) <= 0}
                className="flex-1 glow-neon"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Conferma'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCreditDialog({ open: false, user: null })}
                className="flex-1"
              >
                Chiudi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
