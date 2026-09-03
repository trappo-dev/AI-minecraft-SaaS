import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PLANS, formatPrice } from '@/lib/stripe'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ManageBillingButton } from '@/components/stripe/manage-billing-button'
import { CheckoutButton } from '@/components/stripe/checkout-button'
import { CreditCard, Crown, Rocket, Zap, Check, Receipt } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Fatturazione',
}

const PLAN_ICONS = { free: Zap, pro: Crown, ultra: Rocket }
const PLAN_COLORS = {
  free: 'text-muted-foreground',
  pro: 'text-primary',
  ultra: 'text-amber-400',
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileResult, creditsResult] = await Promise.all([
    supabase
      .from('users')
      .select('subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single(),
    supabase
      .from('credits')
      .select('available_credits')
      .eq('user_id', user.id)
      .single(),
  ])

  const plan = (profileResult.data?.subscription_status ?? 'free') as keyof typeof PLANS
  const hasStripeAccount = !!profileResult.data?.stripe_customer_id
  const availableCredits = creditsResult.data?.available_credits ?? 0
  const currentPlanData = PLANS[plan] ?? PLANS.free
  const PlanIcon = PLAN_ICONS[plan] ?? Zap
  const planColor = PLAN_COLORS[plan] ?? 'text-muted-foreground'

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fatturazione</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestisci il tuo abbonamento, i crediti e i pagamenti.
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="glass-card border-border overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Piano Attuale
            </CardTitle>
            {hasStripeAccount && <ManageBillingButton />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-6">
            {/* Plan info */}
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${plan === 'pro' ? 'bg-primary/10' : plan === 'ultra' ? 'bg-amber-400/10' : 'bg-secondary'}`}>
                <PlanIcon className={`h-6 w-6 ${planColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-lg font-bold ${planColor}`}>{currentPlanData.name}</h3>
                  <Badge className={`text-xs ${plan === 'canceled' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary border-primary/20'}`}>
                    {plan === 'canceled' ? 'Cancellato' : 'Attivo'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {plan === 'ultra'
                    ? 'Crediti illimitati'
                    : plan === 'free' || plan === 'canceled'
                    ? `${availableCredits} crediti disponibili`
                    : `${availableCredits} / ${currentPlanData.credits} crediti questo mese`}
                </p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {currentPlanData.price === 0
                    ? 'Gratuito'
                    : `${formatPrice(currentPlanData.price)} / mese`}
                </p>
              </div>
            </div>
          </div>

          {/* Features included */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border pt-5">
            {currentPlanData.features.slice(0, 4).map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className={`h-3.5 w-3.5 shrink-0 ${planColor}`} />
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade section — only show if not Ultra */}
      {plan !== 'ultra' && (
        <Card className="glass-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4 w-4 text-amber-400" />
              Fai l&apos;Upgrade
            </CardTitle>
            <CardDescription>Sblocca più crediti e funzionalità avanzate.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plan !== 'pro' && (
                <div className="gradient-border rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Pro</span>
                    <Badge className="ml-auto bg-primary/10 text-primary text-xs border-primary/20">⚡ Consigliato</Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatPrice(PLANS.pro.price)}<span className="text-sm font-normal text-muted-foreground">/mese</span></p>
                  <p className="text-xs text-muted-foreground">200 crediti al mese, supporto prioritario</p>
                  <CheckoutButton planId="pro" label="Passa a Pro" className="w-full glow-neon font-semibold" />
                </div>
              )}
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-amber-400" />
                  <span className="font-semibold text-foreground">Ultra</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatPrice(PLANS.ultra.price)}<span className="text-sm font-normal text-muted-foreground">/mese</span></p>
                <p className="text-xs text-muted-foreground">Crediti illimitati, Claude 3.5 Sonnet prioritario</p>
                <CheckoutButton planId="ultra" label="Passa a Ultra" className="w-full font-semibold border-amber-400/40 text-amber-400 hover:bg-amber-400/10" variant="outline" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing info note */}
      <Card className="glass-card border-border">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Note sulla fatturazione</p>
              <p>I pagamenti vengono elaborati in modo sicuro da <strong className="text-foreground">Stripe</strong>. Non conserviamo i dati della tua carta.</p>
              <p>Per annullare l&apos;abbonamento, scaricare le fatture o aggiornare il metodo di pagamento, usa il pulsante <em>Gestisci Abbonamento</em> qui sopra.</p>
              <p className="mt-2">
                Problemi?{' '}
                <Link href="mailto:support@trappolagiodev.com" className="text-primary hover:underline">
                  Contatta il supporto
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
