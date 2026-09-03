'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)

    // Client-side password match check
    const password = formData.get('password') as string
    const confirm = formData.get('confirm_password') as string
    if (password !== confirm) {
      setError('Le password non coincidono.')
      return
    }
    if (password.length < 8) {
      setError('La password deve contenere almeno 8 caratteri.')
      return
    }

    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in-up">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary animate-fade-in-up">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-medium">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="GioDev99"
          required
          autoComplete="username"
          className="bg-secondary/50 border-border focus:border-primary/60 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@esempio.com"
          required
          autoComplete="email"
          className="bg-secondary/50 border-border focus:border-primary/60 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimo 8 caratteri"
            required
            autoComplete="new-password"
            className="bg-secondary/50 border-border focus:border-primary/60 pr-10 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password" className="text-sm font-medium">Conferma Password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          placeholder="Ripeti la password"
          required
          autoComplete="new-password"
          className="bg-secondary/50 border-border focus:border-primary/60 transition-colors"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || !!success}
        className="w-full glow-neon font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creazione account…
          </>
        ) : (
          'Crea Account Gratuito'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Hai già un account?{' '}
        <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
          Accedi
        </Link>
      </p>
    </form>
  )
}
