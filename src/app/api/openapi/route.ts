import { NextRequest, NextResponse } from "next/server";
import { monetizeConfig } from "@/../monetize.config";
import { AVAILABLE_PRESETS } from "@/tool-engine/presets";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const download = searchParams.get("download") === "true";

  const hostUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (req.headers.get("host") ? `http://${req.headers.get("host")}` : "http://localhost:3000");

  if (format === "postman") {
    // Postman Collection v2.1.0 Format
    const postmanCollection = {
      info: {
        name: `${monetizeConfig.tool.name} Collection`,
        description: monetizeConfig.tool.description,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      auth: {
        type: "bearer",
        bearer: [
          {
            key: "token",
            value: "{{API_KEY}}",
            type: "string",
          },
        ],
      },
      variable: [
        { key: "BASE_URL", value: hostUrl },
        { key: "API_KEY", value: "sk_live_sample_token_here" },
      ],
      item: [
        {
          name: "Execute Tool Logic",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify(monetizeConfig.toolEngine.sampleRequest, null, 2),
            },
            url: {
              raw: "{{BASE_URL}}/api/v1/tool/execute",
              host: ["{{BASE_URL}}"],
              path: ["api", "v1", "tool", "execute"],
            },
            description: "Execute the core monetized developer tool logic. Atomically meters credits.",
          },
        },
        {
          name: "Health & Latency Check",
          request: {
            method: "GET",
            url: {
              raw: "{{BASE_URL}}/api/health",
              host: ["{{BASE_URL}}"],
              path: ["api", "health"],
            },
            description: "Check system uptime, database latency, and gateway health.",
          },
        },
        {
          name: "List API Keys",
          request: {
            method: "GET",
            url: {
              raw: "{{BASE_URL}}/api/keys",
              host: ["{{BASE_URL}}"],
              path: ["api", "keys"],
            },
            description: "List all active API keys and their request counters.",
          },
        },
        {
          name: "Fetch Usage Audit Logs",
          request: {
            method: "GET",
            url: {
              raw: "{{BASE_URL}}/api/logs?limit=25",
              host: ["{{BASE_URL}}"],
              path: ["api", "logs"],
              query: [{ key: "limit", value: "25" }],
            },
            description: "Retrieve historical tool invocation logs and credit deductions.",
          },
        },
      ],
    };

    return new NextResponse(JSON.stringify(postmanCollection, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(download
          ? {
              "Content-Disposition": `attachment; filename="${monetizeConfig.tool.id}-postman-collection.json"`,
            }
          : {}),
      },
    });
  }

  // OpenAPI 3.1.0 Specification
  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: monetizeConfig.tool.name,
      description: monetizeConfig.tool.description,
      version: monetizeConfig.tool.version,
      contact: {
        name: monetizeConfig.tool.author.name,
        url: monetizeConfig.tool.author.url,
      },
    },
    servers: [
      {
        url: hostUrl,
        description: "Active Environment Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "sk_live_...",
          description: "Secret developer API key prefixed with sk_live_ generated from your developer dashboard.",
        },
      },
      schemas: {
        ToolExecutionInput: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Main prompt or code payload for the engine.",
              example: monetizeConfig.toolEngine.sampleRequest.prompt,
            },
            preset: {
              type: "string",
              enum: Object.keys(AVAILABLE_PRESETS),
              description: "Optional tool archetype preset to execute.",
              example: "sql-optimizer",
            },
            options: {
              type: "object",
              description: "Configuration options for processing.",
              example: monetizeConfig.toolEngine.sampleRequest.options,
            },
          },
          required: ["prompt"],
        },
        ToolExecutionResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object", example: monetizeConfig.toolEngine.sampleResponse.data },
            metadata: {
              type: "object",
              properties: {
                durationMs: { type: "integer", example: 42 },
                creditsDeducted: { type: "integer", example: 1 },
                creditsRemaining: { type: "integer", example: 2499 },
                plan: { type: "string", example: "pro" },
              },
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "healthy" },
            uptime: { type: "number", example: 99.98 },
            database: { type: "object" },
          },
        },
      },
    },
    paths: {
      "/api/v1/tool/execute": {
        post: {
          summary: "Execute Tool Engine",
          description: "Runs custom compute logic, validates rate limits, and atomically deducts credits.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ToolExecutionInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Successful execution with metered credit deduction",
              headers: {
                "X-Credits-Used": { schema: { type: "string" }, description: "Credits consumed by this call" },
                "X-Credits-Remaining": { schema: { type: "string" }, description: "Remaining workspace credits" },
                "X-Execution-Time-Ms": { schema: { type: "string" }, description: "Processing latency in milliseconds" },
                "X-RateLimit-Limit": { schema: { type: "string" }, description: "Rate limit requests allowed per minute" },
                "X-RateLimit-Remaining": { schema: { type: "string" }, description: "Rate limit requests remaining this minute" },
              },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ToolExecutionResponse" },
                },
              },
            },
            "401": { description: "Invalid, missing, or revoked API key" },
            "402": { description: "Insufficient credit balance for this operation" },
            "429": { description: "Rate limit quota exceeded" },
          },
        },
      },
      "/api/health": {
        get: {
          summary: "Health & Uptime Probe",
          description: "Returns connection status for SQLite, PostgreSQL, and Clerk authentication.",
          responses: {
            "200": {
              description: "System is healthy",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
      "/api/logs": {
        get: {
          summary: "Audit Usage Logs",
          description: "Fetches historical execution logs or exports CSV for external accounting.",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"] } },
          ],
          responses: {
            "200": { description: "List of usage records" },
          },
        },
      },
    },
  };

  return new NextResponse(JSON.stringify(openApiSpec, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(download
        ? {
            "Content-Disposition": `attachment; filename="${monetizeConfig.tool.id}-openapi.json"`,
          }
        : {}),
    },
  });
}
