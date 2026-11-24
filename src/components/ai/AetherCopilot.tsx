"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Send, Bot, ArrowRight } from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { calculateEmployeePayslip, formatCurrency } from "@/lib/payroll-engine";

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
    activeRole,
    currentEmployee,
    hasPermission,
    auditLogs,
    employees,
    payrollRuns,
    leaves,
    expenses,
    documents,
    reports,
    openInviteModal,
    recordAuditLog,
  } = useHRIS();
  const isId = locale === "id";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: isId
        ? "Halo! Saya AetherAI HR Copilot (Zero-Trust RBAC Aware). Tanyakan tentang Payroll, PPh 21 TER, Kandidat IQ Tertinggi, Kontrak PKWT, atau Audit Log Keamanan sesuai otoritas role Anda."
        : "Hello! I am AetherAI HR Copilot (RBAC-Aware). Ask about Payroll, PPh 21 Tax, Top IQ Candidates, Contracts, or Security Audit Logs within your role's clearance.",
    },
  ]);

  if (!open) return null;

  const analyzeQuery = (raw: string): Omit<CopilotMessage, "id" | "sender"> => {
    const q = raw.toLowerCase();

    // 0. Security Audit Log & RBAC Queries
    if (q.includes("audit") || q.includes("log") || q.includes("rbac") || q.includes("security") || q.includes("keamanan")) {
      if (!hasPermission("audit:view")) {
        recordAuditLog({
          module: "RBAC & Security",
          action: "copilot.rbac_redacted",
          target: "Security Audit Trail Query",
          severity: "SECURITY",
          detail: `Blocked AI Copilot query for Security Audit Logs from role ${activeRole}.`,
        });
        return {
          text: isId
            ? `Akses Dibatasi (Zero-Trust RBAC): Role "${activeRole}" tidak diizinkan membaca Security Audit Log organisasi.`
            : `Access Restricted (Zero-Trust RBAC): Role "${activeRole}" cannot inspect organization Security Audit Logs.`,
        };
      }
      const secCount = auditLogs.filter((l) => l.severity === "SECURITY").length;
      return {
        text: isId
          ? `Tercatat ${auditLogs.length} blok rantai Audit Log SHA-256 (${secCount} event keamanan/RBAC). Event terbaru: [${auditLogs[0]?.action}] oleh ${auditLogs[0]?.actorName} (${auditLogs[0]?.actorRole}).`
          : `Ledger holds ${auditLogs.length} SHA-256 chained audit blocks (${secCount} security events). Latest: [${auditLogs[0]?.action}] by ${auditLogs[0]?.actorName} (${auditLogs[0]?.actorRole}).`,
        actionLabel: isId ? "Buka Audit Log & RBAC" : "Open Audit Logs & RBAC",
        actionPath: "/audit-logs",
      };
    }

    // 1. Top IQ / Psychometrics
    if (q.includes("iq") || q.includes("psikotes") || q.includes("kandidat") || q.includes("candidate") || q.includes("top")) {
      if (!hasPermission("assessments:manage")) {
        return {
          text: isId
            ? `Sesuai kebijakan privasi psikometrik RBAC, role "${activeRole}" tidak memiliki izin melihat skor IQ kandidat rekrutmen.`
            : `Under RBAC psychometric privacy rules, role "${activeRole}" cannot view confidential candidate IQ reports.`,
        };
      }
      const top = [...reports].sort((a, b) => b.estimatedIq - a.estimatedIq)[0];
      if (top) {
        return {
          text: isId
            ? `Kandidat skor tertinggi: ${top.candidateName} (${top.targetRole}) — Estimated IQ ${top.estimatedIq} (${top.globalPercentile}th pct, DISC ${top.disc.archetype}, Integrity ${top.integrityScore}%). Status: ${top.recommendation.replace("_", " ")}.`
            : `Top candidate: ${top.candidateName} (${top.targetRole}) — Estimated IQ ${top.estimatedIq} (${top.globalPercentile}th pct, DISC ${top.disc.archetype}, Integrity ${top.integrityScore}%). Verdict: ${top.recommendation.replace("_", " ")}.`,
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
          actionLabel: isId ? "Buka Slip Gaji / Payroll" : "Open Payroll",
          actionPath: "/payroll",
        };
      }

      if (!hasPermission("payroll:view_all")) {
        const mySlip = calculateEmployeePayslip(currentEmployee, 0, 0);
        return {
          text: isId
            ? `Mode Self-Service (${currentEmployee.name}): Estimasi Net Take-Home Pay pribadi Anda bulan ini adalah ${formatCurrency(mySlip.netSalary, mySlip.currency)} (${mySlip.taxRateLabel}). Data gaji karyawan lain disembunyikan oleh RBAC.`
            : `Self-Service (${currentEmployee.name}): Your personal net take-home pay is ${formatCurrency(mySlip.netSalary, mySlip.currency)} (${mySlip.taxRateLabel}). Colleague salaries are protected by RBAC.`,
          actionLabel: isId ? "Lihat Slip Gaji Saya" : "View My Payslip",
          actionPath: "/payroll",
        };
      }

      const latest = payrollRuns[0];
      const approvedExp = expenses.filter((e) => e.syncedToPayroll).length;
      return {
        text: isId
          ? `Siklus Payroll terbaru (${latest?.period}) mencakup ${latest?.totalEmployees} karyawan lintas 5 mata uang dengan Net Payout $${latest?.totalNetUSD.toLocaleString("en-US")} (${approvedExp} klaim reimburse tersinkronisasi).`
          : `Latest Payroll run (${latest?.period}) covers ${latest?.totalEmployees} staff across 5 currencies with Net Payout $${latest?.totalNetUSD.toLocaleString("en-US")} (${approvedExp} reimbursements synced).`,
        actionLabel: isId ? "Lihat Detail Payroll" : "Open Global Payroll",
        actionPath: "/payroll",
      };
    }

    // 3. Contracts / PKWT / E-Sign
    if (q.includes("kontrak") || q.includes("pkwt") || q.includes("sign") || q.includes("contract")) {
      const scopedDocs =
        activeRole === "Employee"
          ? documents.filter((d) => d.employeeId === currentEmployee.id)
          : documents;
      const pending = scopedDocs.filter((d) => d.status !== "Signed");
      return {
        text:
          pending.length > 0
            ? isId
              ? `Ada ${pending.length} dokumen butuh tindakan: ${pending.map((d) => `${d.employeeName} (${d.status})`).join(", ")}.`
              : `${pending.length} documents need action: ${pending.map((d) => `${d.employeeName} (${d.status})`).join(", ")}.`
            : isId
            ? "Seluruh kontrak pada scope Anda sudah bertanda tangan digital (SHA-256 Verified)."
            : "All contracts in your scope are signed and SHA-256 verified.",
        actionLabel: isId ? "Buka Kontrak & E-Sign" : "Open Contracts & E-Sign",
        actionPath: "/documents",
      };
    }

    // 4. Invite / WhatsApp / Email
    if (q.includes("undang") || q.includes("invite") || q.includes("wa") || q.includes("whatsapp") || q.includes("email")) {
      if (!hasPermission("assessments:manage")) {
        return {
          text: isId
            ? `Role "${activeRole}" tidak memiliki otoritas mengirim undangan psikotes kandidat.`
            : `Role "${activeRole}" is not authorized to dispatch candidate test invitations.`,
        };
      }
      return {
        text: isId
          ? "Siap! Saya bisa langsung membuka pengirim undangan Tes Kognitif & Psikotes (104 soal) otomatis via WhatsApp + Email + QR Code + .ICS."
          : "Ready! I can launch the automated Cognitive & Psychometric invite dispatcher (Email + WhatsApp + QR + .ICS).",
        actionLabel: isId ? "Buka Modal Kirim Undangan" : "Launch Invite Dispatcher",
        actionFn: () => {
          onClose();
          openInviteModal();
        },
      };
    }

    // 5. Default Briefing
    const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
    const pendingClaims = expenses.filter((e) => e.status === "Pending").length;
    return {
      text: isId
        ? `Ringkasan Live (${activeRole}):\n• Karyawan Aktif: ${employees.length}\n• Cuti Pending: ${pendingLeaves}\n• Reimburse Pending: ${pendingClaims}\n• Blok Audit SHA-256: ${auditLogs.length}`
        : `Live Briefing (${activeRole}):\n• Active Staff: ${employees.length}\n• Pending Leaves: ${pendingLeaves}\n• Pending Expenses: ${pendingClaims}\n• SHA-256 Audit Blocks: ${auditLogs.length}`,
      actionLabel: hasPermission("audit:view")
        ? isId
          ? "Cek Audit Log & RBAC"
          : "Inspect Audit Logs"
        : isId
        ? "Buka Absensi Saya"
        : "Open My Attendance",
      actionPath: hasPermission("audit:view") ? "/audit-logs" : "/attendance",
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
        "Cek Security Audit Log",
        "Hitung PPh 21 gaji 25 juta",
        "Siapa kandidat IQ tertinggi?",
        "Kontrak siapa yang mau habis?",
      ]
    : [
        "Check Security Audit Logs",
        "Summarize monthly payroll",
        "Who is the highest IQ candidate?",
        "Which contracts need e-sign?",
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
            <div className="text-[10px] text-indigo-100">Role: {activeRole} · RBAC Guarded</div>
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
              {m.text}
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
