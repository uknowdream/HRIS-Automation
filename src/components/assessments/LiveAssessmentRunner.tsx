"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Clock,
  ShieldCheck,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Globe,
  BrainCircuit,
  Camera,
  Send,
  ArrowLeft,
} from "lucide-react";
import type {
  AssessmentCategory,
  AssessmentReport,
  Locale,
  ProctoringEvent,
} from "@/types/hris";
import {
  ASSESSMENT_PRESETS,
  getBatteryMeta,
  selectQuestionsForSession,
} from "@/lib/psychometrics";
import { evaluateAssessmentSubmission } from "@/lib/psychometrics/scoring";
import { MatrixCellSvg } from "@/components/visuals/MatrixCellSvg";
import { PsychometricReportView } from "./PsychometricReportView";
import { useHRIS } from "@/context/HRISContext";

export interface RunnerConfig {
  sessionId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  role: string;
  companyName: string;
  categories: AssessmentCategory[];
  presetId: string;
  durationMinutes: number;
  expressLimitPerCategory?: number;
  proctoringStrict: boolean;
}

function formatTimer(sec: number): string {
  const s = Math.max(0, sec);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export function LiveAssessmentRunner({ config }: { config: RunnerConfig }) {
  const { locale: globalLocale, saveAssessmentReport, settings } = useHRIS();
  const [lang, setLang] = useState<Locale>(globalLocale);
  const isId = lang === "id";

  const questions = useMemo(
    () =>
      selectQuestionsForSession(
        config.categories,
        config.expressLimitPerCategory,
        config.sessionId
      ),
    [config.categories, config.expressLimitPerCategory, config.sessionId]
  );

  const presetName = useMemo(() => {
    const found = ASSESSMENT_PRESETS.find((p) => p.id === config.presetId);
    return found ? found.name[lang] : `Custom Assessment (${questions.length} Qs)`;
  }, [config.presetId, lang, questions.length]);

  const totalAllocatedSec = config.durationMinutes * 60;
  const storageKey = `aether_exam_${config.sessionId}`;

  const [phase, setPhase] = useState<"intro" | "running" | "submitting" | "done">("intro");
  const [agreedRules, setAgreedRules] = useState(true);
  const [webcamChecked, setWebcamChecked] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(totalAllocatedSec);
  const [proctoringEvents, setProctoringEvents] = useState<ProctoringEvent[]>([]);
  const [warningBanner, setWarningBanner] = useState<string | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [report, setReport] = useState<AssessmentReport | null>(null);

  const submittedRef = useRef(false);

  // Restore saved progress if refreshed mid-test
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.flagged) setFlagged(parsed.flagged);
        if (typeof parsed.secondsLeft === "number" && parsed.secondsLeft > 0) {
          setSecondsLeft(parsed.secondsLeft);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (phase === "running") {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ answers, flagged, secondsLeft }));
      } catch {
        // ignore
      }
    }
  }, [phase, answers, flagged, secondsLeft, storageKey]);

  const finalizeAssessment = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setConfirmSubmitOpen(false);
    setPhase("submitting");

    const durationUsedSec = Math.max(10, totalAllocatedSec - secondsLeft);

    try {
      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: config.sessionId,
          candidateName: config.candidateName,
          candidateEmail: config.candidateEmail,
          candidatePhone: config.candidatePhone,
          targetRole: config.role,
          presetName,
          categories: config.categories,
          expressLimitPerCategory: config.expressLimitPerCategory,
          answers,
          durationUsedSec,
          durationAllocatedSec: totalAllocatedSec,
          proctoringEvents,
          webhookUrl: settings.primaryWebhookUrl || undefined,
          webhookSecret: settings.webhookSecret || undefined,
          slackWebhookUrl: settings.slackWebhookUrl || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.report) {
        saveAssessmentReport(data.report);
        setReport(data.report);
        sessionStorage.removeItem(storageKey);
        setPhase("done");
        return;
      }
    } catch {
      // Fallback to client evaluation if offline
    }

    const fallbackReport = evaluateAssessmentSubmission({
      candidateName: config.candidateName,
      candidateEmail: config.candidateEmail,
      candidatePhone: config.candidatePhone,
      targetRole: config.role,
      presetName,
      questions,
      answers,
      durationUsedSec,
      durationAllocatedSec: totalAllocatedSec,
      proctoringEvents,
    });
    saveAssessmentReport(fallbackReport);
    setReport(fallbackReport);
    sessionStorage.removeItem(storageKey);
    setPhase("done");
  }, [
    answers,
    config,
    presetName,
    proctoringEvents,
    questions,
    saveAssessmentReport,
    secondsLeft,
    settings.primaryWebhookUrl,
    settings.slackWebhookUrl,
    settings.webhookSecret,
    storageKey,
    totalAllocatedSec,
  ]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) {
      void finalizeAssessment();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, secondsLeft, finalizeAssessment]);

  // Proctoring anti-cheat telemetry listeners
  useEffect(() => {
    if (phase !== "running" || !config.proctoringStrict) return;

    const recordEvent = (type: ProctoringEvent["type"], detail: string) => {
      setProctoringEvents((prev) => [
        ...prev,
        { type, timestamp: new Date().toISOString(), detail },
      ]);
      setWarningBanner(detail);
      setTimeout(() => setWarningBanner(null), 5000);
    };

    const onVisibility = () => {
      if (document.hidden) {
        recordEvent(
          "tab_switch",
          isId
            ? "Peringatan Proctoring: Perpindahan tab terdeteksi dan dicatat ke log integritas."
            : "Proctoring Alert: Tab switch detected and recorded in integrity audit."
        );
      }
    };

    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordEvent(
        "copy_attempt",
        isId
          ? "Peringatan Proctoring: Aksi menyalin (copy) soal dinonaktifkan selama ujian."
          : "Proctoring Alert: Copying question text is disabled during active testing."
      );
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordEvent(
          "fullscreen_exit",
          isId
            ? "Mode Layar Penuh keluar — disarankan tetap dalam mode fokus."
            : "Exited Fullscreen mode — please remain focused inside the test window."
        );
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("copy", onCopy);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [phase, config.proctoringStrict, isId]);

  // Keyboard shortcuts during running phase
  const currentQ = questions[currentIndex];
  useEffect(() => {
    if (phase !== "running" || !currentQ) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.key.toLowerCase() === "f") {
        setFlagged((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
      } else if (currentQ.options) {
        const idx = ["1", "2", "3", "4", "5"].indexOf(e.key);
        const letterIdx = ["a", "b", "c", "d", "e"].indexOf(e.key.toLowerCase());
        const picked = idx >= 0 ? idx : letterIdx;
        if (picked >= 0 && currentQ.options[picked]) {
          setAnswers((prev) => ({ ...prev, [currentQ.id]: currentQ.options![picked].id }));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, currentQ, questions.length]);

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore if blocked by browser policy
    }
  };

  const answeredCount = Object.keys(answers).filter((k) => Boolean(answers[k])).length;
  const progressPct = Math.round((answeredCount / Math.max(1, questions.length)) * 100);

  // ==========================
  // PHASE 1: PRE-FLIGHT INTRO
  // ==========================
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl hr-card rounded-3xl p-6 sm:p-9 space-y-6 shadow-2xl">
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {config.companyName} · {isId ? "Portal Asesmen Terproktor" : "Proctored Assessment Portal"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                {isId ? "Tes Kemampuan Kognitif & Psikotes Internasional" : "International Cognitive & Psychometric Assessment"}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setLang(lang === "id" ? "en" : "id")}
              className="px-3 py-1.5 rounded-xl hr-btn-secondary text-xs font-bold flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {lang.toUpperCase()}
            </button>
          </div>

          {/* Candidate Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl hr-subtle">
              <div className="hr-muted">{isId ? "Nama Peserta" : "Candidate"}</div>
              <div className="font-extrabold text-sm mt-0.5">{config.candidateName}</div>
            </div>
            <div className="p-3.5 rounded-xl hr-subtle">
              <div className="hr-muted">{isId ? "Posisi Target" : "Target Role"}</div>
              <div className="font-extrabold text-sm mt-0.5 text-indigo-600 dark:text-indigo-400">{config.role}</div>
            </div>
            <div className="p-3.5 rounded-xl hr-subtle">
              <div className="hr-muted">{isId ? "Total Soal & Durasi" : "Items & Timer"}</div>
              <div className="font-extrabold text-sm mt-0.5 text-emerald-600 dark:text-emerald-400">
                {questions.length} {isId ? "Soal" : "Qs"} · {config.durationMinutes}{" "}
                {isId ? "Menit" : "Mins"}
              </div>
            </div>
          </div>

          {/* Active Modules Breakdown */}
          <div>
            <div className="text-xs font-bold hr-muted mb-2">
              {isId ? "Baterai Soal dalam Sesi Ini (Acak Terenkripsi per Sesi):" : "Batteries Included in This Session (Seeded Randomization):"}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {config.categories.map((cat) => {
                const meta = getBatteryMeta(cat);
                const count = questions.filter((q) => q.category === cat).length;
                return (
                  <div key={cat} className="p-2.5 rounded-xl hr-subtle text-xs">
                    <div className="font-bold truncate" style={{ color: meta.color }}>
                      {meta.shortName[lang]}
                    </div>
                    <div className="text-[11px] hr-muted mt-0.5">
                      {count} {isId ? "soal" : "items"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anti-Cheat Proctoring Checklist */}
          <div className="p-4 rounded-2xl badge-info space-y-2.5 text-xs">
            <div className="font-extrabold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {isId ? "Aturan Integritas & Anti-Cheat Proctoring" : "Integrity & Anti-Cheat Proctoring Rules"}
            </div>
            <ul className="space-y-1 opacity-90 list-disc pl-4">
              <li>
                {isId
                  ? "Timer berjalan otomatis dan jawaban langsung tersubmit ketika waktu habis."
                  : "Countdown runs continuously and auto-submits cleanly when time expires."}
              </li>
              <li>
                {isId
                  ? "Perpindahan tab browser dan aksi copy-paste dimonitor ke Skor Integritas."
                  : "Browser tab switches and copy attempts are logged into your Integrity Score."}
              </li>
              <li>
                {isId
                  ? "Urutan soal diacak secara unik untuk sesi Anda; gunakan tombol 1-5 / A-D atau panah kiri-kanan."
                  : "Question order is uniquely randomized for your session; use keys 1-5 / A-D or Left/Right arrows."}
              </li>
            </ul>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={agreedRules}
                  onChange={(e) => setAgreedRules(e.target.checked)}
                  className="accent-indigo-600 w-4 h-4"
                />
                {isId ? "Saya menyetujui aturan integritas ujian" : "I agree to uphold assessment integrity"}
              </label>
              <button
                type="button"
                onClick={() => setWebcamChecked(true)}
                className="px-3 py-1.5 rounded-lg hr-btn-secondary text-[11px] font-bold flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {webcamChecked
                  ? isId
                    ? "Sensor Perangkat OK ✓"
                    : "Device Check Passed ✓"
                  : isId
                  ? "Verifikasi Perangkat (Opsional)"
                  : "Verify Device (Optional)"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link
              href="/assessments"
              className="text-xs hr-muted hover:text-indigo-600 flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> {isId ? "Kembali ke HRIS" : "Back to HRIS"}
            </Link>
            <button
              type="button"
              disabled={!agreedRules}
              onClick={() => {
                setPhase("running");
              }}
              className="btn-quantum px-7 py-3.5 rounded-xl text-sm font-black flex items-center gap-2 disabled:opacity-50"
            >
              <BrainCircuit className="w-5 h-5" />
              {isId ? "Mulai Tes Sekarang →" : "Start Timed Assessment →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================
  // PHASE 3: SUBMITTING
  // ==========================
  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center animate-pulse shadow-xl">
          <BrainCircuit className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-xl font-black">
          {isId ? "Menghitung Indeks IQ, OCEAN, DISC & Laporan Eksekutif..." : "Computing Cognitive IQ, OCEAN, DISC & Executive Report..."}
        </h2>
        <p className="text-xs hr-muted">
          {isId ? "Menyinkronkan hasil psikometrik ke ATS & Webhook Otomatisasi..." : "Synchronizing verified results to ATS & Automation Webhooks..."}
        </p>
      </div>
    );
  }

  // ==========================
  // PHASE 4: REPORT VIEW
  // ==========================
  if (phase === "done" && report) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="no-print flex items-center justify-between">
          <Link
            href="/assessments"
            className="px-4 py-2 rounded-xl hr-btn-secondary text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            {isId ? "Kembali ke Assessment Center" : "Back to Assessment Center"}
          </Link>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {isId ? "Laporan Tersimpan di HRIS & ATS" : "Report Saved to HRIS & ATS"}
          </span>
        </div>
        <PsychometricReportView report={report} />
      </div>
    );
  }

  // ==========================
  // PHASE 2: LIVE TIMED EXAM ARENA
  // ==========================
  if (!currentQ) return null;
  const battery = getBatteryMeta(currentQ.category);
  const lowTime = secondsLeft < 300;
  const criticalTime = secondsLeft < 60;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Sticky Exam Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
              style={{ backgroundColor: `${battery.color}22`, color: battery.color }}
            >
              {currentIndex + 1}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black truncate">{battery.name[lang]}</div>
              <div className="text-[11px] hr-muted truncate">
                {config.candidateName} · {answeredCount}/{questions.length}{" "}
                {isId ? "Terjawab" : "Answered"} ({progressPct}%)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Timer */}
            <div
              className={`px-3.5 py-2 rounded-xl font-mono text-sm font-black flex items-center gap-2 border ${
                criticalTime
                  ? "badge-danger animate-pulse"
                  : lowTime
                  ? "badge-warning"
                  : "badge-info"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>

            <button
              type="button"
              onClick={requestFullscreen}
              className="hidden sm:flex p-2 rounded-xl hr-btn-secondary"
              title="Fullscreen Focus Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setLang(lang === "id" ? "en" : "id")}
              className="px-2.5 py-2 rounded-xl hr-btn-secondary text-xs font-bold"
            >
              {lang.toUpperCase()}
            </button>

            <button
              type="button"
              onClick={() => setConfirmSubmitOpen(true)}
              className="btn-emerald px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isId ? "Selesai" : "Submit"}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-7xl mx-auto mt-2.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Proctoring Alert Banner */}
      {warningBanner && (
        <div className="badge-warning border-b px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{warningBanner}</span>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question Card */}
        <div className="lg:col-span-8 hr-card rounded-3xl p-5 sm:p-8 space-y-6 select-none">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                style={{ backgroundColor: `${battery.color}20`, color: battery.color }}
              >
                {battery.shortName[lang]} · Q{currentIndex + 1}/{questions.length}
              </span>
              <span className="px-2 py-1 rounded-lg text-[10px] font-mono hr-subtle hr-muted font-bold">
                {currentQ.difficulty === 3
                  ? "Executive Tier"
                  : currentQ.difficulty === 2
                  ? "Advanced"
                  : "Standard"}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setFlagged((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                flagged[currentQ.id] ? "badge-warning" : "hr-btn-secondary"
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              {flagged[currentQ.id]
                ? isId
                  ? "Ditandai Ragu"
                  : "Flagged"
                : isId
                ? "Tandai Ragu (F)"
                : "Flag (F)"}
            </button>
          </div>

          {/* Context Box if any */}
          {currentQ.context && (
            <div className="p-4 rounded-2xl badge-info text-xs sm:text-sm leading-relaxed">
              {currentQ.context[lang]}
            </div>
          )}

          {/* Prompt */}
          <h2 className="text-base sm:text-lg font-extrabold leading-relaxed whitespace-pre-line">
            {currentQ.prompt[lang]}
          </h2>

          {/* Visual 3x3 Raven Matrix if format === "matrix" */}
          {currentQ.format === "matrix" && currentQ.matrixVisual && (
            <div className="space-y-5">
              <div className="matrix-dark-board inline-grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-900 border border-slate-700 mx-auto">
                {currentQ.matrixVisual.grid.map((spec, idx) => (
                  <MatrixCellSvg
                    key={`${currentQ.id}-g-${idx}`}
                    spec={spec}
                    uid={`${currentQ.id}-g-${idx}`}
                    size={84}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentQ.matrixVisual.options.map((optSpec, idx) => {
                  const optId = currentQ.options?.[idx]?.id || String(idx);
                  const selected = answers[currentQ.id] === optId;
                  return (
                    <button
                      type="button"
                      key={optId}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [currentQ.id]: optId }))
                      }
                      className={`matrix-dark-board p-3 rounded-2xl border flex flex-col items-center gap-2 transition ${
                        selected
                          ? "border-indigo-400 bg-indigo-950 ring-2 ring-indigo-500/40"
                          : "border-slate-700 bg-slate-900 hover:border-indigo-400"
                      }`}
                    >
                      <span className="text-xs font-black uppercase text-white on-dark">
                        {optId.toUpperCase()}
                      </span>
                      <MatrixCellSvg
                        spec={optSpec}
                        uid={`${currentQ.id}-opt-${idx}`}
                        size={74}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standard Options (MCQ, Likert, DISC, SJT) */}
          {currentQ.format !== "matrix" && currentQ.options && (
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const selected = answers[currentQ.id] === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.id }))
                    }
                    className={`w-full text-left p-4 rounded-2xl border flex items-start gap-3.5 transition ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 shadow-xs"
                        : "hr-subtle hover:border-indigo-400"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black uppercase shrink-0 ${
                        selected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {currentQ.format === "likert" ? idx + 1 : opt.id.toUpperCase()}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                      {opt.label[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Nav Buttons */}
          <div
            className="flex items-center justify-between pt-4 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2.5 rounded-xl hr-btn-secondary text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> {isId ? "Sebelumnya" : "Previous"}
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                className="btn-quantum px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {isId ? "Soal Berikutnya" : "Next Question"}{" "}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(true)}
                className="btn-emerald px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isId ? "Selesaikan & Hitung Skor" : "Finish & Compute Report"}
              </button>
            )}
          </div>
        </div>

        {/* Right Side Question Navigator & Proctoring Telemetry */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="hr-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>{isId ? "Navigator Soal" : "Question Navigator"}</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                {answeredCount}/{questions.length}
              </span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-6 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAns = Boolean(answers[q.id]);
                const isFlag = Boolean(flagged[q.id]);
                return (
                  <button
                    type="button"
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 rounded-lg text-[11px] font-mono font-bold transition border ${
                      isCurrent
                        ? "border-indigo-600 bg-indigo-600 text-white ring-2 ring-indigo-500/30"
                        : isFlag
                        ? "badge-warning"
                        : isAns
                        ? "badge-success"
                        : "hr-subtle hr-muted hover:border-indigo-400"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div
              className="flex flex-wrap gap-3 text-[10px] hr-muted pt-2 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded badge-success" />
                {isId ? "Terjawab" : "Answered"}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded badge-warning" />
                {isId ? "Ditandai" : "Flagged"}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded hr-subtle" />
                {isId ? "Belum" : "Unvisited"}
              </span>
            </div>
          </div>

          <div className="hr-card rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {isId ? "Proctoring Aktif" : "Proctoring Active"}
              </span>
              <span className="font-mono">
                {proctoringEvents.length} {isId ? "bendera" : "flags"}
              </span>
            </div>
            <p className="text-[11px] hr-muted leading-relaxed">
              {isId
                ? "Sesi ini dilindungi anti-cheat real-time. Jawaban tersimpan otomatis di browser Anda."
                : "Protected by real-time integrity monitoring. Answers auto-save locally."}
            </p>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {confirmSubmitOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
          onClick={() => setConfirmSubmitOpen(false)}
        >
          <div
            className="w-full max-w-md hr-card rounded-2xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-extrabold">
              {isId ? "Konfirmasi Pengumpulan Tes" : "Confirm Assessment Submission"}
            </h3>
            <p className="text-xs hr-muted leading-relaxed">
              {isId
                ? `Anda telah menjawab ${answeredCount} dari ${questions.length} soal dengan sisa waktu ${formatTimer(
                    secondsLeft
                  )}. Setelah dikirim, sistem akan langsung menghitung skor IQ, Big Five, DISC, dan Laporan Eksekutif.`
                : `You answered ${answeredCount} of ${questions.length} questions with ${formatTimer(
                    secondsLeft
                  )} remaining. Submitting will immediately compute your Cognitive IQ, Big Five, DISC, and Executive Report.`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hr-btn-secondary"
              >
                {isId ? "Kembali ke Soal" : "Continue Testing"}
              </button>
              <button
                type="button"
                onClick={() => void finalizeAssessment()}
                className="btn-emerald px-5 py-2 rounded-xl text-xs font-black"
              >
                {isId ? "Kirim & Lihat Hasil →" : "Submit & View Report →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
