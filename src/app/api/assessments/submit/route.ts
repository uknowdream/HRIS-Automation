import { NextRequest, NextResponse } from "next/server";
import { selectQuestionsForSession } from "@/lib/psychometrics";
import { evaluateAssessmentSubmission } from "@/lib/psychometrics/scoring";
import { signWebhookPayload } from "@/lib/token";
import type { AssessmentCategory, ProctoringEvent } from "@/types/hris";

interface SubmitBody {
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
      body.expressLimitPerCategory
    );

    const report = evaluateAssessmentSubmission({
      candidateId: body.candidateId,
      candidateName: body.candidateName || "Candidate",
      candidateEmail: body.candidateEmail || "",
      candidatePhone: body.candidatePhone,
      targetRole: body.targetRole || "Enterprise Specialist",
      presetName: body.presetName || "AetherHR Assessment",
      questions,
      answers: body.answers || {},
      durationUsedSec: body.durationUsedSec || 0,
      durationAllocatedSec: body.durationAllocatedSec || 1200,
      proctoringEvents: body.proctoringEvents || [],
    });

    // Fire outbound webhook if configured
    const targetWebhook = body.webhookUrl || process.env.DEFAULT_WEBHOOK_URL;
    if (targetWebhook && targetWebhook.startsWith("http")) {
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
      }).catch(() => {});
    }

    if (body.slackWebhookUrl && body.slackWebhookUrl.startsWith("http")) {
      fetch(body.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🧠 *AetherHR Psychometric Report*: *${report.candidateName}* (${report.targetRole}) — IQ *${report.estimatedIq}* (${report.globalPercentile}th pct) | DISC: *${report.disc.archetype}* | Integrity: *${report.integrityScore}%* | Verdict: *${report.recommendation}*`,
        }),
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
