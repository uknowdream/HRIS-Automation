import { NextRequest, NextResponse } from "next/server";
import { signInviteToken, verifyInviteToken } from "@/lib/token";
import { ASSESSMENT_PRESETS } from "@/lib/psychometrics";
import type { AssessmentCategory } from "@/types/hris";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing token parameter" }, { status: 400 });
  }
  const verified = verifyInviteToken(token);
  if (!verified.valid) {
    return NextResponse.json(verified, { status: 400 });
  }
  return NextResponse.json({
    valid: true,
    expired: verified.expired,
    payload: verified.payload,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      candidateName?: string;
      candidateEmail?: string;
      candidatePhone?: string;
      role?: string;
      department?: string;
      companyName?: string;
      presetId?: string;
      categories?: AssessmentCategory[];
      durationMinutes?: number;
      expressLimitPerCategory?: number;
      proctoringStrict?: boolean;
    };

    const preset =
      ASSESSMENT_PRESETS.find((p) => p.id === body.presetId) || ASSESSMENT_PRESETS[4];
    const categories =
      body.categories && body.categories.length > 0 ? body.categories : preset.categories;
    const durationMinutes = body.durationMinutes || preset.durationMinutes;

    const token = signInviteToken({
      id: `demo_${Date.now()}`,
      candidateName: body.candidateName || "Executive Demo Candidate",
      candidateEmail: body.candidateEmail || "candidate@aetherhr.global",
      candidatePhone: body.candidatePhone || "6281200001111",
      role: body.role || "Senior Enterprise Systems Lead",
      department: body.department || "Engineering & Product",
      companyName: body.companyName || "AetherHR Global Technologies",
      categories,
      presetId: preset.id,
      durationMinutes,
      expressLimitPerCategory:
        body.expressLimitPerCategory ?? preset.expressLimitPerCategory,
      proctoringStrict: body.proctoringStrict ?? true,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 72 * 3600 * 1000,
    });

    return NextResponse.json({ ok: true, token, path: `/assess/${token}` });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unable to issue token" },
      { status: 500 }
    );
  }
}
