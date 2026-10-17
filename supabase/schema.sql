-- =========================================================================
-- DevTool Monetization & Growth Wrapper: Database Schema for Supabase
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Synced with Clerk via Webhook or Just-In-Time)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Clerk user id (e.g. user_2pABC...)
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  credits_balance INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Subscriptions Table (Lemon Squeezy & Stripe MoR / Direct)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY, -- Sub ID (e.g. sub_123 or ls_sub_123)
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('lemonsqueezy', 'stripe')),
  plan_id TEXT NOT NULL DEFAULT 'pro', -- 'pro', 'scale', etc.
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'trialing'
  customer_id TEXT NOT NULL, -- Lemon Squeezy customer ID or Stripe customer ID
  variant_id TEXT, -- Lemon Squeezy variant ID or Stripe price ID
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 3. Developer API Keys Table (For CLI, SDK, and programmatic API access)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id TEXT PRIMARY KEY, -- key_xxxx
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default API Key',
  key_prefix TEXT NOT NULL, -- e.g. "sk_live_a1b2..." (shown in UI)
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of secret key
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  requests_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

-- 4. Usage Records / Execution Audit Logs
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  api_key_id TEXT REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  credits_deducted INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER DEFAULT 0,
  status_code INTEGER NOT NULL DEFAULT 200,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);

-- 5. Webhook Events (Idempotency ledger to avoid double billing or double crediting)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY, -- External webhook event ID
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ATOMIC STORED PROCEDURES / FUNCTIONS
-- =========================================================================

-- Deduct credits atomically with balance check
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id TEXT,
  p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lock the profile row for update
  SELECT credits_balance INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found', 'balance', 0);
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credit balance',
      'balance', v_current_balance,
      'required', p_amount
    );
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.profiles
  SET credits_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'deducted', p_amount
  );
END;
$$;

-- Add credits atomically (top-ups or subscription refill)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id TEXT,
  p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits_balance = credits_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'added', p_amount
  );
END;
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Note: In Next.js Server Components and Server Actions / API Routes,
-- the Supabase Service Role Key bypasses RLS for administrative access,
-- while public client queries are guarded.
