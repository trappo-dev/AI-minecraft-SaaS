'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Puzzle,
  Settings,
  FileCode2,
  LogOut,
  Zap,
  ChevronRight,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/generate/plugin',
    label: 'Plugin Generator',
    icon: Puzzle,
  },
  {
    href: '/generate/config',
    label: 'Config Generator',
    icon: FileCode2,
  },
  {
    href: '/dashboard/billing',
    label: 'Fatturazione',
    icon: CreditCard,
  },
  {
    href: '/dashboard/settings',
    label: 'Impostazioni',
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 animate-pulse-neon">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <span className="font-bold text-foreground tracking-tight">
          Trappola<span className="neon-text">GIoDev</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {item.label}
              {isActive && (
                <ChevronRight className="ml-auto h-3 w-3 text-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade banner */}
      <div className="mx-3 mb-3 rounded-lg gradient-border p-4">
        <p className="text-xs font-semibold text-foreground">Vuoi più crediti?</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Passa al piano Pro o Ultra.</p>
        <Link href="/pricing">
          <Button size="sm" className="mt-3 w-full text-xs h-7">
            Upgrade
          </Button>
        </Link>
      </div>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Esci
          </Button>
        </form>
      </div>
    </aside>
  )
}
