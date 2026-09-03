import type { Metadata } from 'next'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { UsersTable } from '@/components/admin/users-table'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Admin – Utenti' }
export const dynamic = 'force-dynamic'

async function getAllUsers() {
  const db = createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await db
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
    console.error('[ADMIN_USERS_PAGE]', error)
    return []
  }

  return data ?? []
}

export default async function AdminUsersPage() {
  const users = await getAllUsers()

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestione Utenti</h1>
            <p className="text-sm text-muted-foreground">
              Visualizza, cerca, sospendi e modifica i crediti degli utenti.
            </p>
          </div>
        </div>
        <Badge className="bg-secondary text-muted-foreground text-sm px-3 py-1">
          {users.length} utenti registrati
        </Badge>
      </div>

      {/* Users table */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <UsersTable initialUsers={users as any} />
    </div>
  )
}
