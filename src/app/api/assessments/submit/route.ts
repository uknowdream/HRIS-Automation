import { NextRequest, NextResponse } from "next/server";
import { selectQuestionsForSession } from "@/lib/psychometrics";
import { evaluateAssessmentSubmission } from "@/lib/psychometrics/scoring";
import { signWebhookPayload } from "@/lib/token";
import { isSafeExternalUrl } from "@/lib/security";
import type { AssessmentCategory, ProctoringEvent } from "@/types/hris";

interface SubmitBody {
  sessionId?: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  targetRole: string;
  presetName: string;
  categories: AssessmentCategory[];
  expressLimitPerCategory?: number;
  answers: Record<string, string>;
  durationUsedSec: number;
  durationAllocatedSec: number;
  proctoringEvents: ProctoringEvent[];
  webhookUrl?: string;
  webhookSecret?: string;
  slackWebhookUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubmitBody;
    const questions = selectQuestionsForSession(
      body.categories?.length
        ? body.categories
        : ["numerical", "verbal", "abstract", "spatial", "speed", "big5", "disc", "sjt"],
      body.expressLimitPerCategory,
      body.sessionId
    );

    const report = evaluateAssessmentSubmission({
      candidateId: body.candidateId,
      candidateName: String(body.candidateName || "Candidate").slice(0, 120),
      candidateEmail: String(body.candidateEmail || "").slice(0, 140),
      candidatePhone: body.candidatePhone ? String(body.candidatePhone).slice(0, 30) : undefined,
      targetRole: String(body.targetRole || "Enterprise Specialist").slice(0, 120),
      presetName: String(body.presetName || "AetherHR Assessment").slice(0, 140),
      questions,
      answers: body.answers || {},
      durationUsedSec: Math.max(0, Number(body.durationUsedSec) || 0),
      durationAllocatedSec: Math.max(60, Number(body.durationAllocatedSec) || 1200),
      proctoringEvents: Array.isArray(body.proctoringEvents) ? body.proctoringEvents : [],
    });

    // Fire outbound webhook only if it passes strict OWASP SSRF validation
    const targetWebhook = body.webhookUrl || process.env.DEFAULT_WEBHOOK_URL;
    if (targetWebhook && isSafeExternalUrl(targetWebhook).safe) {
      const serialized = JSON.stringify({
        event:
          report.estimatedIq >= 120 ? "assessment.high_score" : "assessment.completed",
        timestamp: new Date().toISOString(),
        data: report,
      });
      fetch(targetWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AetherHR-Event": "assessment.completed",
          "X-AetherHR-Signature": signWebhookPayload(serialized, body.webhookSecret),
        },
        body: serialized,
        signal: AbortSignal.timeout(4000),
      }).catch(() => {});
    }

    if (body.slackWebhookUrl && isSafeExternalUrl(body.slackWebhookUrl).safe) {
      fetch(body.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🧠 *AetherHR Psychometric Report*: *${report.candidateName}* (${report.targetRole}) — IQ *${report.estimatedIq}* (${report.globalPercentile}th pct) | DISC: *${report.disc.archetype}* | Integrity: *${report.integrityScore}%* | Verdict: *${report.recommendation}*`,
        }),
        signal: AbortSignal.timeout(4000),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
