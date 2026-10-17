-- ==============================================================================
-- Development & Local Seed Data
-- ==============================================================================

-- 1. Seed Demo User Profile
INSERT INTO public.profiles (id, email, name, avatar_url, credits_balance)
VALUES (
  'user_demo_123',
  'demo@developer.local',
  'Demo Developer',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  2500
) ON CONFLICT (id) DO NOTHING;

-- 2. Seed Active Pro Subscription
INSERT INTO public.subscriptions (
  id,
  user_id,
  provider,
  plan_id,
  status,
  customer_id,
  variant_id,
  current_period_end,
  cancel_at_period_end
) VALUES (
  'sub_local_pro_1',
  'user_demo_123',
  'lemonsqueezy',
  'pro',
  'active',
  'cust_demo_8821',
  'variant_pro_monthly',
  NOW() + INTERVAL '30 days',
  false
) ON CONFLICT (id) DO NOTHING;

-- 3. Seed Default Developer API Key
-- SHA-256 of "sk_live_demo88f29910a7b4c"
INSERT INTO public.api_keys (
  id,
  user_id,
  name,
  key_prefix,
  key_hash,
  is_active,
  requests_count,
  last_used_at
) VALUES (
  'key_demo_primary',
  'user_demo_123',
  'CLI & Local Terminal Key',
  'sk_live_demo88...',
  '372b64ef4d8985161ce38f6b64f33d02e482fe87747754b2d699042a9bbf62a9',
  true,
  42,
  NOW() - INTERVAL '15 minutes'
) ON CONFLICT (id) DO NOTHING;

-- 4. Seed Initial Usage Logs
INSERT INTO public.usage_logs (
  id,
  user_id,
  api_key_id,
  endpoint,
  credits_deducted,
  duration_ms,
  status_code,
  metadata
) VALUES 
  ('seed_log_1', 'user_demo_123', 'key_demo_primary', '/api/v1/tool/execute', 1, 38, 200, '{"dialect":"postgres","query":"SELECT * FROM users"}'),
  ('seed_log_2', 'user_demo_123', 'key_demo_primary', '/api/v1/tool/execute', 1, 45, 200, '{"dialect":"mysql","query":"SELECT id, count(*) FROM logs GROUP BY id"}');
