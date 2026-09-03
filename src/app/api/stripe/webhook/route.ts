import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Admin client (service role) — bypasses RLS for server-side writes
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Map Stripe subscription plan metadata to our DB status
function getPlanFromMetadata(metadata: Stripe.Metadata): string {
  const planId = metadata?.plan_id
  if (planId === 'pro') return 'pro'
  if (planId === 'ultra') return 'ultra'
  return 'free'
}

// Monthly credit allocation per plan
const PLAN_CREDITS: Record<string, number> = {
  pro: 200,
  ultra: 0, // Ultra is unlimited — credits column not used
  free: 0,
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing Stripe signature or webhook secret' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[WEBHOOK] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getAdminClient()

  try {
    switch (event.type) {

      // ── Payment completed (subscription OR one-time) ──────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const type = session.metadata?.type

        if (!userId) break

        // ── One-time credit pack ────────────────────────────────────
        if (type === 'credit_pack') {
          const creditAmount = parseInt(session.metadata?.credit_amount ?? '0', 10)
          if (creditAmount > 0) {
            // Increment credits
            const { data: credits } = await supabase
              .from('credits')
              .select('available_credits')
              .eq('user_id', userId)
              .single()

            await supabase
              .from('credits')
              .update({
                available_credits: (credits?.available_credits ?? 0) + creditAmount,
              })
              .eq('user_id', userId)

            console.log(`[WEBHOOK] Added ${creditAmount} credits to user ${userId}`)
          }
          break
        }

        // ── Subscription: link Stripe customer to user ──────────────
        if (type === 'subscription' && session.customer) {
          await supabase
            .from('users')
            .update({ stripe_customer_id: session.customer as string })
            .eq('id', userId)
        }

        break
      }

      // ── Subscription created / updated ────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        const planId = getPlanFromMetadata(subscription.metadata)

        if (!userId) {
          // Try to find user by Stripe customer ID
          const customerId = subscription.customer as string
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile?.id) {
            await updateUserPlan(supabase, profile.id, planId, subscription.status)
          }
          break
        }

        await updateUserPlan(supabase, userId, planId, subscription.status)
        break
      }

      // ── Subscription canceled / expired ───────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile?.id) {
          await supabase
            .from('users')
            .update({ subscription_status: 'canceled' })
            .eq('id', profile.id)

          console.log(`[WEBHOOK] Subscription canceled for user ${profile.id}`)
        }
        break
      }

      // ── Monthly renewal — reset credits ───────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Only process subscription renewals (not the initial creation handled above)
        if (!invoice.subscription || invoice.billing_reason === 'subscription_create') break

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )

        const customerId = subscription.customer as string
        const planId = getPlanFromMetadata(subscription.metadata)
        const monthlyCredits = PLAN_CREDITS[planId] ?? 0

        if (monthlyCredits === 0) break // Ultra is unlimited, skip

        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile?.id) {
          // Reset credits to plan allocation (not additive — clean monthly reset)
          await supabase
            .from('credits')
            .update({ available_credits: monthlyCredits })
            .eq('user_id', profile.id)

          console.log(`[WEBHOOK] Reset ${monthlyCredits} credits for user ${profile.id} (${planId} renewal)`)
        }
        break
      }

      // ── Payment failed ────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // We could send an email here — for now just log
        console.warn(`[WEBHOOK] Payment failed for invoice ${invoice.id}`)
        break
      }

      default:
        // Unhandled event — not an error
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[WEBHOOK] Processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// ─── Helper: update user plan + credits ──────────────────────────
async function updateUserPlan(
  supabase: ReturnType<typeof getAdminClient>,
  userId: string,
  planId: string,
  stripeStatus: string
) {
  // Map Stripe status to our DB status
  const dbStatus = stripeStatus === 'active' || stripeStatus === 'trialing'
    ? planId
    : 'canceled'

  await supabase
    .from('users')
    .update({ subscription_status: dbStatus })
    .eq('id', userId)

  // On new plan activation, set credits
  if (dbStatus === 'pro') {
    await supabase
      .from('credits')
      .update({ available_credits: PLAN_CREDITS.pro })
      .eq('user_id', userId)
  }
  // Ultra users get unlimited — we check subscription_status in code, don't touch credits

  console.log(`[WEBHOOK] Updated user ${userId} → plan: ${dbStatus}`)
}
