"use client";

import React from "react";
import { Target, Award, TrendingUp, BrainCircuit } from "lucide-react";
import { useHRIS } from "@/context/HRISContext";

const NINE_BOX_CELLS = [
  { row: 2, col: 0, title: "Enigma / High Potential", tone: "bg-indigo-500/12 border-indigo-500/30" },
  { row: 2, col: 1, title: "Growth Star", tone: "bg-cyan-500/15 border-cyan-500/35" },
  { row: 2, col: 2, title: "Future Executive ★", tone: "bg-emerald-500/18 border-emerald-500/45" },
  { row: 1, col: 0, title: "Dilemma / Coach", tone: "bg-amber-500/10 border-amber-500/25" },
  { row: 1, col: 1, title: "Core Backbone", tone: "bg-slate-800/70 border-slate-700" },
  { row: 1, col: 2, title: "High Impact Performer", tone: "bg-cyan-500/12 border-cyan-500/30" },
  { row: 0, col: 0, title: "Performance Risk", tone: "bg-rose-500/12 border-rose-500/30" },
  { row: 0, col: 1, title: "Effective Specialist", tone: "bg-slate-900/70 border-slate-800" },
  { row: 0, col: 2, title: "Trusted Master", tone: "bg-indigo-500/12 border-indigo-500/30" },
];

function bucket(score: number): number {
  if (score >= 90) return 2;
  if (score >= 80) return 1;
  return 0;
}

export default function PerformancePage() {
  const { locale, employees, okrs, updateOkrProgress } = useHRIS();
  const isId = locale === "id";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
          <Target className="w-6 h-6 text-emerald-400" />
          {isId ? "OKR Strategis & Matriks Talenta 9-Box" : "Strategic OKRs & 9-Box Talent Matrix"}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isId
            ? "Pemetaan suksesi otomatis berbasis kinerja kuartalan, potensi kepemimpinan, dan skor kognitif IQ."
            : "Automated succession mapping blending quarterly OKR execution, leadership potential, and Cognitive IQ baselines."}
        </p>
      </div>

      {/* 9-Box Grid */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            {isId ? "Interactive 9-Box Talent Calibration (Potential × Performance)" : "Interactive 9-Box Talent Calibration (Potential × Performance)"}
          </h2>
          <span className="text-[11px] text-slate-400">
            Y: Potential (↑) · X: Performance (→)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {NINE_BOX_CELLS.map((cell) => {
            const members = employees.filter(
              (e) => bucket(e.potentialScore) === cell.row && bucket(e.performanceScore) === cell.col
            );
            return (
              <div
                key={`${cell.row}-${cell.col}`}
                className={`p-3.5 rounded-xl border min-h-[120px] flex flex-col justify-between ${cell.tone}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">{cell.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60">
                    {members.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {members.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No staff in quadrant</span>
                  ) : (
                    members.map((m) => (
                      <div
                        key={m.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-950/75 border border-slate-700/70 text-[11px] font-semibold flex items-center gap-1.5"
                      >
                        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500 to-indigo-600 text-[9px] font-black text-white flex items-center justify-center">
                          {m.avatarInitials}
                        </span>
                        <span>{m.name.split(" ")[0]}</span>
                        <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-0.5">
                          <BrainCircuit className="w-2.5 h-2.5" />
                          {m.cognitiveIq}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Interactive OKRs */}
      <div className="space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          {isId ? "Pelacak OKR Kuartalan (Geser Slider untuk Update Real-Time)" : "Quarterly OKR Tracker (Drag Sliders for Live Check-In)"}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {okrs.map((okr) => {
            const avg = Math.round(
              okr.keyResults.reduce((s, kr) => s + kr.progress, 0) / okr.keyResults.length
            );
            return (
              <div key={okr.id} className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      {okr.quarter} · {okr.department}
                    </span>
                    <h3 className="text-sm font-bold mt-1 leading-snug">{okr.objective}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">{okr.employeeName}</div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      okr.status === "Exceeded"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : okr.status === "On Track"
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {avg}% · {okr.status}
                  </span>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800">
                  {okr.keyResults.map((kr, idx) => (
                    <div key={kr.title} className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="text-slate-300 leading-snug">{kr.title}</span>
                        <span className="font-mono font-bold text-cyan-400 shrink-0">
                          {kr.progress}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={kr.progress}
                        onChange={(e) => updateOkrProgress(okr.id, idx, Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
