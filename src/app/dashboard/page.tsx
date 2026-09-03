import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanCard } from '@/components/dashboard/plan-card'
import { CouponRedeem } from '@/components/dashboard/coupon-redeem'
import { GenerationHistoryTable } from '@/components/dashboard/generation-history'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Puzzle, FileCode2, Zap, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { DbGeneration } from '@/lib/types/database'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Il tuo pannello di controllo TrappolaGIoDev.',
}

// Always fetch fresh data — ensures new generations appear immediately
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch user profile + credits + recent generations in parallel
  const [profileResult, creditsResult, generationsResult] = await Promise.all([
    supabase
      .from('users')
      .select('email, subscription_status, role, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('credits')
      .select('available_credits')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const profile = profileResult.data
  const credits = creditsResult.data
  const generations = (generationsResult.data ?? []) as DbGeneration[]
  const availableCredits = credits?.available_credits ?? 0
  const plan = profile?.subscription_status ?? 'free'

  // Stats
  const pluginCount = generations.filter((g) => g.type === 'plugin').length
  const configCount = generations.filter((g) => g.type === 'config').length
  const totalCreditsUsed = generations.reduce((sum, g) => sum + g.credits_used, 0)

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Ciao, <span className="neon-text">{user.email?.split('@')[0]}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pronto a generare qualcosa di epico oggi?
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/generate/config">
            <Button variant="outline" size="sm" className="gap-2">
              <FileCode2 className="h-4 w-4" />
              Nuova Config
            </Button>
          </Link>
          <Link href="/generate/plugin">
            <Button size="sm" className="gap-2 glow-neon">
              <Puzzle className="h-4 w-4" />
              Nuovo Plugin
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Crediti Disponibili',
            value: plan === 'ultra' ? '∞' : availableCredits,
            icon: Zap,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          {
            label: 'Plugin Generati',
            value: pluginCount,
            icon: Puzzle,
            color: 'text-violet-400',
            bg: 'bg-violet-400/10',
          },
          {
            label: 'Config Generate',
            value: configCount,
            icon: FileCode2,
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10',
          },
          {
            label: 'Crediti Usati',
            value: totalCreditsUsed,
            icon: TrendingUp,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
          },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Plan + Coupon */}
        <div className="space-y-4">
          <PlanCard
            plan={plan as 'free' | 'pro' | 'ultra' | 'canceled'}
            availableCredits={availableCredits}
          />
          <CouponRedeem userId={user.id} />
        </div>

        {/* Right: Quick actions + History */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/generate/plugin">
              <Card className="glass-card border-border cursor-pointer group hover:border-primary/40 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors mb-2">
                    <Puzzle className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-sm">Plugin Generator</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Genera codice Java per Spigot o PaperMC partendo da una descrizione.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-primary">5 crediti →</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/generate/config">
              <Card className="glass-card border-border cursor-pointer group hover:border-cyan-400/40 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 group-hover:bg-cyan-400/20 transition-colors mb-2">
                    <FileCode2 className="h-5 w-5 text-cyan-400" />
                  </div>
                  <CardTitle className="text-sm">Config Generator</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Genera file YAML di configurazione per qualsiasi plugin Minecraft.
                  </p>
                  <p className="mt-2 text-xs font-semibold text-cyan-400">1 credito →</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Generation history */}
          <GenerationHistoryTable generations={generations} />
        </div>
      </div>
    </div>
  )
}
