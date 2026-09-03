import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'
import { Zap, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Registrati',
  description: 'Crea un account gratuito su TrappolaGIoDev e inizia a generare plugin Minecraft con l\'AI.',
}

const perks = [
  '10 crediti gratuiti subito',
  'Genera plugin Java per Spigot/Paper',
  'Genera configurazioni YAML',
  'Storico generazioni illimitato',
]

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
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
              Unisciti a <span className="neon-text">TrappolaGIoDev</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Crea il tuo account gratuito e inizia subito.
            </p>
          </div>
        </div>

        {/* Perks */}
        <div className="mb-6 grid grid-cols-2 gap-2">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              {perk}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Registrandoti, accetti i nostri{' '}
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
