export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  requests_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface UsageLogItem {
  id: string;
  endpoint: string;
  credits_deducted: number;
  duration_ms: number;
  status_code: number;
  created_at: string;
  metadata?: {
    requestId?: string;
    preset?: string | null;
    errorCode?: string;
    planId?: string;
    authMethod?: string;
    [key: string]: any;
  };
}

export interface WebhookAlertSettings {
  endpointUrl: string;
  lowCreditThreshold: number;
  notifyOnRateLimit: boolean;
  notifyOnLowCredits: boolean;
  format: "raw_json" | "slack" | "discord";
  isActive: boolean;
}

export interface AccountInfo {
  demoMode: boolean;
  userId: string;
  email: string;
  name: string | null;
  creditsBalance: number;
  plan: string;
  planDetails: {
    id: string;
    name: string;
    price: number;
    interval: string;
    creditsPerMonth: number;
    rateLimitPerMin: number;
  };
  subscription: null | {
    status: string;
    provider: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
}
