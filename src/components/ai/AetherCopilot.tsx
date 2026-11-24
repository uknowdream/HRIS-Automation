"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Send, Bot, ArrowRight } from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { formatCurrency } from "@/lib/payroll-engine";

interface CopilotMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  actionLabel?: string;
  actionPath?: string;
  actionFn?: () => void;
}

export function AetherCopilot({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const {
    locale,
    employees,
    payrollRuns,
    leaves,
    expenses,
    documents,
    reports,
    openInviteModal,
  } = useHRIS();
  const isId = locale === "id";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: isId
        ? "Halo! Saya **AetherAI HR Copilot**. Tanyakan apa saja tentang data SDM live Anda: total payroll, kandidat IQ tertinggi, kontrak PKWT habis, hitung PPh 21 TER, atau kirim undangan psikotes."
        : "Hello! I am **AetherAI HR Copilot**. Ask anything about your live workforce data: payroll totals, top IQ candidates, expiring contracts, PPh 21 TER tax estimates, or dispatch test invites.",
    },
  ]);

  if (!open) return null;

  const analyzeQuery = (raw: string): Omit<CopilotMessage, "id" | "sender"> => {
    const q = raw.toLowerCase();

    // 1. Top IQ / Psychometrics
    if (q.includes("iq") || q.includes("psikotes") || q.includes("kandidat") || q.includes("candidate") || q.includes("top")) {
      const top = [...reports].sort((a, b) => b.estimatedIq - a.estimatedIq)[0];
      if (top) {
        return {
          text: isId
            ? `Kandidat dengan skor tertinggi saat ini adalah **${top.candidateName}** (${top.targetRole}) — Estimated IQ **${top.estimatedIq}** (${top.globalPercentile}th percentile, DISC ${top.disc.archetype}, Integrity ${top.integrityScore}%). Status: **${top.recommendation.replace("_", " ")}**.`
            : `Your top-scoring candidate is **${top.candidateName}** (${top.targetRole}) — Estimated IQ **${top.estimatedIq}** (${top.globalPercentile}th percentile, DISC ${top.disc.archetype}, Integrity ${top.integrityScore}%). Verdict: **${top.recommendation.replace("_", " ")}**.`,
          actionLabel: isId ? "Buka Laporan Psikotes" : "Open Assessment Reports",
          actionPath: "/assessments",
        };
      }
    }

    // 2. Payroll / Gaji / PPh 21
    if (q.includes("payroll") || q.includes("gaji") || q.includes("pph") || q.includes("pajak") || q.includes("tax")) {
      const numMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(juta|jt|m)/);
      if (numMatch) {
        const gross = Math.round(parseFloat(numMatch[1].replace(",", ".")) * 1_000_000);
        const terRate = gross <= 5400000 ? 0 : gross <= 10050000 ? 0.02 : gross <= 15100000 ? 0.06 : gross <= 25000000 ? 0.1 : gross <= 40000000 ? 0.15 : 0.21;
        const tax = Math.round(gross * terRate);
        const bpjs = Math.round(Math.min(gross, 12000000) * 0.01 + gross * 0.02 + Math.min(gross, 10042300) * 0.01);
        const net = gross - tax - bpjs;
        return {
          text: `Simulasi Cepat PPh 21 TER A (TK/0) untuk Bruto ${formatCurrency(gross, "IDR")}:\n• PPh 21 TER (${(terRate * 100).toFixed(1)}%): -${formatCurrency(tax, "IDR")}\n• BPJS Kesehatan + JHT + JP: -${formatCurrency(bpjs, "IDR")}\n• Estimasi Take-Home Pay: ${formatCurrency(net, "IDR")}`,
          actionLabel: isId ? "Buka Mesin Payroll" : "Open Payroll Engine",
          actionPath: "/payroll",
        };
      }
      const latest = payrollRuns[0];
      const approvedExp = expenses.filter((e) => e.syncedToPayroll).length;
      return {
        text: isId
          ? `Siklus Payroll terbaru (${latest?.period}) mencakup **${latest?.totalEmployees} karyawan lintas 5 mata uang** dengan total Net Payout setara **$${latest?.totalNetUSD.toLocaleString("en-US")}** (termasuk ${approvedExp} klaim reimburse tersinkronisasi).`
          : `Latest Payroll run (${latest?.period}) covers **${latest?.totalEmployees} staff across 5 currencies** with Net Payout of **$${latest?.totalNetUSD.toLocaleString("en-US")}** (${approvedExp} approved reimbursements synced).`,
        actionLabel: isId ? "Lihat Detail Payroll" : "Open Global Payroll",
        actionPath: "/payroll",
      };
    }

    // 3. Contracts / PKWT / E-Sign
    if (q.includes("kontrak") || q.includes("pkwt") || q.includes("sign") || q.includes("contract")) {
      const pending = documents.filter((d) => d.status !== "Signed");
      return {
        text:
          pending.length > 0
            ? isId
              ? `Ada **${pending.length} dokumen** butuh tindakan: ${pending.map((d) => `${d.employeeName} (${d.status})`).join(", ")}. Anda dapat menandatangani langsung dengan Canvas E-Sign SHA-256.`
              : `**${pending.length} documents** need action: ${pending.map((d) => `${d.employeeName} (${d.status})`).join(", ")}. You can e-sign directly with SHA-256 verification.`
            : isId
            ? "Seluruh kontrak karyawan sudah bertanda tangan digital (SHA-256 Verified)."
            : "All HR contracts are fully signed and SHA-256 verified.",
        actionLabel: isId ? "Buka Kontrak & E-Sign" : "Open Contracts & E-Sign",
        actionPath: "/documents",
      };
    }

    // 4. Invite / WhatsApp / Email
    if (q.includes("undang") || q.includes("invite") || q.includes("wa") || q.includes("whatsapp") || q.includes("email")) {
      return {
        text: isId
          ? "Siap! Saya bisa langsung membuka pengirim undangan Tes Kognitif & Psikotes (104 soal) otomatis via WhatsApp + Email + QR Code + .ICS."
          : "Ready! I can launch the automated Cognitive & Psychometric invite dispatcher (Email + WhatsApp + QR + .ICS) right now.",
        actionLabel: isId ? "Buka Modal Kirim Undangan" : "Launch Invite Dispatcher",
        actionFn: () => {
          onClose();
          openInviteModal();
        },
      };
    }

    // 5. Default Executive Briefing
    const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
    const pendingClaims = expenses.filter((e) => e.status === "Pending").length;
    return {
      text: isId
        ? `Ringkasan Live HRIS:\n• Total Karyawan Aktif: ${employees.length} orang\n• Cuti Menunggu Approval: ${pendingLeaves}\n• Klaim Reimburse Pending: ${pendingClaims}\n• Dokumen Butuh E-Sign: ${documents.filter((d) => d.status !== "Signed").length}\n• Laporan Psikotes Terverifikasi: ${reports.length}`
        : `Live HRIS Briefing:\n• Active Headcount: ${employees.length}\n• Pending Leaves: ${pendingLeaves}\n• Pending Reimbursements: ${pendingClaims}\n• Contracts Needing E-Sign: ${documents.filter((d) => d.status !== "Signed").length}\n• Verified Psychometric Reports: ${reports.length}`,
      actionLabel: isId ? "Lihat Reimburse & Aset" : "Review Expenses & Assets",
      actionPath: "/finance-ops",
    };
  };

  const sendPrompt = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const reply = analyzeQuery(clean);
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, sender: "user", text: clean },
      { id: `a_${Date.now() + 1}`, sender: "ai", ...reply },
    ]);
    setInput("");
  };

  const quickChips = isId
    ? [
        "Siapa kandidat IQ tertinggi?",
        "Hitung PPh 21 gaji 25 juta",
        "Kontrak siapa yang mau habis?",
        "Kirim undangan psikotes WA",
      ]
    : [
        "Who is the highest IQ candidate?",
        "Summarize monthly payroll",
        "Which contracts need e-sign?",
        "Send WhatsApp test invite",
      ];

  return (
    <div className="no-print fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] hr-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[540px] border border-indigo-500/30">
      <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight flex items-center gap-1">
              AetherAI HR Copilot <Sparkles className="w-3 h-3" />
            </div>
            <div className="text-[10px] text-indigo-100">Live Workforce Intelligence</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/15" aria-label="Close AI Copilot">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line leading-relaxed ${
                m.sender === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "hr-subtle rounded-bl-sm"
              }`}
            >
              {m.text.replace(/\*\*/g, "")}
            </div>
            {m.actionLabel && (
              <button
                onClick={() => {
                  if (m.actionFn) {
                    m.actionFn();
                  } else if (m.actionPath) {
                    router.push(m.actionPath);
                    onClose();
                  }
                }}
                className="mt-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold inline-flex items-center gap-1 hover:underline"
              >
                {m.actionLabel} <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="px-3.5 py-2 border-t flex flex-wrap gap-1.5" style={{ borderColor: "var(--border-subtle)" }}>
        {quickChips.map((chip) => (
          <button
            key={chip}
            onClick={() => sendPrompt(chip)}
            className="text-[10px] font-semibold px-2 py-1 rounded-full hr-subtle hover:border-indigo-400 transition"
          >
            {chip}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendPrompt(input);
        }}
        className="p-3 border-t flex items-center gap-2"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isId ? "Tanya AetherAI HR..." : "Ask AetherAI HR..."}
          className="flex-1 px-3 py-2 rounded-xl text-xs hr-input"
        />
        <button type="submit" className="btn-quantum p-2 rounded-xl" aria-label="Send">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
