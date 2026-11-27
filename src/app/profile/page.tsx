"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  ShieldCheck,
  KeyRound,
  Wallet,
  Calendar,
  FileSignature,
  Clock,
  Send,
  CheckCircle2,
  Lock,
  LogOut,
  LogIn,
  Building2,
  MapPin,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { PERMISSION_CATALOG, ROLE_PERSONAS } from "@/lib/rbac";
import { calculateEmployeePayslip, formatCurrency } from "@/lib/payroll-engine";
import { formatConverted } from "@/lib/currency";
import { tRole, tStatus } from "@/lib/i18n";
import type { ProfileChangeRequest } from "@/types/hris";

export default function ProfileEssPage() {
  const router = useRouter();
  const {
    locale,
    displayCurrency,
    activeRole,
    authUser,
    currentEmployee,
    hasPermission,
    leaves,
    overtimeRequests,
    documents,
    profileChangeRequests,
    submitProfileChangeRequest,
    signOut,
  } = useHRIS();
  const isId = locale === "id";

  const [field, setField] = useState<ProfileChangeRequest["field"]>("Bank Account");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");

  const personalSlip = useMemo(
    () => calculateEmployeePayslip(currentEmployee, 0, 0),
    [currentEmployee]
  );

  const myLeaves = useMemo(
    () => leaves.filter((l) => l.employeeId === currentEmployee.id),
    [currentEmployee.id, leaves]
  );
  const usedAnnualDays = myLeaves
    .filter((l) => l.type === "Annual Leave" && l.status === "Approved")
    .reduce((s, l) => s + l.days, 0);
  const remainingLeaveDays = Math.max(0, 14 - usedAnnualDays);

  const myDocs = useMemo(
    () => documents.filter((d) => d.employeeId === currentEmployee.id),
    [currentEmployee.id, documents]
  );

  const myOvertime = useMemo(
    () => overtimeRequests.filter((o) => o.employeeId === currentEmployee.id),
    [currentEmployee.id, overtimeRequests]
  );

  const myChangeRequests = useMemo(
    () => profileChangeRequests.filter((r) => r.employeeId === currentEmployee.id),
    [currentEmployee.id, profileChangeRequests]
  );

  const grantedPermissions = useMemo(
    () => PERMISSION_CATALOG.filter((p) => hasPermission(p.key)),
    [hasPermission]
  );

  const currentFieldValue = (f: ProfileChangeRequest["field"]) => {
    switch (f) {
      case "Bank Account":
        return "BCA •••• 7741";
      case "Tax Status (PTKP)":
        return currentEmployee.taxStatus;
      case "Phone & WhatsApp":
        return `+${currentEmployee.phone}`;
      case "Emergency Contact":
        return "Family Contact · +62 811-2233-4455";
      case "Home Address":
        return currentEmployee.location;
    }
  };

  const handleSubmitChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !reason.trim()) return;
    submitProfileChangeRequest({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      department: currentEmployee.department,
      field,
      oldValue: currentFieldValue(field),
      newValue: newValue.trim(),
      reason: reason.trim(),
    });
    setNewValue("");
    setReason("");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <UserCircle2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {isId ? "Profil Akun & Self-Service Pribadi (ESS)" : "My Personal Account & Self-Service (ESS)"}
          </h1>
          <p className="text-xs sm:text-sm hr-muted mt-1">
            {isId
              ? "Ruang pribadi terisolasi untuk data kepegawaian, pengajuan perubahan rekening/PTKP (Maker–Checker HR), sesi MFA, dan hak akses RBAC Anda."
              : "Dedicated personal ESS workspace for your employment profile, bank/tax change requests (HR Maker–Checker), MFA session security, and active RBAC permissions."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/login"
            className="hr-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-600" />
            {isId ? "Ganti Akun" : "Switch Account"}
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold badge-danger flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            {isId ? "Keluar (Sign Out)" : "Sign Out"}
          </button>
        </div>
      </div>

      {/* Personal Identity Banner */}
      <div className="hr-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentEmployee.avatarColor} text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md`}
          >
            {authUser.avatarInitials}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold truncate">{authUser.name}</h2>
              <span className={`${ROLE_PERSONAS[activeRole].badgeClass} px-2.5 py-0.5 rounded-full text-[10px] font-bold`}>
                {tRole(activeRole, locale)}
              </span>
              <span className="badge-success px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> MFA Verified
              </span>
            </div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {currentEmployee.role} · {currentEmployee.department} · {currentEmployee.employeeCode}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] hr-muted">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {authUser.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> +{currentEmployee.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {currentEmployee.location}</span>
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {authUser.companyName}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl hr-subtle text-xs space-y-1 shrink-0 min-w-[210px]">
          <div className="hr-muted font-medium">
            {isId ? `Estimasi Gaji Bersih (${displayCurrency})` : `Personal Net Take-Home (${displayCurrency})`}
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {formatConverted(personalSlip.netSalary, personalSlip.currency, displayCurrency)}
          </div>
          {personalSlip.currency !== displayCurrency && (
            <div className="text-[10px] hr-muted font-mono">
              ({formatCurrency(personalSlip.netSalary, personalSlip.currency)})
            </div>
          )}
          <Link
            href="/payroll"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
          >
            <Wallet className="w-3.5 h-3.5" />
            {isId ? "Buka Slip Gaji PDF →" : "Open Digital Payslip →"}
          </Link>
        </div>
      </div>

      {/* Personal ESS Quick KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/attendance" className="hr-card hr-card-hover rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs hr-muted">
            <span>{isId ? "Sisa Kuota Cuti Tahunan" : "Annual Leave Balance"}</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold mt-1 tabular-nums">
            {remainingLeaveDays} <span className="text-xs font-normal hr-muted">/ 14 {isId ? "Hari" : "Days"}</span>
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
            {isId ? "Ajukan Cuti / WFA →" : "Request Leave / WFA →"}
          </div>
        </Link>

        <Link href="/attendance" className="hr-card hr-card-hover rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs hr-muted">
            <span>{isId ? "Lembur SPL Saya" : "My Overtime (SPL)"}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold mt-1 tabular-nums">
            {myOvertime.reduce((s, o) => s + o.hours, 0)} <span className="text-xs font-normal hr-muted">{isId ? "Jam" : "Hrs"}</span>
          </div>
          <div className="text-[11px] hr-muted mt-1">
            {myOvertime.filter((o) => o.syncedToPayroll).length} {isId ? "tersinkron ke Payroll" : "synced to Payroll"}
          </div>
        </Link>

        <Link href="/documents" className="hr-card hr-card-hover rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs hr-muted">
            <span>{isId ? "Dokumen & Kontrak Saya" : "My Contracts & Docs"}</span>
            <FileSignature className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold mt-1 tabular-nums">{myDocs.length}</div>
          <div className="text-[11px] hr-muted mt-1">
            {isId ? "Status PTKP:" : "PTKP Tax Code:"} <strong className="font-mono">{currentEmployee.taxStatus}</strong>
          </div>
        </Link>

        <div className="hr-card rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs hr-muted">
            <span>{isId ? "Skor Kinerja & IQ Profil" : "Performance & IQ Index"}</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold mt-1 tabular-nums">
            {currentEmployee.performanceScore}%
          </div>
          <div className="text-[11px] hr-muted mt-1">
            IQ {currentEmployee.cognitiveIq || 126} · DISC {currentEmployee.discProfile || "D-C"}
          </div>
        </div>
      </div>

      {/* Main Split: ESS Data Change Request (Maker-Checker) + Active RBAC & Session Security */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Self-Service Data Change Request */}
        <div className="lg:col-span-7 hr-card rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {isId
                ? "Pengajuan Perubahan Data Pribadi (Verifikasi HR)"
                : "Self-Service Data Change Request (HR Maker–Checker)"}
            </h2>
            <p className="text-xs hr-muted mt-1">
              {isId
                ? "Perubahan rekening payroll, status pajak PTKP, nomor WhatsApp, atau kontak darurat diverifikasi oleh HR Admin sebelum aktif di Payroll & tercatat di Audit Log."
                : "Updates to payroll bank account, PTKP tax status, phone, or emergency contacts are verified by HR Admin and recorded in the SHA-256 Audit Trail."}
            </p>
          </div>

          <form onSubmit={handleSubmitChange} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold hr-muted mb-1">
                  {isId ? "Field Data yang Diubah" : "Profile Field"}
                </label>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value as ProfileChangeRequest["field"])}
                  className="w-full px-3 py-2.5 rounded-xl hr-input font-semibold"
                >
                  <option value="Bank Account">{isId ? "Rekening Bank Payroll" : "Bank Account"}</option>
                  <option value="Tax Status (PTKP)">{isId ? "Status Pajak (PTKP)" : "Tax Status (PTKP)"}</option>
                  <option value="Phone & WhatsApp">{isId ? "Nomor Telepon & WhatsApp" : "Phone & WhatsApp"}</option>
                  <option value="Emergency Contact">{isId ? "Kontak Darurat" : "Emergency Contact"}</option>
                  <option value="Home Address">{isId ? "Alamat Domisili" : "Home Address"}</option>
                </select>
              </div>
              <div>
                <label className="block font-bold hr-muted mb-1">
                  {isId ? "Nilai Saat Ini (Tercatat)" : "Current Value on Record"}
                </label>
                <div className="w-full px-3 py-2.5 rounded-xl hr-subtle font-mono font-semibold truncate">
                  {currentFieldValue(field)}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold hr-muted mb-1">
                {isId ? "Nilai Baru yang Diajukan *" : "Requested New Value *"}
              </label>
              {field === "Tax Status (PTKP)" ? (
                <select
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl hr-input font-mono font-bold"
                >
                  <option value="">{isId ? "-- Pilih PTKP Baru --" : "-- Select New PTKP --"}</option>
                  <option value="TK/0">TK/0 — Tidak Kawin, 0 Tanggungan</option>
                  <option value="TK/1">TK/1 — Tidak Kawin, 1 Tanggungan</option>
                  <option value="K/0">K/0 — Kawin, 0 Tanggungan</option>
                  <option value="K/1">K/1 — Kawin, 1 Tanggungan</option>
                  <option value="K/2">K/2 — Kawin, 2 Tanggungan</option>
                  <option value="K/3">K/3 — Kawin, 3 Tanggungan</option>
                </select>
              ) : (
                <input
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={
                    field === "Bank Account"
                      ? "e.g. Mandiri 124-00-9881223 a/n " + currentEmployee.name
                      : field === "Phone & WhatsApp"
                      ? "e.g. 6281299887766"
                      : isId
                      ? "Masukkan data terbaru..."
                      : "Enter updated value..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                />
              )}
            </div>

            <div>
              <label className="block font-bold hr-muted mb-1">
                {isId ? "Alasan / Dokumen Pendukung *" : "Reason / Supporting Reference *"}
              </label>
              <input
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isId
                    ? "Contoh: Perubahan rekening utama / lampiran KK terbaru"
                    : "e.g. Updated payroll bank account / tax family card attached"
                }
                className="w-full px-3.5 py-2.5 rounded-xl hr-input"
              />
            </div>

            <button
              type="submit"
              className="btn-quantum w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isId ? "Ajukan Perubahan Data ke HR" : "Submit Data Change to HR"}
            </button>
          </form>

          {/* My Request History */}
          <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="text-xs font-bold hr-muted">
              {isId ? `Riwayat Pengajuan Saya (${myChangeRequests.length})` : `My Change Requests (${myChangeRequests.length})`}
            </div>
            {myChangeRequests.length === 0 ? (
              <div className="text-xs hr-muted py-3">
                {isId ? "Belum ada pengajuan perubahan data." : "No profile change requests submitted yet."}
              </div>
            ) : (
              myChangeRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-xl hr-subtle flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold">
                      {req.field}: <span className="hr-muted line-through">{req.oldValue}</span> →{" "}
                      <span className="text-indigo-600 dark:text-indigo-400">{req.newValue}</span>
                    </div>
                    <div className="text-[11px] hr-muted truncate">{req.reason}</div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      req.status === "Approved"
                        ? "badge-success"
                        : req.status === "Rejected"
                        ? "badge-danger"
                        : "badge-warning"
                    }`}
                  >
                    {tStatus(req.status, locale)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Session Security & Granular RBAC Permissions */}
        <div className="lg:col-span-5 hr-card rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {isId ? "Keamanan Sesi & Hak Akses RBAC Aktif" : "Session Security & Active RBAC Scope"}
          </h2>

          <div className="p-3.5 rounded-xl hr-subtle space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="hr-muted">{isId ? "Protokol Sesi" : "Session Protocol"}</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                HttpOnly HMAC-SHA256
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="hr-muted">{isId ? "Enkripsi Password" : "Password Hashing"}</span>
              <span className="font-mono font-bold">scrypt (16B Salt)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="hr-muted">{isId ? "Role Akses Aktif" : "Active Role Tier"}</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{tRole(activeRole, locale)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="hr-muted">{isId ? "Atasan Langsung" : "Reporting Manager"}</span>
              <span className="font-semibold">{currentEmployee.managerName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>
                {isId ? "Izin Modul Aktif" : "Granted Permissions"} ({grantedPermissions.length}/{PERMISSION_CATALOG.length})
              </span>
              {hasPermission("audit:view") && (
                <Link href="/audit-logs" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                  {isId ? "Lihat Matriks →" : "Open Matrix →"}
                </Link>
              )}
            </div>

            {grantedPermissions.length === 0 ? (
              <div className="p-3.5 rounded-xl badge-info text-xs flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isId
                    ? "Mode Employee Self-Service (ESS): Akses dibatasi ketat pada data pribadi Anda (Slip Gaji sendiri, Absensi/Cuti sendiri, Reimburse & Kontrak pribadi)."
                    : "Employee Self-Service (ESS) Mode: Strictly scoped to your personal payslips, attendance/leave, expenses, and contracts."}
                </span>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {grantedPermissions.map((perm) => (
                  <div
                    key={perm.key}
                    className="px-3 py-2 rounded-lg hr-subtle text-[11px] flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium flex-1 truncate">{perm.label[locale]}</span>
                    <span className="font-mono text-[9px] hr-muted shrink-0">{perm.key}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
