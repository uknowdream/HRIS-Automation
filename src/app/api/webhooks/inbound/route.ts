import { NextRequest, NextResponse } from "next/server";
import { signInviteToken } from "@/lib/token";
import { ASSESSMENT_PRESETS } from "@/lib/psychometrics";
import { checkRateLimit, getClientIp } from "@/lib/security";

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/webhooks/inbound",
    description:
      "Universal Inbound Webhook Receiver for Zapier, Make.com, n8n, LinkedIn, JobStreet, and external ERP/ATS systems.",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "<your-inbound-api-key>",
    },
    samplePayload: {
      event: "candidate.applied",
      candidateName: "Sarah Connor",
      candidateEmail: "sarah@globaltech.io",
      candidatePhone: "6281234567890",
      role: "Principal AI Architect",
      presetId: "executive-full",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`inbound:${ip}`, 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Inbound webhook rate limit exceeded. Please retry shortly." },
        { status: 429 }
      );
    }

    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.INBOUND_WEBHOOK_API_KEY;
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ ok: false, error: "Invalid x-api-key header" }, { status: 401 });
    }

    const body = (await request.json()) as {
      event?: string;
      candidateName?: string;
      candidateEmail?: string;
      candidatePhone?: string;
      role?: string;
      department?: string;
      presetId?: string;
    };

    const candidateName = String(body.candidateName || "Inbound Candidate").trim().slice(0, 120);
    const candidateEmail = String(body.candidateEmail || "").trim().slice(0, 140);
    const role = String(body.role || "Global Specialist").trim().slice(0, 120);
    const department = String(body.department || "General").trim().slice(0, 80);

    const preset =
      ASSESSMENT_PRESETS.find((p) => p.id === body.presetId) || ASSESSMENT_PRESETS[0];

    const host = request.headers.get("host") || "hris-automation.vercel.app";
    const fwdProto = request.headers.get("x-forwarded-proto");
    const proto = fwdProto || (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || `${proto}://${host}`;

    const cleanPhone = String(body.candidatePhone || "").replace(/[^\d]/g, "").slice(0, 20);
    const token = signInviteToken({
      id: `inb_${Date.now()}`,
      candidateName,
      candidateEmail,
      candidatePhone: cleanPhone,
      role,
      department,
      companyName: "AetherHR Global Technologies",
      categories: preset.categories,
      presetId: preset.id,
      durationMinutes: preset.durationMinutes,
      expressLimitPerCategory: preset.expressLimitPerCategory,
      proctoringStrict: true,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 72 * 3600 * 1000,
    });

    const inviteUrl = `${origin}/assess/${token}`;
    const whatsappLaunchUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
          `Hello ${candidateName}, your AetherHR Cognitive & Psychometric Assessment link for ${role} is ready: ${inviteUrl}`
        )}`
      : null;

    return NextResponse.json({
      ok: true,
      receivedAt: new Date().toISOString(),
      event: body.event || "candidate.applied",
      automationTriggered: true,
      generatedAssessment: {
        presetId: preset.id,
        durationMinutes: preset.durationMinutes,
        inviteUrl,
        whatsappLaunchUrl,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
