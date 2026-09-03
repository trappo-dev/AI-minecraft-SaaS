import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PLANS, CREDIT_PACKS, formatPrice } from '@/lib/stripe'
import { LandingNav } from '@/components/layout/landing-nav'
import { CheckoutButton } from '@/components/stripe/checkout-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Check, Zap, Crown, Rocket, Package,
  ChevronRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Prezzi – TrappolaGIoDev',
  description: 'Scegli il piano perfetto per il tuo server Minecraft. Inizia gratis con 10 crediti, poi scala con Pro o Ultra.',
}

const PLAN_ICONS = {
  free: Zap,
  pro: Crown,
  ultra: Rocket,
}

const PLAN_COLORS = {
  free: {
    border: 'border-border',
    badge: 'bg-secondary text-muted-foreground',
    button: 'outline' as const,
    icon: 'text-muted-foreground',
    iconBg: 'bg-secondary',
    glow: '',
  },
  pro: {
    border: 'border-primary/50',
    badge: 'bg-primary/15 text-primary',
    button: 'default' as const,
    icon: 'text-primary',
    iconBg: 'bg-primary/10',
    glow: 'glow-neon',
  },
  ultra: {
    border: 'border-amber-400/40',
    badge: 'bg-amber-400/15 text-amber-400',
    button: 'default' as const,
    icon: 'text-amber-400',
    iconBg: 'bg-amber-400/10',
    glow: '',
  },
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentPlan = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
    currentPlan = profile?.subscription_status ?? 'free'
  }

  return (
    <>
      <LandingNav />

      <main className="min-h-screen bg-background pt-28 pb-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute inset-0 bg-grid opacity-10" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">

          {/* Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <Badge className="mb-4 border-primary/20 bg-primary/5 text-primary px-4 py-1.5">
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Prezzi Trasparenti
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4">
              Scegli il piano{' '}
              <span className="neon-text text-glow">perfetto</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Inizia gratis. Scala quando ne hai bisogno. Nessun sorpresa in bolletta.
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {(Object.values(PLANS) as (typeof PLANS)[keyof typeof PLANS][]).map((plan) => {
              const planKey = plan.id as keyof typeof PLANS
              const colors = PLAN_COLORS[planKey]
              const PlanIcon = PLAN_ICONS[planKey]
              const isCurrentPlan = currentPlan === plan.id
              const isPopular = plan.id === 'pro'
              const isFree = plan.id === 'free'

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border ${colors.border} glass-card p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 ${isPopular ? 'ring-1 ring-primary/30' : ''}`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-xs px-4 py-1 font-semibold shadow-lg">
                        ⚡ Più Popolare
                      </Badge>
                    </div>
                  )}

                  {/* Current plan badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3.5 right-4">
                      <Badge className="bg-secondary text-xs px-3 py-1">
                        Piano Attuale
                      </Badge>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="mb-6">
                    <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${colors.iconBg}`}>
                      <PlanIcon className={`h-5 w-5 ${colors.icon}`} />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-foreground">
                        {plan.price === 0 ? '€0' : formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="mb-1.5 text-sm text-muted-foreground">/mese</span>
                      )}
                    </div>
                    <p className={`mt-2 text-sm font-medium ${colors.icon}`}>
                      {plan.credits === Infinity ? 'Crediti illimitati' : `${plan.credits} crediti${plan.price > 0 ? '/mese' : ' starter'}`}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-7">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${colors.icon}`} />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isFree ? (
                    user ? (
                      <Link href="/dashboard">
                        <Button variant="outline" className="w-full">
                          {isCurrentPlan ? 'Dashboard →' : 'Piano Gratuito'}
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/register">
                        <Button variant="outline" className="w-full">
                          Inizia Gratis
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    )
                  ) : isCurrentPlan ? (
                    <Button variant="outline" disabled className="w-full">
                      Piano Attuale ✓
                    </Button>
                  ) : user ? (
                    <CheckoutButton
                      planId={planKey}
                      label={`Passa a ${plan.name}`}
                      className={`w-full font-semibold ${colors.glow}`}
                    />
                  ) : (
                    <Link href={`/auth/register?plan=${plan.id}`}>
                      <Button className={`w-full font-semibold ${colors.glow}`}>
                        Inizia con {plan.name}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          {/* Credit Packs Section */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <Badge className="mb-4 border-violet-400/20 bg-violet-400/5 text-violet-400">
                <Package className="mr-1.5 h-3.5 w-3.5" />
                Pacchetti Crediti
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Hai bisogno di più crediti?
              </h2>
              <p className="text-muted-foreground">
                Acquisti una tantum, senza abbonamento. I crediti non scadono mai.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative glass-card rounded-2xl border p-6 text-center flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 ${pack.popular ? 'border-violet-400/40 ring-1 ring-violet-400/20' : 'border-border'}`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-violet-500 text-white text-xs px-4 py-1 font-semibold">
                        🔥 Più Conveniente
                      </Badge>
                    </div>
                  )}

                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-violet-400/10">
                    <Zap className="h-6 w-6 text-violet-400" />
                  </div>

                  <div>
                    <p className="text-3xl font-extrabold text-foreground">{pack.credits}</p>
                    <p className="text-sm text-muted-foreground">crediti</p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {formatPrice(pack.price)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(pack.price / pack.credits / 100).toFixed(3).replace('.', ',')}€ / credito
                    </p>
                  </div>

                  {user ? (
                    <CheckoutButton
                      packId={pack.id}
                      label="Acquista"
                      className="w-full"
                      variant={pack.popular ? 'default' : 'outline'}
                    />
                  ) : (
                    <Link href="/auth/register">
                      <Button
                        variant={pack.popular ? 'default' : 'outline'}
                        className="w-full"
                      >
                        Acquista
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              Domande Frequenti
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'I crediti scadono?',
                  a: 'I crediti dei pacchetti one-time non scadono mai. I crediti mensili del piano Pro vengono azzerati e ripristinati ogni mese.',
                },
                {
                  q: 'Posso cambiare piano?',
                  a: 'Sì, puoi fare upgrade o downgrade in qualsiasi momento dal portale di gestione abbonamento. Le modifiche entrano in vigore immediatamente.',
                },
                {
                  q: 'Cosa succede se esaurisco i crediti?',
                  a: 'Puoi acquistare pacchetti crediti aggiuntivi in qualsiasi momento, oppure attendere il rinnovo mensile se sei su Piano Pro.',
                },
                {
                  q: 'Quanto costa generare un plugin vs una config?',
                  a: 'Generare una configurazione YAML costa 1 credito. Generare un plugin Java completo costa 5 crediti per la maggiore complessità del codice.',
                },
                {
                  q: 'Il piano Ultra è davvero illimitato?',
                  a: 'Sì! Con Ultra puoi generare quanti plugin e configurazioni vuoi senza limiti di crediti. È pensato per sviluppatori professionisti e server farm.',
                },
              ].map((faq) => (
                <div key={faq.q} className="glass-card rounded-xl border border-border p-5">
                  <p className="font-semibold text-foreground text-sm mb-2">❓ {faq.q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">
              Trappola<span className="neon-text">GIoDev</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tutti i prezzi sono IVA inclusa · Pagamenti sicuri con Stripe
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Termini</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
