import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
})

// ─── Plan Definitions ────────────────────────────────────────────
export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'Free',
    price: 0,
    currency: 'eur',
    credits: 10,
    stripePriceId: null,
    features: [
      '10 crediti starter gratuiti',
      'Config Generator (1 credito)',
      'Plugin Generator (5 crediti)',
      'Storico generazioni',
    ],
  },
  pro: {
    id: 'pro' as const,
    name: 'Pro',
    price: 999, // €9.99 in cents
    currency: 'eur',
    credits: 200,
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO ?? null,
    features: [
      '200 crediti / mese',
      'Config Generator (1 credito)',
      'Plugin Generator (5 crediti)',
      'Storico illimitato',
      'Supporto prioritario',
      'Accesso modelli AI più veloci',
    ],
  },
  ultra: {
    id: 'ultra' as const,
    name: 'Ultra',
    price: 2499, // €24.99 in cents
    currency: 'eur',
    credits: Infinity,
    stripePriceId: process.env.STRIPE_PRICE_ID_ULTRA ?? null,
    features: [
      'Crediti ILLIMITATI',
      'Config Generator (1 credito)',
      'Plugin Generator (5 crediti)',
      'Storico illimitato',
      'Supporto dedicato',
      'Claude 3.5 Sonnet prioritario',
      'Download batch',
      'API access (coming soon)',
    ],
  },
} as const

export type PlanId = keyof typeof PLANS

// ─── Credit Packs (one-time purchases) ───────────────────────────
export const CREDIT_PACKS = [
  {
    id: 'pack_50',
    name: '50 Crediti',
    credits: 50,
    price: 499, // €4.99
    stripePriceId: process.env.STRIPE_PRICE_ID_PACK_50 ?? null,
    popular: false,
  },
  {
    id: 'pack_150',
    name: '150 Crediti',
    credits: 150,
    price: 1299, // €12.99
    stripePriceId: process.env.STRIPE_PRICE_ID_PACK_150 ?? null,
    popular: true,
  },
  {
    id: 'pack_500',
    name: '500 Crediti',
    credits: 500,
    price: 3999, // €39.99
    stripePriceId: process.env.STRIPE_PRICE_ID_PACK_500 ?? null,
    popular: false,
  },
] as const

// ─── Helper: format price ────────────────────────────────────────
export function formatPrice(cents: number, currency = 'eur'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

// ─── Helper: plan from subscription status ───────────────────────
export function getPlanFromStatus(status: string | null): PlanId {
  if (status === 'pro') return 'pro'
  if (status === 'ultra') return 'ultra'
  return 'free'
}

// ─── Helper: monthly credits for plan ───────────────────────────
export function getMonthlyCredits(planId: PlanId): number {
  const plan = PLANS[planId]
  return plan.credits === Infinity ? 0 : plan.credits
}
