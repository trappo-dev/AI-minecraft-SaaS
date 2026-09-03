import { NextRequest, NextResponse } from 'next/server'
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
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return user
}

// GET /api/admin/users — list all users with credits
export async function GET() {
  const adminUser = await verifyAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }

  const db = getAdminClient()

  const { data: users, error } = await db
    .from('users')
    .select(`
      id,
      email,
      subscription_status,
      role,
      is_suspended,
      created_at,
      credits (available_credits)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[ADMIN_USERS_GET]', error)
    return NextResponse.json({ error: 'Errore nel recupero utenti' }, { status: 500 })
  }

  return NextResponse.json({ users })
}
