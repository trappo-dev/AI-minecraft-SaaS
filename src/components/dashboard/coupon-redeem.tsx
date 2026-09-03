'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tag, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function CouponRedeem({ userId }: { userId: string }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRedeem() {
    if (!code.trim()) return
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const supabase = createClient()

      // 1. Look up the coupon
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .single()

      if (couponError || !coupon) {
        setError('Codice coupon non valido.')
        return
      }

      // 2. Check if expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setError('Questo coupon è scaduto.')
        return
      }

      // 3. Check if max uses reached
      if (coupon.current_uses >= coupon.max_uses) {
        setError('Questo coupon ha raggiunto il numero massimo di utilizzi.')
        return
      }

      // 4. Check if already redeemed by this user
      const { data: existingRedemption } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId)
        .single()

      if (existingRedemption) {
        setError('Hai già utilizzato questo coupon.')
        return
      }

      // 5. Insert redemption record
      const { error: redemptionError } = await supabase
        .from('coupon_redemptions')
        .insert({ coupon_id: coupon.id, user_id: userId })

      if (redemptionError) {
        setError('Errore durante il riscatto. Riprova.')
        return
      }

      // 6. Update coupon current_uses
      await supabase
        .from('coupons')
        .update({ current_uses: coupon.current_uses + 1 })
        .eq('id', coupon.id)

      // 7. Add credits to user
      const { data: credits } = await supabase
        .from('credits')
        .select('available_credits')
        .eq('user_id', userId)
        .single()

      await supabase
        .from('credits')
        .update({
          available_credits: (credits?.available_credits ?? 0) + coupon.credit_reward,
        })
        .eq('user_id', userId)

      setSuccess(`🎉 Hai ricevuto ${coupon.credit_reward} crediti gratuiti!`)
      setCode('')
    })
  }

  return (
    <Card className="glass-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-primary" />
          Riscatta Coupon
        </CardTitle>
        <CardDescription>Inserisci un codice promozionale per ottenere crediti gratuiti.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            {success}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="GIODEV50"
            className="flex-1 bg-secondary/50 border-border font-mono text-sm uppercase tracking-widest"
            onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          />
          <Button
            onClick={handleRedeem}
            disabled={isPending || !code.trim()}
            className="shrink-0"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Riscatta'}
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            ℹ️ I codici coupon sono case-insensitive
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
