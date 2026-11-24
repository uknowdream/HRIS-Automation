import { NextRequest, NextResponse } from "next/server";
import { signInviteToken } from "@/lib/token";
import { ASSESSMENT_PRESETS } from "@/lib/psychometrics";

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

    const preset =
      ASSESSMENT_PRESETS.find((p) => p.id === body.presetId) || ASSESSMENT_PRESETS[0];

    const host = request.headers.get("host") || "hris-automation.vercel.app";
    const proto = host.includes("localhost") ? "http" : "https";
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || `${proto}://${host}`;

    const cleanPhone = (body.candidatePhone || "").replace(/[^\d]/g, "");
    const token = signInviteToken({
      id: `inb_${Date.now()}`,
      candidateName: body.candidateName || "Inbound Candidate",
      candidateEmail: body.candidateEmail || "",
      candidatePhone: cleanPhone,
      role: body.role || "Global Specialist",
      department: body.department || "General",
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
          `Hello ${body.candidateName || "Candidate"}, your AetherHR Cognitive & Psychometric Assessment link for ${
            body.role || "our open role"
          } is ready: ${inviteUrl}`
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
