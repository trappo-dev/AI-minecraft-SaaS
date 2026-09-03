'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { PlanId } from '@/lib/stripe'

interface CheckoutButtonProps {
  planId?: PlanId
  packId?: string
  label?: string
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
  disabled?: boolean
}

export function CheckoutButton({
  planId,
  packId,
  label = 'Acquista',
  variant = 'default',
  className,
  disabled,
}: CheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCheckout() {
    setError(null)
    startTransition(async () => {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, packId }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error ?? 'Errore durante il checkout.')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckout}
        disabled={isPending || disabled}
        variant={variant}
        className={className}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Apertura checkout…
          </>
        ) : (
          label
        )}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
