"use client";

import React from "react";
import {
  Award,
  BrainCircuit,
  ShieldCheck,
  Printer,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
  FileCheck,
} from "lucide-react";
import type { AssessmentReport } from "@/types/hris";
import { DonutGauge, RadarChart } from "@/components/visuals/Charts";

export function PsychometricReportView({
  report,
  onClose,
}: {
  report: AssessmentReport;
  onClose?: () => void;
}) {
  const verdictStyles: Record<AssessmentReport["recommendation"], string> = {
    STRONG_HIRE:
      "from-emerald-500/20 to-cyan-500/20 border-emerald-500/45 text-emerald-300",
    RECOMMENDED:
      "from-cyan-500/20 to-indigo-500/20 border-cyan-500/45 text-cyan-300",
    CONSIDER:
      "from-amber-500/20 to-orange-500/20 border-amber-500/45 text-amber-300",
    NOT_RECOMMENDED:
      "from-rose-500/20 to-pink-500/20 border-rose-500/45 text-rose-300",
  };

  const minsUsed = Math.max(1, Math.round(report.durationUsedSec / 60));
  const minsAlloc = Math.max(1, Math.round(report.durationAllocatedSec / 60));

  const radarData =
    report.domainScores.length >= 3
      ? report.domainScores.map((d) => ({ label: d.label, value: d.percentage }))
      : [
          { label: "Openness", value: report.bigFive.openness },
          { label: "Conscientious", value: report.bigFive.conscientiousness },
          { label: "Extraversion", value: report.bigFive.extraversion },
          { label: "Agreeable", value: report.bigFive.agreeableness },
          { label: "Stability", value: report.bigFive.emotionalStability },
        ];

  const shareText = `AetherHR Certified Psychometric Report\nCandidate: ${report.candidateName}\nRole: ${report.targetRole}\nEst. Cognitive IQ: ${report.estimatedIq} (${report.globalPercentile}th Percentile, Sten ${report.stenScore}/10)\nDISC Profile: ${report.disc.archetype}\nSJT Score: ${report.sjtScore}%\nIntegrity: ${report.integrityScore}%\nVerdict: ${report.recommendation.replace("_", " ")}`;

  return (
    <div className="space-y-6">
      {/* Executive Banner */}
      <div
        className={`rounded-3xl p-6 border bg-gradient-to-br ${verdictStyles[report.recommendation]}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
              <FileCheck className="w-4 h-4" />
              AetherHR International Psychometric Certificate · ID {report.id}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {report.candidateName}
            </h2>
            <p className="text-xs text-slate-200">
              {report.targetRole} · {report.presetName} · {report.answeredQuestions}/
              {report.totalQuestions} Questions ({minsUsed}m / {minsAlloc}m)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <span className="px-4 py-2 rounded-xl bg-slate-950/60 border border-white/15 font-black text-sm tracking-wide">
              VERDICT: {report.recommendation.replace("_", " ")}
            </span>
            <button
              onClick={() => window.print()}
              className="btn-quantum px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> PDF / Print
            </button>
            <a
              href={`https://wa.me/${report.candidatePhone || ""}?text=${encodeURIComponent(
                shareText
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-emerald px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Share
            </a>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-950/60 border border-white/15 hover:bg-slate-900"
              >
                Close
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-slate-100/90 leading-relaxed bg-slate-950/35 p-4 rounded-2xl border border-white/10">
          {report.executiveSummary}
        </p>
      </div>

      {/* Primary KPI Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <DonutGauge
            value={report.estimatedIq}
            max={150}
            label="Estimated Cognitive IQ"
            sublabel={`Sten ${report.stenScore}/10`}
            color="#22d3ee"
          />
        </div>
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <DonutGauge
            value={report.globalPercentile}
            max={100}
            label="Global Percentile Rank"
            sublabel={
              report.globalPercentile >= 90
                ? "Top 10%"
                : report.globalPercentile >= 75
                ? "Top 25%"
                : report.globalPercentile >= 50
                ? "Above Avg"
                : "Developing"
            }
            color="#818cf8"
          />
        </div>
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <DonutGauge
            value={report.sjtScore}
            max={100}
            label="Leadership & Ethics (SJT)"
            sublabel="%"
            color="#fbbf24"
          />
        </div>
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <DonutGauge
            value={report.integrityScore}
            max={100}
            label="Proctoring Integrity"
            sublabel={`${report.tabSwitches} flags`}
            color={report.integrityScore >= 85 ? "#34d399" : "#fb7185"}
          />
        </div>
      </div>

      {/* Deep Analytical Charts: Radar + Big Five + DISC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cognitive Radar & Domain Table */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
            Cognitive Aptitude Radar
          </h3>
          <RadarChart data={radarData} />
          <div className="space-y-2 pt-2 border-t border-slate-800">
            {report.domainScores.map((d) => (
              <div key={d.category} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{d.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {d.correct}/{d.total}
                  </span>
                  <span className="font-mono font-bold text-cyan-400 w-9 text-right">
                    {d.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Big Five OCEAN Spectrum */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Big Five Personality (OCEAN)
          </h3>
          <div className="space-y-3.5">
            {[
              { key: "Openness to Innovation", val: report.bigFive.openness, color: "#22d3ee" },
              { key: "Conscientiousness", val: report.bigFive.conscientiousness, color: "#34d399" },
              { key: "Extraversion & Influence", val: report.bigFive.extraversion, color: "#818cf8" },
              { key: "Agreeableness & Empathy", val: report.bigFive.agreeableness, color: "#fbbf24" },
              { key: "Emotional Stability", val: report.bigFive.emotionalStability, color: "#a78bfa" },
            ].map((trait) => (
              <div key={trait.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{trait.key}</span>
                  <span className="font-mono font-bold" style={{ color: trait.color }}>
                    {trait.val}/100
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${trait.val}%`, backgroundColor: trait.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DISC Behavioral Archetype */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            DISC Behavioral Archetype
          </h3>
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-500/12 to-indigo-500/12 border border-cyan-500/30">
            <div className="text-base font-black text-cyan-300">{report.disc.archetype}</div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{report.disc.summary}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
            {[
              { code: "D", label: "Dominance", val: report.disc.D, color: "#fb7185" },
              { code: "I", label: "Influence", val: report.disc.I, color: "#fbbf24" },
              { code: "S", label: "Steadiness", val: report.disc.S, color: "#34d399" },
              { code: "C", label: "Precision", val: report.disc.C, color: "#22d3ee" },
            ].map((d) => (
              <div key={d.code} className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-lg font-black" style={{ color: d.color }}>
                  {d.code}
                </div>
                <div className="text-sm font-mono font-bold mt-0.5">{d.val}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths, Development Areas, Interview Probes & Proctoring Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Key Strengths & AI Interview Guide
          </h3>
          <ul className="space-y-2 text-xs text-slate-200">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-cyan-400 mb-2">
              Recommended Executive Interview Probes
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {report.interviewProbes.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">{i + 1}.</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
            <ShieldCheck className="w-4 h-4" /> Development Focus & Proctoring Audit
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.developmentAreas.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Session Duration Telemetry
              </span>
              <span className="font-mono font-semibold">
                {minsUsed} min used / {minsAlloc} min allowed
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Anti-Cheat Focus/Tab Flags</span>
              <span
                className={`font-mono font-bold ${
                  report.tabSwitches === 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {report.tabSwitches} events logged
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
