-- ================================================================
-- TrappolaGIoDev – Full Database Schema
-- Run this in your Supabase SQL Editor (Project → SQL Editor → New query)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. USERS TABLE
--    Extends Supabase auth.users with app-specific profile data.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT        NOT NULL,
  stripe_customer_id  TEXT        UNIQUE,
  subscription_status TEXT        NOT NULL DEFAULT 'free',
    -- Allowed values: 'free' | 'pro' | 'ultra' | 'canceled'
  role                TEXT        NOT NULL DEFAULT 'user',
    -- Allowed values: 'user' | 'admin'
  is_suspended        BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add check constraints for safety
ALTER TABLE public.users
  ADD CONSTRAINT users_subscription_status_check
    CHECK (subscription_status IN ('free', 'pro', 'ultra', 'canceled')),
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'admin'));

-- ----------------------------------------------------------------
-- 2. CREDITS TABLE
--    Separate table for clean credit management per user.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credits (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  available_credits INT         NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 3. GENERATIONS TABLE
--    Stores every AI generation for history and analytics.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.generations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,
    -- Allowed values: 'plugin' | 'config'
  prompt      TEXT        NOT NULL,
  output_code TEXT,
  mc_version  TEXT,
  api_type    TEXT,
    -- Allowed values: 'spigot' | 'paper' | 'bungeecord'
  credits_used INT        NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generations
  ADD CONSTRAINT generations_type_check
    CHECK (type IN ('plugin', 'config'));

-- ----------------------------------------------------------------
-- 4. COUPONS TABLE
--    Admin-managed promo codes for free credits.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT        NOT NULL UNIQUE,
  credit_reward INT         NOT NULL CHECK (credit_reward > 0),
  max_uses      INT         NOT NULL DEFAULT 1,
  current_uses  INT         NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  created_by    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 5. COUPON REDEMPTIONS TABLE
--    Tracks which user redeemed which coupon (prevents double use).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   UUID        NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)  -- Each user can only redeem a coupon once
);

-- ================================================================
-- TRIGGERS & FUNCTIONS
-- ================================================================

-- ----------------------------------------------------------------
-- Function: Auto-create user profile + credits on signup
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert user profile row
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);

  -- Insert credits row with 10 free starter credits
  INSERT INTO public.credits (user_id, available_credits)
  VALUES (NEW.id, 10);

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------
-- Function: Auto-update updated_at timestamp
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- INDEXES (performance)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_type ON public.generations(type);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON public.coupon_redemptions(user_id);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Helper function: Check if the calling user is an admin
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ----------------------------------------------------------------
-- USERS policies
-- ----------------------------------------------------------------
-- Users can read their own profile
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can update only their own row (limited fields; admins bypass via service role)
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Prevent users from changing their own role or suspension status
    role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND is_suspended = (SELECT is_suspended FROM public.users WHERE id = auth.uid())
  );

-- Only the trigger (service role) inserts user rows — no user-facing insert policy needed
-- Admins (using service_role key) bypass RLS entirely

-- ----------------------------------------------------------------
-- CREDITS policies
-- ----------------------------------------------------------------
-- Users can view their own credits
CREATE POLICY "credits_select_own"
  ON public.credits FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Only service role (webhooks/admin API) can modify credits
-- No user-facing update/insert/delete policies for credits

-- ----------------------------------------------------------------
-- GENERATIONS policies
-- ----------------------------------------------------------------
-- Users can view their own generations
CREATE POLICY "generations_select_own"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Users can insert their own generations (via server API route only in practice)
CREATE POLICY "generations_insert_own"
  ON public.generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- COUPONS policies
-- ----------------------------------------------------------------
-- Admins can do everything with coupons
CREATE POLICY "coupons_admin_all"
  ON public.coupons FOR ALL
  USING (public.is_admin());

-- ----------------------------------------------------------------
-- COUPON REDEMPTIONS policies
-- ----------------------------------------------------------------
-- Users can see their own redemptions
CREATE POLICY "redemptions_select_own"
  ON public.coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Users can insert (redeem) coupons for themselves
CREATE POLICY "redemptions_insert_own"
  ON public.coupon_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- INITIAL ADMIN SETUP (Optional)
-- Replace 'your-admin-email@example.com' with your actual email
-- Run AFTER you have signed up via the app
-- ================================================================

-- UPDATE public.users
--   SET role = 'admin'
-- WHERE email = 'your-admin-email@example.com';

-- ================================================================
-- PLAN CREDIT ALLOCATIONS (Reference)
-- Free:  10 starter credits
-- Pro:   200 credits/month
-- Ultra: Unlimited (check subscription_status in code)
-- Config generation costs: 1 credit
-- Plugin generation costs: 5 credits
-- ================================================================
