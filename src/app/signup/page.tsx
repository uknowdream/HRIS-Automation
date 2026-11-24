"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Building2, User, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import type { Currency } from "@/types/hris";

export default function SignUpPage() {
  const router = useRouter();
  const { locale, setAuthUser, setActiveRole, updateSettings, pushToast, pushNotification } = useHRIS();
  const isId = locale === "id";

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState<Currency>("IDR");
  const [teamSize, setTeamSize] = useState("50–250 Employees");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (step === 1) {
      if (password.length < 8) {
        setError(isId ? "Password minimal 8 karakter untuk standar keamanan HRIS." : "Password must be at least 8 characters.");
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName: companyName || "AetherHR Enterprise",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Sign up failed");

      setAuthUser(data.user);
      setActiveRole("HR Admin");
      updateSettings({
        companyName: data.user.companyName,
        defaultCurrency: currency,
      });
      pushNotification({
        title: isId ? "Workspace Baru Berhasil Dibuat" : "Enterprise Workspace Provisioned",
        message: `${data.user.companyName} (${teamSize}) ready with 104-item Psychometric Suite & Automation Hub.`,
        category: "security",
        href: "/settings",
      });
      pushToast({
        title: isId ? "Registrasi Berhasil!" : "Workspace Created!",
        description: `Welcome to ${data.user.companyName}`,
        variant: "success",
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f4f6fb] dark:bg-[#090d16]">
      <div className="w-full max-w-lg hr-card rounded-3xl p-7 sm:p-9 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center">A</div>
            <div>
              <div className="font-extrabold text-sm">AetherHR Enterprise</div>
              <div className="text-[11px] hr-muted">Step {step} of 2 · Workspace Provisioning</div>
            </div>
          </div>
          <Link href="/login" className="text-xs font-bold text-indigo-600 hover:underline">
            {isId ? "Sudah punya akun? Sign In" : "Sign In"}
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-indigo-600" : "bg-slate-200"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"}`} />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {step === 1
              ? isId
                ? "Buat Akun Admin HRIS"
                : "Create HRIS Admin Account"
              : isId
              ? "Konfigurasi Entitas Perusahaan"
              : "Configure Company Entity"}
          </h1>
          <p className="text-xs hr-muted mt-1">
            {step === 1
              ? isId
                ? "Enkripsi password scrypt + sesi HttpOnly HMAC-SHA256."
                : "Protected by scrypt hashing and HttpOnly HMAC-SHA256 sessions."
              : isId
              ? "Otomatis menyiapkan struktur Payroll, Pajak & Psikotes untuk tim Anda."
              : "Automatically configures multi-currency payroll, tax rules, and psychometric batteries."}
          </p>
        </div>

        {error && <div className="p-3 rounded-xl badge-danger text-xs font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold block">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Teuku Saiful"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm hr-input"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">Work Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm hr-input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold block">Password (Min. 8 chars) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="StrongPassword@2026"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm hr-input"
                  />
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[1, 2, 3, 4].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-1 flex-1 rounded-full ${
                        strength >= lvl
                          ? strength >= 3
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                          : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold block">Company Legal Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="PT Nusantara Tech Global"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm hr-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold block">Primary Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold hr-input"
                  >
                    <option value="IDR">IDR (Indonesia · PPh 21)</option>
                    <option value="USD">USD (Global / US)</option>
                    <option value="SGD">SGD (Singapore · CPF)</option>
                    <option value="EUR">EUR (European Union)</option>
                    <option value="GBP">GBP (United Kingdom)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold block">Organization Size</label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold hr-input"
                  >
                    <option>1–50 Employees</option>
                    <option>50–250 Employees</option>
                    <option>250–1,000 Employees</option>
                    <option>1,000+ Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="p-3 rounded-xl hr-subtle text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Includes 104-Item Cognitive/Psychometric Suite, WA/Email Automation & Mobile PWA.</span>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 pt-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl text-xs font-bold hr-btn-secondary"
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-quantum flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading
                ? "Provisioning Workspace..."
                : step === 1
                ? isId
                  ? "Lanjut: Data Perusahaan"
                  : "Next: Company Setup"
                : isId
                ? "Buat Workspace & Masuk"
                : "Create Workspace & Launch"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[11px] hr-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Protected by OWASP Top 10 Security Headers & Zero-Trust Sessions
        </div>
      </div>
    </div>
  );
}
