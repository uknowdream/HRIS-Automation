"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  BrainCircuit,
  Wallet,
  Send,
  ArrowUpRight,
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
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { getDict } from "@/lib/i18n";
import { AreaTrendChart } from "@/components/visuals/Charts";
import { formatCurrency, FX_TO_USD } from "@/lib/payroll-engine";

export default function ExecutiveDashboardPage() {
  const {
    locale,
    activeRole,
    selectedEntity,
    authUser,
    employees,
    attendance,
    leaves,
    expenses,
    documents,
    announcements,
    reports,
    workflows,
    openInviteModal,
    decideLeaveRequest,
    decideExpenseClaim,
  } = useHRIS();

  const dict = getDict(locale);
  const isId = locale === "id";
  const [inboxTab, setInboxTab] = useState<"all" | "leave" | "expense" | "contract">("all");

  // Filter employees by active Multi-Entity Workspace Switcher
  const scopedEmployees = useMemo(() => {
    if (selectedEntity === "ALL") return employees;
    if (selectedEntity === "Europe") {
      return employees.filter((e) => e.country === "Germany" || e.country === "United Kingdom");
    }
    return employees.filter((e) => e.country === selectedEntity);
  }, [employees, selectedEntity]);

  const scopedPayrollUsd = useMemo(() => {
    const netApprox = scopedEmployees.reduce(
      (sum, emp) => sum + (emp.baseSalary + emp.allowances) * 0.82 * FX_TO_USD[emp.currency],
      0
    );
    return Math.round(netApprox);
  }, [scopedEmployees]);

  const avgIq =
    reports.length > 0
      ? Math.round(reports.reduce((acc, r) => acc + r.estimatedIq, 0) / reports.length)
      : 128;
  const activeFlows = workflows.filter((w) => w.enabled).length;
  const avgAttendance = (
    scopedEmployees.reduce((acc, e) => acc + e.attendanceRate, 0) / Math.max(1, scopedEmployees.length)
  ).toFixed(1);

  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const pendingExpenses = expenses.filter((e) => e.status === "Pending");
  const actionDocs = documents.filter(
    (d) => d.status === "Awaiting Signature" || d.status === "Expiring Soon"
  );
  const totalPending = pendingLeaves.length + pendingExpenses.length + actionDocs.length;

  const deptCounts = Object.entries(
    scopedEmployees.reduce<Record<string, number>>((acc, e) => {
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const metrics = [
    {
      label: dict.dashboard.totalHeadcount,
      value: `${scopedEmployees.length}`,
      delta: "+14.2%",
      deltaTone: "badge-success",
      footnote:
        selectedEntity === "ALL"
          ? `${new Set(employees.map((e) => e.country)).size} ${isId ? "Entitas Negara" : "Global Entities"}`
          : selectedEntity,
      icon: Users,
      iconTone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
      href: "/employees",
    },
    {
      label: dict.dashboard.monthlyPayroll,
      value: `$${(scopedPayrollUsd / 1000).toFixed(1)}K`,
      delta: "Nov 25",
      deltaTone: "badge-info",
      footnote: isId ? "PPh 21 TER + BPJS + Reimburse" : "Auto-Tax & Reimburse Synced",
      icon: Wallet,
      iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
      href: "/payroll",
    },
    {
      label: dict.dashboard.attendanceRate,
      value: `${avgAttendance}%`,
      delta: `${attendance.length}/${employees.length} In`,
      deltaTone: "badge-success",
      footnote: isId ? "GPS Geofence & Shift Aktif" : "GPS Geofence & Active Roster",
      icon: Clock,
      iconTone: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
      href: "/attendance",
    },
    {
      label: dict.dashboard.avgCognitiveIq,
      value: `${avgIq}`,
      delta: "104 Soal",
      deltaTone: "badge-warning",
      footnote: `${reports.length} ${isId ? "Laporan Psikotes" : "Verified Reports"}`,
      icon: BrainCircuit,
      iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      href: "/assessments",
    },
  ];

  const celebrations = [
    { name: "Nadia Kusuma", event: isId ? "Work Anniversary ke-4" : "4th Work Anniversary", date: "28 Nov", initials: "NK" },
    { name: "Raka Pradipta", event: isId ? "Ulang Tahun" : "Birthday", date: "02 Dec", initials: "RP" },
    { name: "Bima Sakti Nugroho", event: isId ? "Selesai Onboarding 30 Hari" : "30-Day Onboarding Done", date: "02 Dec", initials: "BN" },
  ];

  return (
    <div className="space-y-6">
      {/* Clean Quiet-Chrome Executive Page Header (Deel / Rippling / Linear Standard) */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{isId ? "Selasa, 24 November 2026" : "Tuesday, November 24, 2026"}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> {activeRole}
            </span>
            {selectedEntity !== "ALL" && (
              <>
                <span>·</span>
                <span className="badge-info px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Entity: {selectedEntity}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isId ? `Selamat Datang, ${authUser.name.split(" ")[0]}` : `Good morning, ${authUser.name.split(" ")[0]}`}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/payroll"
            className="hr-btn-secondary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            {dict.dashboard.runPayroll}
          </Link>
          <Link
            href="/assessments"
            className="hr-btn-secondary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
            {dict.dashboard.launchPsychometric}
          </Link>
          {activeRole !== "Employee" && (
            <button
              onClick={() => openInviteModal()}
              className="btn-quantum px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {dict.dashboard.inviteCandidate}
            </button>
          )}
        </div>
      </section>

      {/* Row 1: Crisp 4-Column Quiet-Chrome Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              href={m.href}
              className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {m.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.iconTone}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-extrabold tracking-tight tabular-nums">
                  {m.value}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${m.deltaTone}`}>
                  {m.delta}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {m.footnote}
              </div>
            </Link>
          );
        })}
      </section>

      {/* Row 2: Action-First HRIS Workspace (8 cols) + Operations Rail (4 cols) */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left 8 Cols: Tabbed Priority Action Center + Analytics */}
        <div className="xl:col-span-8 space-y-5">
          {/* Tabbed HR Action Center */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isId ? "Antrean Persetujuan & Tindakan HR" : "Priority Approvals & Action Queue"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isId
                    ? "Selesaikan persetujuan cuti, klaim reimburse, dan kontrak E-Sign langsung dari sini."
                    : "Resolve pending leaves, payroll-synced expenses, and e-sign contracts inline."}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-[11px]">
                {(
                  [
                    { id: "all", label: `${isId ? "Semua" : "All"} (${totalPending})` },
                    { id: "leave", label: `${isId ? "Cuti" : "Leave"} (${pendingLeaves.length})` },
                    { id: "expense", label: `Reimburse (${pendingExpenses.length})` },
                    { id: "contract", label: `E-Sign (${actionDocs.length})` },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setInboxTab(t.id)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition whitespace-nowrap ${
                      inboxTab === t.id
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {(inboxTab === "all" || inboxTab === "leave") &&
                pendingLeaves.map((lv) => (
                  <div
                    key={lv.id}
                    className="px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">
                          {lv.employeeName} · <span className="text-indigo-600 dark:text-indigo-400">{lv.type}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {lv.days}d ({lv.startDate} → {lv.endDate}) · {lv.reason}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => decideLeaveRequest(lv.id, "Approved")}
                        className="btn-emerald px-3 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => decideLeaveRequest(lv.id, "Rejected")}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold badge-danger"
                        aria-label="Reject leave"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {(inboxTab === "all" || inboxTab === "expense") &&
                pendingExpenses.map((ex) => (
                  <div
                    key={ex.id}
                    className="px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">
                          {ex.employeeName} · {ex.category}{" "}
                          <span className="font-mono text-emerald-700 dark:text-emerald-400">
                            ({formatCurrency(ex.amount, ex.currency)})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {ex.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => decideExpenseClaim(ex.id, "Approved")}
                        className="btn-quantum px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                      >
                        Approve & Sync
                      </button>
                      <button
                        onClick={() => decideExpenseClaim(ex.id, "Rejected")}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold badge-danger"
                        aria-label="Reject expense"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {(inboxTab === "all" || inboxTab === "contract") &&
                actionDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <FileSignature className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">
                          {doc.employeeName} ·{" "}
                          <span className="text-amber-700 dark:text-amber-400">{doc.status}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{doc.title}</div>
                      </div>
                    </div>
                    <Link
                      href="/documents"
                      className="hr-btn-secondary px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0"
                    >
                      Open E-Sign →
                    </Link>
                  </div>
                ))}

              {totalPending === 0 && (
                <div className="py-10 text-center text-xs text-slate-500">
                  🎉 {isId ? "Semua antrean persetujuan HR hari ini telah terselesaikan." : "All pending HR approvals are complete."}
                </div>
              )}
            </div>
          </div>

          {/* Analytics & Velocity */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-extrabold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isId ? "Kecepatan Otomatisasi HR & Penyelesaian Psikotes" : "HR Automation & Psychometric Velocity"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeFlows}/{workflows.length} active flows · Email, WhatsApp & HMAC-SHA256 Webhooks
                </p>
              </div>
              <Link
                href="/automation"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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

        {/* Right 4 Cols: Payroll Countdown, Dept Breakdown, Milestones & Announcements */}
        <div className="xl:col-span-4 space-y-5">
          {/* Payroll Readiness Card */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {isId ? "Kesiapan Payroll Nov 2026" : "Nov 2026 Payroll Cycle"}
              </h2>
              <span className="badge-success px-2 py-0.5 rounded-full text-[10px] font-bold">On Track</span>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: isId ? "Sinkronisasi Absensi & Shift GPS" : "GPS Attendance & Shift Sync", done: true },
                { label: isId ? "Penggabungan Reimburse Disetujui" : "Approved Reimbursements Merged", done: true },
                { label: isId ? "Pencairan Bank API (25 Nov)" : "Bank API Disbursement (Nov 25)", done: false },
              ].map((step) => (
                <div key={step.label} className="flex items-center justify-between py-1">
                  <span className={step.done ? "text-slate-700 dark:text-slate-300" : "text-slate-500"}>
                    {step.label}
                  </span>
                  <span className={`text-[10px] font-bold ${step.done ? "text-emerald-600" : "text-amber-600"}`}>
                    {step.done ? "✓ Ready" : "Scheduled"}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/payroll"
              className="block w-full text-center py-2 rounded-lg hr-btn-secondary text-xs font-semibold"
            >
              {isId ? "Review & Jalankan Payroll →" : "Review Payroll Run →"}
            </Link>
          </div>

          {/* Department Headcount */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {isId ? "Headcount per Divisi" : "Headcount by Dept"}
              </h2>
              <Link href="/employees" className="text-xs font-semibold text-indigo-600 hover:underline">
                Directory →
              </Link>
            </div>
            <div className="space-y-2.5">
              {deptCounts.map(([dept, count]) => (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{dept}</span>
                    <span className="font-mono font-bold tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${Math.round((count / Math.max(1, scopedEmployees.length)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Celebrations & Milestones */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Cake className="w-4 h-4 text-rose-500" />
              {isId ? "Perayaan & Milestone Tim" : "Team Celebrations"}
            </h2>
            <div className="space-y-2">
              {celebrations.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2 text-xs py-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{c.event}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{c.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Psychometric + Announcements */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                {isId ? "Top Skor Psikotes" : "Top Psychometric Talent"}
              </h2>
              <Link href="/assessments" className="text-xs font-semibold text-indigo-600 hover:underline">
                All →
              </Link>
            </div>
            {reports.slice(0, 2).map((rep) => (
              <div key={rep.id} className="flex items-center justify-between gap-2 text-xs py-1">
                <div className="min-w-0">
                  <div className="font-bold truncate">{rep.candidateName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{rep.targetRole}</div>
                </div>
                <span className="badge-success px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0">
                  IQ {rep.estimatedIq}
                </span>
              </div>
            ))}
            {announcements[0] && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="text-[11px] font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <Megaphone className="w-3.5 h-3.5" /> {announcements[0].title}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{announcements[0].body}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
