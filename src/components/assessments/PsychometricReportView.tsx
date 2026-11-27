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
import { useHRIS } from "@/context/HRISContext";

export function PsychometricReportView({
  report,
  onClose,
}: {
  report: AssessmentReport;
  onClose?: () => void;
}) {
  const { locale } = useHRIS();
  const isId = locale === "id";

  const verdictStyles: Record<AssessmentReport["recommendation"], string> = {
    STRONG_HIRE:
      "from-emerald-600 via-teal-600 to-cyan-600 border-emerald-500/45 text-white",
    RECOMMENDED:
      "from-indigo-600 via-blue-600 to-cyan-600 border-indigo-500/45 text-white",
    CONSIDER:
      "from-amber-600 via-orange-600 to-amber-500 border-amber-500/45 text-white",
    NOT_RECOMMENDED:
      "from-rose-600 via-pink-600 to-rose-500 border-rose-500/45 text-white",
  };

  const verdictLabel: Record<AssessmentReport["recommendation"], string> = {
    STRONG_HIRE: isId ? "SANGAT DIREKOMENDASIKAN" : "STRONG HIRE",
    RECOMMENDED: isId ? "DIREKOMENDASIKAN" : "RECOMMENDED",
    CONSIDER: isId ? "DIPERTIMBANGKAN" : "CONSIDER",
    NOT_RECOMMENDED: isId ? "BELUM SESUAI" : "NOT RECOMMENDED",
  };

  const minsUsed = Math.max(1, Math.round(report.durationUsedSec / 60));
  const minsAlloc = Math.max(1, Math.round(report.durationAllocatedSec / 60));

  const radarData =
    report.domainScores.length >= 3
      ? report.domainScores.map((d) => ({ label: d.label, value: d.percentage }))
      : [
          { label: isId ? "Keterbukaan" : "Openness", value: report.bigFive.openness },
          { label: isId ? "Ketelitian" : "Conscientious", value: report.bigFive.conscientiousness },
          { label: isId ? "Ekstraversi" : "Extraversion", value: report.bigFive.extraversion },
          { label: isId ? "Empati" : "Agreeable", value: report.bigFive.agreeableness },
          { label: isId ? "Stabilitas" : "Stability", value: report.bigFive.emotionalStability },
        ];

  const shareText = `${
    isId ? "Laporan Psikotes Resmi AetherHR" : "AetherHR Certified Psychometric Report"
  }\n${isId ? "Kandidat" : "Candidate"}: ${report.candidateName}\n${
    isId ? "Posisi" : "Role"
  }: ${report.targetRole}\nIQ: ${report.estimatedIq} (${report.globalPercentile}th Percentile, Sten ${
    report.stenScore
  }/10)\nDISC: ${report.disc.archetype}\nSJT: ${report.sjtScore}%\n${
    isId ? "Integritas" : "Integrity"
  }: ${report.integrityScore}%\n${isId ? "Keputusan" : "Verdict"}: ${verdictLabel[report.recommendation]}`;

  return (
    <div className="space-y-6">
      {/* Executive Banner (Intentionally Vibrant Header with on-dark protection) */}
      <div
        className={`rounded-3xl p-6 border bg-gradient-to-br ${verdictStyles[report.recommendation]}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white">
              <FileCheck className="w-4 h-4" />
              {isId
                ? `Sertifikat Psikometrik Internasional AetherHR · ID ${report.id}`
                : `AetherHR International Psychometric Certificate · ID ${report.id}`}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {report.candidateName}
            </h2>
            <p className="text-xs text-slate-200 on-dark">
              {report.targetRole} · {report.presetName} · {report.answeredQuestions}/
              {report.totalQuestions} {isId ? "Soal" : "Questions"} ({minsUsed}m / {minsAlloc}m)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <span className="px-4 py-2 rounded-xl bg-slate-950/60 border border-white/15 font-black text-xs sm:text-sm tracking-wide text-white">
              {isId ? "KEPUTUSAN" : "VERDICT"}: {verdictLabel[report.recommendation]}
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" /> {isId ? "Cetak / PDF" : "PDF / Print"}
            </button>
            <a
              href={`https://wa.me/${report.candidatePhone || ""}?text=${encodeURIComponent(
                shareText
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-emerald px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" /> {isId ? "Kirim WhatsApp" : "WhatsApp Share"}
            </a>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-950/60 border border-white/15 hover:bg-slate-900 text-white"
              >
                {isId ? "Tutup" : "Close"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-white/95 leading-relaxed bg-slate-950/35 p-4 rounded-2xl border border-white/10">
          {report.executiveSummary}
        </p>
      </div>

      {/* Primary KPI Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="hr-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <DonutGauge
            value={report.estimatedIq}
            max={150}
            label={isId ? "Estimasi Skor IQ" : "Estimated Cognitive IQ"}
            sublabel={`Sten ${report.stenScore}/10`}
            color="#4f46e5"
          />
        </div>
        <div className="hr-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <DonutGauge
            value={report.globalPercentile}
            max={100}
            label={isId ? "Persentil Global" : "Global Percentile Rank"}
            sublabel={
              report.globalPercentile >= 90
                ? "Top 10%"
                : report.globalPercentile >= 75
                ? "Top 25%"
                : report.globalPercentile >= 50
                ? isId
                  ? "Di Atas Rata-Rata"
                  : "Above Avg"
                : isId
                ? "Berkembang"
                : "Developing"
            }
            color="#0284c7"
          />
        </div>
        <div className="hr-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <DonutGauge
            value={report.sjtScore}
            max={100}
            label={isId ? "Kepemimpinan & Etika (SJT)" : "Leadership & Ethics (SJT)"}
            sublabel="%"
            color="#d97706"
          />
        </div>
        <div className="hr-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <DonutGauge
            value={report.integrityScore}
            max={100}
            label={isId ? "Integritas Anti-Curang" : "Proctoring Integrity"}
            sublabel={`${report.tabSwitches} ${isId ? "bendera" : "flags"}`}
            color={report.integrityScore >= 85 ? "#059669" : "#e11d48"}
          />
        </div>
      </div>

      {/* Deep Analytical Charts: Radar + Big Five + DISC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cognitive Radar & Domain Table */}
        <div className="hr-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {isId ? "Radar Kemampuan Kognitif" : "Cognitive Aptitude Radar"}
          </h3>
          <RadarChart data={radarData} color="#4f46e5" />
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            {report.domainScores.map((d) => (
              <div key={d.category} className="flex items-center justify-between text-xs">
                <span className="font-semibold">{d.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] hr-muted font-mono">
                    {d.correct}/{d.total}
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 w-9 text-right">
                    {d.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Big Five OCEAN Spectrum */}
        <div className="hr-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {isId ? "Kepribadian Big Five (OCEAN)" : "Big Five Personality (OCEAN)"}
          </h3>
          <div className="space-y-3.5">
            {[
              {
                key: isId ? "Keterbukaan & Inovasi (O)" : "Openness to Innovation (O)",
                val: report.bigFive.openness,
                color: "#0284c7",
              },
              {
                key: isId ? "Ketelitian & Disiplin (C)" : "Conscientiousness (C)",
                val: report.bigFive.conscientiousness,
                color: "#059669",
              },
              {
                key: isId ? "Ekstraversi & Pengaruh (E)" : "Extraversion & Influence (E)",
                val: report.bigFive.extraversion,
                color: "#4f46e5",
              },
              {
                key: isId ? "Empati & Kolaborasi (A)" : "Agreeableness & Empathy (A)",
                val: report.bigFive.agreeableness,
                color: "#d97706",
              },
              {
                key: isId ? "Stabilitas Emosional (S)" : "Emotional Stability (S)",
                val: report.bigFive.emotionalStability,
                color: "#7c3aed",
              },
            ].map((trait) => (
              <div key={trait.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{trait.key}</span>
                  <span className="font-mono font-bold" style={{ color: trait.color }}>
                    {trait.val}/100
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
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
        <div className="hr-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {isId ? "Arketipe Perilaku Kerja DISC" : "DISC Behavioral Archetype"}
          </h3>
          <div className="p-3.5 rounded-xl badge-info">
            <div className="text-base font-black">{report.disc.archetype}</div>
            <p className="text-xs opacity-90 mt-1 leading-relaxed">{report.disc.summary}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
            {[
              { code: "D", label: isId ? "Dominan" : "Dominance", val: report.disc.D, color: "#e11d48" },
              { code: "I", label: isId ? "Pengaruh" : "Influence", val: report.disc.I, color: "#d97706" },
              { code: "S", label: isId ? "Stabil" : "Steadiness", val: report.disc.S, color: "#059669" },
              { code: "C", label: isId ? "Presisi" : "Precision", val: report.disc.C, color: "#0284c7" },
            ].map((d) => (
              <div key={d.code} className="p-2.5 rounded-xl hr-subtle">
                <div className="text-lg font-black" style={{ color: d.color }}>
                  {d.code}
                </div>
                <div className="text-sm font-mono font-bold mt-0.5">{d.val}%</div>
                <div className="text-[10px] hr-muted mt-0.5">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths, Development Areas, Interview Probes & Proctoring Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="hr-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            {isId ? "Keunggulan Utama & Panduan Wawancara AI" : "Key Strengths & AI Interview Guide"}
          </h3>
          <ul className="space-y-2 text-xs">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              {isId ? "Rekomendasi Pertanyaan Wawancara Eksekutif" : "Recommended Executive Interview Probes"}
            </div>
            <ul className="space-y-1.5 text-xs hr-muted">
              {report.interviewProbes.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{i + 1}.</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hr-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            {isId ? "Area Pengembangan & Audit Proctoring" : "Development Focus & Proctoring Audit"}
          </h3>
          <ul className="space-y-2 text-xs hr-muted">
            {report.developmentAreas.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between text-xs">
              <span className="hr-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {isId ? "Telemetri Durasi Pengerjaan" : "Session Duration Telemetry"}
              </span>
              <span className="font-mono font-semibold">
                {minsUsed} {isId ? "mnt terpakai" : "min used"} / {minsAlloc} {isId ? "mnt alokasi" : "min allowed"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="hr-muted">
                {isId ? "Deteksi Pindah Tab / Copy-Paste" : "Anti-Cheat Focus/Tab Flags"}
              </span>
              <span
                className={`font-mono font-bold ${
                  report.tabSwitches === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {report.tabSwitches} {isId ? "kejadian tercatat" : "events logged"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
