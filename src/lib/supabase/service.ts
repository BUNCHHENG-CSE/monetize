import { supabaseAdmin, isSupabaseConfigured } from "./client";
import { sql, isPostgresConfigured } from "@/lib/db";
import { createHash } from "crypto";
import { nanoid } from "nanoid";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  credits_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  provider: "lemonsqueezy" | "stripe";
  plan_id: string;
  status: "active" | "past_due" | "canceled" | "trialing" | "paused";
  customer_id: string;
  variant_id?: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  is_active: boolean;
  requests_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  api_key_id: string | null;
  endpoint: string;
  credits_deducted: number;
  duration_ms: number;
  status_code: number;
  metadata?: Record<string, any>;
  created_at: string;
}

// -----------------------------------------------------------------------------
// In-Memory Mock Store for Zero-Setup Local Development
// -----------------------------------------------------------------------------
const mockStore = {
  profiles: new Map<string, Profile>([
    [
      "user_demo_123",
      {
        id: "user_demo_123",
        email: "demo@developer.local",
        name: "Demo Developer",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        credits_balance: 1420,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  ]),
  subscriptions: new Map<string, Subscription>([
    [
      "sub_demo_pro",
      {
        id: "sub_demo_pro",
        user_id: "user_demo_123",
        provider: "lemonsqueezy",
        plan_id: "pro",
        status: "active",
        customer_id: "cust_demo_8821",
        variant_id: "variant_pro_monthly",
        current_period_end: new Date(Date.now() + 20 * 86400000).toISOString(),
        cancel_at_period_end: false,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  ]),
  apiKeys: new Map<string, ApiKey>([
    [
      "key_demo_primary",
      {
        id: "key_demo_primary",
        user_id: "user_demo_123",
        name: "CLI & Terminal Key",
        key_prefix: "sk_live_demo88f2...",
        key_hash: createHash("sha256").update("sk_live_demo88f29910a7b4c").digest("hex"),
        is_active: true,
        requests_count: 342,
        last_used_at: new Date(Date.now() - 15 * 60000).toISOString(),
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ],
  ]),
  usageLogs: [
    {
      id: "log_1",
      user_id: "user_demo_123",
      api_key_id: "key_demo_primary",
      endpoint: "/api/v1/tool/execute",
      credits_deducted: 1,
      duration_ms: 38,
      status_code: 200,
      metadata: { dialect: "postgres" },
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: "log_2",
      user_id: "user_demo_123",
      api_key_id: "key_demo_primary",
      endpoint: "/api/v1/tool/execute",
      credits_deducted: 1,
      duration_ms: 54,
      status_code: 200,
      metadata: { dialect: "mysql" },
      created_at: new Date(Date.now() - 95 * 60000).toISOString(),
    },
  ] as UsageLog[],
};

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// -----------------------------------------------------------------------------
// Database Operations (Direct PostgreSQL -> Supabase Client -> Mock Fallback)
// -----------------------------------------------------------------------------

/**
 * Fetch or automatically initialize user profile
 */
export async function getOrCreateProfile(
  userId: string,
  email: string,
  name?: string | null,
  avatarUrl?: string | null
): Promise<Profile> {
  // Option 1: Direct PostgreSQL
  if (isPostgresConfigured && sql) {
    const existing = await sql<Profile[]>`
      SELECT * FROM public.profiles WHERE id = ${userId} LIMIT 1;
    `;
    if (existing.length > 0) return existing[0];

    const inserted = await sql<Profile[]>`
      INSERT INTO public.profiles (id, email, name, avatar_url, credits_balance)
      VALUES (${userId}, ${email}, ${name || null}, ${avatarUrl || null}, 50)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, profiles.name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW()
      RETURNING *;
    `;
    return inserted[0];
  }

  // Option 2: Supabase REST
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profile) return profile as Profile;

    const { data: newProfile, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        email,
        name: name || null,
        avatar_url: avatarUrl || null,
        credits_balance: 50,
      })
      .select("*")
      .single();

    if (error) throw error;
    return newProfile as Profile;
  }

  // Option 3: Local In-Memory Fallback
  if (!mockStore.profiles.has(userId)) {
    const newProfile: Profile = {
      id: userId,
      email,
      name: name || null,
      avatar_url: avatarUrl || null,
      credits_balance: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockStore.profiles.set(userId, newProfile);
  }
  return mockStore.profiles.get(userId)!;
}

/**
 * Fetch profile by user ID
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  if (isPostgresConfigured && sql) {
    const rows = await sql<Profile[]>`
      SELECT * FROM public.profiles WHERE id = ${userId} LIMIT 1;
    `;
    return rows[0] || null;
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return (data as Profile) || null;
  }

  return mockStore.profiles.get(userId) || null;
}

/**
 * Fetch active subscription for user
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  if (isPostgresConfigured && sql) {
    const rows = await sql<Subscription[]>`
      SELECT * FROM public.subscriptions 
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY created_at DESC 
      LIMIT 1;
    `;
    return rows[0] || null;
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (data as Subscription) || null;
  }

  const sub = Array.from(mockStore.subscriptions.values()).find(
    (s) => s.user_id === userId && s.status === "active"
  );
  return sub || null;
}

/**
 * Upsert subscription from payment webhook
 */
export async function upsertSubscription(
  sub: Omit<Subscription, "created_at" | "updated_at">
): Promise<void> {
  if (isPostgresConfigured && sql) {
    await sql`
      INSERT INTO public.subscriptions (
        id, user_id, provider, plan_id, status, customer_id, variant_id, current_period_end, cancel_at_period_end, updated_at
      ) VALUES (
        ${sub.id}, ${sub.user_id}, ${sub.provider}, ${sub.plan_id}, ${sub.status},
        ${sub.customer_id}, ${sub.variant_id || null}, ${sub.current_period_end},
        ${sub.cancel_at_period_end}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        plan_id = EXCLUDED.plan_id,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        updated_at = NOW();
    `;
    return;
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("subscriptions").upsert({
      ...sub,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return;
  }

  mockStore.subscriptions.set(sub.id, {
    ...sub,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

/**
 * Deduct credits atomically using PostgreSQL Stored Procedure
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; balance: number; error?: string }> {
  if (isPostgresConfigured && sql) {
    const result = await sql<[{ deduct_credits: { success: boolean; balance: number; error?: string } }]>`
      SELECT public.deduct_credits(${userId}, ${amount});
    `;
    return result[0]?.deduct_credits || { success: false, balance: 0, error: "Deduction failed" };
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc("deduct_credits", {
      p_user_id: userId,
      p_amount: amount,
    });
    if (error) return { success: false, balance: 0, error: error.message };
    return data as { success: boolean; balance: number; error?: string };
  }

  const profile = mockStore.profiles.get(userId);
  if (!profile) return { success: false, balance: 0, error: "Profile not found" };
  if (profile.credits_balance < amount) {
    return { success: false, balance: profile.credits_balance, error: "Insufficient credit balance" };
  }
  profile.credits_balance -= amount;
  return { success: true, balance: profile.credits_balance };
}

/**
 * Add credits atomically
 */
export async function addCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; balance: number }> {
  if (isPostgresConfigured && sql) {
    const result = await sql<[{ add_credits: { success: boolean; balance: number } }]>`
      SELECT public.add_credits(${userId}, ${amount});
    `;
    return result[0]?.add_credits || { success: false, balance: 0 };
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc("add_credits", {
      p_user_id: userId,
      p_amount: amount,
    });
    if (error) throw error;
    return data as { success: boolean; balance: number };
  }

  const profile = mockStore.profiles.get(userId);
  if (profile) {
    profile.credits_balance += amount;
    return { success: true, balance: profile.credits_balance };
  }
  return { success: false, balance: 0 };
}

/**
 * Generate a new API Key for user
 */
export async function createApiKey(
  userId: string,
  name: string
): Promise<{ rawKey: string; keyInfo: ApiKey }> {
  const secretRandom = nanoid(32);
  const rawKey = `sk_live_${secretRandom}`;
  const keyPrefix = `sk_live_${rawKey.slice(8, 14)}...`;
  const keyHash = hashApiKey(rawKey);
  const id = `key_${nanoid(16)}`;

  const keyRecord: ApiKey = {
    id,
    user_id: userId,
    name,
    key_prefix: keyPrefix,
    key_hash: keyHash,
    is_active: true,
    requests_count: 0,
    last_used_at: null,
    created_at: new Date().toISOString(),
  };

  if (isPostgresConfigured && sql) {
    const rows = await sql<ApiKey[]>`
      INSERT INTO public.api_keys (id, user_id, name, key_prefix, key_hash, is_active, requests_count)
      VALUES (${id}, ${userId}, ${name}, ${keyPrefix}, ${keyHash}, true, 0)
      RETURNING *;
    `;
    return { rawKey, keyInfo: rows[0] };
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .insert(keyRecord)
      .select("*")
      .single();
    if (error) throw error;
    return { rawKey, keyInfo: data as ApiKey };
  }

  mockStore.apiKeys.set(id, keyRecord);
  return { rawKey, keyInfo: keyRecord };
}

/**
 * Get all API keys for user
 */
export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  if (isPostgresConfigured && sql) {
    return await sql<ApiKey[]>`
      SELECT * FROM public.api_keys 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC;
    `;
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data as ApiKey[]) || [];
  }

  return Array.from(mockStore.apiKeys.values()).filter((k) => k.user_id === userId);
}

/**
 * Revoke API key
 */
export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  if (isPostgresConfigured && sql) {
    const result = await sql`
      DELETE FROM public.api_keys 
      WHERE id = ${keyId} AND user_id = ${userId};
    `;
    return result.count > 0;
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from("api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", userId);
    return !error;
  }

  const key = mockStore.apiKeys.get(keyId);
  if (key && key.user_id === userId) {
    mockStore.apiKeys.delete(keyId);
    return true;
  }
  return false;
}

/**
 * Verify raw API key from Authorization header
 */
export async function verifyApiKey(
  rawKey: string
): Promise<{ valid: boolean; userId?: string; keyId?: string }> {
  // Demo key support for testing out of the box
  if (rawKey === "sk_live_demo88f29910a7b4c" || rawKey === "sk_test_demo") {
    return { valid: true, userId: "user_demo_123", keyId: "key_demo_primary" };
  }

  const keyHash = hashApiKey(rawKey);

  if (isPostgresConfigured && sql) {
    const rows = await sql<{ id: string; user_id: string; is_active: boolean }[]>`
      SELECT id, user_id, is_active FROM public.api_keys
      WHERE key_hash = ${keyHash} AND is_active = true
      LIMIT 1;
    `;
    if (rows.length === 0) return { valid: false };

    // Update async in background without blocking request
    sql`
      UPDATE public.api_keys 
      SET last_used_at = NOW(), requests_count = requests_count + 1 
      WHERE id = ${rows[0].id};
    `.catch(() => {});

    return { valid: true, userId: rows[0].user_id, keyId: rows[0].id };
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data: key, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id, is_active")
      .eq("key_hash", keyHash)
      .single();

    if (error || !key || !key.is_active) {
      return { valid: false };
    }

    supabaseAdmin
      .from("api_keys")
      .update({
        last_used_at: new Date().toISOString(),
        requests_count: (key as any).requests_count + 1,
      })
      .eq("id", key.id)
      .then(() => {});

    return { valid: true, userId: key.user_id, keyId: key.id };
  }

  for (const key of mockStore.apiKeys.values()) {
    if (key.key_hash === keyHash && key.is_active) {
      key.requests_count += 1;
      key.last_used_at = new Date().toISOString();
      return { valid: true, userId: key.user_id, keyId: key.id };
    }
  }
  return { valid: false };
}

/**
 * Log usage execution
 */
export async function logUsage(params: {
  userId: string;
  apiKeyId?: string | null;
  endpoint: string;
  creditsDeducted: number;
  durationMs: number;
  statusCode: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  const logId = `log_${nanoid(12)}`;

  if (isPostgresConfigured && sql) {
    await sql`
      INSERT INTO public.usage_logs (
        id, user_id, api_key_id, endpoint, credits_deducted, duration_ms, status_code, metadata, created_at
      ) VALUES (
        ${logId}, ${params.userId}, ${params.apiKeyId || null}, ${params.endpoint},
        ${params.creditsDeducted}, ${params.durationMs}, ${params.statusCode},
        ${JSON.stringify(params.metadata || {})}, NOW()
      );
    `;
    return;
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from("usage_logs").insert({
      id: logId,
      user_id: params.userId,
      api_key_id: params.apiKeyId || null,
      endpoint: params.endpoint,
      credits_deducted: params.creditsDeducted,
      duration_ms: params.durationMs,
      status_code: params.statusCode,
      metadata: params.metadata || {},
    });
    return;
  }

  mockStore.usageLogs.unshift({
    id: logId,
    user_id: params.userId,
    api_key_id: params.apiKeyId || null,
    endpoint: params.endpoint,
    credits_deducted: params.creditsDeducted,
    duration_ms: params.durationMs,
    status_code: params.statusCode,
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  });
  if (mockStore.usageLogs.length > 50) mockStore.usageLogs.pop();
}

/**
 * Fetch usage logs for user dashboard
 */
export async function getUserUsageLogs(userId: string, limit = 20): Promise<UsageLog[]> {
  if (isPostgresConfigured && sql) {
    return await sql<UsageLog[]>`
      SELECT * FROM public.usage_logs 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT ${limit};
    `;
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("usage_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as UsageLog[]) || [];
  }

  return mockStore.usageLogs.filter((l) => l.user_id === userId).slice(0, limit);
}
