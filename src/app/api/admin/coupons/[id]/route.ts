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
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

// DELETE /api/admin/coupons/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const { id } = await params
  const db = getAdminClient()

  const { error } = await db.from('coupons').delete().eq('id', id)

  if (error) {
    console.error('[ADMIN_COUPON_DELETE]', error)
    return NextResponse.json({ error: 'Errore eliminazione coupon' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
