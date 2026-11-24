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
  Sparkles,
  Award,
  Building2,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { getDict } from "@/lib/i18n";
import { AreaTrendChart, MiniSparkline } from "@/components/visuals/Charts";
import { formatCurrency } from "@/lib/payroll-engine";

export default function ExecutiveDashboardPage() {
  const {
    locale,
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
  const onLeaveToday = employees.filter((e) => e.status === "On Leave");

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
      sub: `${new Set(employees.map((e) => e.country)).size} ${isId ? "Entitas Negara" : "Global Entities"}`,
      icon: Users,
      accentBg: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400",
      stroke: "#4f46e5",
      spark: [4, 5, 5, 6, 7, 7, employees.length],
    },
    {
      label: dict.dashboard.monthlyPayroll,
      value: `$${((latestPayroll?.totalNetUSD || 48000) / 1000).toFixed(1)}K`,
      badge: "5 Currencies",
      sub: isId ? "PPh 21 TER + BPJS + Reimburse" : "PPh 21 TER + BPJS + Claims",
      icon: Wallet,
      accentBg: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
      stroke: "#059669",
      spark: [38, 41, 43, 45, 46, 48, Math.round((latestPayroll?.totalNetUSD || 48000) / 1000)],
    },
    {
      label: dict.dashboard.attendanceRate,
      value: `${avgAttendance}%`,
      badge: `${attendance.length}/${employees.length} In`,
      sub: isId ? "GPS Geofence & Shift Roster" : "GPS Geofence & Shift Roster",
      icon: Clock,
      accentBg: "bg-sky-500/12 text-sky-600 dark:text-cyan-400",
      stroke: "#0891b2",
      spark: [95, 96, 97, 97, 98, 98, Number(avgAttendance)],
    },
    {
      label: dict.dashboard.avgCognitiveIq,
      value: `${avgIq}`,
      badge: `104Q Suite`,
      sub: `${reports.length} ${isId ? "Laporan Psikotes Terverifikasi" : "Verified Psychometric Reports"}`,
      icon: BrainCircuit,
      accentBg: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
      stroke: "#d97706",
      spark: [118, 121, 124, 126, 128, 130, avgIq],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Welcome Header (Clean Deel / Rippling / Talenta Style) */}
      <section className="hr-card rounded-3xl p-6 sm:p-7 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isId
                ? "AetherHR Enterprise OS · Selasa, 24 November 2026 · 5 Negara Aktif"
                : "AetherHR Enterprise OS · Tuesday, Nov 24, 2026 · 5 Active Countries"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isId ? "Selamat Datang, Nadia Kusuma" : "Welcome back, Nadia Kusuma"}
          </h1>
          <p className="text-xs sm:text-sm hr-muted max-w-2xl">
            {dict.dashboard.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => openInviteModal()}
            className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {dict.dashboard.inviteCandidate}
          </button>
          <Link
            href="/assessments"
            className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <BrainCircuit className="w-4 h-4" />
            {dict.dashboard.launchPsychometric}
          </Link>
          <Link
            href="/payroll"
            className="hr-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            {dict.dashboard.runPayroll}
          </Link>
          <Link
            href="/mobile"
            className="hr-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            {dict.dashboard.openMobile}
          </Link>
        </div>
      </section>

      {/* 4 Executive KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="hr-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold hr-muted">{kpi.label}</span>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                    {kpi.value}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.accentBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                    {kpi.badge}
                  </span>
                  <div className="text-[11px] hr-muted mt-1">{kpi.sub}</div>
                </div>
                <MiniSparkline values={kpi.spark} color={kpi.stroke} />
              </div>
            </div>
          );
        })}
      </section>

      {/* HRIS Signature Row: Instant Action Inbox + Who's Out & Announcements */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Pending Approvals & Action Inbox */}
        <div className="xl:col-span-7 hr-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                {isId ? "Pusat Persetujuan HR (Action Inbox)" : "HR Action & Approvals Inbox"}
              </h2>
              <p className="text-xs hr-muted">
                {isId
                  ? "Setujui cuti, reimburse, dan kontrak E-Sign langsung dari dashboard."
                  : "Approve leaves, expense claims, and e-sign contracts directly from home."}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
              {pendingLeaves.length + pendingExpenses.length + actionDocs.length} Pending
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingLeaves.map((lv) => (
              <div
                key={lv.id}
                className="p-3.5 rounded-xl hr-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      {lv.employeeName} · <span className="text-indigo-600 dark:text-cyan-400">{lv.type}</span>
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
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500/12 text-rose-600 dark:text-rose-300 flex items-center gap-1"
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
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      {ex.employeeName} · {ex.category} ({formatCurrency(ex.amount, ex.currency)})
                    </div>
                    <div className="text-[11px] hr-muted line-clamp-1">{ex.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => decideExpenseClaim(ex.id, "Approved")}
                    className="btn-quantum px-3 py-1.5 rounded-lg text-[11px] font-bold"
                  >
                    Approve & Sync
                  </button>
                  <button
                    onClick={() => decideExpenseClaim(ex.id, "Rejected")}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500/12 text-rose-600 dark:text-rose-300"
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
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <FileSignature className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      {doc.status}: {doc.employeeName}
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

            {pendingLeaves.length === 0 && pendingExpenses.length === 0 && actionDocs.length === 0 && (
              <div className="p-6 text-center rounded-xl hr-subtle text-xs hr-muted">
                🎉 {isId ? "Semua persetujuan HR hari ini telah selesai!" : "Inbox Zero — all HR approvals completed!"}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Who's Out + Pinned Company Announcements */}
        <div className="xl:col-span-5 space-y-5">
          <div className="hr-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                {isId ? "Pengumuman Perusahaan" : "Company Announcements"}
              </h2>
              <Link href="/documents" className="text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:underline">
                Broadcast →
              </Link>
            </div>
            {announcements.slice(0, 2).map((ann) => (
              <div key={ann.id} className="p-3.5 rounded-xl hr-subtle space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                    {ann.category}
                  </span>
                  <span className="hr-muted">{ann.channels.slice(0, 3).join(" · ")}</span>
                </div>
                <div className="text-xs font-bold">{ann.title}</div>
                <p className="text-[11px] hr-muted line-clamp-2">{ann.body}</p>
              </div>
            ))}
          </div>

          <div className="hr-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {isId ? "Distribusi Divisi & Cuti Hari Ini" : "Headcount by Dept & Who's Out"}
              </h2>
              <span className="text-[11px] hr-muted">{onLeaveToday.length} On Leave</span>
            </div>
            <div className="space-y-2">
              {deptCounts.map(([dept, count]) => (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{dept}</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-cyan-400">
                      {count} staff
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-teal-500"
                      style={{ width: `${Math.round((count / Math.max(1, employees.length)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Analytics + Top Psychometrics + Automation Feed */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 hr-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                {isId ? "Tren Otomatisasi HR & Penyelesaian Psikotes" : "HR Automation & Psychometric Velocity"}
              </h2>
              <p className="text-xs hr-muted">
                {activeFlows}/{workflows.length} active flows · Email, WhatsApp & HMAC-SHA256 Webhooks
              </p>
            </div>
            <Link
              href="/automation"
              className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
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

        <div className="hr-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              {isId ? "Top Skor Psikotes" : "Top Psychometric Talent"}
            </h2>
            <Link href="/assessments" className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline">
              All →
            </Link>
          </div>
          <div className="space-y-2.5">
            {reports.slice(0, 3).map((rep) => (
              <div key={rep.id} className="p-3 rounded-xl hr-subtle flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{rep.candidateName}</div>
                  <div className="text-[11px] hr-muted truncate">{rep.targetRole}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-indigo-600 dark:text-cyan-400">
                    IQ {rep.estimatedIq}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {rep.globalPercentile}th pct
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              {isId ? "Aktivitas Otomatisasi Terakhir" : "Recent Automation Stream"}
            </div>
            {logs.slice(0, 2).map((l) => (
              <div key={l.id} className="text-[11px] hr-muted flex items-center justify-between gap-2">
                <span className="truncate font-mono">{l.event} · {l.recipient}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  {l.latencyMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
