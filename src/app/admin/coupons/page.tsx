import type { Metadata } from 'next'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { CouponsManager } from '@/components/admin/coupons-manager'
import { Tag } from 'lucide-react'
import type { DbCoupon } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Admin – Coupon' }
export const dynamic = 'force-dynamic'

async function getAllCoupons(): Promise<DbCoupon[]> {
  const db = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await db
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[ADMIN_COUPONS_PAGE]', error)
    return []
  }

  return (data ?? []) as DbCoupon[]
}

export default async function AdminCouponsPage() {
  const coupons = await getAllCoupons()

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Tag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestione Coupon</h1>
          <p className="text-sm text-muted-foreground">
            Crea, monitora ed elimina i codici promozionali per i crediti gratuiti.
          </p>
        </div>
      </div>

      <CouponsManager initialCoupons={coupons} />
    </div>
  )
}
