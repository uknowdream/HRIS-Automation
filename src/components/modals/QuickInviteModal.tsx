"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Mail,
  MessageCircle,
  Send,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Sparkles,
  Clock,
  QrCode,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { ASSESSMENT_BATTERIES, ASSESSMENT_PRESETS } from "@/lib/psychometrics";
import type { AssessmentCategory, CandidateInvitation } from "@/types/hris";
import { QrCodeSvg } from "@/components/visuals/Charts";

interface DispatchResult {
  invitation: CandidateInvitation;
  delivery: {
    emailDetail: string;
    whatsappDetail: string;
    mailtoUrl: string;
    whatsappLaunchUrl: string;
    whatsappMessageText: string;
    emailSubject: string;
    webhookDispatched: boolean;
  };
}

export function QuickInviteModal() {
  const {
    inviteModalOpen,
    invitePrefill,
    closeInviteModal,
    locale,
    settings,
    recordInvitation,
    pushToast,
  } = useHRIS();

  const isId = locale === "id";
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [presetId, setPresetId] = useState("executive-full");
  const [customCategories, setCustomCategories] = useState<AssessmentCategory[]>([
    "numerical",
    "verbal",
    "abstract",
    "spatial",
    "speed",
    "big5",
    "disc",
    "sjt",
  ]);
  const [durationMinutes, setDurationMinutes] = useState(85);
  const [expiryHours, setExpiryHours] = useState(72);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [proctoringStrict, setProctoringStrict] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<DispatchResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (inviteModalOpen) {
      setCandidateName(invitePrefill?.candidateName || "");
      setCandidateEmail(invitePrefill?.candidateEmail || "");
      setCandidatePhone(invitePrefill?.candidatePhone || "");
      setRole(invitePrefill?.role || "");
      setDepartment(invitePrefill?.department || "Engineering");
      setProctoringStrict(settings.enableStrictProctoringDefault);
      setResult(null);
      setErrorMsg("");
      setCustomMessage("");
    }
  }, [inviteModalOpen, invitePrefill, settings.enableStrictProctoringDefault]);

  if (!inviteModalOpen) return null;

  const handlePresetSelect = (id: string) => {
    setPresetId(id);
    const p = ASSESSMENT_PRESETS.find((item) => item.id === id);
    if (p) {
      setCustomCategories(p.categories);
      setDurationMinutes(p.durationMinutes);
    }
  };

  const toggleCategory = (cat: AssessmentCategory) => {
    setCustomCategories((prev) => {
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      if (next.length === 0) return prev;
      const mins = next.reduce((sum, c) => {
        const meta = ASSESSMENT_BATTERIES.find((b) => b.id === c);
        return sum + (meta?.durationMinutes || 10);
      }, 0);
      setDurationMinutes(mins);
      return next;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!candidateName.trim() || !role.trim()) {
      setErrorMsg(
        isId ? "Nama kandidat dan posisi wajib diisi." : "Candidate name and role are required."
      );
      return;
    }
    const channels: ("Email" | "WhatsApp")[] = [];
    if (sendEmail) channels.push("Email");
    if (sendWhatsApp) channels.push("WhatsApp");
    if (channels.length === 0) {
      setErrorMsg(
        isId
          ? "Pilih minimal 1 kanal pengiriman (Email atau WhatsApp)."
          : "Select at least 1 delivery channel."
      );
      return;
    }

    setSending(true);
    try {
      const activePreset = ASSESSMENT_PRESETS.find((p) => p.id === presetId);
      const res = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: invitePrefill?.candidateId,
          candidateName,
          candidateEmail,
          candidatePhone,
          role,
          department,
          companyName: settings.companyName,
          presetId,
          categories: customCategories,
          durationMinutes,
          expressLimitPerCategory:
            presetId === "express-screening" ? activePreset?.expressLimitPerCategory : undefined,
          expiryHours,
          proctoringStrict,
          channels,
          locale,
          customMessage: customMessage.trim() || undefined,
          config: {
            resendApiKey: settings.resendApiKey,
            resendFromEmail: settings.resendFromEmail,
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpUser: settings.smtpUser,
            smtpPass: settings.smtpPass,
            whatsappMode: settings.whatsappMode,
            whatsappAccessToken: settings.whatsappAccessToken,
            whatsappPhoneNumberId: settings.whatsappPhoneNumberId,
            whatsappGatewayUrl: settings.whatsappGatewayUrl,
            whatsappGatewayToken: settings.whatsappGatewayToken,
            primaryWebhookUrl: settings.primaryWebhookUrl,
            webhookSecret: settings.webhookSecret,
            slackWebhookUrl: settings.slackWebhookUrl,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Dispatch failed");
      }
      recordInvitation(data.invitation);
      setResult(data);
      pushToast({
        title: isId ? "Undangan Terenkripsi Dibuat & Dikirim!" : "Encrypted Invitation Dispatched!",
        description: `${candidateName} — ${channels.join(" + ")}`,
        variant: "success",
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to dispatch invitation");
    } finally {
      setSending(false);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Automated Assessment Invitation Dispatcher"
      onClick={closeInviteModal}
    >
      <div
        className="relative w-full max-w-3xl hr-card rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b hr-subtle"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                {isId
                  ? "Otomatisasi Undangan Tes Kognitif & Psikotes (Email + WA)"
                  : "Automated Cognitive & Psychometric Invite (Email + WhatsApp)"}
              </h2>
              <p className="text-xs hr-muted">
                {isId
                  ? "Link terenkripsi HMAC-SHA256 otomatis aktif lintas perangkat + QR + Kalender .ICS"
                  : "Stateless HMAC-SHA256 signed links work across any device + QR + .ICS Calendar"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeInviteModal}
            className="p-2 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 hr-muted transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!result ? (
            <form onSubmit={handleSend} className="space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-xl badge-danger text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Candidate Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold hr-muted mb-1.5">
                    {isId ? "Nama Lengkap Kandidat *" : "Candidate Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Putri Maharani"
                    className="w-full px-3.5 py-2.5 rounded-xl hr-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold hr-muted mb-1.5">
                    {isId ? "Posisi / Jabatan *" : "Target Position / Role *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl hr-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold hr-muted mb-1.5">
                    {isId ? "Alamat Email Kandidat" : "Candidate Email Address"}
                  </label>
                  <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="kandidat@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl hr-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold hr-muted mb-1.5">
                    {isId ? "Nomor WhatsApp (Kode Negara / 08...)" : "WhatsApp Number (Country Code)"}
                  </label>
                  <input
                    type="tel"
                    value={candidatePhone}
                    onChange={(e) => setCandidatePhone(e.target.value)}
                    placeholder={isId ? "6281234567890 atau 08123456789" : "e.g. 6281234567890"}
                    className="w-full px-3.5 py-2.5 rounded-xl hr-input text-sm"
                  />
                </div>
              </div>

              {/* Assessment Preset Selector */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold hr-muted mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  {isId ? "Pilih Paket Tes Kognitif & Psikotes" : "Select Cognitive & Psychometric Battery Preset"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ASSESSMENT_PRESETS.map((preset) => {
                    const active = presetId === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset.id)}
                        className={`text-left p-3 rounded-xl border transition ${
                          active
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 shadow-xs"
                            : "hr-subtle hover:border-indigo-400"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold leading-snug">
                            {preset.name[locale]}
                          </span>
                          <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded badge-info font-bold">
                            {preset.durationMinutes}m
                          </span>
                        </div>
                        <p className="text-[11px] hr-muted mt-1 line-clamp-2">
                          {preset.description[locale]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fine-tune Batteries */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold hr-muted flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    {isId ? "Baterai Aktif" : "Active Batteries"} ({customCategories.length}/8)
                  </span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {durationMinutes} {isId ? "Menit" : "Minutes"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ASSESSMENT_BATTERIES.map((b) => {
                    const on = customCategories.includes(b.id);
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => toggleCategory(b.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          on
                            ? "badge-info border-indigo-400"
                            : "hr-subtle hr-muted"
                        }`}
                      >
                        {b.shortName[locale]} ({b.questionCount}Q)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Channels & Proctoring */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl hr-subtle cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold">{isId ? "Email Otomatis" : "Automated Email"}</div>
                    <div className="text-[10px] hr-muted">Resend / SMTP / Mailto</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl hr-subtle cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold">{isId ? "WhatsApp Otomatis" : "Automated WhatsApp"}</div>
                    <div className="text-[10px] hr-muted">Meta API / Fonnte / wa.me</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl hr-subtle cursor-pointer">
                  <input
                    type="checkbox"
                    checked={proctoringStrict}
                    onChange={(e) => setProctoringStrict(e.target.checked)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold">{isId ? "Anti-Curang Ketat" : "Anti-Cheat Proctoring"}</div>
                    <div className="text-[10px] hr-muted">{isId ? "Audit Tab & Fullscreen" : "Tab & Fullscreen Audit"}</div>
                  </div>
                </label>
              </div>

              {/* Expiry + Custom Note */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold hr-muted mb-1">
                    {isId ? "Masa Berlaku Link" : "Link Expiry"}
                  </label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl hr-input text-xs font-semibold"
                  >
                    <option value={24}>24 {isId ? "Jam" : "Hours"}</option>
                    <option value={72}>72 {isId ? "Jam (3 Hari)" : "Hours (3 Days)"}</option>
                    <option value={168}>7 {isId ? "Hari" : "Days"}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold hr-muted mb-1">
                    {isId ? "Pesan Khusus (Opsional)" : "Custom Note (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={
                      isId
                        ? "Contoh: Harap selesaikan sebelum Jumat pukul 17:00 WIB."
                        : "e.g. Please complete before Friday 5 PM."
                    }
                    className="w-full px-3 py-2 rounded-xl hr-input text-xs"
                  />
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-3 pt-3 border-t"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <button
                  type="button"
                  onClick={closeInviteModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold hr-btn-secondary"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-quantum px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {sending
                    ? isId
                      ? "Mengenkripsi & Mengirim..."
                      : "Encrypting & Dispatching..."
                    : isId
                    ? "Generate Link & Kirim Undangan Sekarang"
                    : "Generate Signed Link & Dispatch Now"}
                </button>
              </div>
            </form>
          ) : (
            /* DISPATCH SUCCESS PANEL */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl badge-success flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-extrabold">
                    {isId
                      ? `Undangan Terenkripsi Siap untuk ${result.invitation.candidateName}!`
                      : `Signed Assessment Invitation Ready for ${result.invitation.candidateName}!`}
                  </h3>
                  <p className="text-xs opacity-90 mt-1">
                    {isId
                      ? "Tautan unik HMAC-SHA256 telah dibuat dan berlaku di perangkat mana pun (Desktop & Mobile)."
                      : "Unique HMAC-SHA256 link generated and ready on any device (Desktop & Mobile)."}
                  </p>
                </div>
              </div>

              {/* Channel Delivery Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl hr-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {isId ? "Kanal Email" : "Email Channel"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full badge-info font-bold">
                      {result.invitation.emailStatus}
                    </span>
                  </div>
                  <p className="text-[11px] hr-muted">{result.delivery.emailDetail}</p>
                </div>

                <div className="p-3.5 rounded-xl hr-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {isId ? "Kanal WhatsApp" : "WhatsApp Channel"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full badge-success font-bold">
                      {result.invitation.whatsappStatus}
                    </span>
                  </div>
                  <p className="text-[11px] hr-muted">{result.delivery.whatsappDetail}</p>
                </div>
              </div>

              {/* Instant 1-Click Action Buttons + QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-4 rounded-2xl hr-subtle">
                <div className="flex flex-col items-center justify-center">
                  <QrCodeSvg value={result.invitation.inviteUrl} size={132} />
                  <span className="text-[10px] hr-muted mt-1.5 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> {isId ? "Scan dari HP Kandidat" : "Candidate Mobile QR"}
                  </span>
                </div>
                <div className="sm:col-span-2 space-y-2.5">
                  <div className="flex items-center gap-2 p-2 rounded-xl hr-input">
                    <input
                      readOnly
                      value={result.invitation.inviteUrl}
                      className="flex-1 bg-transparent text-[11px] font-mono text-indigo-600 dark:text-indigo-300 focus:outline-none truncate"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(result.invitation.inviteUrl)}
                      className="px-2.5 py-1 rounded-lg hr-btn-secondary text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? (isId ? "Tersalin" : "Copied") : isId ? "Salin" : "Copy"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={result.delivery.whatsappLaunchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-emerald px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {isId ? "Kirim Langsung via WhatsApp" : "Launch WhatsApp Invite"}
                    </a>
                    <a
                      href={result.delivery.mailtoUrl}
                      className="btn-quantum px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      {isId ? "Buka Draft Email (Mailto)" : "Open Email Client"}
                    </a>
                    <a
                      href={result.invitation.inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold badge-info flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {isId ? "Uji Buka Portal Tes" : "Preview Live Test"}
                    </a>
                    <a
                      href={`/api/calendar/ics?title=${encodeURIComponent(
                        `AetherHR Assessment: ${result.invitation.candidateName}`
                      )}&duration=${result.invitation.durationMinutes}&location=${encodeURIComponent(
                        result.invitation.inviteUrl
                      )}`}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold hr-btn-secondary flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      {isId ? "Unduh Kalender .ICS" : "Download .ICS Invite"}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hr-btn-secondary"
                >
                  {isId ? "Kirim Undangan Lain" : "Send Another Invite"}
                </button>
                <button
                  type="button"
                  onClick={closeInviteModal}
                  className="btn-quantum px-5 py-2 rounded-xl text-xs font-bold"
                >
                  {isId ? "Selesai" : "Done"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
