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

// PATCH /api/admin/users/[id]/suspend
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await verifyAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }

  const { id } = await params
  const { is_suspended } = await request.json() as { is_suspended: boolean }

  if (typeof is_suspended !== 'boolean') {
    return NextResponse.json({ error: 'is_suspended (boolean) richiesto' }, { status: 400 })
  }

  // Prevent admin from suspending themselves
  if (id === adminUser.id) {
    return NextResponse.json(
      { error: 'Non puoi sospendere te stesso' },
      { status: 400 }
    )
  }

  const db = getAdminClient()

  const { error } = await db
    .from('users')
    .update({ is_suspended })
    .eq('id', id)

  if (error) {
    console.error('[ADMIN_SUSPEND_PATCH]', error)
    return NextResponse.json({ error: 'Errore aggiornamento stato' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    is_suspended,
    message: is_suspended
      ? 'Account sospeso con successo'
      : 'Account riattivato con successo',
  })
}
