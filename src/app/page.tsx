"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  BrainCircuit,
  Wallet,
  Send,
  Smartphone,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  FileSignature,
  Receipt,
  Megaphone,
  Calendar,
  Activity,
  Award,
  Building2,
  Cake,
  CalendarClock,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { getDict } from "@/lib/i18n";
import { AreaTrendChart, MiniSparkline } from "@/components/visuals/Charts";
import { formatCurrency } from "@/lib/payroll-engine";

export default function ExecutiveDashboardPage() {
  const {
    locale,
    activeRole,
    employees,
    attendance,
    leaves,
    expenses,
    documents,
    announcements,
    payrollRuns,
    reports,
    workflows,
    logs,
    openInviteModal,
    decideLeaveRequest,
    decideExpenseClaim,
  } = useHRIS();

  const dict = getDict(locale);
  const isId = locale === "id";

  const latestPayroll = payrollRuns[0];
  const avgIq =
    reports.length > 0
      ? Math.round(reports.reduce((acc, r) => acc + r.estimatedIq, 0) / reports.length)
      : 128;
  const activeFlows = workflows.filter((w) => w.enabled).length;
  const avgAttendance = (
    employees.reduce((acc, e) => acc + e.attendanceRate, 0) / Math.max(1, employees.length)
  ).toFixed(1);

  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const pendingExpenses = expenses.filter((e) => e.status === "Pending");
  const actionDocs = documents.filter(
    (d) => d.status === "Awaiting Signature" || d.status === "Expiring Soon"
  );
  const totalPending = pendingLeaves.length + pendingExpenses.length + actionDocs.length;

  const deptCounts = Object.entries(
    employees.reduce<Record<string, number>>((acc, e) => {
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const kpis = [
    {
      label: dict.dashboard.totalHeadcount,
      value: `${employees.length}`,
      badge: "+14.2% YoY",
      badgeClass: "badge-success",
      sub: `${new Set(employees.map((e) => e.country)).size} ${isId ? "Entitas Global" : "Global Entities"}`,
      icon: Users,
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
      stroke: "#4f46e5",
      spark: [4, 5, 5, 6, 7, 7, employees.length],
    },
    {
      label: dict.dashboard.monthlyPayroll,
      value: `$${((latestPayroll?.totalNetUSD || 48000) / 1000).toFixed(1)}K`,
      badge: "5 FX Live",
      badgeClass: "badge-info",
      sub: isId ? "PPh 21 TER + BPJS + Reimburse" : "PPh 21 TER + BPJS + Claims",
      icon: Wallet,
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
      stroke: "#059669",
      spark: [38, 41, 43, 45, 46, 48, Math.round((latestPayroll?.totalNetUSD || 48000) / 1000)],
    },
    {
      label: dict.dashboard.attendanceRate,
      value: `${avgAttendance}%`,
      badge: `${attendance.length}/${employees.length} In`,
      badgeClass: "badge-success",
      sub: isId ? "GPS Geofence & Shift Roster" : "GPS Geofence & Shifts",
      icon: Clock,
      iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
      stroke: "#0284c7",
      spark: [95, 96, 97, 97, 98, 98, Number(avgAttendance)],
    },
    {
      label: dict.dashboard.avgCognitiveIq,
      value: `${avgIq}`,
      badge: "104Q Suite",
      badgeClass: "badge-warning",
      sub: `${reports.length} ${isId ? "Laporan Terverifikasi" : "Verified Reports"}`,
      icon: BrainCircuit,
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
      stroke: "#d97706",
      spark: [118, 121, 124, 126, 128, 130, avgIq],
    },
  ];

  const celebrations = [
    { name: "Nadia Kusuma", event: isId ? "Ulang Tahun Kerja ke-4" : "4th Work Anniversary", date: "28 Nov", initials: "NK", bg: "from-indigo-500 to-blue-600" },
    { name: "Raka Pradipta", event: isId ? "Ulang Tahun" : "Birthday", date: "02 Dec", initials: "RP", bg: "from-emerald-500 to-teal-600" },
    { name: "Bima Sakti Nugroho", event: isId ? "Selesai Masa Onboarding 30 Hari" : "30-Day Onboarding Milestone", date: "02 Dec", initials: "BN", bg: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Dark-Indigo Hero Banner (Deel / Rippling / Talenta Signature) */}
      <section className="hero-dark relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white p-6 sm:p-7 shadow-lg border border-indigo-500/20">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-24 w-64 h-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-indigo-200 on-dark">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">
                <CalendarClock className="w-3.5 h-3.5 text-teal-300 on-dark" />
                {isId ? "Payroll Cycle Berikutnya: 25 Nov 2026" : "Next Payroll Disbursement: Nov 25, 2026"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/25">
                ● {activeRole}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {isId ? "Selamat Datang, Nadia Kusuma" : "Welcome back, Nadia Kusuma"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 on-dark max-w-2xl">
              {dict.dashboard.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeRole !== "Employee" && (
              <button
                onClick={() => openInviteModal()}
                className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <Send className="w-3.5 h-3.5" />
                {dict.dashboard.inviteCandidate}
              </button>
            )}
            <Link
              href="/assessments"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              {dict.dashboard.launchPsychometric}
            </Link>
            <Link
              href="/payroll"
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              {dict.dashboard.runPayroll}
            </Link>
            <Link
              href="/mobile"
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              {dict.dashboard.openMobile}
            </Link>
          </div>
        </div>
      </section>

      {/* Balanced 4-Column Compact HRIS KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="hr-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold hr-muted truncate">{kpi.label}</div>
                  <div className="text-2xl font-black tracking-tight tabular-nums mt-1">
                    {kpi.value}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end justify-between gap-2 pt-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="min-w-0">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.badgeClass}`}>
                    {kpi.badge}
                  </span>
                  <div className="text-[11px] hr-muted mt-1 truncate">{kpi.sub}</div>
                </div>
                <MiniSparkline values={kpi.spark} color={kpi.stroke} height={28} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Main 12-Col HRIS Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left 8 Cols: Action Inbox + Velocity Analytics */}
        <div className="xl:col-span-8 space-y-5">
          {/* Action Inbox */}
          <div className="hr-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isId ? "Pusat Persetujuan HR (Action Inbox)" : "HR Action & Approvals Inbox"}
                </h2>
                <p className="text-xs hr-muted">
                  {isId
                    ? "Setujui cuti, reimburse otomatis ke payroll, dan tanda tangan kontrak E-Sign dalam 1 klik."
                    : "Approve leaves, payroll-synced reimbursements, and e-sign contracts in one click."}
                </p>
              </div>
              <span className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${totalPending > 0 ? "badge-warning" : "badge-success"}`}>
                {totalPending} Pending
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingLeaves.map((lv) => (
                <div
                  key={lv.id}
                  className="p-3.5 rounded-xl hr-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">
                        {lv.employeeName} · <span className="text-indigo-600 dark:text-indigo-300">{lv.type}</span>
                      </div>
                      <div className="text-[11px] hr-muted">
                        {lv.days}d ({lv.startDate} → {lv.endDate}) · {lv.reason}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => decideLeaveRequest(lv.id, "Approved")}
                      className="btn-emerald px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => decideLeaveRequest(lv.id, "Rejected")}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold badge-danger flex items-center gap-1"
                      aria-label="Reject leave"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {pendingExpenses.map((ex) => (
                <div
                  key={ex.id}
                  className="p-3.5 rounded-xl hr-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">
                        {ex.employeeName} · {ex.category}{" "}
                        <span className="font-mono text-emerald-700 dark:text-emerald-300">
                          ({formatCurrency(ex.amount, ex.currency)})
                        </span>
                      </div>
                      <div className="text-[11px] hr-muted line-clamp-1">{ex.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => decideExpenseClaim(ex.id, "Approved")}
                      className="btn-quantum px-3 py-1.5 rounded-lg text-[11px] font-bold"
                    >
                      Approve & Sync Payroll
                    </button>
                    <button
                      onClick={() => decideExpenseClaim(ex.id, "Rejected")}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold badge-danger"
                      aria-label="Reject expense"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {actionDocs.slice(0, 2).map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl hr-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">
                        <span className="text-amber-700 dark:text-amber-300">{doc.status}:</span>{" "}
                        {doc.employeeName}
                      </div>
                      <div className="text-[11px] hr-muted">{doc.title}</div>
                    </div>
                  </div>
                  <Link
                    href="/documents"
                    className="px-3 py-1.5 rounded-lg hr-btn-secondary text-[11px] font-bold shrink-0"
                  >
                    Open E-Sign →
                  </Link>
                </div>
              ))}

              {totalPending === 0 && (
                <div className="p-6 text-center rounded-xl hr-subtle text-xs hr-muted">
                  🎉 {isId ? "Semua persetujuan HR hari ini sudah selesai!" : "Inbox Zero — all HR approvals completed!"}
                </div>
              )}
            </div>
          </div>

          {/* Analytics Card */}
          <div className="hr-card rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-extrabold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isId ? "Tren Otomatisasi HR & Penyelesaian Psikotes" : "HR Automation & Psychometric Throughput"}
                </h2>
                <p className="text-xs hr-muted">
                  {activeFlows}/{workflows.length} active workflows · Email, WhatsApp & HMAC-SHA256 Webhooks
                </p>
              </div>
              <Link
                href="/automation"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Automation Studio <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <AreaTrendChart
              labels={["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]}
              seriesA={[140, 185, 220, 260, 295, 340, 392]}
              seriesB={[38, 52, 64, 79, 95, 118, 146]}
              labelA={isId ? "Eksekusi Otomatisasi (Email/WA/Webhook)" : "Automated Workflows"}
              labelB={isId ? "Psikotes Kognitif Selesai" : "Completed Assessments"}
            />
          </div>
        </div>

        {/* Right 4 Cols: People Culture, Announcements, Dept Headcount & Top Talent */}
        <div className="xl:col-span-4 space-y-5">
          {/* Celebrations & Milestones (Signature HRIS People Widget) */}
          <div className="hr-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Cake className="w-4 h-4 text-rose-500" />
                {isId ? "Perayaan & Milestone Tim" : "Team Celebrations & Milestones"}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-info">Upcoming</span>
            </div>
            <div className="space-y-2.5">
              {celebrations.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl hr-subtle">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.bg} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{c.name}</div>
                      <div className="text-[11px] hr-muted truncate">{c.event}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    {c.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Company Announcements */}
          <div className="hr-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {isId ? "Pengumuman Perusahaan" : "Company Announcements"}
              </h2>
              <Link href="/documents" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Broadcast →
              </Link>
            </div>
            {announcements.slice(0, 2).map((ann) => (
              <div key={ann.id} className="p-3 rounded-xl hr-subtle space-y-1">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full badge-info">
                  {ann.category}
                </span>
                <div className="text-xs font-bold pt-0.5">{ann.title}</div>
                <p className="text-[11px] hr-muted line-clamp-2">{ann.body}</p>
              </div>
            ))}
          </div>

          {/* Department Distribution */}
          <div className="hr-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {isId ? "Headcount per Divisi" : "Headcount by Department"}
              </h2>
              <Link href="/employees" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Directory →
              </Link>
            </div>
            <div className="space-y-2.5">
              {deptCounts.map(([dept, count]) => (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{dept}</span>
                    <span className="font-mono font-bold tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-teal-500"
                      style={{ width: `${Math.round((count / Math.max(1, employees.length)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Psychometric Scorers & Live Automation */}
          <div className="hr-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                {isId ? "Top Skor Psikotes" : "Top Psychometric Talent"}
              </h2>
              <Link href="/assessments" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                All →
              </Link>
            </div>
            <div className="space-y-2">
              {reports.slice(0, 3).map((rep) => (
                <div key={rep.id} className="p-2.5 rounded-xl hr-subtle flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{rep.candidateName}</div>
                    <div className="text-[11px] hr-muted truncate">{rep.targetRole}</div>
                  </div>
                  <span className="px-2 py-1 rounded-lg badge-success text-[11px] font-mono font-bold shrink-0">
                    IQ {rep.estimatedIq}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t space-y-1.5" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="text-[11px] font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {isId ? "Otomatisasi Terakhir" : "Latest Automation"}
              </div>
              {logs.slice(0, 2).map((l) => (
                <div key={l.id} className="text-[11px] hr-muted flex items-center justify-between gap-2">
                  <span className="truncate font-mono">{l.event}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold shrink-0">{l.latencyMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
