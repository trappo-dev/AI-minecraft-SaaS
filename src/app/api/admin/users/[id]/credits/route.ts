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

// PATCH /api/admin/users/[id]/credits
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await verifyAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
  }

  const { id } = await params
  const { amount, operation } = await request.json() as {
    amount: number
    operation: 'add' | 'remove' | 'set'
  }

  if (!amount || !operation || amount <= 0) {
    return NextResponse.json({ error: 'amount e operation richiesti' }, { status: 400 })
  }

  const db = getAdminClient()

  // Get current credits
  const { data: credits } = await db
    .from('credits')
    .select('available_credits')
    .eq('user_id', id)
    .single()

  const current = credits?.available_credits ?? 0
  let newValue: number

  switch (operation) {
    case 'add':
      newValue = current + amount
      break
    case 'remove':
      newValue = Math.max(0, current - amount)
      break
    case 'set':
      newValue = amount
      break
    default:
      return NextResponse.json({ error: 'Operazione non valida' }, { status: 400 })
  }

  const { error } = await db
    .from('credits')
    .update({ available_credits: newValue })
    .eq('user_id', id)

  if (error) {
    console.error('[ADMIN_CREDITS_PATCH]', error)
    return NextResponse.json({ error: 'Errore aggiornamento crediti' }, { status: 500 })
  }

  return NextResponse.json({ success: true, new_credits: newValue })
}
