"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  MapPin,
  Wallet,
  Calendar,
  BrainCircuit,
  QrCode,
  CheckCircle2,
  Download,
  Fingerprint,
  MessageCircle,
  Send,
  ShieldCheck,
  Home,
  CreditCard,
  Clock,
  Coffee,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { calculateEmployeePayslip, formatCurrency } from "@/lib/payroll-engine";
import { formatConverted } from "@/lib/currency";
import { tStatus } from "@/lib/i18n";
import { QrCodeSvg } from "@/components/visuals/Charts";

type MobileTab = "home" | "badge" | "payslip" | "leave" | "test";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function formatElapsed(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MobileAppCompanionPage() {
  const router = useRouter();
  const {
    locale,
    displayCurrency,
    activeRole,
    currentEmployee,
    hasPermission,
    employees,
    attendance,
    leaves,
    clockInEmployee,
    toggleBreakAttendance,
    clockOutEmployee,
    resetTodayShiftForDemo,
    submitLeaveRequest,
    openInviteModal,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";
  const isEss = activeRole === "Employee";

  const [tab, setTab] = useState<MobileTab>("home");
  const [selectedEmpId, setSelectedEmpId] = useState(currentEmployee.id);
  const [nowClock, setNowClock] = useState("08:30");
  const [nowMs, setNowMs] = useState(0);
  const [todayStr, setTodayStr] = useState("2026-11-27");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [leaveStart, setLeaveStart] = useState("2026-12-18");
  const [leaveEnd, setLeaveEnd] = useState("2026-12-19");
  const [leaveReason, setLeaveReason] = useState("");
  const [launchingTest, setLaunchingTest] = useState(false);

  useEffect(() => {
    setSelectedEmpId(currentEmployee.id);
  }, [currentEmployee.id]);

  const emp = isEss
    ? currentEmployee
    : employees.find((e) => e.id === selectedEmpId) || currentEmployee;
  const payslip = emp ? calculateEmployeePayslip(emp, 0, 0) : null;
  const todayShift = attendance.find((a) => a.employeeId === emp?.id && a.date === todayStr);
  const shiftPhase: "NOT_STARTED" | "WORKING" | "ON_BREAK" | "COMPLETED" = !todayShift
    ? "NOT_STARTED"
    : todayShift.clockOut
    ? "COMPLETED"
    : todayShift.onBreak
    ? "ON_BREAK"
    : "WORKING";

  const myLeaves = leaves.filter((l) => l.employeeId === emp?.id);
  const usedAnnual = myLeaves
    .filter((l) => l.type === "Annual Leave" && l.status === "Approved")
    .reduce((s, l) => s + l.days, 0);
  const remainingLeaveDays = Math.max(0, 14 - usedAnnual);

  const activeElapsedSec = (() => {
    if (!todayShift || !nowMs || shiftPhase === "NOT_STARTED" || shiftPhase === "COMPLETED") return 0;
    const baseSec = todayShift.clockInTs ? Math.max(0, Math.floor((nowMs - todayShift.clockInTs) / 1000)) : 0;
    const curBreak =
      todayShift.onBreak && todayShift.breakStartTs
        ? Math.max(0, Math.floor((nowMs - todayShift.breakStartTs) / 1000))
        : 0;
    return Math.max(0, baseSec - (todayShift.breakSeconds || 0) - curBreak);
  })();

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowClock(d.toTimeString().slice(0, 5));
      setNowMs(d.getTime());
      setTodayStr(d.toISOString().slice(0, 10));
    };
    tick();
    const t = setInterval(tick, 1000);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      clearInterval(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
    } else {
      pushToast({
        title: isId ? "Cara Install Mobile App (PWA)" : "Install Mobile App (PWA)",
        description: isId
          ? "Di Chrome/Safari HP: ketuk menu Share / ⋮ lalu pilih 'Add to Home Screen / Install App'."
          : "On iOS Safari / Android Chrome: tap Share / ⋮ and choose 'Add to Home Screen'.",
        variant: "info",
      });
    }
  };

  const handleMobileClockIn = () => {
    if (!emp || shiftPhase !== "NOT_STARTED") return;
    clockInEmployee({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      date: todayStr,
      clockIn: nowClock,
      clockOut: null,
      status: Number(nowClock.slice(0, 2)) >= 9 ? "Late" : "On Time",
      location: `${emp.location} (Mobile GPS Verified)`,
      coordinates: { lat: -6.2248, lng: 106.8095 },
      geofenceVerified: true,
      workHours: 0,
      device: "Mobile App (iOS)",
    });
  };

  const handleQuickLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emp || !leaveReason.trim()) return;
    const days = Math.max(
      1,
      Math.round((new Date(leaveEnd).getTime() - new Date(leaveStart).getTime()) / (86400 * 1000)) + 1
    );
    const ok = submitLeaveRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      employeeEmail: emp.email,
      employeePhone: emp.phone,
      type: "Annual Leave",
      startDate: leaveStart,
      endDate: leaveEnd,
      days,
      reason: leaveReason.trim(),
    });
    if (ok) setLeaveReason("");
  };

  const launchMobilePsychometric = async () => {
    if (!emp) return;
    setLaunchingTest(true);
    try {
      const res = await fetch("/api/assessments/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: emp.name,
          candidateEmail: emp.email,
          candidatePhone: emp.phone,
          role: emp.role,
          presetId: "express-screening",
        }),
      });
      const data = await res.json();
      if (data.ok && data.path) {
        router.push(data.path);
      }
    } finally {
      setLaunchingTest(false);
    }
  };

  if (!emp || !payslip) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {isId ? "AetherHR Mobile App (Installable PWA + React Native Expo)" : "AetherHR Mobile App (Installable PWA + React Native Expo)"}
          </h1>
          <p className="text-xs sm:text-sm hr-muted mt-1">
            {isId
              ? "Aplikasi mobile native iOS & Android tersinkron real-time dengan absensi GPS, slip gaji, cuti, ID Badge QR, dan Psikotes."
              : "Native iOS & Android mobile companion synchronized live with GPS attendance, payslips, leave requests, QR ID badge, and psychometrics."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isEss && (
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="px-3 py-2 rounded-xl hr-input text-xs font-semibold"
            >
              {employees.map((item) => (
                <option key={item.id} value={item.id}>
                  Mobile User: {item.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => void handleInstallPwa()}
            className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            {isId ? "Install Mobile App (PWA)" : "Install Mobile App (PWA)"}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Interactive Smartphone Companion Frame */}
        <div className="xl:col-span-5 flex justify-center">
          <div className="w-full md:max-w-[390px] rounded-2xl md:rounded-[40px] border md:border-[7px] border-slate-200 dark:border-slate-800 md:border-slate-900 bg-white dark:bg-[#0d1117] shadow-xl md:shadow-2xl overflow-hidden flex flex-col min-h-[640px] md:min-h-[700px]">
            {/* Mobile Status Bar */}
            <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-bold hr-muted">
              <span className="font-mono">{nowClock}</span>
              <div className="w-20 h-4 rounded-full bg-slate-900 dark:bg-slate-800 border border-slate-700" />
              <span className="text-emerald-600 dark:text-emerald-400">5G · 100%</span>
            </div>

            {/* Mobile App Header */}
            <div className="px-5 py-3.5 hr-subtle border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${emp.avatarColor} flex items-center justify-center font-black text-white text-sm shrink-0`}
                >
                  {emp.avatarInitials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">{emp.name}</div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                    {emp.role}
                  </div>
                </div>
              </div>
              <span className="badge-success text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0">
                SYNCED
              </span>
            </div>

            {/* Mobile Scrollable Body */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {tab === "home" && (
                <>
                  {/* 4-State Biometric GPS Attendance Terminal (Synced Live with /attendance!) */}
                  <div className="p-4 rounded-2xl hr-subtle border border-indigo-500/20 text-center space-y-3">
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {isId ? "Absensi Biometrik & GPS" : "Biometric GPS Attendance"}
                    </div>
                    <div className="text-3xl font-black font-mono tabular-nums">{nowClock}</div>
                    <div className="text-[11px] hr-muted flex items-center justify-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {emp.location} · Geofence OK
                    </div>

                    {shiftPhase === "NOT_STARTED" && (
                      <button
                        type="button"
                        onClick={handleMobileClockIn}
                        className="w-full btn-quantum py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
                      >
                        <Fingerprint className="w-5 h-5" />
                        {isId ? "Tap untuk Clock-In Sekarang" : "Tap to Clock-In Now"}
                      </button>
                    )}

                    {(shiftPhase === "WORKING" || shiftPhase === "ON_BREAK") && todayShift && (
                      <div className="space-y-2.5 pt-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-success text-[11px] font-mono font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          {shiftPhase === "ON_BREAK"
                            ? isId
                              ? "Istirahat"
                              : "On Break"
                            : isId
                            ? `Aktif ${todayShift.clockIn}`
                            : `In ${todayShift.clockIn}`}{" "}
                          · {formatElapsed(activeElapsedSec)}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => toggleBreakAttendance(todayShift.id)}
                            className="py-2.5 rounded-xl hr-btn-secondary text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <Coffee className="w-3.5 h-3.5" />
                            {shiftPhase === "ON_BREAK"
                              ? isId
                                ? "Lanjut"
                                : "Resume"
                              : isId
                              ? "Istirahat"
                              : "Break"}
                          </button>
                          <button
                            type="button"
                            onClick={() => clockOutEmployee(todayShift.id)}
                            className="py-2.5 rounded-xl bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Clock-Out
                          </button>
                        </div>
                      </div>
                    )}

                    {shiftPhase === "COMPLETED" && todayShift && (
                      <div className="p-3 rounded-xl badge-success space-y-2 text-xs">
                        <div className="font-extrabold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          {isId ? "Shift Selesai" : "Shift Done"} ({todayShift.clockIn} → {todayShift.clockOut})
                        </div>
                        <button
                          type="button"
                          onClick={() => resetTodayShiftForDemo(emp.id)}
                          className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/70 text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> {isId ? "Reset Simulasi" : "Reset Demo"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick 2x2 Mobile Tiles */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTab("payslip")}
                      className="p-3.5 rounded-2xl hr-subtle hover:border-indigo-400 text-left space-y-1.5 transition"
                    >
                      <Wallet className="w-5 h-5 text-amber-500" />
                      <div className="text-xs font-bold">{isId ? "Slip Gaji" : "My Payslip"}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold truncate">
                        {formatConverted(payslip.netSalary, payslip.currency, displayCurrency)}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("test")}
                      className="p-3.5 rounded-2xl hr-subtle hover:border-indigo-400 text-left space-y-1.5 transition"
                    >
                      <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <div className="text-xs font-bold">Psikotes IQ</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-300 font-mono">
                        Baseline IQ {emp.cognitiveIq}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("leave")}
                      className="p-3.5 rounded-2xl hr-subtle hover:border-indigo-400 text-left space-y-1.5 transition"
                    >
                      <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <div className="text-xs font-bold">{isId ? "Cuti & WFA" : "Leave & WFA"}</div>
                      <div className="text-[10px] hr-muted">
                        {remainingLeaveDays} {isId ? "hari tersisa" : "days left"}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("badge")}
                      className="p-3.5 rounded-2xl hr-subtle hover:border-indigo-400 text-left space-y-1.5 transition"
                    >
                      <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-xs font-bold">Digital ID QR</div>
                      <div className="text-[10px] hr-muted font-mono">{emp.employeeCode}</div>
                    </button>
                  </div>

                  {hasPermission("assessments:manage") && (
                    <button
                      type="button"
                      onClick={() => openInviteModal()}
                      className="w-full p-3 rounded-2xl badge-success text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {isId ? "Kirim Undangan Tes via WhatsApp / Email" : "Dispatch WA / Email Test Invite"}
                    </button>
                  )}
                </>
              )}

              {tab === "badge" && (
                <div className="p-5 rounded-3xl hr-subtle border border-indigo-400/40 text-center space-y-4">
                  <div className="text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                    AetherHR Global Smart Access Pass
                  </div>
                  <div className="flex justify-center">
                    <QrCodeSvg value={`AETHER-ID:${emp.employeeCode}:${emp.email}`} size={160} />
                  </div>
                  <div>
                    <div className="text-lg font-black">{emp.name}</div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{emp.role}</div>
                    <div className="text-[11px] hr-muted font-mono mt-1">
                      {emp.employeeCode} · {emp.department}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-success text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Enterprise Access
                  </div>
                </div>
              )}

              {tab === "payslip" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl badge-success">
                    <div className="text-[11px] font-semibold">
                      {isId ? `Gaji Bersih (${displayCurrency})` : `Net Take-Home (${displayCurrency})`}
                    </div>
                    <div className="text-2xl font-extrabold font-mono mt-0.5">
                      {formatConverted(payslip.netSalary, payslip.currency, displayCurrency)}
                    </div>
                    <div className="text-[10px] opacity-80 mt-1">{payslip.taxRateLabel}</div>
                  </div>
                  <div className="p-4 rounded-2xl hr-subtle space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="hr-muted">{isId ? "Gaji Pokok" : "Base Salary"}</span>
                      <span className="font-mono font-bold">
                        {formatConverted(payslip.baseSalary, payslip.currency, displayCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="hr-muted">{isId ? "Tunjangan" : "Allowances"}</span>
                      <span className="font-mono font-bold">
                        {formatConverted(payslip.allowances, payslip.currency, displayCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>{isId ? "Pajak Penghasilan" : "Income Tax"}</span>
                      <span className="font-mono">
                        -{formatConverted(payslip.incomeTax, payslip.currency, displayCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>BPJS / Social Sec</span>
                      <span className="font-mono">
                        -{formatConverted(payslip.bpjsHealth + payslip.bpjsEmployment, payslip.currency, displayCurrency)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${emp.phone}?text=${encodeURIComponent(
                      `Slip Gaji Digital AetherHR: ${emp.name} — Net ${formatCurrency(
                        payslip.netSalary,
                        payslip.currency
                      )}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-emerald py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isId ? "Kirim Salinan ke WhatsApp" : "Send Copy to WhatsApp"}
                  </a>
                </div>
              )}

              {tab === "leave" && (
                <div className="space-y-3">
                  <form onSubmit={handleQuickLeave} className="p-4 rounded-2xl hr-subtle space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-extrabold">
                        {isId ? "Pengajuan Cuti Cepat (Mobile)" : "Quick Mobile Leave Request"}
                      </div>
                      <span className="badge-info px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {remainingLeaveDays}h
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={leaveStart}
                        onChange={(e) => {
                          setLeaveStart(e.target.value);
                          if (leaveEnd < e.target.value) setLeaveEnd(e.target.value);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hr-input text-[11px]"
                      />
                      <input
                        type="date"
                        min={leaveStart}
                        value={leaveEnd}
                        onChange={(e) => setLeaveEnd(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl hr-input text-[11px]"
                      />
                    </div>
                    <input
                      required
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder={isId ? "Alasan cuti..." : "Leave reason..."}
                      className="w-full px-3 py-2 rounded-xl hr-input text-xs"
                    />
                    <button type="submit" className="w-full btn-quantum py-2.5 rounded-xl text-xs font-bold">
                      {isId ? "Ajukan Sekarang" : "Submit Leave"}
                    </button>
                  </form>
                  <div className="space-y-2">
                    {myLeaves.map((lv) => (
                      <div
                        key={lv.id}
                        className="p-3 rounded-xl hr-subtle flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold">{tStatus(lv.type, locale)}</div>
                          <div className="text-[10px] hr-muted">
                            {lv.startDate} → {lv.endDate} ({lv.days}d)
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lv.status === "Approved"
                              ? "badge-success"
                              : lv.status === "Rejected"
                              ? "badge-danger"
                              : "badge-warning"
                          }`}
                        >
                          {tStatus(lv.status, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "test" && (
                <div className="p-4 rounded-2xl hr-subtle space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mx-auto shadow-md">
                    <BrainCircuit className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold">
                      {isId ? "Mobile Psikotes & Kognitif" : "Mobile Cognitive & Psychometrics"}
                    </div>
                    <p className="text-[11px] hr-muted mt-1">
                      {isId
                        ? "Dioptimalkan penuh untuk layar sentuh smartphone dengan timer presisi & anti-cheat."
                        : "Touch-optimized assessment engine with precision timers & proctoring telemetry."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void launchMobilePsychometric()}
                    disabled={launchingTest}
                    className="w-full btn-emerald py-3 rounded-xl text-xs font-black"
                  >
                    {launchingTest
                      ? "Launching..."
                      : isId
                      ? "Mulai Express 360° (24 Soal · 20m)"
                      : "Start Express 360° (24 Qs · 20m)"}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Native Bottom Tabs */}
            <div
              className="px-3 py-2.5 bg-white dark:bg-[#0d1117] border-t grid grid-cols-5 gap-1"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              {[
                { id: "home" as const, icon: Home, label: isId ? "Beranda" : "Home" },
                { id: "badge" as const, icon: CreditCard, label: "ID QR" },
                { id: "payslip" as const, icon: Wallet, label: isId ? "Gaji" : "Pay" },
                { id: "leave" as const, icon: Clock, label: isId ? "Cuti" : "Leave" },
                { id: "test" as const, icon: BrainCircuit, label: isId ? "Tes" : "Test" },
              ].map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex flex-col items-center py-1 rounded-xl text-[10px] font-bold transition ${
                      active
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15"
                        : "hr-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Dual Mobile Strategy (PWA + React Native Expo) */}
        <div className="xl:col-span-7 space-y-5">
          <div className="hr-card rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-extrabold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
              {isId
                ? "Arsitektur Dual Mobile App: Installable PWA + Native iOS/Android (Expo)"
                : "Dual Mobile Architecture: Installable PWA + Native iOS/Android (React Native Expo)"}
            </h2>
            <p className="text-xs hr-muted leading-relaxed">
              {isId
                ? "AetherHR dilengkapi dua jalur aplikasi mobile modern yang langsung tersinkronisasi dengan API Vercel:"
                : "AetherHR ships two production mobile delivery paths synchronized live with your Vercel APIs:"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl hr-subtle space-y-2">
                <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  1. Instant Installable PWA (/mobile)
                </div>
                <p className="text-[11px] hr-muted leading-relaxed">
                  {isId
                    ? "Langsung dapat di-install ke Home Screen Android & iPhone tanpa App Store review. Mendukung manifest standalone, GPS Geolocation API, dan tampilan layar penuh."
                    : "Install directly onto iOS and Android Home Screens with standalone manifest, GPS Geolocation API, and full-screen mobile UX."}
                </p>
              </div>
              <div className="p-4 rounded-xl hr-subtle space-y-2">
                <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                  2. Standalone React Native + Expo App (/mobile-app)
                </div>
                <p className="text-[11px] hr-muted leading-relaxed">
                  {isId
                    ? "Kode sumber aplikasi native TypeScript lengkap di folder /mobile-app di repository GitHub untuk kompilasi APK/AAB Android & IPA iOS via Expo EAS Build."
                    : "Complete TypeScript React Native Expo source in /mobile-app for compiling native Android .APK/.AAB and iOS .IPA binaries via Expo EAS."}
                </p>
              </div>
            </div>
          </div>

          <div className="hr-card rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <QrCodeSvg value="https://hris-automation.vercel.app/mobile" size={140} />
            <div className="space-y-2 text-center sm:text-left">
              <div className="text-sm font-extrabold">
                {isId ? "Scan untuk Buka Mobile App di HP Anda" : "Scan to Open Mobile App on Your Phone"}
              </div>
              <p className="text-xs hr-muted leading-relaxed">
                {isId
                  ? "Arahkan kamera iPhone atau Android ke QR Code ini untuk membuka AetherHR Mobile App secara instan dan memasangnya ke layar utama."
                  : "Point any iPhone or Android camera here to launch the live AetherHR Mobile PWA and add it to your Home Screen."}
              </p>
              <code className="inline-block px-3 py-1 rounded-lg hr-subtle text-[11px] text-indigo-600 dark:text-indigo-300 font-mono">
                https://hris-automation.vercel.app/mobile
              </code>
            </div>
          </div>

          <div className="hr-card rounded-2xl p-5 space-y-2">
            <div className="text-xs font-bold">
              React Native Expo Quickstart (<code className="text-indigo-600 dark:text-indigo-400">/mobile-app</code>)
            </div>
            <pre className="code-dark p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto">
{`cd mobile-app
npm install
npx expo start        # Scan with Expo Go on iOS / Android
npx eas build -p all  # Build native .APK / .AAB / .IPA`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
