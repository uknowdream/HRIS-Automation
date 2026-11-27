"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  CheckSquare,
  Square,
  Award,
  Clock,
  Users,
  Printer,
  ShieldCheck,
  X,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import type { LearningCourse } from "@/types/hris";

export default function LearningAndOnboardingPage() {
  const {
    locale,
    activeRole,
    authUser,
    currentEmployee,
    checklists,
    courses,
    toggleChecklistTask,
    completeCourse,
  } = useHRIS();
  const isId = locale === "id";
  const [certCourse, setCertCourse] = useState<LearningCourse | null>(null);

  const visibleChecklists =
    activeRole === "Employee"
      ? checklists.filter((c) => c.employeeId === currentEmployee.id)
      : checklists;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
          <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-cyan-400" />
          {isId ? "Onboarding 30-60-90 Hari & Corporate Learning (LMS)" : "30-60-90 Day Onboarding & Corporate Learning (LMS)"}
        </h1>
        <p className="text-xs hr-muted mt-1">
          {isId
            ? "Orkestrasi checklist karyawan baru lintas tim (HR, IT, Manager) serta pelatihan kepatuhan & sertifikasi terverifikasi."
            : "Cross-functional new-hire onboarding checklists (HR, IT, Manager) paired with mandatory compliance LMS certifications."}
        </p>
      </div>

      {/* Onboarding Checklists */}
      <section className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          {isId ? "Checklist Onboarding & Provisioning Aktif" : "Active Employee Onboarding Pipelines"}
        </h2>
        {visibleChecklists.length === 0 ? (
          <div className="hr-card rounded-2xl p-6 text-center space-y-2 text-xs">
            <div className="w-10 h-10 rounded-xl badge-success flex items-center justify-center mx-auto">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="text-sm font-extrabold">
              {isId
                ? `Seluruh Tugas Onboarding ${currentEmployee.name} Telah Selesai ✓`
                : `All Onboarding Tasks for ${currentEmployee.name} Completed ✓`}
            </div>
            <p className="hr-muted">
              {isId
                ? "Anda dapat melanjutkan sertifikasi wajib pada katalog LMS di bawah ini."
                : "You can continue mandatory compliance certifications in the LMS catalog below."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {visibleChecklists.map((chk) => {
              const doneCount = chk.tasks.filter((t) => t.done).length;
              const pct = Math.round((doneCount / Math.max(1, chk.tasks.length)) * 100);
              return (
                <div key={chk.id} className="hr-card rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/12 text-indigo-600 dark:text-indigo-300">
                        {chk.type} · {isId ? "Mulai" : "Start"} {chk.startDate}
                      </span>
                      <h3 className="text-base font-black mt-1">{chk.employeeName}</h3>
                      <div className="text-xs hr-muted">
                        {chk.role} · Buddy: <span className="font-semibold">{chk.buddyName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-indigo-600 dark:text-cyan-400">{pct}%</div>
                      <div className="text-[10px] hr-muted font-mono">
                        {doneCount}/{chk.tasks.length} {isId ? "tugas" : "tasks"}
                      </div>
                    </div>
                  </div>

                  {pct === 100 && (
                    <div className="px-3 py-2 rounded-xl badge-success text-[11px] font-bold">
                      ✓ {isId ? "Onboarding 100% Selesai — Status Karyawan Aktif!" : "100% Onboarding Complete — Employee Active!"}
                    </div>
                  )}

                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {chk.tasks.map((task) => (
                      <button
                        type="button"
                        key={task.id}
                        onClick={() => toggleChecklistTask(chk.id, task.id)}
                        className="w-full text-left p-2.5 rounded-xl hr-subtle hover:border-indigo-400 flex items-center justify-between gap-2.5 text-xs transition"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          {task.done ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 hr-muted shrink-0" />
                          )}
                          <span className={task.done ? "line-through hr-muted" : "font-medium"}>
                            {task.title}
                          </span>
                        </span>
                        <span className="shrink-0 flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                            {task.phase}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                            {task.owner}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* LMS Courses & Certificates */}
      <section className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          {isId ? "Katalog Pelatihan & Sertifikasi Korporat (LMS)" : "Corporate Learning Catalog & Compliance Certifications"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="hr-card rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/12 text-indigo-600 dark:text-indigo-300">
                    {course.category}
                  </span>
                  {course.mandatory && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/12 text-rose-600 dark:text-rose-300">
                      {isId ? "Wajib Kepatuhan" : "Mandatory Compliance"}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black leading-snug">{course.title}</h3>
                <div className="flex items-center gap-4 text-xs hr-muted">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.durationHours}h</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {course.enrolledCount} {isId ? "peserta" : "enrolled"}
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {course.completionRate}% {isId ? "selesai" : "org rate"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="text-[11px] font-mono hr-muted">{course.certificateCode}</span>
                {course.completedByUser ? (
                  <button
                    type="button"
                    onClick={() => setCertCourse(course)}
                    className="btn-emerald px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" /> {isId ? "Lihat Sertifikat" : "View Certificate"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      completeCourse(course.id);
                      setCertCourse({ ...course, completedByUser: true });
                    }}
                    className="btn-quantum px-3.5 py-2 rounded-xl text-xs font-bold"
                  >
                    {isId ? "Selesaikan & Terbitkan Sertifikat" : "Complete & Issue Certificate"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Printable Certificate Modal */}
      {certCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setCertCourse(null)}
        >
          <div className="w-full max-w-xl hr-card rounded-3xl p-8 text-center space-y-5 border-2 border-indigo-500/40" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end no-print">
              <button onClick={() => setCertCourse(null)}><X className="w-5 h-5 hr-muted" /></button>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-widest font-bold text-indigo-600 dark:text-cyan-400">
                AetherHR Global Academy · Verified Credential
              </div>
              <h2 className="text-2xl font-black">Certificate of Completion</h2>
              <p className="text-xs hr-muted">Awarded to</p>
              <div className="text-xl font-black gradient-text py-1">{authUser.name}</div>
              <p className="text-sm font-bold">{certCourse.title}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4" /> Credential ID: {certCourse.certificateCode}
            </div>
            <div className="no-print flex justify-center pt-2">
              <button onClick={() => window.print()} className="btn-quantum px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
