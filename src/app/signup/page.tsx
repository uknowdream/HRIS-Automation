"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { ALL_ROLES } from "@/lib/rbac";
import { tRole } from "@/lib/i18n";
import type { ActiveRole, Currency } from "@/types/hris";

export default function SignUpPage() {
  const router = useRouter();
  const {
    locale,
    setLocale,
    setIsAuthenticated,
    setAuthUser,
    setActiveRole,
    setDisplayCurrency,
    addEmployee,
    updateSettings,
    recordAuditLog,
    pushToast,
    pushNotification,
  } = useHRIS();
  const isId = locale === "id";

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [role, setRole] = useState<ActiveRole>("Super Admin");
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState<Currency>("IDR");
  const [teamSize, setTeamSize] = useState("50–250");
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
      if (name.trim().length < 2) {
        setError(isId ? "Nama lengkap minimal 2 karakter." : "Full name must be at least 2 characters.");
        return;
      }
      if (password.length < 8) {
        setError(
          isId
            ? "Kata sandi minimal 8 karakter untuk standar keamanan HRIS."
            : "Password must be at least 8 characters."
        );
        return;
      }
      if (password !== confirmPwd) {
        setError(
          isId
            ? "Konfirmasi kata sandi tidak cocok."
            : "Password confirmation does not match."
        );
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
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          currency,
          companyName: companyName.trim() || "AetherHR Enterprise",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || (isId ? "Gagal mendaftar akun." : "Sign up failed."));
      }

      setIsAuthenticated(true);
      setAuthUser(data.user);
      setActiveRole(data.user.role);
      setDisplayCurrency(currency);
      updateSettings({
        companyName: data.user.companyName,
        defaultCurrency: currency,
      });

      // Also provision an employee directory record matching the newly registered user!
      addEmployee({
        name: data.user.name,
        email: data.user.email,
        phone: "6281200000001",
        role:
          role === "Super Admin"
            ? "Founder & Chief Executive"
            : role === "HR Admin"
            ? "Head of People Operations"
            : role === "Finance & Payroll"
            ? "Finance & Payroll Lead"
            : role === "Department Manager"
            ? "Department Lead"
            : "Team Specialist",
        department:
          role === "Finance & Payroll"
            ? "Finance & Legal"
            : role === "HR Admin"
            ? "People & HR Tech"
            : "Engineering",
        location: currency === "SGD" ? "Singapore, SG" : currency === "USD" ? "San Francisco, US" : "Jakarta, ID",
        country: currency === "SGD" ? "Singapore" : currency === "USD" ? "United States" : "Indonesia",
        timezone: "Asia/Jakarta (UTC+7)",
        employmentType: "Full-Time",
        status: "Active",
        joinDate: new Date().toISOString().slice(0, 10),
        managerName: "Board",
        baseSalary: currency === "IDR" ? 35000000 : 8500,
        allowances: currency === "IDR" ? 5000000 : 1000,
        currency,
        taxStatus: "TK/0",
        cognitiveIq: 130,
        discProfile: "D-I",
        performanceScore: 95,
        potentialScore: 94,
        attendanceRate: 100,
        skills: ["Workspace Owner", "Enterprise HRIS"],
      });

      recordAuditLog({
        module: "Auth & Session",
        action: "auth.workspace_registered",
        target: `${data.user.companyName} (${data.user.email})`,
        severity: "SENSITIVE",
        detail: `Registered new scrypt-protected account as ${data.user.role} with primary currency ${currency}.`,
        actorOverride: {
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        },
      });

      pushNotification({
        title: isId ? "Workspace & Akun Berhasil Dibuat" : "Enterprise Workspace Provisioned",
        message: isId
          ? `${data.user.companyName} (${currency}) aktif dengan role ${tRole(data.user.role, "id")}. Anda dapat Sign Out & Login kembali kapan saja.`
          : `${data.user.companyName} (${currency}) provisioned as ${data.user.role}.`,
        category: "security",
        href: "/settings",
      });
      pushToast({
        title: isId ? "Registrasi Berhasil!" : "Workspace Created!",
        description: `${data.user.companyName} · ${currency} · ${tRole(data.user.role, locale)}`,
        variant: "success",
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : isId ? "Registrasi gagal" : "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f4f6fb] dark:bg-[#090d16]">
      <div className="w-full max-w-lg hr-card rounded-3xl p-7 sm:p-9 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center">
              A
            </div>
            <div>
              <div className="font-extrabold text-sm">AetherHR Enterprise</div>
              <div className="text-[11px] hr-muted">
                {isId ? `Langkah ${step} dari 2 · Pendaftaran Workspace` : `Step ${step} of 2 · Workspace Setup`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === "id" ? "en" : "id")}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              {locale.toUpperCase()}
            </button>
            <Link href="/login" className="text-xs font-bold text-indigo-600 hover:underline">
              {isId ? "Masuk (Sign In)" : "Sign In"}
            </Link>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-indigo-600" : "bg-slate-200"}`} />
          <div
            className={`h-1.5 flex-1 rounded-full ${
              step >= 2 ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {step === 1
              ? isId
                ? "Buat Akun HRIS Baru"
                : "Create Your HRIS Account"
              : isId
              ? "Konfigurasi Perusahaan, Role & Mata Uang"
              : "Configure Organization, Role & Currency"}
          </h1>
          <p className="text-xs hr-muted mt-1">
            {step === 1
              ? isId
                ? "Dilindungi enkripsi password scrypt + sesi HttpOnly HMAC-SHA256 (bisa digunakan login ulang kapan saja)."
                : "Protected by scrypt password hashing and HttpOnly HMAC-SHA256 sessions."
              : isId
              ? "Mata uang & role yang Anda pilih langsung disinkronkan ke seluruh modul Payroll, Reimburse, dan Dashboard."
              : "Your chosen currency and RBAC role immediately synchronize across Payroll, Expenses, and Dashboard."}
          </p>
        </div>

        {error && <div className="p-3 rounded-xl badge-danger text-xs font-semibold">{error}</div>}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold block">
                  {isId ? "Nama Lengkap *" : "Full Name *"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isId ? "mis. Budi Santoso" : "e.g. Alex Carter"}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm hr-input"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold block">
                  {isId ? "Email Kerja *" : "Work Email *"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@perusahaan.co.id"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm hr-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold block">
                    {isId ? "Kata Sandi (Min. 8 karakter) *" : "Password (Min. 8 chars) *"}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Rahasia@2026"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm hr-input"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold block">
                    {isId ? "Ulangi Kata Sandi *" : "Confirm Password *"}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Rahasia@2026"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm hr-input"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 pt-0.5">
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
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold block">
                  {isId ? "Nama Resmi Perusahaan *" : "Company Legal Name *"}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="PT Nusantara Teknologi Global"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm hr-input"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold block">
                  {isId ? "Pilih Role Akses Akun (RBAC)" : "Select Account RBAC Role"}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ActiveRole)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-bold hr-input"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {tRole(r, locale)} ({r})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold block">
                    {isId ? "Mata Uang Utama" : "Primary Currency"}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold hr-input"
                  >
                    <option value="IDR">IDR (Rupiah · PPh 21)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="SGD">SGD (Singapore · CPF)</option>
                    <option value="EUR">EUR (Euro Eropa)</option>
                    <option value="GBP">GBP (Poundsterling)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold block">
                    {isId ? "Skala Karyawan" : "Organization Size"}
                  </label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold hr-input"
                  >
                    <option value="1–50">{isId ? "1–50 Karyawan" : "1–50 Employees"}</option>
                    <option value="50–250">{isId ? "50–250 Karyawan" : "50–250 Employees"}</option>
                    <option value="250–1,000">{isId ? "250–1.000 Karyawan" : "250–1,000 Employees"}</option>
                    <option value="1,000+">{isId ? "1.000+ Enterprise" : "1,000+ Enterprise"}</option>
                  </select>
                </div>
              </div>
              <div className="p-3 rounded-xl hr-subtle text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isId
                    ? "Termasuk 104 Soal Psikotes & Kognitif, Otomatisasi WA/Email, Audit Log SHA-256 & Mobile PWA."
                    : "Includes 104-Item Psychometric Suite, WA/Email Automation, SHA-256 Audit Logs & Mobile PWA."}
                </span>
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
                ← {isId ? "Kembali" : "Back"}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-quantum flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading
                ? isId
                  ? "Menyiapkan Workspace..."
                  : "Provisioning Workspace..."
                : step === 1
                ? isId
                  ? "Lanjut: Data Perusahaan & Mata Uang"
                  : "Next: Company & Currency Setup"
                : isId
                ? "Buat Akun & Masuk Sekarang"
                : "Create Account & Launch"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[11px] hr-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          {isId
            ? "Dilindungi Standar Keamanan OWASP Top 10 & Sesi Zero-Trust"
            : "Protected by OWASP Top 10 Security Headers & Zero-Trust Sessions"}
        </div>
      </div>
    </div>
  );
}
