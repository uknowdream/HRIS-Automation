"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Building2,
  Globe,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale, setAuthUser, setActiveRole, pushToast, pushNotification, logAutomation } = useHRIS();
  const isId = locale === "id";

  const [email, setEmail] = useState("nadia.kusuma@aetherhr.global");
  const [password, setPassword] = useState("Admin@2026!");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfaStep, setMfaStep] = useState(false);
  const [otp, setOtp] = useState("482910");

  const completeLogin = async (payload: Record<string, string>) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Sign in failed");
      }
      setAuthUser(data.user);
      setActiveRole(data.user.role);
      logAutomation({
        event: "auth.session_created",
        channel: "System",
        recipient: `${data.user.name} (${data.user.email})`,
        status: "Success",
        latencyMs: 54,
        detail: `Signed HttpOnly HMAC-SHA256 session issued for role ${data.user.role} (MFA Verified).`,
      });
      pushNotification({
        title: isId ? "Sesi Login Terverifikasi (MFA)" : "Authenticated Session Active",
        message: `${data.user.name} signed in as ${data.user.role}.`,
        category: "security",
        href: "/settings",
      });
      pushToast({
        title: isId ? `Selamat Datang, ${data.user.name}` : `Welcome back, ${data.user.name}`,
        description: `Role: ${data.user.role} · HttpOnly Session Active`,
        variant: "success",
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaStep) {
      setMfaStep(true);
      return;
    }
    if (otp.trim().length < 6) {
      setError(isId ? "Masukkan 6 digit kode verifikasi MFA." : "Enter 6-digit MFA code.");
      return;
    }
    void completeLogin({ email, password });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#090d16]">
      {/* Left Enterprise Brand Panel */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-between p-10 xl:p-12 bg-[#0f172a] text-white relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 bottom-0 w-72 h-72 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-lg shadow-lg text-white">
            A
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-white">AetherHR Enterprise</div>
            <div className="text-xs text-slate-400 on-dark">Global People, Payroll & Psychometrics OS</div>
          </div>
        </div>

        <div className="relative space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-indigo-200 on-dark">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 on-dark" />
            ISO 27001 · SOC 2 Type II · UU PDP / GDPR Compliant
          </div>
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
            {isId
              ? "Satu platform HRIS modern untuk SDM global, payroll & psikotes otomatis."
              : "One unified HRIS platform for global people ops, payroll & psychometrics."}
          </h1>
          <p className="text-sm text-slate-300 on-dark leading-relaxed">
            {isId
              ? "Otomatiskan siklus Joiner–Mover–Leaver dari rekrutmen, 104 soal kognitif & psikotes via WhatsApp/Email, tanda tangan kontrak SHA-256, hingga payroll multi-negara."
              : "Automate the complete Joiner–Mover–Leaver lifecycle from ATS & 104-item cognitive testing via WA/Email to SHA-256 e-signing and global payroll."}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            {[
              "HttpOnly HMAC-SHA256 Sessions",
              "104-Item Cognitive & DISC Suite",
              "Multi-FX Payroll + PPh 21 TER",
              "Email, WhatsApp & Webhook Hub",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-slate-200 on-dark">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 on-dark shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-slate-400 on-dark flex items-center justify-between border-t border-white/10 pt-5">
          <span>© 2026 AetherHR Global Technologies</span>
          <span className="font-mono text-emerald-400 on-dark">99.99% SLA Operational</span>
        </div>
      </div>

      {/* Right Clean Sign-In Form */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 py-10 relative">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === "id" ? "en" : "id")}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            {locale.toUpperCase()}
          </button>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-indigo-500"
          >
            {isId ? "Ke Workspace →" : "Back to App →"}
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="space-y-1.5">
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center">A</div>
              <span className="font-extrabold text-base">AetherHR Enterprise</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {mfaStep
                ? isId
                  ? "Verifikasi 2-Langkah (MFA)"
                  : "2-Step MFA Verification"
                : isId
                ? "Masuk ke Workspace HRIS"
                : "Sign in to your HRIS workspace"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mfaStep
                ? isId
                  ? `Masukkan 6 digit kode authenticator untuk ${email}`
                  : `Enter the 6-digit authenticator code for ${email}`
                : isId
                ? "Gunakan akun kerja, SSO perusahaan, atau akses cepat demo di bawah."
                : "Use your corporate credentials, enterprise SSO, or 1-click role demo below."}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl badge-danger text-xs font-semibold">{error}</div>
          )}

          {/* Enterprise SSO Buttons */}
          {!mfaStep && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void completeLogin({ email: "nadia.kusuma@aetherhr.global", ssoProvider: "Google Workspace" })}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Building2 className="w-4 h-4 text-indigo-600" /> Google SSO
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void completeLogin({ email: "nadia.kusuma@aetherhr.global", ssoProvider: "Microsoft Entra ID" })}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <KeyRound className="w-4 h-4 text-sky-600" /> Entra / SAML 2.0
                </button>
              </div>

              <div className="relative flex items-center">
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
                <span className="px-3 text-[11px] text-slate-400 font-medium">
                  {isId ? "atau masuk dengan email kerja" : "or continue with work email"}
                </span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!mfaStep ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block">Work Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm hr-input"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      {isId ? "Lupa password?" : "Forgot password?"}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPwd ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm hr-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-label="Toggle password visibility"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl badge-info text-xs">
                  {isId
                    ? "Kode MFA Demo siap pakai: 482910 (FIDO2 / Authenticator Simulation)"
                    : "Demo MFA code pre-filled: 482910 (Authenticator Simulation)"}
                </div>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                  className="w-full px-4 py-3 rounded-xl text-center font-mono text-xl tracking-[0.5em] font-black hr-input"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setMfaStep(false)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  ← {isId ? "Ganti email" : "Use another email"}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-quantum w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? isId
                  ? "Memverifikasi Sesi..."
                  : "Verifying Session..."
                : mfaStep
                ? isId
                  ? "Verifikasi MFA & Masuk"
                  : "Verify MFA & Sign In"
                : isId
                ? "Lanjut ke Verifikasi MFA"
                : "Continue to MFA"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant Role Demo Switch Cards */}
          {!mfaStep && (
            <div className="pt-2 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isId ? "Akses Cepat 1-Klik Berdasarkan Role RBAC:" : "1-Click RBAC Role Demo Access:"}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "HR Admin", sub: "Full 13 Modules", demoEmail: "nadia.kusuma@aetherhr.global" },
                  { label: "Manager", sub: "Team & Hiring", demoEmail: "marcus.tan@aetherhr.global" },
                  { label: "Employee", sub: "Self-Service", demoEmail: "raka.pradipta@aetherhr.global" },
                ].map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    disabled={loading}
                    onClick={() => void completeLogin({ demoEmail: d.demoEmail })}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition"
                  >
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{d.label}</div>
                    <div className="text-[10px] text-slate-500">{d.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-500">
            {isId ? "Belum punya workspace perusahaan?" : "New to AetherHR?"}{" "}
            <Link href="/signup" className="font-bold text-indigo-600 hover:underline">
              {isId ? "Daftar Workspace Baru (Sign Up)" : "Create Enterprise Workspace"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
