'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink } from 'lucide-react'

export function ManageBillingButton() {
  const [isPending, startTransition] = useTransition()

  function handlePortal() {
    startTransition(async () => {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) window.location.href = data.url
    })
  }

  return (
    <Button
      onClick={handlePortal}
      disabled={isPending}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Apertura portale…
        </>
      ) : (
        <>
          <ExternalLink className="h-4 w-4" />
          Gestisci Abbonamento
        </>
      )}
    </Button>
  )
}
