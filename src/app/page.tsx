"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Workflow,
  BrainCircuit,
  Wallet,
  MapPin,
  Send,
  Smartphone,
  ArrowUpRight,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Globe2,
  Sparkles,
  Activity,
  Award,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { getDict } from "@/lib/i18n";
import { AreaTrendChart, DonutGauge, MiniSparkline } from "@/components/visuals/Charts";

export default function ExecutiveDashboardPage() {
  const {
    locale,
    employees,
    attendance,
    leaves,
    payrollRuns,
    candidates,
    reports,
    workflows,
    logs,
    openInviteModal,
  } = useHRIS();

  const dict = getDict(locale);
  const isId = locale === "id";

  const latestPayroll = payrollRuns[0];
  const avgIq =
    reports.length > 0
      ? Math.round(reports.reduce((acc, r) => acc + r.estimatedIq, 0) / reports.length)
      : 128;
  const activeFlows = workflows.filter((w) => w.enabled).length;
  const totalRuns = workflows.reduce((acc, w) => acc + w.runsCount, 0);
  const avgAttendance = (
    employees.reduce((acc, e) => acc + e.attendanceRate, 0) / Math.max(1, employees.length)
  ).toFixed(1);

  const countryBreakdown = Object.entries(
    employees.reduce<Record<string, number>>((acc, e) => {
      acc[e.country] = (acc[e.country] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const kpis = [
    {
      label: dict.dashboard.totalHeadcount,
      value: `${employees.length}`,
      delta: "+14.2% YoY",
      sub: `${countryBreakdown.length} ${isId ? "Negara Aktif" : "Global Entities"}`,
      icon: Users,
      color: "#22d3ee",
      spark: [4, 5, 5, 6, 7, 7, employees.length],
    },
    {
      label: dict.dashboard.activeAutomations,
      value: `${activeFlows}/${workflows.length}`,
      delta: `${totalRuns} ${isId ? "eksekusi" : "runs"}`,
      sub: "99.6% SLA Delivery",
      icon: Workflow,
      color: "#818cf8",
      spark: [120, 165, 198, 240, 280, 310, totalRuns],
    },
    {
      label: dict.dashboard.avgCognitiveIq,
      value: `${avgIq}`,
      delta: `Top ${avgIq >= 130 ? "2%" : "8%"} Global`,
      sub: `${reports.length} ${isId ? "Laporan Psikotes" : "Verified Reports"}`,
      icon: BrainCircuit,
      color: "#34d399",
      spark: [118, 121, 124, 125, 128, 130, avgIq],
    },
    {
      label: dict.dashboard.monthlyPayroll,
      value: `$${((latestPayroll?.totalNetUSD || 48000) / 1000).toFixed(1)}K`,
      delta: "IDR · USD · SGD · EUR · GBP",
      sub: isId ? "PPh 21 TER + BPJS Otomatis" : "Auto-Tax & Multi-FX Ready",
      icon: Wallet,
      color: "#fbbf24",
      spark: [38, 41, 43, 45, 46, 48, Math.round((latestPayroll?.totalNetUSD || 48000) / 1000)],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl glass-panel border border-cyan-500/25 p-6 sm:p-8">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/12 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isId
                  ? "Enterprise HRIS OS · 104 Soal Kognitif & Psikotes · Otomatisasi Email/WA/Webhook"
                  : "Enterprise HRIS OS · 104 Cognitive & Psychometric Items · Email/WA/Webhook Automation"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              <span className="gradient-text">{dict.dashboard.title}</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              {dict.dashboard.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => openInviteModal()}
              className="btn-quantum px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {dict.dashboard.inviteCandidate}
            </button>
            <Link
              href="/assessments"
              className="btn-emerald px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4" />
              {dict.dashboard.launchPsychometric}
            </Link>
            <Link
              href="/mobile"
              className="px-4 py-3 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900/60 hover:border-cyan-400/60 flex items-center gap-2 transition"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              {dict.dashboard.openMobile}
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="glass-card rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-slate-400">{kpi.label}</span>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                    {kpi.value}
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${kpi.color}1A`, color: kpi.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-emerald-400">{kpi.delta}</div>
                  <div className="text-[11px] text-slate-400">{kpi.sub}</div>
                </div>
                <MiniSparkline values={kpi.spark} color={kpi.color} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Analytics Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Automation & Psychometric Velocity */}
        <div className="xl:col-span-2 glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                {isId
                  ? "Telemetri Otomatisasi & Penyelesaian Psikotes"
                  : "Automation Velocity & Psychometric Throughput"}
              </h2>
              <p className="text-xs text-slate-400">
                {isId
                  ? "Perbandingan eksekusi workflow otomatis (Email/WA/Webhook) vs kandidat selesai tes 7 bulan terakhir."
                  : "Automated workflow dispatches (Email/WA/Webhooks) vs completed assessments over 7 months."}
              </p>
            </div>
            <Link
              href="/automation"
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              {isId ? "Buka Studio Otomatisasi" : "Open Automation Studio"}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <AreaTrendChart
            labels={["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]}
            seriesA={[140, 185, 220, 260, 295, 340, 392]}
            seriesB={[38, 52, 64, 79, 95, 118, 146]}
            labelA={isId ? "Eksekusi Otomatisasi (Email/WA/Webhook)" : "Automated Workflows (Email/WA/Webhook)"}
            labelB={isId ? "Asesmen Psikotes Selesai" : "Completed Psychometric Assessments"}
          />
        </div>

        {/* Live Telemetry Gauges */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isId ? "Kesehatan Sistem & Integritas" : "System Health & Integrity"}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              {isId ? "Metrik real-time proctoring, absensi & SLA." : "Real-time proctoring, attendance & SLA gauges."}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DonutGauge
                value={Number(avgAttendance)}
                label={isId ? "Absensi GPS" : "GPS Attendance"}
                sublabel="%"
                color="#22d3ee"
              />
              <DonutGauge
                value={97}
                label={isId ? "Integritas Proctoring" : "Proctor Integrity"}
                sublabel="%"
                color="#34d399"
              />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {isId ? "Clock-In Hari Ini" : "Checked-In Today"}
              </span>
              <span className="font-bold">
                {attendance.length} / {employees.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                {isId ? "Pengajuan Cuti Menunggu" : "Pending Leave Approvals"}
              </span>
              <Link href="/attendance" className="font-bold text-amber-400 hover:underline">
                {leaves.filter((l) => l.status === "Pending").length} {isId ? "Pending" : "Pending"}
              </Link>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                {isId ? "Kandidat Pipeline Aktif" : "Active Hiring Pipeline"}
              </span>
              <Link href="/recruitment" className="font-bold text-cyan-400 hover:underline">
                {candidates.length} {isId ? "Kandidat" : "Candidates"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Dual Grid: Top Psychometric Reports + Live Automation Feed */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top Psychometric Results */}
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
              {isId ? "Hasil Psikotes & Kognitif Terbaru" : "Latest Cognitive & Psychometric Reports"}
            </h2>
            <Link href="/assessments" className="text-xs font-semibold text-cyan-400 hover:underline">
              {isId ? "Lihat Semua →" : "View All →"}
            </Link>
          </div>
          <div className="space-y-3">
            {reports.slice(0, 4).map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 rounded-xl bg-slate-900/55 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{rep.candidateName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.recommendation === "STRONG_HIRE"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : rep.recommendation === "RECOMMENDED"
                          ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                          : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {rep.recommendation.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {rep.targetRole} · DISC {rep.disc.archetype}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Est. IQ</div>
                    <div className="text-lg font-black text-cyan-400">{rep.estimatedIq}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Percentile</div>
                    <div className="text-sm font-bold text-emerald-400">{rep.globalPercentile}th</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Integrity</div>
                    <div className="text-sm font-bold">{rep.integrityScore}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Automation Execution Feed */}
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              {isId ? "Log Otomatisasi Real-Time" : "Live Automation Event Stream"}
            </h2>
            <Link href="/automation" className="text-xs font-semibold text-cyan-400 hover:underline">
              {isId ? "Kelola Integrasi →" : "Manage Integrations →"}
            </Link>
          </div>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {logs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-900/55 border border-slate-800/80 flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono text-cyan-300 truncate">
                      {log.event}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                      {log.channel} · {log.latencyMs}ms
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">{log.recipient}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{log.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Footprint Strip */}
      <section className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            {isId ? "Distribusi Entitas Global & Multi-Zona Waktu" : "Global Entities & Multi-Timezone Distribution"}
          </h3>
          <Link href="/employees" className="text-xs text-cyan-400 hover:underline font-semibold">
            {isId ? "Buka Direktori & Bagan Organisasi →" : "Open Directory & Org Chart →"}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {countryBreakdown.map(([country, count]) => (
            <div
              key={country}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
            >
              <span className="text-xs font-semibold">{country}</span>
              <span className="text-sm font-black text-cyan-400">{count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
