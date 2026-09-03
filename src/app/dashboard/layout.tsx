import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check suspension
  const { data: profile } = await supabase
    .from('users')
    .select('is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    redirect('/suspended')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
