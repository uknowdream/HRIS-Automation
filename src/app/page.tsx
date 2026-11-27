"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Coffee,
  LogOut,
  Fingerprint,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { getDict, tRole, tStatus } from "@/lib/i18n";
import { AreaTrendChart } from "@/components/visuals/Charts";
import { calculateEmployeePayslip, formatCurrency, FX_TO_USD } from "@/lib/payroll-engine";
import { convertCurrency, formatCompactConverted, formatConverted } from "@/lib/currency";

export default function ExecutiveDashboardPage() {
  const {
    locale,
    displayCurrency,
    activeRole,
    selectedEntity,
    authUser,
    currentEmployee,
    hasPermission,
    auditLogs,
    settings,
    employees,
    attendance,
    leaves,
    overtimeRequests,
    profileChangeRequests,
    payrollRuns,
    expenses,
    documents,
    announcements,
    reports,
    workflows,
    openInviteModal,
    clockInEmployee,
    toggleBreakAttendance,
    clockOutEmployee,
    decideLeaveRequest,
    decideOvertimeRequest,
    decideProfileChangeRequest,
    decideExpenseClaim,
  } = useHRIS();

  const dict = getDict(locale);
  const isId = locale === "id";
  const [inboxTab, setInboxTab] = useState<"all" | "leave" | "expense" | "contract">("all");
  const [todayStr, setTodayStr] = useState("2026-11-27");
  useEffect(() => {
    setTodayStr(new Date().toISOString().slice(0, 10));
  }, []);

  const myTodayShift = attendance.find(
    (a) => a.employeeId === currentEmployee.id && a.date === todayStr
  );
  const activePayroll = payrollRuns[0];
  const approvedExpensesQueue = expenses.filter((e) => e.syncedToPayroll).length;
  const approvedOvertimeQueue = overtimeRequests.filter((o) => o.syncedToPayroll).length;

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

  const isEss = activeRole === "Employee";
  const myPayslip = useMemo(
    () => calculateEmployeePayslip(currentEmployee, 0, 0),
    [currentEmployee]
  );

  const canFinalApproveLeave = hasPermission("employees:manage");
  const canFinalApproveExpense = hasPermission("payroll:run") || activeRole === "Super Admin";

  const pendingLeaves = isEss
    ? leaves.filter((l) => l.employeeId === currentEmployee.id)
    : leaves.filter(
        (l) =>
          l.status === "Pending" ||
          (l.status === "Manager Approved" && canFinalApproveLeave)
      );
  const pendingOvertime = isEss
    ? []
    : hasPermission("attendance:approve")
    ? overtimeRequests.filter((o) => o.status === "Pending")
    : [];
  const pendingProfileUpdates =
    !isEss && hasPermission("employees:manage")
      ? profileChangeRequests.filter((r) => r.status === "Pending")
      : [];
  const pendingExpenses = isEss
    ? expenses.filter((e) => e.employeeId === currentEmployee.id)
    : expenses.filter(
        (e) =>
          e.status === "Pending" ||
          (e.status === "Manager Approved" && canFinalApproveExpense)
      );
  const actionDocs = isEss
    ? documents.filter((d) => d.employeeId === currentEmployee.id && d.status !== "Signed")
    : documents.filter(
        (d) => d.status === "Awaiting Signature" || d.status === "Expiring Soon"
      );
  const totalPending =
    pendingLeaves.length +
    pendingOvertime.length +
    pendingProfileUpdates.length +
    pendingExpenses.length +
    actionDocs.length;

  const deptCounts = Object.entries(
    scopedEmployees.reduce<Record<string, number>>((acc, e) => {
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const microLimitFormatted = formatCurrency(
    convertCurrency(settings.microExpenseLimitUSD, "USD", displayCurrency),
    displayCurrency
  );

  const metrics = isEss
    ? [
        {
          label: isId ? "Estimasi Gaji Bersih Saya" : "My Net Take-Home Pay",
          value: formatConverted(myPayslip.netSalary, myPayslip.currency, displayCurrency),
          delta: displayCurrency,
          deltaTone: "badge-success",
          footnote: `${currentEmployee.employeeCode} · ${currentEmployee.department}`,
          icon: Wallet,
          iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
          href: "/payroll",
        },
        {
          label: isId ? "Kehadiran Pribadi Saya" : "My Attendance Rate",
          value: `${currentEmployee.attendanceRate}%`,
          delta: isId ? "GPS Aktif" : "GPS Verified",
          deltaTone: "badge-info",
          footnote: currentEmployee.location,
          icon: Clock,
          iconTone: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
          href: "/attendance",
        },
        {
          label: isId ? "Pengajuan Cuti & WFA Saya" : "My Leave & WFA Requests",
          value: `${pendingLeaves.length}`,
          delta: isId ? "Kuota 12h" : "12d Quota",
          deltaTone: "badge-warning",
          footnote: isId ? "Auto-Pilot WFA Aktif" : "Auto-Pilot WFA Enabled",
          icon: Calendar,
          iconTone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
          href: "/attendance",
        },
        {
          label: isId ? "Skor Kinerja & OKR Saya" : "My Performance Score",
          value: `${currentEmployee.performanceScore}/100`,
          delta: "Q4 2026",
          deltaTone: "badge-success",
          footnote: currentEmployee.role,
          icon: Award,
          iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
          href: "/performance",
        },
      ]
    : [
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
          label: hasPermission("payroll:view_all")
            ? `${dict.dashboard.monthlyPayroll} (${displayCurrency})`
            : isId
            ? "Workflow Otomatis Aktif"
            : "Active Workflows",
          value: hasPermission("payroll:view_all")
            ? formatCompactConverted(scopedPayrollUsd, displayCurrency, locale)
            : `${activeFlows}/${workflows.length}`,
          delta: hasPermission("payroll:view_all")
            ? isId
              ? "25 Nov"
              : "Nov 25"
            : "99.9% SLA",
          deltaTone: "badge-info",
          footnote: hasPermission("payroll:view_all")
            ? isId
              ? `Tersinkron ke ${displayCurrency} · Pajak & Reimburse`
              : `Synced in ${displayCurrency} · Tax & Expenses`
            : isId
            ? "Nominal Payroll Dilindungi RBAC"
            : "Confidential Payroll Masked by RBAC",
          icon: Wallet,
          iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
          href: "/payroll",
        },
        {
          label: dict.dashboard.attendanceRate,
          value: `${avgAttendance}%`,
          delta: `${attendance.length}/${employees.length} ${isId ? "Hadir" : "In"}`,
          deltaTone: "badge-success",
          footnote: isId ? "GPS Geofence & Shift Aktif" : "GPS Geofence & Active Roster",
          icon: Clock,
          iconTone: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
          href: "/attendance",
        },
        {
          label: hasPermission("assessments:manage")
            ? dict.dashboard.avgCognitiveIq
            : isId
            ? "Blok Audit Keamanan"
            : "SHA-256 Audit Blocks",
          value: hasPermission("assessments:manage") ? `${avgIq}` : `${auditLogs.length}`,
          delta: hasPermission("assessments:manage")
            ? isId
              ? "104 Soal"
              : "104 Items"
            : "Zero-Trust",
          deltaTone: "badge-warning",
          footnote: hasPermission("assessments:manage")
            ? `${reports.length} ${isId ? "Laporan Psikotes" : "Verified Reports"}`
            : isId
            ? "Jejak Kepatuhan Kriptografi"
            : "Immutable Compliance Trail",
          icon: hasPermission("assessments:manage") ? BrainCircuit : ShieldCheck,
          iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
          href: hasPermission("assessments:manage") ? "/assessments" : "/audit-logs",
        },
      ];

  const celebrations = [
    {
      name: "Nadia Kusuma",
      event: isId ? "Ulang Tahun Kerja ke-4" : "4th Work Anniversary",
      date: "28 Nov",
      initials: "NK",
    },
    {
      name: "Raka Pradipta",
      event: isId ? "Hari Ulang Tahun" : "Birthday",
      date: isId ? "02 Des" : "02 Dec",
      initials: "RP",
    },
    {
      name: "Bima Sakti Nugroho",
      event: isId ? "Lulus Onboarding 30 Hari" : "30-Day Onboarding Done",
      date: isId ? "02 Des" : "02 Dec",
      initials: "BN",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Clean Quiet-Chrome Executive Page Header */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{authUser.companyName}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> {tRole(activeRole, locale)}
            </span>
            <span>·</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {displayCurrency}
            </span>
            {selectedEntity !== "ALL" && (
              <>
                <span>·</span>
                <span className="badge-info px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {selectedEntity}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isId
              ? `Selamat Datang, ${authUser.name.split(" ")[0]}`
              : `Good morning, ${authUser.name.split(" ")[0]}`}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPermission("audit:view") && (
            <Link
              href="/audit-logs"
              className="hr-btn-secondary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              {isId ? "Audit Log & RBAC" : "Audit Logs & RBAC"}
            </Link>
          )}
          <Link
            href="/payroll"
            className="hr-btn-secondary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            {!hasPermission("payroll:view_all")
              ? isId
                ? "Slip Gaji Saya"
                : "My Payslip"
              : dict.dashboard.runPayroll}
          </Link>
          {hasPermission("assessments:manage") && (
            <Link
              href="/assessments"
              className="hr-btn-secondary px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
              {dict.dashboard.launchPsychometric}
            </Link>
          )}
          {hasPermission("assessments:manage") && (
            <button
              type="button"
              onClick={() => openInviteModal()}
              className="btn-quantum px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {dict.dashboard.inviteCandidate}
            </button>
          )}
        </div>
      </section>

      {/* Live Quick Attendance Strip (100% Synced with /attendance & /mobile — Zero Spam!) */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Fingerprint className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold truncate">
              {!myTodayShift
                ? isId
                  ? `Status Absensi Hari Ini (${currentEmployee.name}): Belum Clock-In`
                  : `Today's Shift (${currentEmployee.name}): Not Clocked In`
                : myTodayShift.clockOut
                ? isId
                  ? `Shift Selesai (${myTodayShift.clockIn} → ${myTodayShift.clockOut} · ${myTodayShift.workHours}j)`
                  : `Shift Completed (${myTodayShift.clockIn} → ${myTodayShift.clockOut} · ${myTodayShift.workHours}h)`
                : myTodayShift.onBreak
                ? isId
                  ? `Sedang Istirahat · Masuk pukul ${myTodayShift.clockIn}`
                  : `On Break · Clocked in at ${myTodayShift.clockIn}`
                : isId
                ? `Sedang Bekerja · Masuk pukul ${myTodayShift.clockIn} (GPS Terverifikasi)`
                : `Shift Active · Clocked in at ${myTodayShift.clockIn} (GPS Verified)`}
            </div>
            <div className="text-[11px] hr-muted truncate">
              {currentEmployee.location} · {isId ? "Tersinkron langsung ke Absensi, Mobile App & Payroll" : "Live-synced to Attendance, Mobile PWA & Payroll"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!myTodayShift ? (
            <button
              type="button"
              onClick={() => {
                const hhmm = new Date().toTimeString().slice(0, 5);
                clockInEmployee({
                  employeeId: currentEmployee.id,
                  employeeName: currentEmployee.name,
                  department: currentEmployee.department,
                  date: todayStr,
                  clockIn: hhmm,
                  clockOut: null,
                  status: Number(hhmm.slice(0, 2)) >= 9 ? "Late" : "On Time",
                  location: `${currentEmployee.location} (Dashboard GPS Verified)`,
                  coordinates: { lat: -6.2248, lng: 106.8095 },
                  geofenceVerified: true,
                  workHours: 0,
                  device: "Web Portal",
                });
              }}
              className="btn-quantum px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isId ? "Clock-In Sekarang" : "Clock-In Now"}
            </button>
          ) : !myTodayShift.clockOut ? (
            <>
              <button
                type="button"
                onClick={() => toggleBreakAttendance(myTodayShift.id)}
                className="hr-btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"
              >
                <Coffee className="w-3.5 h-3.5" />
                {myTodayShift.onBreak ? (isId ? "Lanjut Kerja" : "Resume") : isId ? "Istirahat" : "Break"}
              </button>
              <button
                type="button"
                onClick={() => clockOutEmployee(myTodayShift.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Clock-Out
              </button>
            </>
          ) : (
            <Link
              href="/attendance#spl-overtime-section"
              className="badge-success px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isId ? "Hadir ✓ · Ajukan Lembur" : "Present ✓ · Log SPL"}
            </Link>
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
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums truncate">
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
        <div className="xl:col-span-8 space-y-5">
          {/* Tabbed HR Action Center */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isEss
                    ? isId
                      ? "Status Pengajuan & Dokumen Pribadi Saya"
                      : "My Personal Requests & Contracts"
                    : isId
                    ? "Antrean Persetujuan & Tindakan HR"
                    : "Priority Approvals & Action Queue"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEss
                    ? isId
                      ? "Pantau status cuti, klaim reimburse, dan kontrak E-Sign milik Anda sendiri."
                      : "Track your own leave requests, expense claims, and pending e-signatures."
                    : isId
                    ? "Selesaikan persetujuan cuti, klaim reimburse, dan kontrak E-Sign langsung dari sini."
                    : "Resolve pending leaves, payroll-synced expenses, and e-sign contracts inline."}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-[11px]">
                {(
                  [
                    { id: "all", label: `${isId ? "Semua" : "All"} (${totalPending})` },
                    { id: "leave", label: `${isId ? "Cuti" : "Leave"} (${pendingLeaves.length})` },
                    { id: "expense", label: `${isId ? "Reimburse" : "Expense"} (${pendingExpenses.length})` },
                    { id: "contract", label: `E-Sign (${actionDocs.length})` },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
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
                          {lv.employeeName} ·{" "}
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {tStatus(lv.type, locale)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {lv.days} {isId ? "hari" : "days"} ({lv.startDate} → {lv.endDate}) · {lv.reason}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(hasPermission("attendance:approve") && lv.status === "Pending") ||
                      (canFinalApproveLeave && lv.status === "Manager Approved") ? (
                        <>
                          <button
                            type="button"
                            onClick={() => decideLeaveRequest(lv.id, "Approved")}
                            className="btn-emerald px-3 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {lv.status === "Manager Approved"
                              ? isId
                                ? "Final HR"
                                : "HR Final"
                              : dict.common.approve}
                          </button>
                          <button
                            type="button"
                            onClick={() => decideLeaveRequest(lv.id, "Rejected")}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold badge-danger"
                            aria-label="Reject leave"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="badge-warning px-2.5 py-1 rounded-full text-[10px] font-bold">
                          {tStatus(lv.status, locale)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {(inboxTab === "all" || inboxTab === "leave") &&
                pendingOvertime.map((ot) => (
                  <div
                    key={ot.id}
                    className="px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">
                          {ot.employeeName} ·{" "}
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {isId ? `Lembur SPL (${ot.hours} jam)` : `SPL Overtime (${ot.hours}h)`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {ot.date} · {formatConverted(ot.calculatedPay, ot.currency, displayCurrency)} · {ot.reason}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => decideOvertimeRequest(ot.id, "Approved")}
                        className="btn-emerald px-3 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isId ? "Setujui SPL" : "Approve SPL"}
                      </button>
                      <button
                        type="button"
                        onClick={() => decideOvertimeRequest(ot.id, "Rejected")}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold badge-danger"
                        aria-label="Reject overtime"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

              {inboxTab === "all" &&
                pendingProfileUpdates.map((req) => (
                  <div
                    key={req.id}
                    className="px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">
                          {req.employeeName} ·{" "}
                          <span className="text-indigo-600 dark:text-indigo-400">
                            ESS: {req.field} ({req.oldValue} → {req.newValue})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{req.reason}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => decideProfileChangeRequest(req.id, "Approved")}
                        className="btn-quantum px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                      >
                        {isId ? "Setujui ESS" : "Approve ESS"}
                      </button>
                      <button
                        type="button"
                        onClick={() => decideProfileChangeRequest(req.id, "Rejected")}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold badge-danger"
                        aria-label="Reject profile update"
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
                            ({formatConverted(ex.amount, ex.currency, displayCurrency)})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {ex.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(hasPermission("expenses:approve") && ex.status === "Pending") ||
                      (canFinalApproveExpense && ex.status === "Manager Approved") ? (
                        <>
                          <button
                            type="button"
                            onClick={() => decideExpenseClaim(ex.id, "Approved")}
                            className="btn-quantum px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                          >
                            {ex.status === "Manager Approved"
                              ? isId
                                ? "Final Finance"
                                : "Finance Final"
                              : isId
                              ? "Setujui & Sync"
                              : "Approve & Sync"}
                          </button>
                          <button
                            type="button"
                            onClick={() => decideExpenseClaim(ex.id, "Rejected")}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold badge-danger"
                            aria-label="Reject expense"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="badge-info px-2.5 py-1 rounded-full text-[10px] font-bold">
                          {tStatus(ex.status, locale)}
                        </span>
                      )}
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
                          <span className="text-amber-700 dark:text-amber-400">
                            {tStatus(doc.status, locale)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{doc.title}</div>
                      </div>
                    </div>
                    <Link
                      href="/documents"
                      className="hr-btn-secondary px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0"
                    >
                      {isId ? "Buka E-Sign →" : "Open E-Sign →"}
                    </Link>
                  </div>
                ))}

              {totalPending === 0 && (
                <div className="py-10 text-center text-xs text-slate-500">
                  🎉{" "}
                  {isId
                    ? "Seluruh antrean persetujuan telah terselesaikan."
                    : "All pending approvals are complete."}
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
                  {isId
                    ? "Tren Otomatisasi HR & Penyelesaian Psikotes"
                    : "HR Automation & Psychometric Velocity"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? `${activeFlows}/${workflows.length} alur aktif · Email, WhatsApp & Webhook HMAC-SHA256`
                    : `${activeFlows}/${workflows.length} active flows · Email, WhatsApp & HMAC-SHA256 Webhooks`}
                </p>
              </div>
              {hasPermission("automation:manage") && (
                <Link
                  href="/automation"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {isId ? "Studio Otomatisasi" : "Automation Studio"}{" "}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <AreaTrendChart
              labels={isId ? ["Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov"] : ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]}
              seriesA={[140, 185, 220, 260, 295, 340, 392]}
              seriesB={[38, 52, 64, 79, 95, 118, 146]}
              labelA={isId ? "Eksekusi Otomatisasi (Email/WA/Webhook)" : "Automated Workflows"}
              labelB={isId ? "Psikotes Kognitif Selesai" : "Completed Assessments"}
            />
          </div>
        </div>

        {/* Right 4 Cols: Role-Scoped Cards */}
        <div className="xl:col-span-4 space-y-5">
          {/* Live Role-Scoped Security & Auto-Pilot Pulse */}
          {hasPermission("audit:view") && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isId ? "Audit Log & Auto-Pilot AI" : "Security Audit & Auto-Pilot"}
                </h2>
                <Link
                  href="/audit-logs"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {isId ? "Semua Log →" : "Full Trail →"}
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                <span className={settings.autoApproveShortLeave ? "badge-success px-2 py-0.5 rounded-full" : "hr-subtle px-2 py-0.5 rounded-full"}>
                  {isId ? "Auto-Cuti/WFA" : "Auto-WFA/Leave"}: {settings.autoApproveShortLeave ? (isId ? "AKTIF" : "ON") : "OFF"}
                </span>
                <span className={settings.autoApproveMicroExpense ? "badge-success px-2 py-0.5 rounded-full" : "hr-subtle px-2 py-0.5 rounded-full"}>
                  {isId ? "Klaim Mikro" : "Micro-Claim"} ≤{microLimitFormatted}: {settings.autoApproveMicroExpense ? (isId ? "AKTIF" : "ON") : "OFF"}
                </span>
              </div>
              <div className="space-y-2 pt-1">
                {auditLogs.slice(0, 3).map((a) => (
                  <div key={a.id} className="text-[11px] flex items-start justify-between gap-2 py-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{a.action}</div>
                      <div className="text-slate-500 truncate">
                        {a.actorName} ({tRole(a.actorRole, locale)})
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {a.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Payroll Readiness Card (Reactive to actual payrollRuns, expenses & SPL!) */}
          {hasPermission("payroll:view_all") && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isId
                    ? `Siklus Payroll ${activePayroll?.period || "2026-11"}`
                    : `Payroll Cycle ${activePayroll?.period || "2026-11"}`}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activePayroll?.status === "Awaiting Checker" ? "badge-warning" : "badge-success"
                  }`}
                >
                  {tStatus(activePayroll?.status || "Completed", locale)}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  {
                    label: isId
                      ? `Absensi & Lembur SPL (${approvedOvertimeQueue} antrean)`
                      : `Attendance & SPL Overtime (${approvedOvertimeQueue} queued)`,
                    done: approvedOvertimeQueue === 0,
                  },
                  {
                    label: isId
                      ? `Reimburse Siap Payroll (${approvedExpensesQueue} klaim)`
                      : `Expenses Queued (${approvedExpensesQueue} claims)`,
                    done: approvedExpensesQueue === 0,
                  },
                  {
                    label: isId ? "Verifikasi Checker & Pencairan Bank" : "Checker Sign-Off & Bank Disbursement",
                    done: activePayroll?.status === "Completed",
                  },
                ].map((step) => (
                  <div key={step.label} className="flex items-center justify-between py-1">
                    <span className={step.done ? "text-slate-700 dark:text-slate-300" : "text-slate-500"}>
                      {step.label}
                    </span>
                    <span className={`text-[10px] font-bold shrink-0 ${step.done ? "text-emerald-600" : "text-amber-600"}`}>
                      {step.done ? (isId ? "✓ Selesai" : "✓ Settled") : isId ? "Siap Proses" : "Pending Run"}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/payroll"
                className="block w-full text-center py-2 rounded-lg hr-btn-secondary text-xs font-semibold"
              >
                {activePayroll?.status === "Awaiting Checker"
                  ? isId
                    ? "Verifikasi Checker Sekarang →"
                    : "Sign Off as Checker →"
                  : isId
                  ? "Tinjau & Jalankan Payroll →"
                  : "Review Payroll Run →"}
              </Link>
            </div>
          )}

          {/* Department Headcount */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {isId ? "Jumlah Karyawan per Divisi" : "Headcount by Dept"}
              </h2>
              <Link href="/employees" className="text-xs font-semibold text-indigo-600 hover:underline">
                {isId ? "Direktori →" : "Directory →"}
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

          {/* Top Psychometric (RBAC Guarded) + Announcements */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3">
            {hasPermission("assessments:manage") && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    {isId ? "Skor Psikotes Tertinggi" : "Top Psychometric Talent"}
                  </h2>
                  <Link href="/assessments" className="text-xs font-semibold text-indigo-600 hover:underline">
                    {isId ? "Semua →" : "All →"}
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
              </>
            )}
            {announcements[0] && (
              <div className={`${hasPermission("assessments:manage") ? "pt-3 border-t border-slate-200/80 dark:border-slate-800" : ""} space-y-1`}>
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
