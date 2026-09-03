import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Zap, Crown, Rocket, Star } from 'lucide-react'
import Link from 'next/link'
import type { SubscriptionStatus } from '@/lib/types/database'

const planConfig = {
  free: {
    label: 'Free',
    icon: Zap,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    totalCredits: 10,
    description: '10 crediti starter',
  },
  pro: {
    label: 'Pro',
    icon: Crown,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    totalCredits: 200,
    description: '200 crediti / mese',
  },
  ultra: {
    label: 'Ultra',
    icon: Rocket,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    totalCredits: Infinity,
    description: 'Crediti illimitati',
  },
  canceled: {
    label: 'Cancellato',
    icon: Star,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    totalCredits: 0,
    description: 'Abbonamento cancellato',
  },
}

interface PlanCardProps {
  plan: SubscriptionStatus
  availableCredits: number
}

export function PlanCard({ plan, availableCredits }: PlanCardProps) {
  const config = planConfig[plan] ?? planConfig.free
  const PlanIcon = config.icon
  const isUnlimited = plan === 'ultra'
  const progressValue = isUnlimited ? 100 : Math.min((availableCredits / config.totalCredits) * 100, 100)

  return (
    <Card className="glass-card border-border overflow-hidden relative">
      {plan === 'ultra' && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent pointer-events-none" />
      )}
      {plan === 'pro' && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Piano Attivo</CardTitle>
          <Badge
            className={`${config.bgColor} ${config.color} border-0 text-xs font-semibold`}
          >
            <PlanIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Credits display */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {isUnlimited ? '∞' : availableCredits.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isUnlimited ? 'crediti illimitati' : `crediti disponibili`}
              </p>
            </div>
            {!isUnlimited && plan !== 'free' && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>

          {!isUnlimited && (
            <div className="space-y-1">
              <Progress value={progressValue} className="h-1.5" />
              <p className="text-xs text-muted-foreground text-right">
                {availableCredits} / {config.totalCredits} crediti
              </p>
            </div>
          )}
        </div>

        {/* Credit costs reference */}
        <div className="flex gap-3 text-xs text-muted-foreground border-t border-border pt-3">
          <span className="flex items-center gap-1">
            <span className="text-primary font-semibold">1</span> credito = Config
          </span>
          <span className="flex items-center gap-1">
            <span className="text-primary font-semibold">5</span> crediti = Plugin
          </span>
        </div>

        {/* Upgrade CTA */}
        {(plan === 'free' || plan === 'canceled') && (
          <Link href="/pricing">
            <Button size="sm" className="w-full glow-neon text-xs font-semibold">
              <Crown className="mr-1.5 h-3.5 w-3.5" />
              Passa a Pro
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
