/**
 * TypeScript types matching the Supabase database schema.
 * Keep these in sync with supabase-schema.sql
 */

export type SubscriptionStatus = 'free' | 'pro' | 'ultra' | 'canceled'
export type UserRole = 'user' | 'admin'
export type GenerationType = 'plugin' | 'config'
export type ApiType = 'spigot' | 'paper' | 'bungeecord'

export interface DbUser {
  id: string
  email: string
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus
  role: UserRole
  is_suspended: boolean
  created_at: string
  updated_at: string
}

export interface DbCredits {
  id: string
  user_id: string
  available_credits: number
  updated_at: string
}

export interface DbGeneration {
  id: string
  user_id: string
  type: GenerationType
  prompt: string
  output_code: string | null
  mc_version: string | null
  api_type: ApiType | null
  credits_used: number
  created_at: string
}

export interface DbCoupon {
  id: string
  code: string
  credit_reward: number
  max_uses: number
  current_uses: number
  expires_at: string | null
  created_by: string | null
  created_at: string
}

export interface DbCouponRedemption {
  id: string
  coupon_id: string
  user_id: string
  redeemed_at: string
}

/**
 * Extended user object with credits joined — used in dashboard & admin panel
 */
export interface UserWithCredits extends DbUser {
  credits: DbCredits | null
}

/**
 * Plan configuration object
 */
export interface PlanConfig {
  id: 'free' | 'pro' | 'ultra'
  name: string
  price: number
  currency: string
  credits: number | 'unlimited'
  features: string[]
  stripePriceId?: string
  highlighted?: boolean
}
