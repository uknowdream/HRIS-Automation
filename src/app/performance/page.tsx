"use client";

import React, { useState } from "react";
import { Target, Award, TrendingUp, BrainCircuit, Plus, X, Lock } from "lucide-react";
import { useHRIS } from "@/context/HRISContext";

const NINE_BOX_CELLS = [
  { row: 2, col: 0, title: "Enigma / High Potential", tone: "bg-indigo-50/70 border-indigo-200 dark:bg-indigo-500/12 dark:border-indigo-500/30" },
  { row: 2, col: 1, title: "Growth Star", tone: "bg-sky-50/70 border-sky-200 dark:bg-sky-500/12 dark:border-sky-500/30" },
  { row: 2, col: 2, title: "Future Executive ★", tone: "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-500/16 dark:border-emerald-500/40" },
  { row: 1, col: 0, title: "Dilemma / Coach", tone: "bg-amber-50/70 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25" },
  { row: 1, col: 1, title: "Core Backbone", tone: "hr-subtle" },
  { row: 1, col: 2, title: "High Impact Performer", tone: "bg-sky-50/60 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/25" },
  { row: 0, col: 0, title: "Performance Risk", tone: "bg-rose-50/70 border-rose-200 dark:bg-rose-500/12 dark:border-rose-500/30" },
  { row: 0, col: 1, title: "Effective Specialist", tone: "hr-subtle" },
  { row: 0, col: 2, title: "Trusted Master", tone: "bg-indigo-50/60 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/25" },
];

function bucket(score: number): number {
  if (score >= 90) return 2;
  if (score >= 80) return 1;
  return 0;
}

export default function PerformancePage() {
  const {
    locale,
    activeRole,
    currentEmployee,
    hasPermission,
    employees,
    okrs,
    addOkrItem,
    updateOkrProgress,
  } = useHRIS();
  const isId = locale === "id";
  const canCalibrate9Box = hasPermission("performance:manage");

  const [newOkrOpen, setNewOkrOpen] = useState(false);
  const [objective, setObjective] = useState("");
  const [kr1, setKr1] = useState("");
  const [kr2, setKr2] = useState("");

  const visibleOkrs =
    activeRole === "Employee"
      ? okrs.filter(
          (o) =>
            o.employeeId === currentEmployee.id ||
            o.department === currentEmployee.department
        )
      : okrs;

  const handleCreateOkr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim() || !kr1.trim()) return;
    addOkrItem({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      department: currentEmployee.department,
      objective: objective.trim(),
      quarter: "Q4 2026",
      keyResults: [
        { title: kr1.trim(), progress: 25 },
        ...(kr2.trim() ? [{ title: kr2.trim(), progress: 10 }] : []),
      ],
    });
    setObjective("");
    setKr1("");
    setKr2("");
    setNewOkrOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {isId ? "OKR Strategis & Matriks Talenta 9-Box" : "Strategic OKRs & 9-Box Talent Matrix"}
          </h1>
          <p className="text-xs sm:text-sm hr-muted mt-1">
            {isId
              ? "Pemetaan suksesi otomatis berbasis kinerja kuartalan, potensi kepemimpinan, dan baseline kognitif."
              : "Automated succession mapping blending quarterly OKR execution, leadership potential, and Cognitive IQ."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNewOkrOpen(true)}
          className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {isId ? "Buat OKR Baru" : "New OKR Objective"}
        </button>
      </div>

      {/* 9-Box Grid (RBAC Scoped to Managers, HR Admin & Super Admin) */}
      {canCalibrate9Box ? (
        <div className="hr-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {isId ? "Kalibrasi Talenta 9-Box (Potential × Performance)" : "Interactive 9-Box Talent Calibration (Potential × Performance)"}
            </h2>
            <span className="text-[11px] hr-muted font-semibold">
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
                    <span className="text-xs font-extrabold">{cell.title}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                      {members.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {members.length === 0 ? (
                      <span className="text-[11px] hr-muted italic">No staff in quadrant</span>
                    ) : (
                      members.map((m) => (
                        <div
                          key={m.id}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-600 to-blue-600 text-[9px] font-black text-white flex items-center justify-center">
                            {m.avatarInitials}
                          </span>
                          <span>{m.name.split(" ")[0]}</span>
                          {hasPermission("assessments:manage") && (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-0.5">
                              <BrainCircuit className="w-2.5 h-2.5" />
                              {m.cognitiveIq}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="hr-card rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 hr-muted">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {isId
                ? `Matriks Kalibrasi 9-Box Organisasi bersifat rahasia manajemen (Role aktif: ${activeRole}). Anda menampilkan OKR tim & pribadi.`
                : `Organization 9-Box Calibration Matrix is restricted to Leadership & HR (Active Role: ${activeRole}).`}
            </span>
          </div>
        </div>
      )}

      {/* Live Interactive OKRs */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          {isId ? "Pelacak OKR Kuartalan (Geser Slider untuk Update Real-Time)" : "Quarterly OKR Tracker (Drag Sliders for Live Check-In)"}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {visibleOkrs.map((okr) => {
            const avg = Math.round(
              okr.keyResults.reduce((s, kr) => s + kr.progress, 0) / okr.keyResults.length
            );
            return (
              <div key={okr.id} className="hr-card rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {okr.quarter} · {okr.department}
                    </span>
                    <h3 className="text-sm font-extrabold mt-1 leading-snug">{okr.objective}</h3>
                    <div className="text-xs hr-muted mt-0.5">{okr.employeeName}</div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      okr.status === "Exceeded"
                        ? "badge-success"
                        : okr.status === "On Track"
                        ? "badge-info"
                        : "badge-warning"
                    }`}
                  >
                    {avg}% · {okr.status}
                  </span>
                </div>

                <div className="space-y-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  {okr.keyResults.map((kr, idx) => (
                    <div key={kr.title} className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="leading-snug font-medium">{kr.title}</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                          {kr.progress}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={kr.progress}
                        onChange={(e) => updateOkrProgress(okr.id, idx, Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add OKR Modal */}
      {newOkrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setNewOkrOpen(false)}
        >
          <div
            className="w-full max-w-md hr-card rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {isId ? "Tambah Objektif OKR Kuartalan" : "Create Strategic OKR"}
              </h3>
              <button type="button" onClick={() => setNewOkrOpen(false)} className="hr-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOkr} className="space-y-3 text-xs">
              <input
                required
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder={isId ? "Objektif Utama (mis. Capai 99.9% SLA)" : "Strategic Objective *"}
                className="w-full px-3.5 py-2.5 rounded-xl hr-input"
              />
              <input
                required
                value={kr1}
                onChange={(e) => setKr1(e.target.value)}
                placeholder="Key Result #1 *"
                className="w-full px-3.5 py-2.5 rounded-xl hr-input"
              />
              <input
                value={kr2}
                onChange={(e) => setKr2(e.target.value)}
                placeholder="Key Result #2 (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl hr-input"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewOkrOpen(false)}
                  className="hr-btn-secondary px-4 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-quantum px-5 py-2 rounded-xl font-bold">
                  {isId ? "Simpan OKR" : "Save OKR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
