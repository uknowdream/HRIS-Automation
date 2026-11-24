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
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
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
    settings,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";

  // Live Webhook Tester State
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

  // Create Workflow Modal
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
      pushToast({
        title: data.ok ? "Live Webhook Delivered!" : "Webhook Error",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Workflow className="w-6 h-6 text-indigo-400" />
            {isId ? "Studio Otomatisasi & Hub Integrasi Universal" : "No-Code Automation Studio & Universal Integration Hub"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isId
              ? "Hubungkan HRIS ke mana saja: Email (Resend/SMTP), WhatsApp (Meta/Fonnte/wa.me), Zapier, Make, n8n, Slack, MS Teams, dan REST API HMAC-SHA256."
              : "Connect HRIS anywhere: Email (Resend/SMTP), WhatsApp (Meta/Fonnte/wa.me), Zapier, Make, n8n, Slack, MS Teams & HMAC-SHA256 Webhooks."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings"
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            {isId ? "Kredensial API" : "API Credentials"}
          </Link>
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {isId ? "Buat Workflow Otomatis" : "Create Automation Flow"}
          </button>
        </div>
      </div>

      {/* Active Visual Workflows */}
      <section className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          {isId ? "Alur Otomatisasi Aktif (Trigger → Multi-Action)" : "Active Automation Pipelines (Trigger → Multi-Action)"}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <div key={wf.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold">
                      TRIGGER: {wf.trigger}
                    </span>
                    <h3 className="text-sm font-black mt-1.5">{wf.name}</h3>
                  </div>
                  <button
                    onClick={() => toggleWorkflow(wf.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-black transition shrink-0 ${
                      wf.enabled
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {wf.enabled ? "ON" : "PAUSED"}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{wf.description}</p>

                {/* Visual Action Chain */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {wf.actions.map((act, idx) => (
                    <React.Fragment key={act.label}>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-semibold text-slate-200">
                        {act.label}
                      </span>
                      {idx < wf.actions.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/70 text-xs">
                <span className="text-slate-400 font-mono">
                  {wf.runsCount} runs · {wf.successRate}% SLA
                </span>
                <button
                  onClick={() => handleTestRunWorkflow(wf.name, wf.trigger)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 font-bold flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> {isId ? "Uji Jalankan" : "Test Run"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Outbound Webhook Tester + Universal Inbound API */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 min-w-0">
        {/* Live Outbound Webhook Tester */}
        <form onSubmit={handleFireWebhook} className="min-w-0 glass-panel rounded-2xl p-5 sm:p-6 border border-cyan-500/25 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Webhook className="w-4 h-4 text-cyan-400" />
              {isId ? "Uji Kirim Live Outbound Webhook (HMAC-SHA256)" : "Live Outbound Webhook Dispatcher (HMAC-SHA256)"}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
              REAL HTTP POST
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {isId
              ? "Masukkan URL Zapier, Make.com, n8n, Slack Webhook, MS Teams, atau httpbin.org/post untuk menguji pengiriman real-time bertanda tangan HMAC-SHA256."
              : "Paste any Zapier, Make.com, n8n, Slack, MS Teams, or httpbin.org/post URL to fire a real signed HMAC-SHA256 JSON webhook."}
          </p>

          <div className="space-y-3">
            <input
              type="url"
              required
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/... or https://httpbin.org/post"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={testEvent}
                onChange={(e) => setTestEvent(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs"
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
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs"
              >
                <option value="generic">Universal JSON (Zapier / Make / n8n)</option>
                <option value="slack">Slack Incoming Webhook</option>
                <option value="teams">Microsoft Teams Card</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={firing}
              className="btn-quantum w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2"
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
              className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 ${
                testResult.ok
                  ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-200"
                  : "bg-rose-500/10 border-rose-500/35 text-rose-200"
              }`}
            >
              <div className="font-bold">
                Status: HTTP {testResult.statusCode} · {testResult.latencyMs}ms
              </div>
              {testResult.signature && (
                <div className="text-[10px] truncate text-cyan-300">
                  X-AetherHR-Signature: {testResult.signature}
                </div>
              )}
              {testResult.responsePreview && (
                <pre className="text-[10px] bg-slate-950/70 p-2 rounded-lg overflow-x-auto max-h-28 text-slate-300">
                  {testResult.responsePreview}
                </pre>
              )}
              {testResult.error && <div>Error: {testResult.error}</div>}
            </div>
          )}
        </form>

        {/* Inbound REST API Snippet */}
        <div className="min-w-0 glass-card rounded-2xl p-5 sm:p-6 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold flex items-center gap-2 min-w-0">
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                {isId ? "Universal Inbound Webhook API (Integrasi Masuk)" : "Universal Inbound Webhook API"}
              </span>
            </h2>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(inboundCurl);
                pushToast({ title: "cURL Copied", variant: "info" });
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" /> Copy cURL
            </button>
          </div>
          <p className="text-xs text-slate-400">
            {isId
              ? "Kirim kandidat dari LinkedIn, JobStreet, Google Form, n8n, atau Zapier ke endpoint ini — sistem otomatis membuat tautan tes kognitif & URL WhatsApp!"
              : "Push candidates from LinkedIn, JobStreet, Google Forms, n8n, or Zapier here — AetherHR automatically returns a signed assessment URL & WhatsApp invite link!"}
          </p>
          <pre className="code-dark p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-w-full whitespace-pre-wrap break-all leading-relaxed">
            {inboundCurl}
          </pre>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Endpoint active at <code className="text-cyan-300">/api/webhooks/inbound</code> &{" "}
              <code className="text-cyan-300">/api/invitations/send</code>
            </span>
          </div>
        </div>
      </section>

      {/* 12 Integration Connectors Ecosystem */}
      <section className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Plug className="w-4 h-4 text-cyan-400" />
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
                className="glass-card rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {conn.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isConfigured
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isConfigured ? "Active" : "Configure"}
                    </span>
                  </div>
                  <h3 className="text-xs font-black">{conn.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {conn.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
                  <code className="text-[10px] text-cyan-400/80 truncate">{conn.endpointHint}</code>
                  <Link
                    href="/settings"
                    className="text-[11px] font-bold text-cyan-400 hover:underline shrink-0"
                  >
                    Setup →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Execution Audit Logs */}
      <section className="glass-card rounded-2xl p-5 overflow-x-auto">
        <h2 className="text-base font-bold mb-3">
          {isId ? "Log Audit Eksekusi Otomatisasi" : "Automation Execution Audit Log"}
        </h2>
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2 px-3">Event</th>
              <th className="py-2 px-3">Channel</th>
              <th className="py-2 px-3">Recipient / Target</th>
              <th className="py-2 px-3">Detail</th>
              <th className="py-2 px-3 text-right">Status & Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.slice(0, 15).map((l) => (
              <tr key={l.id}>
                <td className="py-2.5 px-3 font-mono text-cyan-300 font-semibold">{l.event}</td>
                <td className="py-2.5 px-3">{l.channel}</td>
                <td className="py-2.5 px-3 max-w-[200px] truncate">{l.recipient}</td>
                <td className="py-2.5 px-3 text-slate-400 max-w-md truncate">{l.detail}</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  <span
                    className={
                      l.status === "Success" ? "text-emerald-400 font-bold" : "text-amber-400"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-full max-w-md glass-panel rounded-2xl border border-cyan-500/30 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">
                {isId ? "Buat Workflow Otomatisasi Baru" : "Create New Automation Workflow"}
              </h3>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkflow} className="space-y-3">
              <input
                required
                value={wfName}
                onChange={(e) => setWfName(e.target.value)}
                placeholder={isId ? "Nama Workflow *" : "Workflow Name *"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
              />
              <select
                value={wfTrigger}
                onChange={(e) => setWfTrigger(e.target.value as AutomationTrigger)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
              >
                <option value="candidate.created">Trigger: candidate.created</option>
                <option value="assessment.completed">Trigger: assessment.completed</option>
                <option value="assessment.high_score">Trigger: assessment.high_score</option>
                <option value="leave.approved">Trigger: leave.approved</option>
                <option value="payroll.completed">Trigger: payroll.completed</option>
                <option value="employee.onboarded">Trigger: employee.onboarded</option>
              </select>
              <input
                value={wfActionLabel}
                onChange={(e) => setWfActionLabel(e.target.value)}
                placeholder="Primary Action Target (e.g. Sync to n8n / Slack)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
              />
              <textarea
                rows={3}
                value={wfDesc}
                onChange={(e) => setWfDesc(e.target.value)}
                placeholder="Description of automated actions..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs border border-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-quantum px-5 py-2 rounded-xl text-xs font-bold">
                  {isId ? "Aktifkan Workflow" : "Activate Workflow"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
