import type {
  AssessmentCategory,
  AssessmentQuestion,
  AssessmentReport,
  ProctoringEvent,
} from "@/types/hris";
import { getBatteryMeta } from "./index";

export interface ScoreSubmissionInput {
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  targetRole: string;
  presetName: string;
  questions: AssessmentQuestion[];
  answers: Record<string, string>;
  durationUsedSec: number;
  durationAllocatedSec: number;
  proctoringEvents: ProctoringEvent[];
}

const COGNITIVE_CATEGORIES: AssessmentCategory[] = [
  "numerical",
  "verbal",
  "abstract",
  "spatial",
  "speed",
];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getDiscArchetype(primary: "D" | "I" | "S" | "C", secondary: "D" | "I" | "S" | "C") {
  const combo = `${primary}${secondary}`;
  const map: Record<string, { archetype: string; summary: string }> = {
    DC: {
      archetype: "Strategic Architect (D-C)",
      summary:
        "Decisive, data-rigorous leader who combines aggressive execution speed with high analytical precision.",
    },
    DI: {
      archetype: "Visionary Driver (D-I)",
      summary:
        "Charismatic change-agent who rallies teams around ambitious milestones and closes high-stakes goals fast.",
    },
    DS: {
      archetype: "Resilient Commander (D-S)",
      summary:
        "Steady, goal-focused operator who balances decisive ownership with durable long-term execution.",
    },
    ID: {
      archetype: "Catalyst Innovator (I-D)",
      summary:
        "Energetic influencer who champions bold innovation and mobilizes cross-functional stakeholders.",
    },
    IS: {
      archetype: "People Champion (I-S)",
      summary:
        "Empathetic, collaborative communicator who builds high-trust cultures and strong client loyalty.",
    },
    IC: {
      archetype: "Creative Strategist (I-C)",
      summary:
        "Persuasive communicator grounded in structured research, blending storytelling with analytical depth.",
    },
    SC: {
      archetype: "Precision Guardian (S-C)",
      summary:
        "Dependable, methodical specialist who ensures zero-defect compliance, operational harmony, and quality.",
    },
    SI: {
      archetype: "Harmonious Coordinator (S-I)",
      summary:
        "Warm, patient team builder who keeps cross-timezone teams aligned, engaged, and supported.",
    },
    SD: {
      archetype: "Reliable Executor (S-D)",
      summary:
        "Calm under pressure with quiet determination to deliver complex milestones consistently.",
    },
    CD: {
      archetype: "Systems Mastermind (C-D)",
      summary:
        "Objective problem-solver who engineers scalable frameworks and drives uncompromising technical excellence.",
    },
    CS: {
      archetype: "Quality Specialist (C-S)",
      summary:
        "Detail-oriented, disciplined professional who excels at auditing, governance, and continuous reliability.",
    },
    CI: {
      archetype: "Analytical Advisor (C-I)",
      summary:
        "Articulate domain expert capable of translating complex analytics into compelling executive narratives.",
    },
  };
  return (
    map[combo] || {
      archetype: `Balanced Enterprise Profile (${primary}-${secondary})`,
      summary:
        "Adaptable behavioral profile able to flex between analytical depth, leadership drive, and collaboration.",
    }
  );
}

export function evaluateAssessmentSubmission(
  input: ScoreSubmissionInput
): AssessmentReport {
  const {
    candidateId,
    candidateName,
    candidateEmail,
    candidatePhone,
    targetRole,
    presetName,
    questions,
    answers,
    durationUsedSec,
    durationAllocatedSec,
    proctoringEvents,
  } = input;

  // 1. Cognitive Domain Scoring (weighted by difficulty)
  const domainScores: AssessmentReport["domainScores"] = [];
  let weightedEarned = 0;
  let weightedMax = 0;
  let cogCorrectTotal = 0;
  let cogQuestionTotal = 0;

  for (const cat of COGNITIVE_CATEGORIES) {
    const qs = questions.filter((q) => q.category === cat);
    if (qs.length === 0) continue;
    let correct = 0;
    for (const q of qs) {
      const weight = q.difficulty === 3 ? 1.35 : q.difficulty === 2 ? 1.15 : 1.0;
      weightedMax += weight;
      if (answers[q.id] && answers[q.id] === q.correctOptionId) {
        correct += 1;
        weightedEarned += weight;
      }
    }
    cogCorrectTotal += correct;
    cogQuestionTotal += qs.length;
    const meta = getBatteryMeta(cat);
    domainScores.push({
      category: cat,
      label: meta.shortName.en,
      correct,
      total: qs.length,
      percentage: Math.round((correct / qs.length) * 100),
    });
  }

  const cognitiveOverallPct =
    weightedMax > 0
      ? Math.round((weightedEarned / weightedMax) * 100)
      : 78; // Default baseline when psychometric-only battery is run

  // Standardized IQ curve (mean 100, SD 15, mapped 75..145)
  const estimatedIq =
    cogQuestionTotal > 0
      ? clamp(Math.round(74 + (cognitiveOverallPct / 100) * 68), 75, 145)
      : 112;

  // Normal CDF approximation for Global Percentile from IQ
  const z = (estimatedIq - 100) / 15;
  const globalPercentile = clamp(
    Math.round((0.5 * (1 + Math.tanh(0.79788456 * (z + 0.044715 * z * z * z)))) * 100),
    2,
    99
  );

  // Sten Score (1-10)
  const stenScore = clamp(Math.round(5.5 + z * 2), 1, 10);

  // 2. Big Five (OCEAN)
  const b5Sums: Record<"O" | "C" | "E" | "A" | "S", { sum: number; count: number }> = {
    O: { sum: 0, count: 0 },
    C: { sum: 0, count: 0 },
    E: { sum: 0, count: 0 },
    A: { sum: 0, count: 0 },
    S: { sum: 0, count: 0 },
  };
  for (const q of questions.filter((item) => item.category === "big5")) {
    const trait = q.big5Trait;
    if (!trait) continue;
    const raw = Number(answers[q.id]);
    if (raw >= 1 && raw <= 5) {
      const val = q.big5Reverse ? 6 - raw : raw;
      b5Sums[trait].sum += val;
      b5Sums[trait].count += 1;
    }
  }
  const toB5Pct = (t: "O" | "C" | "E" | "A" | "S", fallback: number) =>
    b5Sums[t].count > 0
      ? Math.round(((b5Sums[t].sum / b5Sums[t].count - 1) / 4) * 100)
      : fallback;

  const bigFive = {
    openness: toB5Pct("O", 76),
    conscientiousness: toB5Pct("C", 82),
    extraversion: toB5Pct("E", 68),
    agreeableness: toB5Pct("A", 79),
    emotionalStability: toB5Pct("S", 80),
  };

  // 3. DISC Profile
  const discRaw: Record<"D" | "I" | "S" | "C", number> = { D: 0, I: 0, S: 0, C: 0 };
  const discQs = questions.filter((q) => q.category === "disc");
  let discAnswered = 0;
  for (const q of discQs) {
    const selected = q.options?.find((o) => o.id === answers[q.id]);
    if (selected?.discTrait) {
      discRaw[selected.discTrait] += 1;
      discAnswered += 1;
    }
  }
  const discNorm = {
    D: discAnswered > 0 ? Math.round((discRaw.D / discAnswered) * 100) : 32,
    I: discAnswered > 0 ? Math.round((discRaw.I / discAnswered) * 100) : 24,
    S: discAnswered > 0 ? Math.round((discRaw.S / discAnswered) * 100) : 18,
    C: discAnswered > 0 ? Math.round((discRaw.C / discAnswered) * 100) : 26,
  };
  const discKeys: ("D" | "I" | "S" | "C")[] = ["D", "I", "S", "C"];
  const discSorted = discKeys.sort((a, b) => discNorm[b] - discNorm[a]);
  const primary = discSorted[0];
  const secondary = discSorted[1];
  const discMeta = getDiscArchetype(primary, secondary);

  // 4. Situational Judgment Test (SJT)
  const sjtQs = questions.filter((q) => q.category === "sjt");
  let sjtEarned = 0;
  let sjtMax = 0;
  for (const q of sjtQs) {
    sjtMax += 4;
    const selected = q.options?.find((o) => o.id === answers[q.id]);
    if (selected?.sjtScore) {
      sjtEarned += selected.sjtScore;
    }
  }
  const sjtScore = sjtMax > 0 ? Math.round((sjtEarned / sjtMax) * 100) : 82;

  if (sjtQs.length > 0) {
    domainScores.push({
      category: "sjt",
      label: "SJT Leadership",
      correct: sjtQs.filter((q) => answers[q.id] === q.correctOptionId).length,
      total: sjtQs.length,
      percentage: sjtScore,
    });
  }

  // 5. Anti-Cheat Proctoring Integrity Score
  const tabSwitches = proctoringEvents.filter(
    (e) => e.type === "tab_switch" || e.type === "window_blur"
  ).length;
  const copyAttempts = proctoringEvents.filter(
    (e) => e.type === "copy_attempt" || e.type === "context_menu"
  ).length;
  const fullscreenExits = proctoringEvents.filter(
    (e) => e.type === "fullscreen_exit"
  ).length;
  const answeredQuestions = Object.keys(answers).filter((k) => Boolean(answers[k])).length;
  const avgSecPerQ = answeredQuestions > 0 ? durationUsedSec / answeredQuestions : 0;
  const speedPenalty = answeredQuestions >= 10 && avgSecPerQ < 3 ? 15 : 0;

  const integrityScore = clamp(
    100 - tabSwitches * 7 - copyAttempts * 10 - fullscreenExits * 5 - speedPenalty,
    35,
    100
  );

  // 6. Composite Decision Recommendation
  const compositeScore = Math.round(
    cognitiveOverallPct * 0.5 +
      sjtScore * 0.25 +
      ((bigFive.conscientiousness + bigFive.emotionalStability) / 2) * 0.15 +
      integrityScore * 0.1
  );

  let recommendation: AssessmentReport["recommendation"] = "CONSIDER";
  if (compositeScore >= 82 && integrityScore >= 80) {
    recommendation = "STRONG_HIRE";
  } else if (compositeScore >= 68 && integrityScore >= 70) {
    recommendation = "RECOMMENDED";
  } else if (compositeScore >= 52) {
    recommendation = "CONSIDER";
  } else {
    recommendation = "NOT_RECOMMENDED";
  }

  // 7. Dynamic Strengths, Development Areas, & Interview Probes
  const strengths: string[] = [];
  const developmentAreas: string[] = [];

  for (const d of domainScores) {
    if (d.percentage >= 75) {
      strengths.push(`Strong ${d.label} aptitude (${d.percentage}% accuracy)`);
    } else if (d.percentage < 55) {
      developmentAreas.push(`Moderate ${d.label} accuracy (${d.percentage}%) — verify practical fluency`);
    }
  }
  if (bigFive.conscientiousness >= 75) {
    strengths.push(`High Conscientiousness (${bigFive.conscientiousness}/100) — structured & reliable execution`);
  }
  if (bigFive.emotionalStability >= 75) {
    strengths.push(`High Emotional Stability (${bigFive.emotionalStability}/100) — calm under high-pressure incidents`);
  }
  if (bigFive.openness >= 75) {
    strengths.push(`Strong Innovation Openness (${bigFive.openness}/100) — adapts fast to automation & new tech`);
  }
  if (integrityScore >= 90) {
    strengths.push(`Verified Proctoring Integrity (${integrityScore}%) with clean session telemetry`);
  } else if (integrityScore < 80) {
    developmentAreas.push(`Proctoring flagged ${tabSwitches} tab/focus switch(es) — recommend live technical validation`);
  }

  if (strengths.length === 0) {
    strengths.push(`Balanced behavioral profile aligned with ${discMeta.archetype}`);
  }
  if (developmentAreas.length === 0) {
    developmentAreas.push("Explore cross-regional stakeholder conflict leadership during final executive panel");
  }

  const interviewProbes = [
    `Ask for a concrete project demonstrating ${discMeta.archetype} decision-making under conflicting stakeholder goals.`,
    `Probe quantitative reasoning with a live business case tied to ${targetRole} KPIs.`,
    `Validate ethical judgment & risk escalation using a past production or compliance incident.`,
  ];

  const executiveSummary = `${candidateName} completed the ${presetName} battery for ${targetRole} with an Estimated Cognitive IQ of ${estimatedIq} (${globalPercentile}th global percentile, Sten ${stenScore}/10), ${sjtScore}% Executive SJT alignment, and a ${discMeta.archetype} behavioral profile. Proctoring integrity verified at ${integrityScore}%. Overall AI Hiring Verdict: ${recommendation.replace("_", " ")}.`;

  return {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    candidateId,
    candidateName,
    candidateEmail,
    candidatePhone,
    targetRole,
    presetName,
    completedAt: new Date().toISOString(),
    durationUsedSec,
    durationAllocatedSec,
    totalQuestions: questions.length,
    answeredQuestions,
    cognitiveOverallPct,
    estimatedIq,
    globalPercentile,
    stenScore,
    domainScores,
    bigFive,
    disc: {
      ...discNorm,
      primary,
      secondary,
      archetype: discMeta.archetype,
      summary: discMeta.summary,
    },
    sjtScore,
    integrityScore,
    tabSwitches,
    proctoringEvents,
    recommendation,
    executiveSummary,
    strengths: strengths.slice(0, 5),
    developmentAreas: developmentAreas.slice(0, 4),
    interviewProbes,
  };
}
