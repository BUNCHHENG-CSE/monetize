export interface OutboundAlertPayload {
  event: "credits.low_balance" | "rate_limit.exceeded" | "key.created" | "key.revoked" | "test.ping";
  userId: string;
  timestamp: string;
  data: Record<string, any>;
  message: string;
}

export interface WebhookConfig {
  userId: string;
  endpointUrl: string;
  lowCreditThreshold: number; // e.g. 100 credits
  notifyOnRateLimit: boolean;
  notifyOnLowCredits: boolean;
  format: "raw_json" | "slack" | "discord";
  isActive: boolean;
}

// In-Memory store for zero-setup local dev / demo fallback
const alertConfigStore = new Map<string, WebhookConfig>([
  [
    "user_demo_123",
    {
      userId: "user_demo_123",
      endpointUrl: "https://httpbin.org/post",
      lowCreditThreshold: 200,
      notifyOnRateLimit: true,
      notifyOnLowCredits: true,
      format: "raw_json",
      isActive: true,
    },
  ],
]);

export function getAlertConfig(userId: string): WebhookConfig {
  return (
    alertConfigStore.get(userId) || {
      userId,
      endpointUrl: "",
      lowCreditThreshold: 150,
      notifyOnRateLimit: true,
      notifyOnLowCredits: true,
      format: "raw_json",
      isActive: false,
    }
  );
}

export function saveAlertConfig(config: WebhookConfig): WebhookConfig {
  alertConfigStore.set(config.userId, config);
  return config;
}

export async function dispatchOutboundAlert(
  payload: OutboundAlertPayload
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const config = getAlertConfig(payload.userId);
  if (!config.isActive || !config.endpointUrl) {
    return { success: false, error: "Alerts not configured or inactive" };
  }

  // Filter based on event settings
  if (payload.event === "credits.low_balance" && !config.notifyOnLowCredits) {
    return { success: false, error: "Low credit alerts disabled in config" };
  }
  if (payload.event === "rate_limit.exceeded" && !config.notifyOnRateLimit) {
    return { success: false, error: "Rate limit alerts disabled in config" };
  }

  try {
    let requestBody: any = payload;
    let headers: Record<string, string> = { "Content-Type": "application/json" };

    if (config.format === "slack" || config.endpointUrl.includes("hooks.slack.com")) {
      requestBody = {
        text: `🚨 [TCT Monetize Alert] ${payload.message}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*🚨 TCT Monetize Alert: \`${payload.event}\`*\n${payload.message}`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*User*: \`${payload.userId}\` • *Time*: ${payload.timestamp}`,
              },
            ],
          },
        ],
      };
    } else if (config.format === "discord" || config.endpointUrl.includes("discord.com/api/webhooks")) {
      requestBody = {
        username: "TCT Monetize",
        avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
        embeds: [
          {
            title: `🚨 Alert: ${payload.event}`,
            description: payload.message,
            color: payload.event === "credits.low_balance" ? 0xf59e0b : 0xef4444,
            fields: [
              { name: "User ID", value: `\`${payload.userId}\``, inline: true },
              { name: "Timestamp", value: payload.timestamp, inline: true },
              ...Object.entries(payload.data).map(([k, v]) => ({
                name: k,
                value: String(v),
                inline: true,
              })),
            ],
            footer: { text: "TCT Monetize Outbound Dispatcher" },
          },
        ],
      };
    }

    const response = await fetch(config.endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(5000),
    });

    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}
