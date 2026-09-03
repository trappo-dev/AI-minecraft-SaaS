import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Strict admin-only check
  const { data: profile } = await supabase
    .from('users')
    .select('role, is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    // Silently redirect non-admins — don't reveal the admin panel exists
    redirect('/dashboard')
  }

  if (profile?.is_suspended) {
    redirect('/suspended')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Subtle amber top border to distinguish from user dashboard */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent z-50" />
      <AdminSidebar />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
