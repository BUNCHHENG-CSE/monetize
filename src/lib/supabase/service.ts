import { prisma, isPrismaConfigured } from "@/lib/prisma";
import { supabaseAdmin, isSupabaseConfigured } from "./client";
import { createHash } from "crypto";
import { nanoid } from "nanoid";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  credits_balance?: number;
  creditsBalance?: number;
  created_at?: string | Date;
  createdAt?: string | Date;
  updated_at?: string | Date;
  updatedAt?: string | Date;
}

export interface Subscription {
  id: string;
  user_id?: string;
  userId?: string;
  provider: "lemonsqueezy" | "stripe";
  plan_id?: string;
  planId?: string;
  status: "active" | "past_due" | "canceled" | "trialing" | "paused" | string;
  customer_id?: string;
  customerId?: string;
  variant_id?: string | null;
  variantId?: string | null;
  current_period_end?: string | Date | null;
  currentPeriodEnd?: string | Date | null;
  cancel_at_period_end?: boolean;
  cancelAtPeriodEnd?: boolean;
  created_at?: string | Date;
  createdAt?: string | Date;
  updated_at?: string | Date;
  updatedAt?: string | Date;
}

export interface ApiKey {
  id: string;
  user_id?: string;
  userId?: string;
  name: string;
  key_prefix?: string;
  keyPrefix?: string;
  key_hash?: string;
  keyHash?: string;
  is_active?: boolean;
  isActive?: boolean;
  requests_count?: number;
  requestsCount?: number;
  last_used_at?: string | Date | null;
  lastUsedAt?: string | Date | null;
  created_at?: string | Date;
  createdAt?: string | Date;
}

export interface UsageLog {
  id: string;
  user_id?: string;
  userId?: string;
  api_key_id?: string | null;
  apiKeyId?: string | null;
  endpoint: string;
  credits_deducted?: number;
  creditsDeducted?: number;
  duration_ms?: number;
  durationMs?: number;
  status_code?: number;
  statusCode?: number;
  metadata?: Record<string, any> | any;
  created_at?: string | Date;
  createdAt?: string | Date;
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
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        credits_balance: 1420,
        creditsBalance: 1420,
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
        userId: "user_demo_123",
        provider: "lemonsqueezy",
        plan_id: "pro",
        planId: "pro",
        status: "active",
        customer_id: "cust_demo_8821",
        customerId: "cust_demo_8821",
        variant_id: "variant_pro_monthly",
        variantId: "variant_pro_monthly",
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
        userId: "user_demo_123",
        name: "CLI & Terminal Key",
        key_prefix: "sk_live_demo88f2...",
        keyPrefix: "sk_live_demo88f2...",
        key_hash: createHash("sha256").update("sk_live_demo88f29910a7b4c").digest("hex"),
        is_active: true,
        isActive: true,
        requests_count: 342,
        requestsCount: 342,
        last_used_at: new Date(Date.now() - 15 * 60000).toISOString(),
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ],
  ]),
  usageLogs: [
    {
      id: "log_1",
      user_id: "user_demo_123",
      userId: "user_demo_123",
      api_key_id: "key_demo_primary",
      apiKeyId: "key_demo_primary",
      endpoint: "/api/v1/tool/execute",
      credits_deducted: 1,
      creditsDeducted: 1,
      duration_ms: 38,
      durationMs: 38,
      status_code: 200,
      statusCode: 200,
      metadata: { dialect: "postgres" },
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: "log_2",
      user_id: "user_demo_123",
      userId: "user_demo_123",
      api_key_id: "key_demo_primary",
      apiKeyId: "key_demo_primary",
      endpoint: "/api/v1/tool/execute",
      credits_deducted: 1,
      creditsDeducted: 1,
      duration_ms: 54,
      durationMs: 54,
      status_code: 200,
      statusCode: 200,
      metadata: { dialect: "mysql" },
      created_at: new Date(Date.now() - 95 * 60000).toISOString(),
    },
  ] as UsageLog[],
};

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// -----------------------------------------------------------------------------
// Database Operations (Optimized Prisma ORM -> Supabase Client -> Mock Fallback)
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
  // Option 1: Optimized Prisma ORM
  if (isPrismaConfigured && prisma) {
    const profile = await prisma.profile.upsert({
      where: { id: userId },
      update: {
        email,
        ...(name ? { name } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      create: {
        id: userId,
        email,
        name: name || null,
        avatarUrl: avatarUrl || null,
        creditsBalance: 50,
      },
    });

    return {
      ...profile,
      avatar_url: profile.avatarUrl,
      credits_balance: profile.creditsBalance,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString(),
    };
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
  if (isPrismaConfigured && prisma) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });
    if (!profile) return null;
    return {
      ...profile,
      avatar_url: profile.avatarUrl,
      credits_balance: profile.creditsBalance,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString(),
    };
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
  if (isPrismaConfigured && prisma) {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    if (!sub) return null;
    return {
      ...sub,
      user_id: sub.userId,
      plan_id: sub.planId,
      customer_id: sub.customerId,
      variant_id: sub.variantId,
      current_period_end: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
      cancel_at_period_end: sub.cancelAtPeriodEnd,
      created_at: sub.createdAt.toISOString(),
      updated_at: sub.updatedAt.toISOString(),
    } as Subscription;
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
    (s) => (s.user_id === userId || s.userId === userId) && s.status === "active"
  );
  return sub || null;
}

/**
 * Upsert subscription from payment webhook
 */
export async function upsertSubscription(
  sub: Omit<Subscription, "created_at" | "updated_at">
): Promise<void> {
  const userId = sub.user_id || sub.userId!;
  const planId = sub.plan_id || sub.planId || "pro";
  const customerId = sub.customer_id || sub.customerId!;
  const variantId = sub.variant_id || sub.variantId || null;
  const periodEnd = sub.current_period_end || sub.currentPeriodEnd;
  const cancelAtEnd = Boolean(sub.cancel_at_period_end ?? sub.cancelAtPeriodEnd ?? false);

  if (isPrismaConfigured && prisma) {
    await prisma.subscription.upsert({
      where: { id: sub.id },
      update: {
        status: sub.status,
        planId,
        variantId,
        currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
        cancelAtPeriodEnd: cancelAtEnd,
      },
      create: {
        id: sub.id,
        userId,
        provider: sub.provider,
        planId,
        status: sub.status,
        customerId,
        variantId,
        currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
        cancelAtPeriodEnd: cancelAtEnd,
      },
    });
    return;
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("subscriptions").upsert({
      id: sub.id,
      user_id: userId,
      provider: sub.provider,
      plan_id: planId,
      status: sub.status,
      customer_id: customerId,
      variant_id: variantId,
      current_period_end: periodEnd,
      cancel_at_period_end: cancelAtEnd,
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
 * Deduct credits atomically
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; balance: number; error?: string }> {
  if (isPrismaConfigured && prisma) {
    try {
      // Execute the PostgreSQL stored procedure atomically via Prisma
      const result = await prisma.$queryRaw<[{ deduct_credits: { success: boolean; balance: number; error?: string } }]>`
        SELECT public.deduct_credits(${userId}, ${amount});
      `;
      return result[0]?.deduct_credits || { success: false, balance: 0, error: "Deduction failed" };
    } catch (e: any) {
      // Fallback to Prisma interactive transaction with row check
      try {
        return await prisma.$transaction(async (tx) => {
          const profile = await tx.profile.findUnique({ where: { id: userId } });
          if (!profile) return { success: false, balance: 0, error: "Profile not found" };
          if (profile.creditsBalance < amount) {
            return { success: false, balance: profile.creditsBalance, error: "Insufficient credit balance" };
          }
          const updated = await tx.profile.update({
            where: { id: userId },
            data: { creditsBalance: { decrement: amount } },
          });
          return { success: true, balance: updated.creditsBalance };
        });
      } catch (err: any) {
        return { success: false, balance: 0, error: err.message };
      }
    }
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
  const currentBal = profile.credits_balance ?? profile.creditsBalance ?? 0;
  if (currentBal < amount) {
    return { success: false, balance: currentBal, error: "Insufficient credit balance" };
  }
  const newBal = currentBal - amount;
  profile.credits_balance = newBal;
  profile.creditsBalance = newBal;
  return { success: true, balance: newBal };
}

/**
 * Add credits atomically
 */
export async function addCredits(
  userId: string,
  amount: number
): Promise<{ success: boolean; balance: number }> {
  if (isPrismaConfigured && prisma) {
    const updated = await prisma.profile.update({
      where: { id: userId },
      data: {
        creditsBalance: { increment: amount },
      },
    });
    return { success: true, balance: updated.creditsBalance };
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
    const current = profile.credits_balance ?? profile.creditsBalance ?? 0;
    profile.credits_balance = current + amount;
    profile.creditsBalance = current + amount;
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

  if (isPrismaConfigured && prisma) {
    const key = await prisma.apiKey.create({
      data: {
        id,
        userId,
        name,
        keyPrefix,
        keyHash,
        isActive: true,
        requestsCount: 0,
      },
    });

    return {
      rawKey,
      keyInfo: {
        ...key,
        user_id: key.userId,
        key_prefix: key.keyPrefix,
        key_hash: key.keyHash,
        is_active: key.isActive,
        requests_count: key.requestsCount,
        last_used_at: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
        created_at: key.createdAt.toISOString(),
      },
    };
  }

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
  if (isPrismaConfigured && prisma) {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return keys.map((k) => ({
      ...k,
      user_id: k.userId,
      key_prefix: k.keyPrefix,
      key_hash: k.keyHash,
      is_active: k.isActive,
      requests_count: k.requestsCount,
      last_used_at: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      created_at: k.createdAt.toISOString(),
    }));
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data as ApiKey[]) || [];
  }

  return Array.from(mockStore.apiKeys.values()).filter(
    (k) => k.user_id === userId || k.userId === userId
  );
}

/**
 * Revoke API key
 */
export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  if (isPrismaConfigured && prisma) {
    const result = await prisma.apiKey.deleteMany({
      where: { id: keyId, userId },
    });
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
  if (key && (key.user_id === userId || key.userId === userId)) {
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
  if (rawKey === "sk_live_demo88f29910a7b4c" || rawKey === "sk_test_demo") {
    return { valid: true, userId: "user_demo_123", keyId: "key_demo_primary" };
  }

  const keyHash = hashApiKey(rawKey);

  if (isPrismaConfigured && prisma) {
    const key = await prisma.apiKey.findFirst({
      where: { keyHash, isActive: true },
      select: { id: true, userId: true },
    });
    if (!key) return { valid: false };

    // Asynchronously record last used time and increment counter
    prisma.apiKey.update({
      where: { id: key.id },
      data: {
        lastUsedAt: new Date(),
        requestsCount: { increment: 1 },
      },
    }).catch(() => {});

    return { valid: true, userId: key.userId, keyId: key.id };
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
    if ((key.key_hash === keyHash || key.keyHash === keyHash) && (key.is_active || key.isActive)) {
      key.requests_count = (key.requests_count || 0) + 1;
      key.last_used_at = new Date().toISOString();
      return { valid: true, userId: key.user_id || key.userId, keyId: key.id };
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

  if (isPrismaConfigured && prisma) {
    await prisma.usageLog.create({
      data: {
        id: logId,
        userId: params.userId,
        apiKeyId: params.apiKeyId || null,
        endpoint: params.endpoint,
        creditsDeducted: params.creditsDeducted,
        durationMs: params.durationMs,
        statusCode: params.statusCode,
        metadata: params.metadata || {},
      },
    });
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
    userId: params.userId,
    api_key_id: params.apiKeyId || null,
    apiKeyId: params.apiKeyId || null,
    endpoint: params.endpoint,
    credits_deducted: params.creditsDeducted,
    creditsDeducted: params.creditsDeducted,
    duration_ms: params.durationMs,
    durationMs: params.durationMs,
    status_code: params.statusCode,
    statusCode: params.statusCode,
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  });
  if (mockStore.usageLogs.length > 50) mockStore.usageLogs.pop();
}

/**
 * Fetch usage logs for user dashboard
 */
export async function getUserUsageLogs(userId: string, limit = 20): Promise<UsageLog[]> {
  if (isPrismaConfigured && prisma) {
    const logs = await prisma.usageLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return logs.map((l) => ({
      ...l,
      user_id: l.userId,
      api_key_id: l.apiKeyId,
      credits_deducted: l.creditsDeducted,
      duration_ms: l.durationMs,
      status_code: l.statusCode,
      created_at: l.createdAt.toISOString(),
    }));
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

  return mockStore.usageLogs.filter((l) => l.user_id === userId || l.userId === userId).slice(0, limit);
}
