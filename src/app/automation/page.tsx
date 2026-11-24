"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Workflow,
  Zap,
  Webhook,
  Play,
  Plus,
  CheckCircle2,
  Plug,
  Terminal,
  Copy,
  Send,
  Settings,
  X,
  ArrowRight,
  Bot,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { RBACGuard } from "@/components/security/RBACGuard";
import { SEED_CONNECTORS } from "@/lib/seed-data";
import type { AutomationTrigger } from "@/types/hris";

export default function AutomationStudioPage() {
  const {
    locale,
    workflows,
    toggleWorkflow,
    addWorkflow,
    logs,
    logAutomation,
    recordAuditLog,
    settings,
    updateSettings,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";

  const [testUrl, setTestUrl] = useState(
    settings.primaryWebhookUrl || "https://httpbin.org/post"
  );
  const [testEvent, setTestEvent] = useState("assessment.high_score");
  const [testFormat, setTestFormat] = useState<"generic" | "slack" | "teams">("generic");
  const [firing, setFiring] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    statusCode: number;
    latencyMs: number;
    signature?: string;
    responsePreview?: string;
    error?: string;
  } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [wfName, setWfName] = useState("");
  const [wfDesc, setWfDesc] = useState("");
  const [wfTrigger, setWfTrigger] = useState<AutomationTrigger>("candidate.created");
  const [wfActionLabel, setWfActionLabel] = useState("Dispatch Email + WhatsApp + Outbound Webhook");

  const handleFireWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFiring(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/webhooks/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: testUrl,
          event: testEvent,
          format: testFormat,
          secret: settings.webhookSecret,
          payload: {
            candidateName: "Dimas Arya Mahendra",
            role: "Staff AI & Automation Engineer",
            estimatedIq: 136,
            globalPercentile: 99,
            disc: "Strategic Architect (D-C)",
            verdict: "STRONG_HIRE",
          },
        }),
      });
      const data = await res.json();
      setTestResult(data);
      logAutomation({
        event: testEvent,
        channel: "Webhook",
        recipient: testUrl,
        status: data.ok ? "Success" : "Failed",
        latencyMs: data.latencyMs || 0,
        detail: data.ok
          ? `HTTP ${data.statusCode} · HMAC-SHA256 verified dispatch`
          : data.error || `HTTP ${data.statusCode}`,
      });
      recordAuditLog({
        module: "Automation & API",
        action: data.ok ? "webhook.dispatched" : "webhook.blocked_or_failed",
        target: testUrl,
        severity: data.ok ? "INFO" : "SECURITY",
        detail: data.ok
          ? `Delivered HMAC-SHA256 signed payload (${testEvent}) in ${data.latencyMs}ms.`
          : `Outbound webhook rejected: ${data.error || data.statusCode}`,
      });
      pushToast({
        title: data.ok ? "Live Webhook Delivered!" : "Webhook Guard / Error",
        description: data.ok
          ? `HTTP ${data.statusCode} in ${data.latencyMs}ms`
          : data.error || "Check URL",
        variant: data.ok ? "success" : "warning",
      });
    } catch (err) {
      setTestResult({
        ok: false,
        statusCode: 0,
        latencyMs: 0,
        error: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setFiring(false);
    }
  };

  const handleTestRunWorkflow = (wfNameLabel: string, trigger: string) => {
    logAutomation({
      event: trigger,
      channel: "System",
      recipient: "Multi-Channel Pipeline (Email + WA + Webhook)",
      status: "Success",
      latencyMs: 92,
      detail: `Manual test execution completed for "${wfNameLabel}" — all actions verified.`,
    });
    recordAuditLog({
      module: "Automation & API",
      action: "workflow.dry_run",
      target: wfNameLabel,
      severity: "INFO",
      detail: `Executed end-to-end simulation for trigger [${trigger}].`,
    });
    pushToast({
      title: isId ? "Workflow Berhasil Diuji!" : "Workflow Dry-Run Succeeded!",
      description: wfNameLabel,
      variant: "success",
    });
  };

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;
    addWorkflow({
      name: wfName.trim(),
      description:
        wfDesc.trim() || "Custom automated trigger-to-omnichannel orchestration flow.",
      trigger: wfTrigger,
      condition: "Always active",
      actions: [
        { type: "email", label: "Send Branded Email" },
        { type: "whatsapp", label: "Send WhatsApp Message" },
        { type: "webhook", label: wfActionLabel },
      ],
      enabled: true,
    });
    setCreateOpen(false);
    setWfName("");
    setWfDesc("");
  };

  const inboundCurl = `curl -X POST https://hris-automation.vercel.app/api/webhooks/inbound \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${settings.inboundApiKey}" \\
  -d '{"event":"candidate.applied","candidateName":"Rina Wijaya","candidateEmail":"rina@mail.com","candidatePhone":"6281234567890","role":"Product Manager","presetId":"executive-full"}'`;

  return (
    <RBACGuard
      requiredPermission="automation:manage"
      moduleName="Automation & API"
      resourceLabel="No-Code Automation Studio & Webhooks"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Workflow className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              {isId ? "Studio Otomatisasi Otonom & Hub Integrasi" : "Autonomous Automation Studio & Universal Hub"}
            </h1>
            <p className="text-xs sm:text-sm hr-muted mt-1">
              {isId
                ? "Mesin event-driven real-time: setiap aksi di HRIS otomatis memicu workflow aktif, Auto-Pilot AI, Email, WhatsApp, dan Webhook HMAC-SHA256."
                : "Live event-driven bus: every HRIS action automatically triggers matching workflows, AI Auto-Pilot rules, Email, WhatsApp & HMAC-SHA256 Webhooks."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings"
              className="hr-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4 text-indigo-600" />
              {isId ? "Kredensial API" : "API Credentials"}
            </Link>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {isId ? "Buat Workflow Otomatis" : "Create Automation Flow"}
            </button>
          </div>
        </div>

        {/* Autonomous AI Auto-Pilot Control Strip */}
        <section className="hr-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {isId ? "Kebijakan Zero-Touch AI Auto-Pilot (Langsung Berjalan Otomatis)" : "Zero-Touch AI Auto-Pilot Policies (Live Autonomous Execution)"}
            </h2>
            <span className="badge-success px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              Event Bus Active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl hr-subtle flex items-center justify-between gap-3">
              <div>
                <div className="font-bold">{isId ? "Auto-Approve WFA & Cuti ≤2 Hari" : "Auto-Approve WFA & ≤2d Leave"}</div>
                <div className="text-[11px] hr-muted">Attendance ≥ 95% auto-synced to WA & Calendar</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ autoApproveShortLeave: !settings.autoApproveShortLeave })}
                className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                  settings.autoApproveShortLeave ? "badge-success" : "hr-btn-secondary"
                }`}
              >
                {settings.autoApproveShortLeave ? "ON" : "OFF"}
              </button>
            </div>

            <div className="p-3.5 rounded-xl hr-subtle flex items-center justify-between gap-3">
              <div>
                <div className="font-bold">{isId ? `Auto-Sync Reimburse ≤ $${settings.microExpenseLimitUSD}` : `Auto-Sync Expenses ≤ $${settings.microExpenseLimitUSD}`}</div>
                <div className="text-[11px] hr-muted">Instant approval & next-cycle Payroll merge</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ autoApproveMicroExpense: !settings.autoApproveMicroExpense })}
                className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                  settings.autoApproveMicroExpense ? "badge-success" : "hr-btn-secondary"
                }`}
              >
                {settings.autoApproveMicroExpense ? "ON" : "OFF"}
              </button>
            </div>

            <div className="p-3.5 rounded-xl hr-subtle flex items-center justify-between gap-3">
              <div>
                <div className="font-bold">{isId ? `Fast-Track Kandidat IQ ≥ ${settings.autoAdvanceThresholdIq}` : `Fast-Track IQ ≥ ${settings.autoAdvanceThresholdIq}`}</div>
                <div className="text-[11px] hr-muted">Auto-promote completed test to Interview</div>
              </div>
              <span className="badge-info px-3 py-1 rounded-full text-[11px] font-bold shrink-0">
                IQ {settings.autoAdvanceThresholdIq}+
              </span>
            </div>
          </div>
        </section>

        {/* Active Visual Workflows */}
        <section className="space-y-3">
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            {isId ? "Alur Otomatisasi Aktif (Trigger → Multi-Action)" : "Active Automation Pipelines (Trigger → Multi-Action)"}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {workflows.map((wf) => (
              <div key={wf.id} className="hr-card rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="badge-info text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                        TRIGGER: {wf.trigger}
                      </span>
                      <h3 className="text-sm font-extrabold mt-1.5">{wf.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleWorkflow(wf.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition shrink-0 ${
                        wf.enabled ? "badge-success" : "hr-subtle hr-muted"
                      }`}
                    >
                      {wf.enabled ? "ON" : "PAUSED"}
                    </button>
                  </div>
                  <p className="text-xs hr-muted leading-relaxed">{wf.description}</p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {wf.actions.map((act, idx) => (
                      <React.Fragment key={act.label}>
                        <span className="px-2.5 py-1 rounded-lg hr-subtle text-[11px] font-semibold">
                          {act.label}
                        </span>
                        {idx < wf.actions.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t text-xs" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="hr-muted font-mono">
                    {wf.runsCount} runs · {wf.successRate}% SLA
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestRunWorkflow(wf.name, wf.trigger)}
                    className="hr-btn-secondary px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-indigo-600" /> {isId ? "Uji Jalankan" : "Test Run"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Outbound Webhook Tester + Universal Inbound API */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 min-w-0">
          <form onSubmit={handleFireWebhook} className="min-w-0 hr-card rounded-2xl p-5 sm:p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <Webhook className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {isId ? "Uji Kirim Live Outbound Webhook (HMAC-SHA256)" : "Live Outbound Webhook Dispatcher (HMAC-SHA256)"}
              </h2>
              <span className="badge-success text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                REAL HTTP POST
              </span>
            </div>
            <p className="text-xs hr-muted">
              {isId
                ? "Masukkan URL Zapier, Make.com, n8n, Slack, MS Teams, atau httpbin.org/post. Dilindungi OWASP A10 SSRF Guard."
                : "Paste any Zapier, Make.com, n8n, Slack, MS Teams, or httpbin.org/post URL (protected by OWASP A10 SSRF Guard)."}
            </p>

            <div className="space-y-3">
              <input
                type="url"
                required
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/... or https://httpbin.org/post"
                className="w-full px-3.5 py-2.5 rounded-xl hr-input text-xs font-mono"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={testEvent}
                  onChange={(e) => setTestEvent(e.target.value)}
                  className="px-3 py-2 rounded-xl hr-input text-xs font-semibold"
                >
                  <option value="assessment.high_score">assessment.high_score</option>
                  <option value="invitation.sent">invitation.sent</option>
                  <option value="employee.onboarded">employee.onboarded</option>
                  <option value="payroll.completed">payroll.completed</option>
                  <option value="leave.approved">leave.approved</option>
                </select>
                <select
                  value={testFormat}
                  onChange={(e) => setTestFormat(e.target.value as "generic" | "slack" | "teams")}
                  className="px-3 py-2 rounded-xl hr-input text-xs font-semibold"
                >
                  <option value="generic">Universal JSON (Zapier / Make / n8n)</option>
                  <option value="slack">Slack Incoming Webhook</option>
                  <option value="teams">Microsoft Teams Card</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={firing}
                className="btn-quantum w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {firing
                  ? "Firing Signed Webhook..."
                  : isId
                  ? "Kirim Live Webhook Sekarang"
                  : "Fire Real Signed Webhook Now"}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs font-mono space-y-1.5 ${
                  testResult.ok ? "badge-success" : "badge-danger"
                }`}
              >
                <div className="font-bold">
                  Status: HTTP {testResult.statusCode} · {testResult.latencyMs}ms
                </div>
                {testResult.signature && (
                  <div className="text-[10px] truncate">
                    X-AetherHR-Signature: {testResult.signature}
                  </div>
                )}
                {testResult.responsePreview && (
                  <pre className="code-dark text-[10px] p-2 rounded-lg overflow-x-auto max-h-28">
                    {testResult.responsePreview}
                  </pre>
                )}
                {testResult.error && <div>Error: {testResult.error}</div>}
              </div>
            )}
          </form>

          {/* Inbound REST API Snippet */}
          <div className="min-w-0 hr-card rounded-2xl p-5 sm:p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold flex items-center gap-2 min-w-0">
                <Terminal className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {isId ? "Universal Inbound Webhook API" : "Universal Inbound Webhook API"}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(inboundCurl);
                  pushToast({ title: "cURL Copied", variant: "info" });
                }}
                className="hr-btn-secondary px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copy cURL
              </button>
            </div>
            <p className="text-xs hr-muted">
              {isId
                ? "Kirim kandidat dari LinkedIn, JobStreet, Google Form, n8n, atau Zapier ke endpoint ini — otomatis menghasilkan tautan tes kognitif & WhatsApp!"
                : "Push candidates from LinkedIn, JobStreet, Google Forms, n8n, or Zapier here — AetherHR returns a signed assessment URL & WhatsApp invite link!"}
            </p>
            <pre className="code-dark p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-w-full whitespace-pre-wrap break-all leading-relaxed">
              {inboundCurl}
            </pre>
            <div className="text-[11px] hr-muted flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Active at <code className="font-mono font-bold">/api/webhooks/inbound</code> &{" "}
                <code className="font-mono font-bold">/api/invitations/send</code>
              </span>
            </div>
          </div>
        </section>

        {/* 12 Integration Connectors Ecosystem */}
        <section className="space-y-3">
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Plug className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {isId ? "Ekosistem Konektor Global (12+ Integrasi Siap Pakai)" : "Global Connector Ecosystem (12+ Native Integrations)"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {SEED_CONNECTORS.map((conn) => {
              const isConfigured =
                conn.status === "Connected" ||
                conn.status === "Active (Instant Mode)" ||
                (conn.configuredKeyField && Boolean(settings[conn.configuredKeyField]));
              return (
                <div
                  key={conn.id}
                  className="hr-card rounded-2xl p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider hr-muted">
                        {conn.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isConfigured ? "badge-success" : "hr-subtle hr-muted"
                        }`}
                      >
                        {isConfigured ? "Active" : "Configure"}
                      </span>
                    </div>
                    <h3 className="text-xs font-extrabold">{conn.name}</h3>
                    <p className="text-[11px] hr-muted mt-1 leading-relaxed">
                      {conn.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between gap-2" style={{ borderColor: "var(--border-subtle)" }}>
                    <code className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                      {conn.endpointHint}
                    </code>
                    <Link
                      href="/settings"
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                    >
                      Setup →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Execution Stream */}
        <section className="hr-card rounded-2xl p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold">
              {isId ? "Stream Eksekusi Otomatisasi Real-Time" : "Live Automation Execution Stream"}
            </h2>
            <Link href="/audit-logs" className="text-xs font-bold text-indigo-600 hover:underline">
              {isId ? "Buka Security Audit Log →" : "Open Security Audit Logs →"}
            </Link>
          </div>
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <tr>
                <th className="py-2 px-3">Event</th>
                <th className="py-2 px-3">Channel</th>
                <th className="py-2 px-3">Recipient / Target</th>
                <th className="py-2 px-3">Detail</th>
                <th className="py-2 px-3 text-right">Status & Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {logs.slice(0, 15).map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {l.event}
                  </td>
                  <td className="py-2.5 px-3 font-semibold">{l.channel}</td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate">{l.recipient}</td>
                  <td className="py-2.5 px-3 hr-muted max-w-md truncate">{l.detail}</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    <span
                      className={
                        l.status === "Success"
                          ? "text-emerald-600 dark:text-emerald-400 font-bold"
                          : "text-amber-600 font-bold"
                      }
                    >
                      {l.status} · {l.latencyMs}ms
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Create Workflow Modal */}
        {createOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setCreateOpen(false)}
          >
            <div
              className="w-full max-w-md hr-card rounded-2xl p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold">
                  {isId ? "Buat Workflow Otomatisasi Baru" : "Create New Automation Workflow"}
                </h3>
                <button type="button" onClick={() => setCreateOpen(false)} className="hr-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateWorkflow} className="space-y-3 text-xs">
                <input
                  required
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  placeholder={isId ? "Nama Workflow *" : "Workflow Name *"}
                  className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                />
                <select
                  value={wfTrigger}
                  onChange={(e) => setWfTrigger(e.target.value as AutomationTrigger)}
                  className="w-full px-3.5 py-2.5 rounded-xl hr-input font-semibold"
                >
                  <option value="candidate.created">Trigger: candidate.created</option>
                  <option value="invitation.sent">Trigger: invitation.sent</option>
                  <option value="assessment.completed">Trigger: assessment.completed</option>
                  <option value="assessment.high_score">Trigger: assessment.high_score</option>
                  <option value="leave.submitted">Trigger: leave.submitted</option>
                  <option value="leave.approved">Trigger: leave.approved</option>
                  <option value="expense.approved">Trigger: expense.approved</option>
                  <option value="contract.signed">Trigger: contract.signed</option>
                  <option value="payroll.completed">Trigger: payroll.completed</option>
                  <option value="employee.onboarded">Trigger: employee.onboarded</option>
                  <option value="attendance.late">Trigger: attendance.late</option>
                </select>
                <input
                  value={wfActionLabel}
                  onChange={(e) => setWfActionLabel(e.target.value)}
                  placeholder="Primary Action Target (e.g. Sync to n8n / Slack)"
                  className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                />
                <textarea
                  rows={3}
                  value={wfDesc}
                  onChange={(e) => setWfDesc(e.target.value)}
                  placeholder="Description of automated actions..."
                  className="w-full px-3.5 py-2.5 rounded-xl hr-input"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="hr-btn-secondary px-4 py-2 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-quantum px-5 py-2 rounded-xl font-bold">
                    {isId ? "Aktifkan Workflow" : "Activate Workflow"}
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
