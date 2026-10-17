export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "month" | "year" | "one-time";
  creditsPerMonth: number;
  rateLimitPerMin: number;
  popular?: boolean;
  features: string[];
  stripePriceId?: string;
  lemonSqueezyVariantId?: string;
}

export interface ToolInputSchema {
  name: string;
  type: "string" | "number" | "boolean" | "json";
  required: boolean;
  description: string;
  default?: any;
}

export interface MonetizationConfig {
  // Brand & Tool Identity
  tool: {
    id: string;
    name: string;
    tagline: string;
    description: string;
    badge: string;
    version: string;
    githubUrl?: string;
    docsUrl?: string;
    author: {
      name: string;
      handle: string;
      url?: string;
    };
  };

  // Billing & Providers
  providers: {
    payments: "lemonsqueezy" | "stripe";
    auth: "clerk";
    database: "supabase";
  };

  // Pricing & Subscription Plans
  plans: PlanConfig[];

  // Credit packs for one-time top-ups
  creditPacks: {
    id: string;
    name: string;
    credits: number;
    price: number;
    stripePriceId?: string;
    lemonSqueezyVariantId?: string;
  }[];

  // Tool Engine Settings (The Developer's Logic)
  toolEngine: {
    apiEndpoint: string;
    defaultCostInCredits: number;
    inputSchema: ToolInputSchema[];
    sampleRequest: Record<string, any>;
    sampleResponse: Record<string, any>;
  };
}

export const monetizeConfig: MonetizationConfig = {
  tool: {
    id: "dev-optimizer",
    name: "DevTool Monetize Engine",
    tagline: "The fastest wrapper to transform your CLI, script, or API into a revenue-generating product",
    description: "Plug in your custom TypeScript/Python business logic. We provide pre-wired Clerk auth, Lemon Squeezy/Stripe billing, credit metering, API key distribution, and customer portal in minutes.",
    badge: "Production Ready Starter",
    version: "1.0.0",
    githubUrl: "https://github.com",
    docsUrl: "/docs",
    author: {
      name: "Indie Dev",
      handle: "@indiedev",
      url: "https://twitter.com",
    },
  },

  providers: {
    payments: "lemonsqueezy", // or 'stripe'
    auth: "clerk",
    database: "supabase",
  },

  plans: [
    {
      id: "free",
      name: "Hobby",
      description: "For testing, prototyping, and personal sandbox experiments.",
      price: 0,
      interval: "month",
      creditsPerMonth: 50,
      rateLimitPerMin: 5,
      features: [
        "50 Tool Execution Credits / mo",
        "1 Active API Key",
        "Community Discord Support",
        "Standard Speed Processing",
        "Web Dashboard Access",
      ],
    },
    {
      id: "pro",
      name: "Pro Developer",
      description: "For active builders, automated scripts, and growing workloads.",
      price: 29,
      interval: "month",
      popular: true,
      creditsPerMonth: 2500,
      rateLimitPerMin: 60,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro_monthly",
      lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_PRO_VARIANT_ID || "variant_pro_monthly",
      features: [
        "2,500 Tool Execution Credits / mo",
        "Unlimited API Keys",
        "Dedicated Rate Limit (60 req/min)",
        "Automated Webhooks & Alerts",
        "Priority Email & Slack Support",
        "Full API & SDK Access",
      ],
    },
    {
      id: "scale",
      name: "Scale / Team",
      description: "High concurrency and unlimited throughput for production infrastructure.",
      price: 99,
      interval: "month",
      creditsPerMonth: 15000,
      rateLimitPerMin: 300,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID || "price_scale_monthly",
      lemonSqueezyVariantId: process.env.NEXT_PUBLIC_LEMON_SCALE_VARIANT_ID || "variant_scale_monthly",
      features: [
        "15,000 Tool Execution Credits / mo",
        "Unlimited API Keys & Team Seats",
        "Custom Rate Limits (300+ req/min)",
        "SLA Guarantee (99.9% Uptime)",
        "Custom Domain & White-labeling",
        "Direct 1-on-1 Engineering Support",
      ],
    },
  ],

  creditPacks: [
    {
      id: "credits-500",
      name: "500 Extra Credits",
      credits: 500,
      price: 9,
      stripePriceId: "price_credits_500",
      lemonSqueezyVariantId: "variant_credits_500",
    },
    {
      id: "credits-2500",
      name: "2,500 Extra Credits",
      credits: 2500,
      price: 39,
      stripePriceId: "price_credits_2500",
      lemonSqueezyVariantId: "variant_credits_2500",
    },
  ],

  toolEngine: {
    apiEndpoint: "/api/v1/tool/execute",
    defaultCostInCredits: 1,
    inputSchema: [
      {
        name: "prompt",
        type: "string",
        required: true,
        description: "The primary input prompt or code payload to analyze / execute.",
        default: "SELECT u.id, u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name;",
      },
      {
        name: "options",
        type: "json",
        required: false,
        description: "Configuration parameters (e.g. strictMode, format, targetRuntime).",
        default: { strictMode: true, format: "json" },
      },
    ],
    sampleRequest: {
      prompt: "SELECT u.id, u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name;",
      options: {
        strictMode: true,
        dialect: "postgres",
        benchmark: true,
      },
    },
    sampleResponse: {
      success: true,
      executionId: "exec_98af2c019d",
      durationMs: 42,
      creditsUsed: 1,
      creditsRemaining: 2499,
      data: {
        optimizedQuery: "SELECT u.id, u.name, count(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name;",
        recommendations: [
          "Add composite index ON orders(user_id, id)",
          "Scan cost reduced from 142.5 to 18.2",
        ],
        estimatedSpeedup: "7.8x",
      },
    },
  },
};
