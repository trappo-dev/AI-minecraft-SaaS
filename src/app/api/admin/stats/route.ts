import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

// GET /api/admin/stats
export async function GET() {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const db = getAdminClient()

  const [usersResult, generationsResult, subscriptionsResult, couponsResult] =
    await Promise.all([
      db.from('users').select('id, created_at, subscription_status', { count: 'exact' }),
      db.from('generations').select('id, type, created_at', { count: 'exact' }),
      db
        .from('users')
        .select('subscription_status')
        .in('subscription_status', ['pro', 'ultra']),
      db.from('coupons').select('id', { count: 'exact' }),
    ])

  const totalUsers = usersResult.count ?? 0
  const totalGenerations = generationsResult.count ?? 0
  const activeSubscriptions = subscriptionsResult.data?.length ?? 0
  const totalCoupons = couponsResult.count ?? 0

  // New users this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const newUsersThisWeek =
    usersResult.data?.filter(
      (u) => new Date(u.created_at) > oneWeekAgo
    ).length ?? 0

  // Generations by type
  const pluginGenerations =
    generationsResult.data?.filter((g) => g.type === 'plugin').length ?? 0
  const configGenerations =
    generationsResult.data?.filter((g) => g.type === 'config').length ?? 0

  // Generations this week
  const generationsThisWeek =
    generationsResult.data?.filter(
      (g) => new Date(g.created_at) > oneWeekAgo
    ).length ?? 0

  return NextResponse.json({
    stats: {
      totalUsers,
      newUsersThisWeek,
      totalGenerations,
      generationsThisWeek,
      pluginGenerations,
      configGenerations,
      activeSubscriptions,
      totalCoupons,
    },
  })
}
