"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Send,
  MessageCircle,
  Mail,
  CheckCircle2,
  Plus,
  Copy,
  ExternalLink,
  Calendar,
  BrainCircuit,
  Sparkles,
  X,
  Users,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { RBACGuard } from "@/components/security/RBACGuard";
import type { CandidateStage } from "@/types/hris";

const STAGES: CandidateStage[] = [
  "Applied",
  "Invited",
  "Completed",
  "Interview",
  "Offer",
  "Hired",
];

export default function RecruitmentPage() {
  const {
    locale,
    hasPermission,
    candidates,
    invitations,
    addCandidate,
    updateCandidateStage,
    hireCandidateToEmployee,
    openInviteModal,
    recordInvitation,
    settings,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";
  const canExecuteHire = hasPermission("employees:manage");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("Jakarta, ID");
  const [expectedSalary, setExpectedSalary] = useState("Rp 25.000.000/mo");
  const [autoInviteOnCreate, setAutoInviteOnCreate] = useState(true);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDispatch = async () => {
    if (selectedIds.length === 0) return;
    setBulkSending(true);
    let sentCount = 0;
    for (const id of selectedIds) {
      const cand = candidates.find((c) => c.id === id);
      if (!cand) continue;
      try {
        const res = await fetch("/api/invitations/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: cand.id,
            candidateName: cand.name,
            candidateEmail: cand.email,
            candidatePhone: cand.phone,
            role: cand.role,
            department: cand.department,
            companyName: settings.companyName,
            presetId: "executive-full",
            channels: ["Email", "WhatsApp"],
            locale,
            config: {
              resendApiKey: settings.resendApiKey,
              resendFromEmail: settings.resendFromEmail,
              smtpHost: settings.smtpHost,
              smtpPort: settings.smtpPort,
              smtpUser: settings.smtpUser,
              smtpPass: settings.smtpPass,
              whatsappAccessToken: settings.whatsappAccessToken,
              whatsappPhoneNumberId: settings.whatsappPhoneNumberId,
              whatsappGatewayUrl: settings.whatsappGatewayUrl,
              whatsappGatewayToken: settings.whatsappGatewayToken,
              primaryWebhookUrl: settings.primaryWebhookUrl,
              webhookSecret: settings.webhookSecret,
            },
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          recordInvitation(data.invitation);
          sentCount += 1;
        }
      } catch {
        // continue batch
      }
    }
    setBulkSending(false);
    setSelectedIds([]);
    pushToast({
      title: isId ? `Undangan Massal Selesai (${sentCount})` : `Bulk Dispatch Completed (${sentCount})`,
      description: isId
        ? "Seluruh link terenkripsi & peluncur WhatsApp tersedia di tabel riwayat."
        : "All signed assessment links & WhatsApp launchers are ready below.",
      variant: "success",
    });
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    const created = addCandidate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/[^\d]/g, ""),
      role: role.trim(),
      department,
      location,
      source: "Direct Portal",
      expectedSalary,
    });
    setAddOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setRole("");
    if (autoInviteOnCreate) {
      openInviteModal({
        candidateId: created.id,
        candidateName: created.name,
        candidateEmail: created.email,
        candidatePhone: created.phone,
        role: created.role,
        department: created.department,
      });
    }
  };

  return (
    <RBACGuard
      requiredPermission="recruitment:manage"
      moduleName="Recruitment & ATS"
      resourceLabel="ATS Recruitment & Bulk Invitations"
    >
      <div className="space-y-6">
        {/* Clean Quiet-Chrome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
              <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              {isId ? "ATS Pipeline & Otomatisasi Undangan WA/Email" : "ATS Pipeline & Automated WA/Email Invitations"}
            </h1>
            <p className="text-xs sm:text-sm hr-muted mt-1">
              {isId
                ? "Kirim undangan Tes Kognitif & Psikotes secara satuan atau massal (Bulk) via Email, WhatsApp, QR & Kalender .ICS."
                : "Dispatch single or bulk Cognitive & Psychometric invites via Email, WhatsApp, QR Code, and .ICS Calendar."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border p-0.5 hr-subtle">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "kanban"
                    ? "bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-300"
                    : "hr-muted"
                }`}
              >
                Kanban Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-300"
                    : "hr-muted"
                }`}
              >
                Bulk Table
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold hr-btn-secondary flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {isId ? "Tambah Kandidat" : "Add Candidate"}
            </button>
            <button
              type="button"
              onClick={() => openInviteModal()}
              className="btn-quantum px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              {isId ? "Kirim Undangan (WA + Email)" : "New Invite (WA + Email)"}
            </button>
          </div>
        </div>

        {/* Bulk Action Banner */}
        {selectedIds.length > 0 && (
          <div className="p-4 rounded-2xl badge-info flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                {selectedIds.length}{" "}
                {isId ? "kandidat dipilih untuk pengiriman massal" : "candidates selected for bulk automated dispatch"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="hr-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => void handleBulkDispatch()}
                disabled={bulkSending}
                className="btn-emerald px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {bulkSending
                  ? isId
                    ? "Mengirim Massal..."
                    : "Dispatching Batch..."
                  : isId
                  ? "Kirim Undangan Massal (Email + WA)"
                  : "Bulk Send Email + WhatsApp Invites"}
              </button>
            </div>
          </div>
        )}

        {/* Stage Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((st) => {
            const count = candidates.filter((c) => c.stage === st).length;
            return (
              <div key={st} className="hr-card rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-semibold hr-muted">{st}</span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Kanban Board View */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {STAGES.map((stage) => {
              const stageItems = candidates.filter((c) => c.stage === stage);
              const nextStage = STAGES[STAGES.indexOf(stage) + 1];
              return (
                <div key={stage} className="hr-card rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="text-xs font-extrabold uppercase tracking-wider">{stage}</span>
                    <span className="badge-info px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {stageItems.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {stageItems.length === 0 ? (
                      <div className="p-4 text-center text-[11px] hr-muted rounded-xl hr-subtle border-dashed">
                        {isId ? "Belum ada kandidat" : "No candidates"}
                      </div>
                    ) : (
                      stageItems.map((cand) => (
                        <div key={cand.id} className="p-3.5 rounded-xl hr-subtle space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">{cand.name}</div>
                              <div className="text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold truncate">
                                {cand.role}
                              </div>
                            </div>
                            {cand.cognitiveIq && (
                              <span className="badge-success px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0">
                                IQ {cand.cognitiveIq}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] hr-muted truncate">
                            {cand.location} · {cand.source} · {cand.expectedSalary}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                openInviteModal({
                                  candidateId: cand.id,
                                  candidateName: cand.name,
                                  candidateEmail: cand.email,
                                  candidatePhone: cand.phone,
                                  role: cand.role,
                                  department: cand.department,
                                })
                              }
                              className="btn-quantum px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" /> Invite
                            </button>
                            {nextStage && (
                              <button
                                type="button"
                                onClick={() => updateCandidateStage(cand.id, nextStage)}
                                className="hr-btn-secondary px-2.5 py-1 rounded-lg text-[10px] font-bold"
                              >
                                Move → {nextStage}
                              </button>
                            )}
                            {(cand.stage === "Interview" || cand.stage === "Offer") && canExecuteHire && (
                              <button
                                type="button"
                                onClick={() => {
                                  hireCandidateToEmployee(cand.id);
                                }}
                                className="btn-emerald px-2.5 py-1 rounded-lg text-[10px] font-bold"
                              >
                                {isId ? "Hire & Auto-Onboard ✓" : "Hire & Onboard ✓"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Candidate Pipeline Table */}
        {viewMode === "table" && (
          <div className="hr-card rounded-2xl p-5 overflow-x-auto">
            <h2 className="text-base font-extrabold mb-4">
              {isId ? "Daftar Kandidat & Kontrol Pipeline ATS" : "Candidate Directory & ATS Stage Control"}
            </h2>
            <table className="w-full text-left text-xs min-w-[860px]">
              <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <tr>
                  <th className="py-2.5 px-2 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === candidates.length && candidates.length > 0}
                      onChange={(e) =>
                        setSelectedIds(e.target.checked ? candidates.map((c) => c.id) : [])
                      }
                      className="accent-indigo-600"
                    />
                  </th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Role & Dept</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Psychometric Score</th>
                  <th className="py-2.5 px-3 text-right">Instant Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {candidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cand.id)}
                        onChange={() => toggleSelect(cand.id)}
                        className="accent-indigo-600"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold">{cand.name}</div>
                      <div className="text-[11px] hr-muted">
                        {cand.email} · +{cand.phone}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400">{cand.role}</div>
                      <div className="text-[11px] hr-muted">
                        {cand.department} · {cand.location}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={cand.stage}
                        onChange={(e) =>
                          updateCandidateStage(cand.id, e.target.value as CandidateStage)
                        }
                        className="px-2.5 py-1 rounded-lg hr-input text-xs font-semibold"
                      >
                        {STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      {cand.cognitiveIq ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg badge-success font-mono font-bold">
                          <BrainCircuit className="w-3.5 h-3.5" /> IQ {cand.cognitiveIq} · {cand.discCode}
                        </span>
                      ) : (
                        <span className="hr-muted text-[11px]">
                          {isId ? "Belum Tes" : "Not Tested Yet"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            openInviteModal({
                              candidateId: cand.id,
                              candidateName: cand.name,
                              candidateEmail: cand.email,
                              candidatePhone: cand.phone,
                              role: cand.role,
                              department: cand.department,
                            })
                          }
                          className="btn-quantum px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> {isId ? "Undang Tes" : "Send Invite"}
                        </button>
                        <a
                          href={`https://wa.me/${cand.phone}?text=${encodeURIComponent(
                            `Halo ${cand.name}, kami dari tim HR ${settings.companyName} terkait lamaran posisi ${cand.role}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg badge-success"
                          title="Chat WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`mailto:${cand.email}`}
                          className="p-1.5 rounded-lg badge-info"
                          title="Send Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sent Invitations Tracker */}
        <div className="hr-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {isId
                ? `Riwayat Undangan Terenkripsi Terkirim (${invitations.length})`
                : `Dispatched Encrypted Assessment Invitations (${invitations.length})`}
            </h2>
          </div>

          {invitations.length === 0 ? (
            <div className="p-6 text-center rounded-xl hr-subtle border-dashed text-xs hr-muted">
              {isId
                ? "Belum ada undangan sesi ini. Klik tombol 'Invite' pada kandidat mana pun untuk membuat tautan HMAC-SHA256 & mengirim lewat WhatsApp / Email."
                : "No invitations dispatched yet in this session. Click 'Invite' on any candidate to generate an HMAC-SHA256 link and send via WhatsApp / Email."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl hr-subtle space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm">{inv.candidateName}</div>
                      <div className="hr-muted">
                        {inv.role} · {inv.durationMinutes}m ({inv.categories.length} batteries)
                      </div>
                    </div>
                    <span className="badge-success px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {inv.whatsappStatus}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {inv.whatsappLaunchUrl && (
                      <a
                        href={inv.whatsappLaunchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-emerald px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(inv.inviteUrl);
                        pushToast({ title: "Link Copied", variant: "info" });
                      }}
                      className="hr-btn-secondary px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy Link
                    </button>
                    <a
                      href={inv.inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hr-btn-secondary px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Test
                    </a>
                    <a
                      href={`/api/calendar/ics?title=${encodeURIComponent(
                        `Assessment: ${inv.candidateName}`
                      )}&duration=${inv.durationMinutes}&location=${encodeURIComponent(inv.inviteUrl)}`}
                      className="hr-btn-secondary px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" /> .ICS
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Candidate Modal */}
        {addOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setAddOpen(false)}
          >
            <div
              className="w-full max-w-md hr-card rounded-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold">
                  {isId ? "Tambah Kandidat Baru" : "Add New Candidate"}
                </h3>
                <button type="button" onClick={() => setAddOpen(false)} className="hr-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddCandidate} className="space-y-3">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isId ? "Nama Lengkap *" : "Full Name *"}
                  className="w-full px-3.5 py-2.5 rounded-xl hr-input text-xs"
                />
                <input
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={isId ? "Posisi yang Dilamar *" : "Target Position *"}
                  className="w-full px-3.5 py-2.5 rounded-xl hr-input text-xs"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email *"
                    className="px-3 py-2.5 rounded-xl hr-input text-xs"
                  />
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="WhatsApp (628...) *"
                    className="px-3 py-2.5 rounded-xl hr-input text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Department"
                    className="px-3 py-2.5 rounded-xl hr-input text-xs"
                  />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location"
                    className="px-3 py-2.5 rounded-xl hr-input text-xs"
                  />
                </div>
                <input
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  placeholder="Expected Salary"
                  className="w-full px-3 py-2.5 rounded-xl hr-input text-xs"
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoInviteOnCreate}
                    onChange={(e) => setAutoInviteOnCreate(e.target.checked)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  {isId
                    ? "Langsung buka pengirim undangan Tes Kognitif & Psikotes (WA + Email)"
                    : "Immediately open WA + Email Psychometric Invite dispatcher"}
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    className="hr-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-quantum px-5 py-2 rounded-xl text-xs font-bold">
                    {isId ? "Simpan Kandidat" : "Save Candidate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RBACGuard>
  );
}
