import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Accedi',
  description: 'Accedi al tuo account TrappolaGIoDev per generare plugin e configurazioni Minecraft con l\'AI.',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 animate-pulse-neon">
              <Zap className="h-5 w-5 text-primary" />
            </div>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Bentornato su <span className="neon-text">TrappolaGIoDev</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Accedi per generare plugin e config Minecraft con l&apos;AI.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <LoginForm />
        </div>

        {/* Bottom links */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Accedendo, accetti i nostri{' '}
          <Link href="/terms" className="text-primary/80 hover:text-primary transition-colors">
            Termini di Servizio
          </Link>{' '}
          e la{' '}
          <Link href="/privacy" className="text-primary/80 hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
