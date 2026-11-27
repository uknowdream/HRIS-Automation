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
  BookOpen,
  Download,
  Search,
  Lock,
  Sliders,
  X,
  Copy,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { RBACGuard } from "@/components/security/RBACGuard";
import { getDict } from "@/lib/i18n";
import { ALL_QUESTIONS, ASSESSMENT_BATTERIES, ASSESSMENT_PRESETS } from "@/lib/psychometrics";
import type { AssessmentCategory, AssessmentReport } from "@/types/hris";
import { PsychometricReportView } from "@/components/assessments/PsychometricReportView";
import { MatrixCellSvg } from "@/components/visuals/MatrixCellSvg";

export default function AssessmentsCenterPage() {
  const router = useRouter();
  const {
    locale,
    activeRole,
    hasPermission,
    recordAuditLog,
    reports,
    invitations,
    openInviteModal,
    pushToast,
  } = useHRIS();
  const dict = getDict(locale);
  const isId = locale === "id";

  const canInspectKeys = hasPermission("assessments:answer_keys");

  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<AssessmentReport | null>(null);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankCategory, setBankCategory] = useState<AssessmentCategory | "ALL">("ALL");
  const [bankSearch, setBankSearch] = useState("");

  // Custom Assessment Battery Builder Modal
  const [builderOpen, setBuilderOpen] = useState(false);
  const [customName, setCustomName] = useState("Custom Candidate Simulation");
  const [customRole, setCustomRole] = useState("Senior AI & Product Lead");
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customCats, setCustomCats] = useState<AssessmentCategory[]>([
    "numerical",
    "abstract",
    "disc",
    "sjt",
  ]);

  const toggleCustomCat = (cat: AssessmentCategory) => {
    setCustomCats((prev) =>
      prev.includes(cat)
        ? prev.length > 1
          ? prev.filter((c) => c !== cat)
          : prev
        : [...prev, cat]
    );
  };

  const exportReportsCsv = () => {
    const headers = ["Candidate", "Role", "Est_IQ", "Percentile", "Sten", "DISC", "SJT", "Integrity", "Verdict"];
    const rows = reports.map((r) => [
      `"${r.candidateName}"`,
      `"${r.targetRole}"`,
      r.estimatedIq,
      r.globalPercentile,
      r.stenScore,
      `"${r.disc.archetype}"`,
      r.sjtScore,
      r.integrityScore,
      r.recommendation,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aetherhr-psychometric-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    recordAuditLog({
      module: "Psychometrics",
      action: "psychometrics.csv_exported",
      target: `${reports.length} Candidate Reports`,
      severity: "SENSITIVE",
      detail: `Exported psychometric IQ & DISC dataset as CSV.`,
    });
    pushToast({ title: "Psychometric CSV Exported", variant: "success" });
  };

  const handleToggleBank = () => {
    if (!canInspectKeys) {
      recordAuditLog({
        module: "RBAC & Security",
        action: "rbac.answer_keys_denied",
        target: "104-Question Confidential Answer Keys",
        severity: "SECURITY",
        detail: `Role ${activeRole} attempted to open Confidential Psychometric Answer Keys.`,
      });
      pushToast({
        title: isId ? "Kunci Jawaban Dibatasi RBAC" : "Answer Keys Restricted by RBAC",
        description: isId
          ? "Hanya HR Admin & Super Admin yang dapat menginspeksi kunci jawaban psikotes."
          : "Only HR Admin & Super Admin can inspect confidential test answer keys.",
        variant: "warning",
      });
      return;
    }
    const next = !bankOpen;
    setBankOpen(next);
    if (next) {
      recordAuditLog({
        module: "Psychometrics",
        action: "question_bank.inspected",
        target: `${ALL_QUESTIONS.length}-Item Calibrated Bank`,
        severity: "SENSITIVE",
        detail: `${activeRole} opened confidential psychometric answer key & rationale inspector.`,
      });
    }
  };

  const filteredBank = ALL_QUESTIONS.filter((q) => {
    const matchCat = bankCategory === "ALL" || q.category === bankCategory;
    const matchText =
      !bankSearch.trim() ||
      q.prompt[locale].toLowerCase().includes(bankSearch.toLowerCase()) ||
      q.id.toLowerCase().includes(bankSearch.toLowerCase());
    return matchCat && matchText;
  });

  const launchDemoTest = async (params: {
    presetId?: string;
    categories?: AssessmentCategory[];
    durationMinutes?: number;
    expressLimitPerCategory?: number;
    candidateName?: string;
    role?: string;
    label: string;
  }) => {
    setLaunchingId(params.label);
    try {
      const res = await fetch("/api/assessments/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName:
            params.candidateName ||
            (isId ? "Peserta Simulasi Eksekutif" : "Executive Demo Candidate"),
          candidateEmail: "demo.candidate@aetherhr.global",
          role: params.role || "Global Enterprise Candidate",
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
    <RBACGuard
      requiredPermission="assessments:manage"
      moduleName="Psychometrics"
      resourceLabel="Cognitive & Psychometric Assessment Suite"
    >
      <div className="space-y-6">
        {/* Clean Enterprise Quiet-Chrome Header */}
        <section className="hr-card rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-success text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {ALL_QUESTIONS.length} Calibrated Questions · 8 Standardized Batteries · Anti-Cheat Proctoring
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <BrainCircuit className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{dict.assessment.title}</span>
            </h1>
            <p className="text-xs sm:text-sm hr-muted leading-relaxed">
              {dict.assessment.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setBuilderOpen(true)}
              className="hr-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {isId ? "Custom Test Builder" : "Custom Builder"}
            </button>
            <button
              type="button"
              onClick={() =>
                void launchDemoTest({
                  presetId: "express-screening",
                  label: "express-top",
                })
              }
              disabled={Boolean(launchingId)}
              className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {launchingId === "express-top"
                ? "Launching..."
                : isId
                ? "Uji Express (24 Soal · 20m)"
                : "Launch Express (24 Qs · 20m)"}
            </button>
            <button
              type="button"
              onClick={() => openInviteModal()}
              className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {dict.assessment.sendInvite}
            </button>
          </div>
        </section>

        {/* Assessment Presets */}
        <section className="space-y-3">
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {isId
              ? "Paket Asesmen Internasional Terkalibrasi (Siap Pakai & Otomatis)"
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
                  className="hr-card rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge-info text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        {preset.targetLevel}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {preset.durationMinutes}m · {qCount}Q
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold leading-snug">{preset.name[locale]}</h3>
                    <p className="text-xs hr-muted leading-relaxed">
                      {preset.description[locale]}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <button
                      type="button"
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
                      type="button"
                      onClick={() => openInviteModal()}
                      className="hr-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600" /> WA/Email
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 8 Standardized Individual Batteries */}
        <section className="space-y-3">
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {isId
              ? "8 Modul Kognitif & Psikotes Individual (Total 104 Soal Terverifikasi)"
              : "8 Individual Cognitive & Psychometric Modules (104 Verified Items)"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {ASSESSMENT_BATTERIES.map((b) => (
              <div
                key={b.id}
                className="hr-card rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${b.color}18`, color: b.color }}
                    >
                      {b.badge}
                    </span>
                    <span className="text-[11px] font-mono hr-muted font-semibold">
                      {b.questionCount}Q · {b.durationMinutes}m
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold leading-snug">{b.name[locale]}</h3>
                  <p className="text-[11px] hr-muted mt-1 leading-relaxed">
                    {b.description[locale]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    void launchDemoTest({
                      categories: [b.id],
                      durationMinutes: b.durationMinutes,
                      label: `mod-${b.id}`,
                    })
                  }
                  disabled={Boolean(launchingId)}
                  className="w-full py-2 rounded-xl text-xs font-bold hr-btn-secondary flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  {isId ? `Uji Modul ${b.shortName.id}` : `Launch ${b.shortName.en}`}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Completed Reports Ledger */}
        <section className="hr-card rounded-2xl p-5 overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <FileBarChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {isId
                ? `Laporan Hasil Psikotes & IQ Kandidat (${reports.length})`
                : `Completed Candidate Psychometric Reports (${reports.length})`}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggleBank}
                className="hr-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {canInspectKeys ? (
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                )}
                {bankOpen
                  ? isId
                    ? "Tutup Bank Soal"
                    : "Hide Question Bank"
                  : isId
                  ? `Inspeksi Kunci Soal (${ALL_QUESTIONS.length})`
                  : `Inspect ${ALL_QUESTIONS.length}-Item Keys`}
              </button>
              <button
                type="button"
                onClick={exportReportsCsv}
                className="hr-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <tr>
                <th className="py-2.5 px-3">{isId ? "Kandidat & Posisi" : "Candidate"}</th>
                <th className="py-2.5 px-3">{isId ? "Estimasi IQ & Persentil" : "Est. IQ & Percentile"}</th>
                <th className="py-2.5 px-3">{isId ? "Profil DISC" : "DISC Profile"}</th>
                <th className="py-2.5 px-3">{isId ? "Kepemimpinan SJT" : "SJT Leadership"}</th>
                <th className="py-2.5 px-3">{isId ? "Integritas Pengawasan" : "Proctoring Integrity"}</th>
                <th className="py-2.5 px-3">{isId ? "Rekomendasi" : "Verdict"}</th>
                <th className="py-2.5 px-3 text-right">{isId ? "Sertifikat" : "Certificate"}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <div className="font-bold">{rep.candidateName}</div>
                    <div className="text-[11px] hr-muted">{rep.targetRole}</div>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                      IQ {rep.estimatedIq}
                    </span>
                    <span className="hr-muted ml-1.5">({rep.globalPercentile}th pct)</span>
                  </td>
                  <td className="py-3 px-3 font-semibold">{rep.disc.archetype}</td>
                  <td className="py-3 px-3 font-mono font-bold">{rep.sjtScore}%</td>
                  <td className="py-3 px-3 font-mono">
                    <span
                      className={
                        rep.integrityScore >= 85
                          ? "text-emerald-600 dark:text-emerald-400 font-bold"
                          : "text-amber-600 dark:text-amber-400 font-bold"
                      }
                    >
                      {rep.integrityScore}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rep.recommendation === "STRONG_HIRE"
                          ? "badge-success"
                          : rep.recommendation === "RECOMMENDED"
                          ? "badge-info"
                          : "badge-warning"
                      }`}
                    >
                      {rep.recommendation.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        recordAuditLog({
                          module: "Psychometrics",
                          action: "report.viewed",
                          target: `${rep.candidateName} (IQ ${rep.estimatedIq})`,
                          severity: "INFO",
                          detail: `Opened detailed psychometric certificate & domain radar.`,
                        });
                        setActiveReport(rep);
                      }}
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

        {/* Sent Assessment Links Live Tracker */}
        {invitations.length > 0 && (
          <section className="hr-card rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {isId
                ? `Pelacak Tautan Undangan Terenkripsi Aktif (${invitations.length})`
                : `Active Encrypted Assessment Links (${invitations.length})`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="p-3.5 rounded-xl hr-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold">{inv.candidateName}</div>
                    <div className="text-[11px] hr-muted">
                      {inv.role} · {inv.durationMinutes}m · {inv.channels.join(" + ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {inv.whatsappLaunchUrl && (
                      <a
                        href={inv.whatsappLaunchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-emerald px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> WA
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(inv.inviteUrl);
                        pushToast({ title: "Assessment Link Copied", variant: "info" });
                      }}
                      className="hr-btn-secondary px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <a
                      href={inv.inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hr-btn-secondary px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Searchable 104-Question Bank Inspector (RBAC Guarded: Super Admin & HR Admin Only) */}
        {bankOpen && canInspectKeys && (
          <section className="hr-card rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isId
                    ? `Bank Soal Kognitif & Psikotes Terkalibrasi (${filteredBank.length}/${ALL_QUESTIONS.length})`
                    : `Calibrated Question Bank Inspector (${filteredBank.length}/${ALL_QUESTIONS.length})`}
                </h2>
                <p className="text-xs hr-muted">
                  {isId
                    ? "Rahasia HR Admin/Super Admin: Audit kunci jawaban, rasionalisasi, dan matriks SVG Raven."
                    : "Restricted to HR/Super Admin: Audit verified answer keys, rationales, and live SVG Raven matrices."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 hr-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="pl-8 pr-3 py-1.5 rounded-xl text-xs hr-input"
                  />
                </div>
                <select
                  value={bankCategory}
                  onChange={(e) => setBankCategory(e.target.value as AssessmentCategory | "ALL")}
                  className="px-3 py-1.5 rounded-xl text-xs hr-input font-semibold"
                >
                  <option value="ALL">All 8 Batteries ({ALL_QUESTIONS.length})</option>
                  {ASSESSMENT_BATTERIES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName[locale]} ({b.questionCount})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-h-[480px] overflow-y-auto space-y-2.5 pr-1">
              {filteredBank.map((q, idx) => (
                <div key={q.id} className="p-3.5 rounded-xl hr-subtle text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      #{idx + 1} · {q.id.toUpperCase()} ({q.category})
                    </span>
                    <span className="text-[10px] font-mono hr-muted">
                      Difficulty L{q.difficulty} · {q.timeBudgetSec}s budget
                    </span>
                  </div>
                  <p className="font-semibold leading-relaxed">{q.prompt[locale]}</p>
                  {q.matrixVisual && (
                    <div className="inline-grid grid-cols-3 gap-1.5 p-2 rounded-xl matrix-dark-board">
                      {q.matrixVisual.grid.slice(0, 8).map((cell, cIdx) => (
                        <div key={cIdx} className="w-11 h-11 rounded bg-slate-900 flex items-center justify-center">
                          {cell && <MatrixCellSvg spec={cell} uid={`${q.id}-c${cIdx}`} size={34} />}
                        </div>
                      ))}
                      <div className="w-11 h-11 rounded bg-indigo-950 flex items-center justify-center font-black text-cyan-300 on-dark">
                        ?
                      </div>
                    </div>
                  )}
                  {q.correctOptionId && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      ✓ Verified Key: {q.correctOptionId.toUpperCase()}
                      {q.explanation ? ` — ${q.explanation[locale]}` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Custom Assessment Battery Builder Modal */}
        {builderOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setBuilderOpen(false)}
          >
            <div
              className="w-full max-w-lg hr-card rounded-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold">
                    {isId ? "Custom Assessment Builder" : "Custom Assessment Battery Builder"}
                  </h3>
                  <p className="text-xs hr-muted">
                    {isId
                      ? "Racik kombinasi baterai kognitif & psikotes beserta durasi timer sesuai kebutuhan posisi."
                      : "Combine specific cognitive & psychometric batteries with calibrated timers."}
                  </p>
                </div>
                <button type="button" onClick={() => setBuilderOpen(false)} className="hr-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Candidate / Simulation Name</label>
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl hr-input"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Target Role</label>
                  <input
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl hr-input"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block font-bold">
                  {isId ? "Pilih Baterai Tes:" : "Select Assessment Batteries:"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ASSESSMENT_BATTERIES.map((b) => {
                    const checked = customCats.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => toggleCustomCat(b.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                          checked
                            ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-500/15 font-bold"
                            : "hr-subtle hr-muted"
                        }`}
                      >
                        <span className="truncate">{b.shortName[locale]}</span>
                        <span className="font-mono text-[10px]">{b.questionCount}Q</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold">
                  {isId ? "Batas Waktu Total (Menit):" : "Total Time Limit (Minutes):"}
                </span>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value) || 20)}
                  className="w-24 px-3 py-2 rounded-xl hr-input font-mono font-bold text-center"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBuilderOpen(false)}
                  className="hr-btn-secondary px-4 py-2 rounded-xl text-xs font-bold"
                >
                  {dict.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBuilderOpen(false);
                    void launchDemoTest({
                      categories: customCats,
                      durationMinutes: customMinutes,
                      candidateName: customName,
                      role: customRole,
                      label: "custom-builder",
                    });
                  }}
                  className="btn-quantum px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isId ? "Mulai Custom Tes Sekarang" : "Launch Custom Assessment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RBACGuard>
  );
}
