import { supabaseAdmin, isSupabaseConfigured } from "./client";
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

// -----------------------------------------------------------------------------
// Database Service Implementation
// -----------------------------------------------------------------------------

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Fetch or automatically initialize user profile
 */
export async function getOrCreateProfile(
  userId: string,
  email: string,
  name?: string | null,
  avatarUrl?: string | null
): Promise<Profile> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    if (!mockStore.profiles.has(userId)) {
      const newProfile: Profile = {
        id: userId,
        email,
        name: name || null,
        avatar_url: avatarUrl || null,
        credits_balance: 50, // 50 free credits on sign up
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockStore.profiles.set(userId, newProfile);
    }
    return mockStore.profiles.get(userId)!;
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profile) return profile as Profile;

  // Insert new profile
  const { data: newProfile, error: insertError } = await supabaseAdmin
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

  if (insertError) {
    console.error("Failed to insert profile:", insertError);
    throw insertError;
  }

  return newProfile as Profile;
}

/**
 * Fetch profile by user ID
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return mockStore.profiles.get(userId) || null;
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return (data as Profile) || null;
}

/**
 * Fetch active subscription for user
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    const sub = Array.from(mockStore.subscriptions.values()).find(
      (s) => s.user_id === userId && s.status === "active"
    );
    return sub || null;
  }

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

/**
 * Upsert subscription from payment webhook
 */
export async function upsertSubscription(sub: Omit<Subscription, "created_at" | "updated_at">): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    mockStore.subscriptions.set(sub.id, {
      ...sub,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return;
  }

  const { error } = await supabaseAdmin.from("subscriptions").upsert({
    ...sub,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error upserting subscription:", error);
    throw error;
  }
}

/**
 * Deduct credits atomically
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; balance: number; error?: string }> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    const profile = mockStore.profiles.get(userId);
    if (!profile) {
      return { success: false, balance: 0, error: "Profile not found" };
    }
    if (profile.credits_balance < amount) {
      return {
        success: false,
        balance: profile.credits_balance,
        error: "Insufficient credit balance",
      };
    }
    profile.credits_balance -= amount;
    return { success: true, balance: profile.credits_balance };
  }

  // Use atomic stored procedure in PostgreSQL
  const { data, error } = await supabaseAdmin.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error("RPC deduct_credits failed:", error);
    return { success: false, balance: 0, error: error.message };
  }

  return data as { success: boolean; balance: number; error?: string };
}

/**
 * Add credits atomically
 */
export async function addCredits(userId: string, amount: number): Promise<{ success: boolean; balance: number }> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    const profile = mockStore.profiles.get(userId);
    if (profile) {
      profile.credits_balance += amount;
      return { success: true, balance: profile.credits_balance };
    }
    return { success: false, balance: 0 };
  }

  const { data, error } = await supabaseAdmin.rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error("RPC add_credits failed:", error);
    throw error;
  }

  return data as { success: boolean; balance: number };
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

  if (!isSupabaseConfigured || !supabaseAdmin) {
    mockStore.apiKeys.set(id, keyRecord);
    return { rawKey, keyInfo: keyRecord };
  }

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .insert(keyRecord)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create API key:", error);
    throw error;
  }

  return { rawKey, keyInfo: data as ApiKey };
}

/**
 * Get all API keys for user
 */
export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return Array.from(mockStore.apiKeys.values()).filter((k) => k.user_id === userId);
  }

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch API keys:", error);
    return [];
  }

  return data as ApiKey[];
}

/**
 * Revoke/delete API key
 */
export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    const key = mockStore.apiKeys.get(keyId);
    if (key && key.user_id === userId) {
      mockStore.apiKeys.delete(keyId);
      return true;
    }
    return false;
  }

  const { error } = await supabaseAdmin
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", userId);

  return !error;
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

  if (!isSupabaseConfigured || !supabaseAdmin) {
    for (const key of mockStore.apiKeys.values()) {
      if (key.key_hash === keyHash && key.is_active) {
        key.requests_count += 1;
        key.last_used_at = new Date().toISOString();
        return { valid: true, userId: key.user_id, keyId: key.id };
      }
    }
    return { valid: false };
  }

  const { data: key, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, user_id, is_active")
    .eq("key_hash", keyHash)
    .single();

  if (error || !key || !key.is_active) {
    return { valid: false };
  }

  // Update last used & request count asynchronously
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
  const log: UsageLog = {
    id: `log_${nanoid(12)}`,
    user_id: params.userId,
    api_key_id: params.apiKeyId || null,
    endpoint: params.endpoint,
    credits_deducted: params.creditsDeducted,
    duration_ms: params.durationMs,
    status_code: params.statusCode,
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured || !supabaseAdmin) {
    mockStore.usageLogs.unshift(log);
    if (mockStore.usageLogs.length > 50) mockStore.usageLogs.pop();
    return;
  }

  await supabaseAdmin.from("usage_logs").insert(log);
}

/**
 * Fetch usage logs for user dashboard
 */
export async function getUserUsageLogs(userId: string, limit = 20): Promise<UsageLog[]> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return mockStore.usageLogs.filter((l) => l.user_id === userId).slice(0, limit);
  }

  const { data, error } = await supabaseAdmin
    .from("usage_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch usage logs:", error);
    return [];
  }

  return data as UsageLog[];
}
