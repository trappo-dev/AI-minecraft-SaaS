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

// GET /api/admin/coupons — list all coupons
export async function GET() {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const db = getAdminClient()
  const { data: coupons, error } = await db
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Errore recupero coupon' }, { status: 500 })
  return NextResponse.json({ coupons })
}

// POST /api/admin/coupons — create a coupon
export async function POST(request: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })

  const { code, credit_reward, max_uses, expires_at } = await request.json() as {
    code: string
    credit_reward: number
    max_uses: number
    expires_at?: string
  }

  if (!code || !credit_reward || !max_uses) {
    return NextResponse.json(
      { error: 'code, credit_reward e max_uses richiesti' },
      { status: 400 }
    )
  }

  if (credit_reward <= 0 || max_uses <= 0) {
    return NextResponse.json(
      { error: 'credit_reward e max_uses devono essere > 0' },
      { status: 400 }
    )
  }

  const db = getAdminClient()

  const { data, error } = await db
    .from('coupons')
    .insert({
      code: code.toUpperCase().trim(),
      credit_reward,
      max_uses,
      expires_at: expires_at ?? null,
      created_by: adminUser.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Il codice "${code.toUpperCase()}" esiste già` },
        { status: 409 }
      )
    }
    console.error('[ADMIN_COUPONS_POST]', error)
    return NextResponse.json({ error: 'Errore creazione coupon' }, { status: 500 })
  }

  return NextResponse.json({ coupon: data }, { status: 201 })
}
