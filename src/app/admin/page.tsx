import type { Metadata } from 'next'
import { Users, BarChart3, Puzzle, FileCode2, Tag, TrendingUp, UserCheck, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Admin – Overview' }

interface Stats {
  totalUsers: number
  newUsersThisWeek: number
  totalGenerations: number
  generationsThisWeek: number
  pluginGenerations: number
  configGenerations: number
  activeSubscriptions: number
  totalCoupons: number
}

async function getStats(): Promise<Stats | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${appUrl}/api/admin/stats`, {
      cache: 'no-store',
      // We can't pass auth cookie in server fetch, so we replicate the query directly
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.stats
  } catch {
    return null
  }
}

// Use the admin Supabase client directly for server-side rendering
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

async function getStatsServer(): Promise<Stats> {
  const db = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [usersResult, generationsResult, subscriptionsResult, couponsResult] =
    await Promise.all([
      db.from('users').select('id, created_at, subscription_status'),
      db.from('generations').select('id, type, created_at'),
      db.from('users').select('subscription_status').in('subscription_status', ['pro', 'ultra']),
      db.from('coupons').select('id'),
    ])

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const totalUsers = usersResult.data?.length ?? 0
  const newUsersThisWeek = usersResult.data?.filter((u) => new Date(u.created_at) > oneWeekAgo).length ?? 0
  const totalGenerations = generationsResult.data?.length ?? 0
  const generationsThisWeek = generationsResult.data?.filter((g) => new Date(g.created_at) > oneWeekAgo).length ?? 0
  const pluginGenerations = generationsResult.data?.filter((g) => g.type === 'plugin').length ?? 0
  const configGenerations = generationsResult.data?.filter((g) => g.type === 'config').length ?? 0
  const activeSubscriptions = subscriptionsResult.data?.length ?? 0
  const totalCoupons = couponsResult.data?.length ?? 0

  return {
    totalUsers, newUsersThisWeek, totalGenerations, generationsThisWeek,
    pluginGenerations, configGenerations, activeSubscriptions, totalCoupons,
  }
}

export default async function AdminOverviewPage() {
  const stats = await getStatsServer()

  const statCards = [
    {
      label: 'Utenti Totali',
      value: stats.totalUsers,
      sub: `+${stats.newUsersThisWeek} questa settimana`,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Generazioni Totali',
      value: stats.totalGenerations,
      sub: `${stats.generationsThisWeek} questa settimana`,
      icon: Activity,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
    },
    {
      label: 'Abbonamenti Attivi',
      value: stats.activeSubscriptions,
      sub: 'Pro + Ultra combinati',
      icon: UserCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Coupon Totali',
      value: stats.totalCoupons,
      sub: 'Codici nel sistema',
      icon: Tag,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
  ]

  const genBreakdown = [
    { label: 'Plugin Generati', value: stats.pluginGenerations, icon: Puzzle, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Config Generate', value: stats.configGenerations, icon: FileCode2, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
          <BarChart3 className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">
            Statistiche globali della piattaforma TrappolaGIoDev.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="glass-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value.toLocaleString('it-IT')}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generation breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {genBreakdown.map((item) => (
          <Card key={item.label} className="glass-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-4xl font-extrabold ${item.color}`}>
                {item.value.toLocaleString('it-IT')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalGenerations > 0
                  ? `${Math.round((item.value / stats.totalGenerations) * 100)}% del totale`
                  : '0% del totale'}
              </p>
              {/* Mini bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color === 'text-primary' ? 'bg-primary' : 'bg-cyan-400'}`}
                  style={{
                    width: stats.totalGenerations > 0
                      ? `${(item.value / stats.totalGenerations) * 100}%`
                      : '0%',
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/admin/users', label: 'Gestisci Utenti', desc: 'Visualizza, sospendi o modifica crediti', icon: Users },
          { href: '/admin/coupons', label: 'Gestisci Coupon', desc: 'Crea e monitora i codici promo', icon: Tag },
          { href: '/dashboard', label: 'Dashboard Utente', desc: 'Torna alla dashboard normale', icon: TrendingUp },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="glass-card rounded-2xl border border-border p-5 hover:border-amber-400/30 transition-all duration-200 hover:-translate-y-0.5 group block"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 mb-3 group-hover:bg-amber-400/20 transition-colors">
              <link.icon className="h-4 w-4 text-amber-400" />
            </div>
            <p className="font-semibold text-sm text-foreground">{link.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
