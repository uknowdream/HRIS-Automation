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
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { calculateEmployeePayslip, formatCurrency } from "@/lib/payroll-engine";
import { QrCodeSvg } from "@/components/visuals/Charts";

type MobileTab = "home" | "badge" | "payslip" | "leave" | "test";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export default function MobileAppCompanionPage() {
  const router = useRouter();
  const {
    locale,
    employees,
    attendance,
    leaves,
    clockInEmployee,
    submitLeaveRequest,
    openInviteModal,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";

  const [tab, setTab] = useState<MobileTab>("home");
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || "emp-01");
  const [nowClock, setNowClock] = useState("08:30");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveDays, setLeaveDays] = useState("2");
  const [launchingTest, setLaunchingTest] = useState(false);

  const emp = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const payslip = emp ? calculateEmployeePayslip(emp, 0, 0) : null;
  const myAttendance = attendance.find((a) => a.employeeId === emp?.id);
  const myLeaves = leaves.filter((l) => l.employeeId === emp?.id);

  useEffect(() => {
    const tick = () => setNowClock(new Date().toTimeString().slice(0, 5));
    tick();
    const t = setInterval(tick, 10000);
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
    if (!emp) return;
    clockInEmployee({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      date: new Date().toISOString().slice(0, 10),
      clockIn: nowClock,
      clockOut: null,
      status: "On Time",
      location: `${emp.location} (Mobile GPS Verified)`,
      coordinates: { lat: -6.2248, lng: 106.8095 },
      geofenceVerified: true,
      workHours: 0.1,
      device: "Mobile App (iOS)",
    });
  };

  const handleQuickLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emp || !leaveReason.trim()) return;
    submitLeaveRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      employeeEmail: emp.email,
      employeePhone: emp.phone,
      type: "Annual Leave",
      startDate: "2026-12-18",
      endDate: "2026-12-19",
      days: Number(leaveDays) || 2,
      reason: leaveReason.trim(),
    });
    setLeaveReason("");
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
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-emerald-400" />
            {isId ? "AetherHR Mobile App (Installable PWA + React Native Expo)" : "AetherHR Mobile App (Installable PWA + React Native Expo)"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isId
              ? "Pengalaman aplikasi mobile native iOS & Android untuk absensi GPS biometrik, slip gaji, pengajuan cuti, ID Badge QR, dan Psikotes langsung dari smartphone."
              : "Native iOS & Android mobile experience for biometric GPS check-in, digital payslips, leave requests, QR ID badge, and mobile psychometric tests."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold"
          >
            {employees.map((item) => (
              <option key={item.id} value={item.id}>
                Mobile User: {item.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => void handleInstallPwa()}
            className="btn-emerald px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            {isId ? "Install Mobile App (PWA)" : "Install Mobile App (PWA)"}
          </button>
        </div>
      </div>

      {/* Main Layout: Interactive Smartphone Frame + Native Companion Specs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Interactive Smartphone App */}
        <div className="xl:col-span-5 flex justify-center">
          <div className="w-full max-w-[390px] rounded-[42px] border-[7px] border-slate-900 bg-slate-950 shadow-2xl shadow-indigo-500/15 overflow-hidden flex flex-col min-h-[700px]">
            {/* Mobile Status Bar */}
            <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-bold hr-muted">
              <span>{nowClock}</span>
              <div className="w-20 h-4 rounded-full bg-slate-900 border border-slate-700" />
              <span className="text-emerald-600 dark:text-emerald-400">5G · 100%</span>
            </div>

            {/* Mobile App Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-cyan-500/18 via-indigo-500/18 to-emerald-500/15 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${emp.avatarColor} flex items-center justify-center font-black text-white text-sm`}
                >
                  {emp.avatarInitials}
                </div>
                <div>
                  <div className="text-xs font-black">{emp.name}</div>
                  <div className="text-[10px] text-cyan-300 font-semibold">{emp.role}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                SYNCED
              </span>
            </div>

            {/* Mobile Scrollable Body */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {tab === "home" && (
                <>
                  {/* One-Tap Biometric GPS Clock-In */}
                  <div className="p-4 rounded-2xl hr-subtle border border-indigo-500/25 text-center space-y-3">
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
                      {isId ? "Absensi Biometrik & GPS" : "Biometric GPS Attendance"}
                    </div>
                    <div className="text-3xl font-black font-mono">{nowClock}</div>
                    <div className="text-[11px] hr-muted flex items-center justify-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {emp.location} · Geofence OK
                    </div>
                    <button
                      onClick={handleMobileClockIn}
                      className="w-full btn-quantum py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2"
                    >
                      <Fingerprint className="w-5 h-5" />
                      {myAttendance
                        ? isId
                          ? `Sudah Clock-In (${myAttendance.clockIn}) — Update GPS`
                          : `Checked In (${myAttendance.clockIn}) — Refresh GPS`
                        : isId
                        ? "Tap untuk Clock-In Sekarang"
                        : "Tap to Clock-In Now"}
                    </button>
                  </div>

                  {/* Quick 2x2 Mobile Tiles */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setTab("payslip")}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left space-y-1.5"
                    >
                      <Wallet className="w-5 h-5 text-amber-400" />
                      <div className="text-xs font-bold">
                        {isId ? "Slip Gaji" : "My Payslip"}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono font-bold truncate">
                        {formatCurrency(payslip.netSalary, payslip.currency)}
                      </div>
                    </button>
                    <button
                      onClick={() => setTab("test")}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left space-y-1.5"
                    >
                      <BrainCircuit className="w-5 h-5 text-cyan-400" />
                      <div className="text-xs font-bold">Psikotes IQ</div>
                      <div className="text-[10px] text-cyan-300 font-mono">
                        Baseline IQ {emp.cognitiveIq}
                      </div>
                    </button>
                    <button
                      onClick={() => setTab("leave")}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left space-y-1.5"
                    >
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      <div className="text-xs font-bold">
                        {isId ? "Cuti & WFA" : "Leave & WFA"}
                      </div>
                      <div className="text-[10px] text-slate-400">12 days balance</div>
                    </button>
                    <button
                      onClick={() => setTab("badge")}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-left space-y-1.5"
                    >
                      <QrCode className="w-5 h-5 text-emerald-400" />
                      <div className="text-xs font-bold">Digital ID QR</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {emp.employeeCode}
                      </div>
                    </button>
                  </div>

                  {/* Quick HR Action */}
                  <button
                    onClick={() => openInviteModal()}
                    className="w-full p-3 rounded-2xl bg-emerald-500/12 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isId ? "Kirim Undangan Tes via WhatsApp / Email" : "Dispatch WA / Email Test Invite"}
                  </button>
                </>
              )}

              {tab === "badge" && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-indigo-600/20 to-emerald-500/20 border border-cyan-400/40 text-center space-y-4">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-bold">
                    AetherHR Global Smart Access Pass
                  </div>
                  <div className="flex justify-center">
                    <QrCodeSvg value={`AETHER-ID:${emp.employeeCode}:${emp.email}`} size={160} />
                  </div>
                  <div>
                    <div className="text-lg font-black">{emp.name}</div>
                    <div className="text-xs text-cyan-300 font-semibold">{emp.role}</div>
                    <div className="text-[11px] text-slate-300 font-mono mt-1">
                      {emp.employeeCode} · {emp.department}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Enterprise Access
                  </div>
                </div>
              )}

              {tab === "payslip" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/35">
                    <div className="text-[11px] text-slate-300">Net Take-Home (Nov 2026)</div>
                    <div className="text-2xl font-black font-mono text-emerald-300 mt-0.5">
                      {formatCurrency(payslip.netSalary, payslip.currency)}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-1">{payslip.taxRateLabel}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base Salary</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(payslip.baseSalary, payslip.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Allowances</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(payslip.allowances, payslip.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-300">
                      <span>Income Tax</span>
                      <span className="font-mono">
                        -{formatCurrency(payslip.incomeTax, payslip.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-300">
                      <span>BPJS / Social Sec</span>
                      <span className="font-mono">
                        -{formatCurrency(payslip.bpjsHealth + payslip.bpjsEmployment, payslip.currency)}
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
                    <MessageCircle className="w-4 h-4" /> Send Copy to WhatsApp
                  </a>
                </div>
              )}

              {tab === "leave" && (
                <div className="space-y-3">
                  <form
                    onSubmit={handleQuickLeave}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5"
                  >
                    <div className="text-xs font-bold">
                      {isId ? "Pengajuan Cuti Cepat (Mobile)" : "Quick Mobile Leave Request"}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(e.target.value)}
                      placeholder="Days"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs"
                    />
                    <input
                      required
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder={isId ? "Alasan cuti..." : "Leave reason..."}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full btn-quantum py-2.5 rounded-xl text-xs font-bold"
                    >
                      {isId ? "Ajukan Sekarang" : "Submit Leave"}
                    </button>
                  </form>
                  <div className="space-y-2">
                    {myLeaves.map((lv) => (
                      <div
                        key={lv.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold">{lv.type}</div>
                          <div className="text-[10px] text-slate-400">
                            {lv.startDate} ({lv.days}d)
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300">
                          {lv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "test" && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center mx-auto">
                    <BrainCircuit className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-black">
                      {isId ? "Mobile Psikotes & Kognitif" : "Mobile Cognitive & Psychometrics"}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isId
                        ? "Dioptimalkan penuh untuk layar sentuh smartphone dengan timer presisi & anti-cheat."
                        : "Touch-optimized assessment engine with precision timers & proctoring telemetry."}
                    </p>
                  </div>
                  <button
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
            <div className="px-3 py-2.5 bg-slate-950 border-t border-slate-800 grid grid-cols-5 gap-1">
              {[
                { id: "home" as const, icon: Home, label: "Home" },
                { id: "badge" as const, icon: CreditCard, label: "ID QR" },
                { id: "payslip" as const, icon: Wallet, label: "Pay" },
                { id: "leave" as const, icon: Clock, label: "Leave" },
                { id: "test" as const, icon: BrainCircuit, label: "Test" },
              ].map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex flex-col items-center py-1 rounded-xl text-[10px] font-bold transition ${
                      active ? "text-cyan-400 bg-cyan-500/12" : "text-slate-500"
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
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-black flex items-center gap-2 text-cyan-400">
              <CheckCircle2 className="w-5 h-5" />
              {isId
                ? "Arsitektur Dual Mobile App: Installable PWA + Native iOS/Android (Expo)"
                : "Dual Mobile Architecture: Installable PWA + Native iOS/Android (React Native Expo)"}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isId
                ? "AetherHR dilengkapi dua jalur aplikasi mobile modern yang langsung tersinkronisasi dengan API Vercel:"
                : "AetherHR ships two production mobile delivery paths synchronized live with your Vercel APIs:"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 space-y-2">
                <div className="text-xs font-black text-emerald-400">
                  1. Instant Installable PWA (/mobile)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Langsung dapat di-install ke Home Screen Android & iPhone tanpa App Store review. Mendukung manifest standalone, GPS Geolocation API, dan tampilan layar penuh.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-indigo-500/30 space-y-2">
                <div className="text-xs font-black text-indigo-300">
                  2. Standalone React Native + Expo App (/mobile-app)
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Kode sumber aplikasi native TypeScript lengkap di folder <code className="text-cyan-300">/mobile-app</code> di repository GitHub untuk kompilasi APK/AAB Android & IPA iOS via Expo EAS Build.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <QrCodeSvg value="https://hris-automation.vercel.app/mobile" size={140} />
            <div className="space-y-2 text-center sm:text-left">
              <div className="text-sm font-black">
                {isId ? "Scan untuk Buka Mobile App di HP Anda" : "Scan to Open Mobile App on Your Phone"}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isId
                  ? "Arahkan kamera iPhone atau Android ke QR Code ini untuk membuka AetherHR Mobile App secara instan dan memasangnya ke layar utama."
                  : "Point any iPhone or Android camera here to launch the live AetherHR Mobile PWA and add it to your Home Screen."}
              </p>
              <code className="inline-block px-3 py-1 rounded-lg bg-slate-900 text-[11px] text-cyan-300 font-mono">
                https://hris-automation.vercel.app/mobile
              </code>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-2">
            <div className="text-xs font-bold text-slate-300">
              React Native Expo Quickstart (GitHub Repo <code className="text-cyan-400">/mobile-app</code>)
            </div>
            <pre className="code-dark p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
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
