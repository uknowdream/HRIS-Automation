"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  Play,
  Send,
  Clock,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  FileBarChart,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { getDict } from "@/lib/i18n";
import { ALL_QUESTIONS, ASSESSMENT_BATTERIES, ASSESSMENT_PRESETS } from "@/lib/psychometrics";
import type { AssessmentCategory, AssessmentReport } from "@/types/hris";
import { PsychometricReportView } from "@/components/assessments/PsychometricReportView";

export default function AssessmentsCenterPage() {
  const router = useRouter();
  const { locale, reports, openInviteModal, pushToast } = useHRIS();
  const dict = getDict(locale);
  const isId = locale === "id";

  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<AssessmentReport | null>(null);

  const launchDemoTest = async (params: {
    presetId?: string;
    categories?: AssessmentCategory[];
    durationMinutes?: number;
    expressLimitPerCategory?: number;
    label: string;
  }) => {
    setLaunchingId(params.label);
    try {
      const res = await fetch("/api/assessments/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: isId ? "Peserta Simulasi Eksekutif" : "Executive Demo Candidate",
          candidateEmail: "demo.candidate@aetherhr.global",
          role: "Global Enterprise Candidate",
          presetId: params.presetId,
          categories: params.categories,
          durationMinutes: params.durationMinutes,
          expressLimitPerCategory: params.expressLimitPerCategory,
          proctoringStrict: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Unable to start");
      router.push(data.path);
    } catch (err) {
      pushToast({
        title: "Launch Error",
        description: err instanceof Error ? err.message : "Unable to start test",
        variant: "error",
      });
      setLaunchingId(null);
    }
  };

  if (activeReport) {
    return (
      <PsychometricReportView
        report={activeReport}
        onClose={() => setActiveReport(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="glass-panel rounded-3xl p-6 sm:p-7 border border-cyan-500/25 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {ALL_QUESTIONS.length} Calibrated Questions · 8 Standardized Batteries · Anti-Cheat Proctoring
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">
            {dict.assessment.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {dict.assessment.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() =>
              void launchDemoTest({
                presetId: "express-screening",
                label: "express-top",
              })
            }
            disabled={Boolean(launchingId)}
            className="btn-emerald px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {launchingId === "express-top"
              ? "Launching..."
              : isId
              ? "Uji Langsung (Express 24 Soal · 20m)"
              : "Launch Express Test (24 Qs · 20m)"}
          </button>
          <button
            onClick={() => openInviteModal()}
            className="btn-quantum px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {dict.assessment.sendInvite}
          </button>
        </div>
      </section>

      {/* Assessment Presets */}
      <section className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          {isId
            ? "Paket Asesmen Internasional Terkalibrasi (Siap Pakai & Terjadwal)"
            : "Calibrated International Assessment Batteries (Ready to Launch or Invite)"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ASSESSMENT_PRESETS.map((preset) => {
            const qCount = preset.expressLimitPerCategory
              ? preset.categories.length * preset.expressLimitPerCategory
              : ALL_QUESTIONS.filter((q) => preset.categories.includes(q.category)).length;
            return (
              <div
                key={preset.id}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {preset.targetLevel}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {preset.durationMinutes}m · {qCount}Q
                    </span>
                  </div>
                  <h3 className="text-sm font-black leading-snug">{preset.name[locale]}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {preset.description[locale]}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/70">
                  <button
                    onClick={() =>
                      void launchDemoTest({
                        presetId: preset.id,
                        label: preset.id,
                      })
                    }
                    disabled={Boolean(launchingId)}
                    className="flex-1 btn-quantum py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {launchingId === preset.id
                      ? "Loading..."
                      : isId
                      ? "Mulai Tes"
                      : "Start Test"}
                  </button>
                  <button
                    onClick={() => openInviteModal()}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> WA/Email
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8 Standardized Individual Batteries */}
      <section className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          {isId
            ? "8 Modul Kognitif & Psikotes Individual (Total 104 Soal Terverifikasi)"
            : "8 Individual Cognitive & Psychometric Modules (104 Verified Items)"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {ASSESSMENT_BATTERIES.map((b) => (
            <div
              key={b.id}
              className="glass-card rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${b.color}20`, color: b.color }}
                  >
                    {b.badge}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {b.questionCount}Q · {b.durationMinutes}m
                  </span>
                </div>
                <h3 className="text-xs font-black leading-snug">{b.name[locale]}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {b.description[locale]}
                </p>
              </div>
              <button
                onClick={() =>
                  void launchDemoTest({
                    categories: [b.id],
                    durationMinutes: b.durationMinutes,
                    label: `mod-${b.id}`,
                  })
                }
                disabled={Boolean(launchingId)}
                className="w-full py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:border-cyan-400/60 hover:bg-cyan-500/10 transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3 h-3 text-cyan-400" />
                {isId ? `Uji Modul ${b.shortName.id}` : `Launch ${b.shortName.en}`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Completed Reports Ledger */}
      <section className="glass-card rounded-2xl p-5 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-emerald-400" />
            {isId
              ? `Laporan Hasil Psikotes & IQ Kandidat (${reports.length})`
              : `Completed Candidate Psychometric Reports (${reports.length})`}
          </h2>
          <span className="text-xs text-slate-400">
            {isId ? "Klik laporan untuk membuka grafik Radar, OCEAN, DISC & Cetak PDF" : "Click any report to view Radar, OCEAN, DISC & PDF Certificate"}
          </span>
        </div>

        <table className="w-full text-left text-xs min-w-[760px]">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Candidate</th>
              <th className="py-2.5 px-3">Est. IQ & Percentile</th>
              <th className="py-2.5 px-3">DISC Profile</th>
              <th className="py-2.5 px-3">SJT Leadership</th>
              <th className="py-2.5 px-3">Proctoring Integrity</th>
              <th className="py-2.5 px-3">Verdict</th>
              <th className="py-2.5 px-3 text-right">Certificate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {reports.map((rep) => (
              <tr key={rep.id} className="hover:bg-slate-900/45">
                <td className="py-3 px-3">
                  <div className="font-bold">{rep.candidateName}</div>
                  <div className="text-[11px] text-slate-400">{rep.targetRole}</div>
                </td>
                <td className="py-3 px-3 font-mono">
                  <span className="font-black text-cyan-400 text-sm">IQ {rep.estimatedIq}</span>
                  <span className="text-slate-400 ml-1.5">({rep.globalPercentile}th pct)</span>
                </td>
                <td className="py-3 px-3 font-semibold text-indigo-300">{rep.disc.archetype}</td>
                <td className="py-3 px-3 font-mono font-bold text-amber-400">{rep.sjtScore}%</td>
                <td className="py-3 px-3 font-mono">
                  <span
                    className={
                      rep.integrityScore >= 85 ? "text-emerald-400 font-bold" : "text-amber-400"
                    }
                  >
                    {rep.integrityScore}%
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rep.recommendation === "STRONG_HIRE"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : rep.recommendation === "RECOMMENDED"
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {rep.recommendation.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => setActiveReport(rep)}
                    className="btn-quantum px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5" /> {isId ? "Buka Laporan" : "View Report"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
