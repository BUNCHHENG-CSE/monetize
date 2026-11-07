export type SnippetLanguage = "curl" | "js" | "ts" | "python" | "go" | "rust" | "php";

export interface SnippetGeneratorParams {
  language: SnippetLanguage;
  baseUrl?: string;
  endpoint?: string;
  apiKey?: string;
  body?: Record<string, any>;
  preset?: string;
}

export function generateSnippet({
  language,
  baseUrl = "https://api.yourdomain.com",
  endpoint = "/api/v1/tool/execute",
  apiKey = "sk_live_9f82d10a9c8b77e2",
  body = {
    prompt: "SELECT u.id, u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name;",
    options: { dialect: "postgres", benchmark: true },
  },
  preset,
}: SnippetGeneratorParams): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullEndpoint = `${cleanBase}${cleanEndpoint}`;

  const payloadObj: Record<string, any> = {
    ...body,
    ...(preset && !body.preset ? { preset } : {}),
  };

  const payloadCompact = JSON.stringify(payloadObj);
  const payloadPretty = JSON.stringify(payloadObj, null, 2);
  const payloadPretty4 = JSON.stringify(payloadObj, null, 4);

  switch (language) {
    case "curl":
      return `# 1. Authenticate with your secret API key
# 2. Credits are reserved atomically and automatically refunded if the tool fails
curl -i -X POST "${fullEndpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${payloadCompact.replace(/'/g, "'\\''")}'`;

    case "js":
      return `// JavaScript (Fetch API) with v1.1 uniform error handling
async function executeTool() {
  const response = await fetch("${fullEndpoint}", {
    method: "POST",
    headers: {
      "Authorization": "Bearer ${apiKey}",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(${payloadPretty.split("\n").join("\n    ")}),
  });

  const requestId = response.headers.get("x-request-id");
  const json = await response.json();

  if (!response.ok || !json.success) {
    const err = json.error || {};
    throw new Error(\`[\${err.code || response.status}] \${err.message || "Request failed"} (req: \${requestId})\`);
  }

  console.log(\`✔ Success! Request: \${json.requestId} | Credits remaining: \${json.metadata?.creditsRemaining}\`);
  return json.data;
}

executeTool().catch(console.error);`;

    case "ts":
      return `// TypeScript / Node.js 18+ with strict v1.1 API types
export type ToolErrorCode =
  | "invalid_input"
  | "unknown_preset"
  | "unauthorized"
  | "insufficient_credits"
  | "plan_required"
  | "payload_too_large"
  | "rate_limited"
  | "tool_failed"
  | "internal_error";

export interface ToolSuccessResponse<T = Record<string, unknown>> {
  success: true;
  requestId: string;
  data: T;
  metadata: {
    preset: string | null;
    durationMs: number;
    creditsDeducted: number;
    creditsRemaining: number;
    plan: string;
    warning?: string;
  };
}

export interface ToolErrorResponse {
  success: false;
  requestId: string;
  error: {
    code: ToolErrorCode;
    message: string;
    hint?: string;
    docsUrl?: string;
  };
  issues?: Array<{ path: string; message: string }>;
  retryAfterSeconds?: number;
  creditsBalance?: number;
  creditsRequired?: number;
}

export type ToolApiResponse<T = Record<string, unknown>> =
  | ToolSuccessResponse<T>
  | ToolErrorResponse;

async function executeTool<T = Record<string, unknown>>(): Promise<ToolSuccessResponse<T>> {
  const res = await fetch("${fullEndpoint}", {
    method: "POST",
    headers: {
      "Authorization": "Bearer ${apiKey}",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(${payloadPretty.split("\n").join("\n    ")}),
  });

  const payload = (await res.json()) as ToolApiResponse<T>;

  if (!res.ok || !payload.success) {
    const err = (payload as ToolErrorResponse).error;
    throw new Error(
      \`[\${err?.code ?? res.status}] \${err?.message ?? "Execution failed"}\${err?.hint ? " — " + err.hint : ""} (requestId: \${payload.requestId})\`
    );
  }

  console.log(
    \`✔ Request \${payload.requestId} completed in \${payload.metadata.durationMs}ms | Credits left: \${payload.metadata.creditsRemaining}\`
  );
  return payload;
}

executeTool();`;

    case "python":
      return `import requests
import json

# Python 3 Client with v1.1 Uniform Error Handling
url = "${fullEndpoint}"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = json.loads('''${payloadPretty4}''')

response = requests.post(url, json=payload, headers=headers, timeout=30)
body = response.json()

if not response.ok or not body.get("success"):
    err = body.get("error", {})
    code = err.get("code", f"http_{response.status_code}")
    msg = err.get("message", "Execution failed")
    hint = err.get("hint", "")
    raise RuntimeError(f"[{code}] {msg} {f'({hint})' if hint else ''} [req: {body.get('requestId')}]")

print(
    f"Status: {response.status_code} | Request ID: {body.get('requestId')} | "
    f"Credits Left: {response.headers.get('X-Credits-Remaining')} | "
    f"Latency: {response.headers.get('X-Execution-Time-Ms')}ms"
)
print("Response Data:", json.dumps(body["data"], indent=2))`;

    case "go":
      return `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type ApiError struct {
	Code    string \`json:"code"\`
	Message string \`json:"message"\`
	Hint    string \`json:"hint,omitempty"\`
}

type ApiResponse struct {
	Success   bool                   \`json:"success"\`
	RequestId string                 \`json:"requestId"\`
	Data      map[string]interface{} \`json:"data,omitempty"\`
	Error     *ApiError              \`json:"error,omitempty"\`
}

func main() {
	payload := []byte(\`${payloadCompact}\`)
	req, err := http.NewRequest("POST", "${fullEndpoint}", bytes.NewBuffer(payload))
	if err != nil {
		panic(err)
	}

	req.Header.Set("Authorization", "Bearer ${apiKey}")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)
	var parsed ApiResponse
	_ = json.Unmarshal(raw, &parsed)

	if resp.StatusCode >= 400 || !parsed.Success {
		fmt.Fprintf(os.Stderr, "[%s] %s (req: %s)\\n", parsed.Error.Code, parsed.Error.Message, parsed.RequestId)
		os.Exit(1)
	}

	fmt.Printf("Request ID: %s | Credits Remaining: %s\\n", parsed.RequestId, resp.Header.Get("X-Credits-Remaining"))
	fmt.Printf("Result: %s\\n", string(raw))
}`;

    case "rust":
      return `// Rust (tokio + reqwest + serde_json)
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde_json::{json, Value};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let payload: Value = serde_json::from_str(r#"${payloadCompact}"#)?;

    let res = client
        .post("${fullEndpoint}")
        .header(AUTHORIZATION, "Bearer ${apiKey}")
        .header(CONTENT_TYPE, "application/json")
        .json(&payload)
        .send()
        .await?;

    let status = res.status();
    let credits_left = res
        .headers()
        .get("X-Credits-Remaining")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("0")
        .to_string();

    let body: Value = res.json().await?;
    if !status.is_success() || body["success"] != json!(true) {
        eprintln!(
            "[{}] {} (req: {})",
            body["error"]["code"].as_str().unwrap_or("error"),
            body["error"]["message"].as_str().unwrap_or("Request failed"),
            body["requestId"].as_str().unwrap_or("n/a")
        );
        std::process::exit(1);
    }

    println!("Credits Remaining: {} | Request ID: {}", credits_left, body["requestId"]);
    println!("Data: {}", serde_json::to_string_pretty(&body["data"])?);
    Ok(())
}`;

    case "php":
      return `<?php
// PHP cURL Client with v1.1 Uniform Error Check
$ch = curl_init("${fullEndpoint}");
$payload = '${payloadCompact.replace(/'/g, "\\'")}';

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer ${apiKey}",
        "Content-Type: application/json"
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$decoded = json_decode($response, true);
if ($httpCode >= 400 || empty($decoded["success"])) {
    $err = $decoded["error"] ?? [];
    fwrite(STDERR, sprintf("[%s] %s (req: %s)\\n", $err["code"] ?? $httpCode, $err["message"] ?? "Failed", $decoded["requestId"] ?? "n/a"));
    exit(1);
}

echo "Request ID: " . ($decoded["requestId"] ?? "n/a") . "\\n";
echo "Result: " . json_encode($decoded["data"], JSON_PRETTY_PRINT) . "\\n";
?>`;
  }
}

export function generateStandaloneSdkFile(
  language: "ts" | "python",
  apiKey = "sk_live_9f82d10a9c8b77e2",
  baseUrl = "https://api.yourdomain.com"
): { filename: string; content: string } {
  const cleanBase = baseUrl.replace(/\/$/, "");

  if (language === "ts") {
    return {
      filename: "devtool-client.ts",
      content: `/**
 * Official TypeScript Client SDK for DevTool API (v1.1 Contract)
 * Zero-dependency client with typed responses, request IDs, and error codes.
 */

export type ToolErrorCode =
  | "invalid_input"
  | "unknown_preset"
  | "unauthorized"
  | "insufficient_credits"
  | "plan_required"
  | "payload_too_large"
  | "rate_limited"
  | "tool_failed"
  | "internal_error";

export interface ExecuteParams {
  prompt?: string;
  code?: string;
  url?: string;
  title?: string;
  preset?: "sql-optimizer" | "ai-agent" | "web-scraper" | "code-security" | "media-generator";
  options?: Record<string, any>;
}

export class DevToolError extends Error {
  constructor(
    public code: ToolErrorCode,
    message: string,
    public status: number,
    public requestId: string,
    public hint?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "DevToolError";
  }
}

export class DevToolClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = "${apiKey}", baseUrl: string = "${cleanBase}") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\\/$/, "");
  }

  async execute<T = Record<string, any>>(params: ExecuteParams) {
    const res = await fetch(\`\${this.baseUrl}/api/v1/tool/execute\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${this.apiKey}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const json = await res.json().catch(() => ({}));
    const requestId = res.headers.get("x-request-id") || json.requestId || "unknown";

    if (!res.ok || !json.success) {
      const errObj = typeof json.error === "object" && json.error ? json.error : {
        code: "internal_error" as ToolErrorCode,
        message: json.message || json.error || \`HTTP \${res.status}\`,
      };
      throw new DevToolError(
        errObj.code || "internal_error",
        errObj.message || "Execution failed",
        res.status,
        requestId,
        errObj.hint,
        json
      );
    }

    return {
      requestId: json.requestId as string,
      data: json.data as T,
      metadata: json.metadata,
      creditsUsed: Number(res.headers.get("x-credits-used") ?? json.metadata?.creditsDeducted ?? 1),
      creditsRemaining: Number(res.headers.get("x-credits-remaining") ?? json.metadata?.creditsRemaining ?? 0),
      latencyMs: Number(res.headers.get("x-execution-time-ms") ?? json.metadata?.durationMs ?? 0),
    };
  }
}
`,
    };
  }

  return {
    filename: "devtool_client.py",
    content: `"""
Official Python Client SDK for DevTool API (v1.1 Contract)
Includes structured DevToolApiError exceptions and rate-limit metadata.
"""

import requests
from typing import Optional, Dict, Any


class DevToolApiError(Exception):
    def __init__(self, code: str, message: str, status: int, request_id: str, hint: Optional[str] = None):
        super().__init__(f"[{code}] {message}" + (f" ({hint})" if hint else "") + f" [req: {request_id}]")
        self.code = code
        self.status = status
        self.request_id = request_id
        self.hint = hint


class DevToolClient:
    def __init__(self, api_key: str = "${apiKey}", base_url: str = "${cleanBase}"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def execute(
        self,
        prompt: Optional[str] = None,
        preset: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None,
        **extra: Any,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/api/v1/tool/execute"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload: Dict[str, Any] = {**extra}
        if prompt is not None:
            payload["prompt"] = prompt
        if preset is not None:
            payload["preset"] = preset
        if options is not None:
            payload["options"] = options

        response = requests.post(url, json=payload, headers=headers, timeout=30)
        body = response.json() if response.content else {}
        request_id = response.headers.get("X-Request-Id") or body.get("requestId", "unknown")

        if not response.ok or not body.get("success"):
            err = body.get("error") if isinstance(body.get("error"), dict) else {}
            raise DevToolApiError(
                code=err.get("code", f"http_{response.status_code}"),
                message=err.get("message") or body.get("message") or "Execution failed",
                status=response.status_code,
                request_id=request_id,
                hint=err.get("hint"),
            )

        return {
            "request_id": request_id,
            "data": body.get("data"),
            "metadata": body.get("metadata"),
            "credits_remaining": int(response.headers.get("X-Credits-Remaining", 0)),
            "latency_ms": int(response.headers.get("X-Execution-Time-Ms", 0)),
        }
`,
  };
}
