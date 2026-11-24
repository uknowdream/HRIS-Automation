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
    candidates,
    invitations,
    addCandidate,
    updateCandidateStage,
    openInviteModal,
    recordInvitation,
    settings,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Add Candidate Form
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
        ? "Seluruh link terenkripsi & peluncur WhatsApp tersedia di tabel riwayat di bawah."
        : "All signed assessment links & WhatsApp launchers are ready in the ledger below.",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <UserPlus className="w-6 h-6 text-cyan-400" />
            {isId ? "ATS Pipeline & Otomatisasi Undangan WA/Email" : "ATS Pipeline & Automated WA/Email Invitations"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isId
              ? "Kirim undangan Tes Kognitif & Psikotes secara satuan atau massal (Bulk) via Email, WhatsApp, QR & Kalender .ICS."
              : "Dispatch single or bulk Cognitive & Psychometric invites via Email, WhatsApp, QR Code, and .ICS Calendar."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {isId ? "Tambah Kandidat" : "Add Candidate"}
          </button>
          <button
            onClick={() => openInviteModal()}
            className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            {isId ? "Kirim Undangan Baru (WA + Email)" : "New Invite (WA + Email)"}
          </button>
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/18 via-indigo-500/18 to-emerald-500/18 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-300" />
            <span>
              {selectedIds.length}{" "}
              {isId ? "kandidat dipilih untuk pengiriman massal" : "candidates selected for bulk automated dispatch"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs border border-slate-700"
            >
              Clear
            </button>
            <button
              onClick={() => void handleBulkDispatch()}
              disabled={bulkSending}
              className="btn-emerald px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5"
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
            <div key={st} className="glass-card rounded-xl p-3.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{st}</span>
              <span className="text-lg font-black text-cyan-400">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Candidate Pipeline Table */}
      <div className="glass-card rounded-2xl p-5 overflow-x-auto">
        <h2 className="text-base font-bold mb-4">
          {isId ? "Daftar Kandidat & Kontrol Pipeline ATS" : "Candidate Directory & ATS Stage Control"}
        </h2>
        <table className="w-full text-left text-xs min-w-[860px]">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-2 w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.length === candidates.length && candidates.length > 0}
                  onChange={(e) =>
                    setSelectedIds(e.target.checked ? candidates.map((c) => c.id) : [])
                  }
                  className="accent-cyan-400"
                />
              </th>
              <th className="py-2.5 px-3">Candidate</th>
              <th className="py-2.5 px-3">Role & Dept</th>
              <th className="py-2.5 px-3">Stage</th>
              <th className="py-2.5 px-3">Psychometric Score</th>
              <th className="py-2.5 px-3 text-right">Instant Dispatch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {candidates.map((cand) => (
              <tr key={cand.id} className="hover:bg-slate-900/40">
                <td className="py-3 px-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cand.id)}
                    onChange={() => toggleSelect(cand.id)}
                    className="accent-cyan-400"
                  />
                </td>
                <td className="py-3 px-3">
                  <div className="font-bold">{cand.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {cand.email} · +{cand.phone}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-cyan-300">{cand.role}</div>
                  <div className="text-[11px] text-slate-400">
                    {cand.department} · {cand.location}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <select
                    value={cand.stage}
                    onChange={(e) =>
                      updateCandidateStage(cand.id, e.target.value as CandidateStage)
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold"
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-mono font-bold">
                      <BrainCircuit className="w-3.5 h-3.5" /> IQ {cand.cognitiveIq} ·{" "}
                      {cand.discCode}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">
                      {isId ? "Belum Tes" : "Not Tested Yet"}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
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
                      className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                      title="Chat WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`mailto:${cand.email}`}
                      className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25"
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

      {/* Sent Invitations Tracker */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {isId
              ? `Riwayat Undangan Terenkripsi Terkirim (${invitations.length})`
              : `Dispatched Encrypted Assessment Invitations (${invitations.length})`}
          </h2>
        </div>

        {invitations.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-700 text-xs text-slate-400">
            {isId
              ? "Belum ada undangan sesi ini. Klik tombol 'Undang Tes' pada kandidat mana pun untuk membuat tautan HMAC-SHA256 & mengirim lewat WhatsApp / Email."
              : "No invitations dispatched yet in this session. Click 'Send Invite' on any candidate to generate an HMAC-SHA256 link and send via WhatsApp / Email."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm">{inv.candidateName}</div>
                    <div className="text-slate-400">
                      {inv.role} · {inv.durationMinutes}m ({inv.categories.length} batteries)
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300">
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
                    onClick={() => {
                      navigator.clipboard?.writeText(inv.inviteUrl);
                      pushToast({ title: "Link Copied", variant: "info" });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Link
                  </button>
                  <a
                    href={inv.inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Open Test
                  </a>
                  <a
                    href={`/api/calendar/ics?title=${encodeURIComponent(
                      `Assessment: ${inv.candidateName}`
                    )}&duration=${inv.durationMinutes}&location=${encodeURIComponent(inv.inviteUrl)}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 text-[11px] font-semibold flex items-center gap-1"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-md glass-panel rounded-2xl border border-cyan-500/30 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">
                {isId ? "Tambah Kandidat Baru" : "Add New Candidate"}
              </h3>
              <button onClick={() => setAddOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCandidate} className="space-y-3">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isId ? "Nama Lengkap *" : "Full Name *"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
              />
              <input
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder={isId ? "Posisi yang Dilamar *" : "Target Position *"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email *"
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="WhatsApp (628...) *"
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Department"
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
              </div>
              <input
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="Expected Salary"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-cyan-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoInviteOnCreate}
                  onChange={(e) => setAutoInviteOnCreate(e.target.checked)}
                  className="accent-cyan-400 w-4 h-4"
                />
                {isId
                  ? "Langsung buka pengirim undangan Tes Kognitif & Psikotes (WA + Email)"
                  : "Immediately open WA + Email Psychometric Invite dispatcher"}
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs border border-slate-700"
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
  );
}
