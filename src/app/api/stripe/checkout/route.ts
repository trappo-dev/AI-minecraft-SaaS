import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'
import type { PlanId } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { planId, packId } = await request.json() as {
      planId?: PlanId
      packId?: string
    }

    if (!planId && !packId) {
      return NextResponse.json({ error: 'planId o packId richiesto' }, { status: 400 })
    }

    // Fetch user profile to get/create Stripe customer
    const { data: profile } = await supabase
      .from('users')
      .select('email, stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single()

    // Get or create Stripe Customer
    let stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // ─── Subscription checkout ──────────────────────────────────────
    if (planId && planId !== 'free') {
      const plan = PLANS[planId]

      if (!plan.stripePriceId) {
        return NextResponse.json(
          { error: `Price ID per il piano "${planId}" non configurato. Aggiungi STRIPE_PRICE_ID_${planId.toUpperCase()} in .env.local` },
          { status: 500 }
        )
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard?success=true&plan=${planId}`,
        cancel_url: `${appUrl}/pricing?canceled=true`,
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            plan_id: planId,
          },
        },
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
          type: 'subscription',
        },
        locale: 'it',
        allow_promotion_codes: true,
      })

      return NextResponse.json({ url: session.url })
    }

    // ─── One-time credit pack checkout ──────────────────────────────
    if (packId) {
      const { CREDIT_PACKS } = await import('@/lib/stripe')
      const pack = CREDIT_PACKS.find((p) => p.id === packId)

      if (!pack) {
        return NextResponse.json({ error: 'Pacchetto crediti non trovato' }, { status: 404 })
      }

      if (!pack.stripePriceId) {
        return NextResponse.json(
          { error: `Price ID per il pacchetto "${packId}" non configurato in .env.local` },
          { status: 500 }
        )
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: pack.stripePriceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard?success=true&credits=${pack.credits}`,
        cancel_url: `${appUrl}/pricing?canceled=true`,
        metadata: {
          supabase_user_id: user.id,
          pack_id: packId,
          credit_amount: pack.credits.toString(),
          type: 'credit_pack',
        },
        locale: 'it',
        allow_promotion_codes: true,
      })

      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  } catch (error) {
    console.error('[STRIPE_CHECKOUT]', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
