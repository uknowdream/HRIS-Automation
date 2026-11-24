import { NextRequest, NextResponse } from "next/server";
import { signWebhookPayload } from "@/lib/token";

interface TriggerWebhookBody {
  url: string;
  event: string;
  secret?: string;
  format?: "generic" | "slack" | "teams";
  payload?: Record<string, unknown>;
}

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === "169.254.169.254" ||
    lower === "metadata.google.internal" ||
    lower.endsWith(".internal")
  );
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const body = (await request.json()) as TriggerWebhookBody;
    if (!body.url) {
      return NextResponse.json({ ok: false, error: "Webhook URL is required" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(body.url);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid webhook URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol) || isBlockedHost(parsed.hostname)) {
      return NextResponse.json(
        { ok: false, error: "Unsupported or restricted webhook destination" },
        { status: 400 }
      );
    }

    const eventName = body.event || "hris.automation.test";
    const timestamp = new Date().toISOString();

    let wirePayload: Record<string, unknown>;
    if (body.format === "slack") {
      wirePayload = {
        text: `⚡ *AetherHR Live Automation Event* \`${eventName}\`\nTimestamp: ${timestamp}\nPayload: \`${JSON.stringify(
          body.payload || { source: "AetherHR Global" }
        ).slice(0, 300)}\``,
      };
    } else if (body.format === "teams") {
      wirePayload = {
        "@type": "MessageCard",
        summary: `AetherHR Event: ${eventName}`,
        themeColor: "06B6D4",
        title: `AetherHR Automation: ${eventName}`,
        text: JSON.stringify(body.payload || { status: "operational", timestamp }, null, 2),
      };
    } else {
      wirePayload = {
        id: `evt_${Date.now()}`,
        event: eventName,
        timestamp,
        source: "AetherHR-Global-HRIS",
        data: body.payload || { test: true, message: "Live webhook verification from AetherHR" },
      };
    }

    const serialized = JSON.stringify(wirePayload);
    const signature = signWebhookPayload(serialized, body.secret);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(parsed.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "AetherHR-Webhook-Engine/2.0",
          "X-AetherHR-Event": eventName,
          "X-AetherHR-Timestamp": timestamp,
          "X-AetherHR-Signature": signature,
        },
        body: serialized,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await res.text();
      return NextResponse.json({
        ok: res.ok,
        statusCode: res.status,
        latencyMs: Date.now() - started,
        signature,
        responsePreview: text.slice(0, 400),
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      return NextResponse.json(
        {
          ok: false,
          statusCode: 0,
          latencyMs: Date.now() - started,
          signature,
          error: fetchErr instanceof Error ? fetchErr.message : "Destination unreachable",
        },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Webhook trigger error" },
      { status: 500 }
    );
  }
}
