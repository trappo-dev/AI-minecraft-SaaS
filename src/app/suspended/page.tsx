import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldOff } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Account Sospeso',
  robots: { index: false },
}

export default function SuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account Sospeso</h1>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            Il tuo account è stato sospeso dall&apos;amministratore. Se pensi si tratti di un errore,
            contatta il supporto.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">← Torna alla Home</Button>
        </Link>
      </div>
    </main>
  )
}
