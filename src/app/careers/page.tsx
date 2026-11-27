"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Sparkles,
  Globe,
  Sun,
  Moon,
  CheckCircle2,
  ArrowRight,
  BrainCircuit,
  X,
  Building2,
  ShieldCheck,
  Search,
  LogIn,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { ALL_CURRENCIES, formatConverted } from "@/lib/currency";
import { tStatus } from "@/lib/i18n";
import type { Currency, JobOpening } from "@/types/hris";

function computeAiRoleFit(skillsText: string, requiredSkills: string[]): {
  score: number;
  matched: string[];
  missing: string[];
} {
  const normalized = skillsText.toLowerCase();
  if (!normalized.trim()) {
    return { score: 0, matched: [], missing: requiredSkills };
  }
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of requiredSkills) {
    const tokens = skill.toLowerCase().split(/[\s/]+/).filter((t) => t.length >= 2);
    const hit = tokens.some((tk) => normalized.includes(tk));
    if (hit) matched.push(skill);
    else missing.push(skill);
  }
  const matchRatio = matched.length / Math.max(1, requiredSkills.length);
  if (matched.length === 0) {
    return { score: 28, matched, missing };
  }
  const base = Math.round(Math.pow(matchRatio, 0.72) * 88);
  const depthBonus = Math.min(12, 6 + Math.floor(normalized.length / 45) * 2);
  return {
    score: Math.min(99, Math.max(45, base + depthBonus)),
    matched,
    missing,
  };
}

export default function PublicCareersPage() {
  const router = useRouter();
  const {
    locale,
    setLocale,
    displayCurrency,
    setDisplayCurrency,
    theme,
    toggleTheme,
    jobOpenings,
    settings,
    applyFromCareerPortal,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Jakarta, ID");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [skillsSummary, setSkillsSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedState, setSubmittedState] = useState<{
    candidateName: string;
    jobTitle: string;
    fitScore: number;
    assessmentPath: string | null;
  } | null>(null);

  const departments = useMemo(
    () => Array.from(new Set(jobOpenings.map((j) => j.department))),
    [jobOpenings]
  );

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobOpenings.filter((j) => {
      const matchDept = deptFilter === "ALL" || j.department === deptFilter;
      const matchQ =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.requiredSkills.some((s) => s.toLowerCase().includes(q));
      return matchDept && matchQ;
    });
  }, [deptFilter, jobOpenings, query]);

  const liveFit = useMemo(() => {
    if (!selectedJob) return { score: 0, matched: [], missing: [] };
    return computeAiRoleFit(skillsSummary, selectedJob.requiredSkills);
  }, [selectedJob, skillsSummary]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !name.trim() || !email.trim()) return;
    setSubmitting(true);

    const finalScore = liveFit.score || 76;
    applyFromCareerPortal({
      jobId: selectedJob.id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim() || selectedJob.location,
      expectedSalary: expectedSalary.trim() || "Competitive",
      aiFitScore: finalScore,
      notes: `AI CV Fit: ${finalScore}% | Matched: ${liveFit.matched.join(", ") || "General Profile"} | Summary: ${skillsSummary.slice(0, 220)}`,
    });

    let assessmentPath: string | null = null;
    try {
      const res = await fetch("/api/assessments/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: name.trim(),
          candidateEmail: email.trim(),
          candidatePhone: phone.replace(/[^\d]/g, ""),
          role: selectedJob.title,
          department: selectedJob.department,
          companyName: settings.companyName,
          presetId: selectedJob.presetId,
          proctoringStrict: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.path) {
        assessmentPath = data.path;
      }
    } catch {
      // optional instant test link
    }

    setSubmittedState({
      candidateName: name.trim(),
      jobTitle: selectedJob.title,
      fitScore: finalScore,
      assessmentPath,
    });
    setSubmitting(false);
    pushToast({
      title: isId ? "Lamaran Terkirim ke ATS!" : "Application Received in ATS!",
      description: `${selectedJob.title} · AI Fit ${finalScore}%`,
      variant: "success",
    });
  };

  const resetModal = () => {
    setSelectedJob(null);
    setSubmittedState(null);
    setName("");
    setEmail("");
    setPhone("");
    setExpectedSalary("");
    setSkillsSummary("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Standalone Public Career Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
            A
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold truncate">{settings.companyName}</div>
            <div className="text-[11px] hr-muted truncate">
              {isId ? "Portal Karir Internasional · AI Talent Funnel" : "International Careers · AI Talent Funnel"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label="Career Currency"
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
            className="px-2 py-1.5 rounded-lg text-xs font-mono font-bold hr-input"
          >
            {ALL_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setLocale(locale === "id" ? "en" : "id")}
            className="px-2.5 py-1.5 rounded-lg hr-btn-secondary text-xs font-bold flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" /> {locale.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hr-btn-secondary"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/login"
            className="btn-quantum px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isId ? "Portal HRIS" : "HRIS Sign In"}</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Hero */}
        <section className="hr-card rounded-3xl p-6 sm:p-10 space-y-5 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 badge-info px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            {isId
              ? "Rekrutmen Otomatis AI + Tes Kognitif & Psikotes Instan"
              : "AI-Powered Hiring + Instant Proctored Cognitive Assessment"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight max-w-3xl">
            {isId
              ? "Bangun Masa Depan Teknologi SDM Global Bersama Kami"
              : "Build the Future of Global Enterprise People Tech"}
          </h1>
          <p className="text-sm hr-muted max-w-2xl leading-relaxed">
            {isId
              ? "Lamar posisi terbuka lintas negara, dapatkan skor AI Role-Fit secara langsung dari keahlian Anda, dan selesaikan psikotes kognitif terenkripsi dalam satu alur mulus."
              : "Apply for global roles across APAC, EU & US, view your instant AI Role-Fit score, and launch your encrypted cognitive & psychometric assessment in one seamless flow."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 hr-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isId ? "Cari jabatan, lokasi, atau skill (TypeScript, PPh 21, AI)..." : "Search role, location, or skill..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl hr-input text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["ALL", ...departments].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeptFilter(d)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                    deptFilter === d ? "btn-quantum" : "hr-btn-secondary"
                  }`}
                >
                  {d === "ALL" ? (isId ? "Semua Divisi" : "All Teams") : d}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Job Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="hr-card hr-card-hover rounded-2xl p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {job.department}
                    </div>
                    <h2 className="text-lg font-extrabold mt-0.5">{job.title}</h2>
                  </div>
                  <span className="badge-success px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                    {job.openSlots} {isId ? "Posisi" : "Open"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs hr-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" /> {tStatus(job.employmentType, locale)}
                  </span>
                </div>

                <p className="text-xs hr-muted leading-relaxed">{job.summary[locale]}</p>

                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((s) => (
                    <span key={s} className="hr-subtle px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="pt-4 border-t flex flex-wrap items-center justify-between gap-3"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div>
                  <div className="text-[10px] hr-muted font-medium">
                    {isId ? `Kisaran Gaji Bulanan (${displayCurrency})` : `Monthly Range (${displayCurrency})`}
                  </div>
                  <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatConverted(job.salaryMinUSD, "USD", displayCurrency)} –{" "}
                    {formatConverted(job.salaryMaxUSD, "USD", displayCurrency)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJob(job);
                    setSubmittedState(null);
                  }}
                  className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isId ? "Lamar & Cek AI Fit" : "Apply & AI Match"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Application & AI CV Fit Matcher Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
          onClick={resetModal}
        >
          <div
            className="w-full max-w-2xl hr-card rounded-2xl p-6 space-y-5 my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> {selectedJob.department} · {selectedJob.location}
                </div>
                <h2 className="text-lg font-extrabold mt-0.5">{selectedJob.title}</h2>
              </div>
              <button type="button" onClick={resetModal} className="p-1.5 rounded-lg hr-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!submittedState ? (
              <form onSubmit={handleApply} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold hr-muted mb-1">{isId ? "Nama Lengkap *" : "Full Name *"}</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Arya Pratama"
                      className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold hr-muted mb-1">Email *</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="arya@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold hr-muted mb-1">WhatsApp</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="6281234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                    />
                  </div>
                  <div>
                    <label className="block font-bold hr-muted mb-1">{isId ? "Domisili Saat Ini" : "Current Location"}</label>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Jakarta, ID"
                      className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold hr-muted mb-1">
                    {isId ? "Ekspektasi Gaji Bulanan" : "Expected Monthly Compensation"}
                  </label>
                  <input
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    placeholder={formatConverted(selectedJob.salaryMinUSD, "USD", displayCurrency)}
                    className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold hr-muted">
                      {isId ? "Ringkasan CV / Keahlian Utama (AI Fit Matcher)" : "CV Summary & Key Skills (Live AI Fit Matcher)"}
                    </label>
                    {liveFit.score > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          liveFit.score >= 75 ? "badge-success" : "badge-info"
                        }`}
                      >
                        AI Role-Fit: {liveFit.score}%
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={skillsSummary}
                    onChange={(e) => setSkillsSummary(e.target.value)}
                    placeholder={
                      isId
                        ? `Tuliskan pengalaman & keahlian Anda (misal: ${selectedJob.requiredSkills.join(", ")})...`
                        : `Paste your CV summary & skills (e.g. ${selectedJob.requiredSkills.join(", ")})...`
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedJob.requiredSkills.map((sk) => {
                      const matched = liveFit.matched.includes(sk);
                      return (
                        <span
                          key={sk}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            matched ? "badge-success" : "hr-subtle hr-muted"
                          }`}
                        >
                          {matched ? "✓ " : "+ "}
                          {sk}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={resetModal} className="hr-btn-secondary px-4 py-2.5 rounded-xl font-semibold">
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-quantum px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4" />
                    {submitting
                      ? isId
                        ? "Mengirim ke ATS..."
                        : "Submitting to ATS..."
                      : isId
                      ? "Kirim Lamaran & Buat Link Psikotes"
                      : "Submit Application & Mint Test Link"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl badge-success flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-extrabold">
                      {isId
                        ? `Lamaran ${submittedState.candidateName} Berhasil Masuk ke ATS!`
                        : `Application for ${submittedState.candidateName} Received!`}
                    </h3>
                    <p className="text-xs mt-1">
                      {isId
                        ? `Posisi: ${submittedState.jobTitle} · Skor AI Role-Fit: ${submittedState.fitScore}%. Tim rekrutmen telah menerima notifikasi otomatis.`
                        : `Role: ${submittedState.jobTitle} · AI Role-Fit Score: ${submittedState.fitScore}%. Our hiring team has been notified automatically.`}
                    </p>
                  </div>
                </div>

                {submittedState.assessmentPath && (
                  <div className="p-4 rounded-2xl hr-subtle space-y-3 text-xs">
                    <div className="font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <BrainCircuit className="w-4 h-4" />
                      {isId
                        ? "Undangan Psikotes Kognitif Instan Telah Terbit (HMAC-SHA256)"
                        : "Instant Cognitive & Psychometric Assessment Issued (HMAC-SHA256)"}
                    </div>
                    <p className="hr-muted">
                      {isId
                        ? "Anda dapat langsung menyelesaikan Tes Kognitif & Psikotes sekarang untuk mempercepat proses seleksi ke tahap wawancara."
                        : "You can launch your proctored Cognitive & Psychometric Assessment right now to fast-track your interview review."}
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push(submittedState.assessmentPath!)}
                      className="btn-emerald w-full py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {isId ? "Mulai Tes Kognitif & Psikotes Sekarang →" : "Launch Timed Assessment Now →"}
                    </button>
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="button" onClick={resetModal} className="hr-btn-secondary px-4 py-2 rounded-xl text-xs font-bold">
                    {isId ? "Tutup" : "Close"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
