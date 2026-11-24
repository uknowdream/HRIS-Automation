"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  AssessmentReport,
  AttendanceRecord,
  AutomationLog,
  AutomationWorkflow,
  Candidate,
  CandidateInvitation,
  CandidateStage,
  Employee,
  IntegrationSettings,
  LeaveRequest,
  Locale,
  OKRItem,
  PayrollRun,
  ThemeMode,
} from "@/types/hris";
import {
  buildSeedPayrollRun,
  DEFAULT_SETTINGS,
  SEED_ATTENDANCE,
  SEED_CANDIDATES,
  SEED_EMPLOYEES,
  SEED_LEAVES,
  SEED_LOGS,
  SEED_OKRS,
  SEED_REPORTS,
  SEED_WORKFLOWS,
} from "@/lib/seed-data";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "info" | "warning" | "error";
}

interface QuickInvitePrefill {
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  role?: string;
  department?: string;
}

interface HRISContextValue {
  hydrated: boolean;
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;

  // Domain State
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  payrollRuns: PayrollRun[];
  candidates: Candidate[];
  invitations: CandidateInvitation[];
  reports: AssessmentReport[];
  workflows: AutomationWorkflow[];
  logs: AutomationLog[];
  okrs: OKRItem[];
  settings: IntegrationSettings;

  // Actions
  addEmployee: (emp: Omit<Employee, "id" | "employeeCode" | "avatarInitials" | "avatarColor">) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  clockInEmployee: (record: Omit<AttendanceRecord, "id">) => void;
  clockOutEmployee: (recordId: string) => void;

  submitLeaveRequest: (req: Omit<LeaveRequest, "id" | "status" | "submittedAt">) => void;
  decideLeaveRequest: (id: string, decision: "Approved" | "Rejected") => void;

  addPayrollRun: (run: PayrollRun) => void;

  addCandidate: (cand: Omit<Candidate, "id" | "appliedAt" | "stage">) => Candidate;
  updateCandidateStage: (id: string, stage: CandidateStage) => void;
  recordInvitation: (inv: CandidateInvitation) => void;
  saveAssessmentReport: (report: AssessmentReport) => void;

  toggleWorkflow: (id: string) => void;
  addWorkflow: (wf: Omit<AutomationWorkflow, "id" | "runsCount" | "successRate" | "lastRunAt">) => void;
  logAutomation: (entry: Omit<AutomationLog, "id" | "timestamp">) => void;

  updateOkrProgress: (okrId: string, krIndex: number, progress: number) => void;
  updateSettings: (patch: Partial<IntegrationSettings>) => void;
  resetDemoData: () => void;

  // Quick Invite Modal Global Control
  inviteModalOpen: boolean;
  invitePrefill: QuickInvitePrefill | null;
  openInviteModal: (prefill?: QuickInvitePrefill) => void;
  closeInviteModal: () => void;

  // Toasts
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const STORAGE_KEY = "aetherhr_enterprise_state_v2";

const HRISContext = createContext<HRISContextValue | null>(null);

const AVATAR_GRADIENTS = [
  "from-cyan-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-indigo-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

export function HRISProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [locale, setLocale] = useState<Locale>("id");
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(SEED_ATTENDANCE);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(SEED_LEAVES);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => [
    buildSeedPayrollRun(SEED_EMPLOYEES),
  ]);
  const [candidates, setCandidates] = useState<Candidate[]>(SEED_CANDIDATES);
  const [invitations, setInvitations] = useState<CandidateInvitation[]>([]);
  const [reports, setReports] = useState<AssessmentReport[]>(SEED_REPORTS);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>(SEED_WORKFLOWS);
  const [logs, setLogs] = useState<AutomationLog[]>(SEED_LOGS);
  const [okrs, setOkrs] = useState<OKRItem[]>(SEED_OKRS);
  const [settings, setSettings] = useState<IntegrationSettings>(DEFAULT_SETTINGS);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitePrefill, setInvitePrefill] = useState<QuickInvitePrefill | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Hydrate from localStorage safely
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.locale) setLocale(parsed.locale);
        if (parsed.theme) setTheme(parsed.theme);
        if (Array.isArray(parsed.employees) && parsed.employees.length) setEmployees(parsed.employees);
        if (Array.isArray(parsed.attendance)) setAttendance(parsed.attendance);
        if (Array.isArray(parsed.leaves)) setLeaves(parsed.leaves);
        if (Array.isArray(parsed.payrollRuns) && parsed.payrollRuns.length) setPayrollRuns(parsed.payrollRuns);
        if (Array.isArray(parsed.candidates)) setCandidates(parsed.candidates);
        if (Array.isArray(parsed.invitations)) setInvitations(parsed.invitations);
        if (Array.isArray(parsed.reports)) setReports(parsed.reports);
        if (Array.isArray(parsed.workflows)) setWorkflows(parsed.workflows);
        if (Array.isArray(parsed.logs)) setLogs(parsed.logs);
        if (Array.isArray(parsed.okrs)) setOkrs(parsed.okrs);
        if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }
    } catch {
      // Ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          locale,
          theme,
          employees,
          attendance,
          leaves,
          payrollRuns,
          candidates,
          invitations,
          reports,
          workflows,
          logs: logs.slice(0, 80),
          okrs,
          settings,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [
    hydrated,
    locale,
    theme,
    employees,
    attendance,
    leaves,
    payrollRuns,
    candidates,
    invitations,
    reports,
    workflows,
    logs,
    okrs,
    settings,
  ]);

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, [theme]);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const logAutomation = useCallback((entry: Omit<AutomationLog, "id" | "timestamp">) => {
    setLogs((prev) => [
      {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 79),
    ]);
  }, []);

  const addEmployee: HRISContextValue["addEmployee"] = useCallback(
    (empInput) => {
      const initials = empInput.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const codePrefix = empInput.country === "Indonesia" ? "ID" : empInput.country.slice(0, 2).toUpperCase();
      const newEmp: Employee = {
        ...empInput,
        id: `emp_${Date.now()}`,
        employeeCode: `AET-${codePrefix}-${String(employees.length + 1).padStart(3, "0")}`,
        avatarInitials: initials || "AE",
        avatarColor: AVATAR_GRADIENTS[employees.length % AVATAR_GRADIENTS.length],
      };
      setEmployees((prev) => [newEmp, ...prev]);
      logAutomation({
        event: "employee.onboarded",
        channel: "System",
        recipient: `${newEmp.name} (${newEmp.email})`,
        status: "Success",
        latencyMs: 88,
        detail: `Zero-Touch Onboarding triggered: Digital ID ${newEmp.employeeCode}, Welcome Pack & Mobile PWA access provisioned.`,
      });
      pushToast({
        title: locale === "id" ? "Karyawan Baru Ditambahkan" : "Employee Onboarded",
        description: `${newEmp.name} (${newEmp.employeeCode}) — Onboarding workflow triggered.`,
        variant: "success",
      });
      return newEmp;
    },
    [employees.length, locale, logAutomation, pushToast]
  );

  const updateEmployee = useCallback((id: string, patch: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clockInEmployee = useCallback(
    (record: Omit<AttendanceRecord, "id">) => {
      const created: AttendanceRecord = { ...record, id: `att_${Date.now()}` };
      setAttendance((prev) => [created, ...prev]);
      logAutomation({
        event: "attendance.clock_in",
        channel: "System",
        recipient: record.employeeName,
        status: "Success",
        latencyMs: 42,
        detail: `GPS Verified Clock-In at ${record.clockIn} (${record.location}) via ${record.device}`,
      });
      pushToast({
        title: locale === "id" ? "Clock-In GPS Berhasil" : "GPS Clock-In Verified",
        description: `${record.employeeName} — ${record.clockIn} (${record.location})`,
        variant: "success",
      });
    },
    [locale, logAutomation, pushToast]
  );

  const clockOutEmployee = useCallback(
    (recordId: string) => {
      const nowStr = new Date().toTimeString().slice(0, 5);
      setAttendance((prev) =>
        prev.map((a) => (a.id === recordId ? { ...a, clockOut: nowStr, workHours: 8.2 } : a))
      );
      pushToast({
        title: locale === "id" ? "Clock-Out Tercatat" : "Clock-Out Recorded",
        description: `${nowStr} — Timesheet synced to payroll.`,
        variant: "info",
      });
    },
    [locale, pushToast]
  );

  const submitLeaveRequest = useCallback(
    (req: Omit<LeaveRequest, "id" | "status" | "submittedAt">) => {
      const created: LeaveRequest = {
        ...req,
        id: `lv_${Date.now()}`,
        status: "Pending",
        submittedAt: new Date().toISOString(),
      };
      setLeaves((prev) => [created, ...prev]);
      logAutomation({
        event: "leave.submitted",
        channel: "System",
        recipient: req.employeeName,
        status: "Success",
        latencyMs: 51,
        detail: `${req.type} (${req.days} days: ${req.startDate} → ${req.endDate}) queued for manager approval`,
      });
      pushToast({
        title: locale === "id" ? "Pengajuan Cuti Terkirim" : "Leave Request Submitted",
        description: `${req.employeeName} — ${req.type} (${req.days}d)`,
        variant: "info",
      });
    },
    [locale, logAutomation, pushToast]
  );

  const decideLeaveRequest = useCallback(
    (id: string, decision: "Approved" | "Rejected") => {
      const target = leaves.find((l) => l.id === id);
      setLeaves((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: decision, autoNotified: true } : l))
      );
      if (target) {
        logAutomation({
          event: decision === "Approved" ? "leave.approved" : "leave.rejected",
          channel: "WhatsApp",
          recipient: `${target.employeeName} (${target.employeeEmail})`,
          status: "Success",
          latencyMs: 112,
          detail: `Leave ${decision} — Automated Email, WhatsApp & Calendar sync executed.`,
        });
        pushToast({
          title: `Leave ${decision}`,
          description: `${target.employeeName} notified via automated Email & WhatsApp workflow.`,
          variant: decision === "Approved" ? "success" : "warning",
        });
      }
    },
    [leaves, logAutomation, pushToast]
  );

  const addPayrollRun = useCallback(
    (run: PayrollRun) => {
      setPayrollRuns((prev) => [run, ...prev]);
      logAutomation({
        event: "payroll.completed",
        channel: "Email",
        recipient: `${run.totalEmployees} Global Employees`,
        status: "Success",
        latencyMs: 265,
        detail: `${run.label} finalized — Net USD ${run.totalNetUSD.toLocaleString("en-US")} disbursed & digital payslips dispatched.`,
      });
      pushToast({
        title: locale === "id" ? "Payroll Global Selesai!" : "Global Payroll Completed!",
        description: `${run.totalEmployees} payslips calculated & dispatched automatically.`,
        variant: "success",
      });
    },
    [locale, logAutomation, pushToast]
  );

  const addCandidate: HRISContextValue["addCandidate"] = useCallback(
    (candInput) => {
      const created: Candidate = {
        ...candInput,
        id: `cand_${Date.now()}`,
        stage: "Applied",
        appliedAt: new Date().toISOString().slice(0, 10),
      };
      setCandidates((prev) => [created, ...prev]);
      logAutomation({
        event: "candidate.created",
        channel: "System",
        recipient: `${created.name} (${created.role})`,
        status: "Success",
        latencyMs: 38,
        detail: `Candidate entered ATS pipeline from ${created.source}. Ready for instant WA/Email test invite.`,
      });
      return created;
    },
    [logAutomation]
  );

  const updateCandidateStage = useCallback((id: string, stage: CandidateStage) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
  }, []);

  const recordInvitation = useCallback(
    (inv: CandidateInvitation) => {
      setInvitations((prev) => [inv, ...prev]);
      setCandidates((prev) => {
        const exists = prev.some(
          (c) =>
            c.id === inv.candidateId ||
            c.email.toLowerCase() === inv.candidateEmail.toLowerCase()
        );
        if (exists) {
          return prev.map((c) =>
            c.id === inv.candidateId ||
            c.email.toLowerCase() === inv.candidateEmail.toLowerCase()
              ? { ...c, stage: "Invited", invitationId: inv.id, inviteUrl: inv.inviteUrl }
              : c
          );
        }
        return [
          {
            id: inv.candidateId,
            name: inv.candidateName,
            email: inv.candidateEmail,
            phone: inv.candidatePhone,
            role: inv.role,
            department: inv.department,
            location: "Global / Remote",
            source: "Direct Portal",
            stage: "Invited",
            appliedAt: new Date().toISOString().slice(0, 10),
            expectedSalary: "Competitive",
            invitationId: inv.id,
            inviteUrl: inv.inviteUrl,
          },
          ...prev,
        ];
      });
      logAutomation({
        event: "invitation.sent",
        channel: inv.channels.includes("WhatsApp") ? "WhatsApp" : "Email",
        recipient: `${inv.candidateName} (${inv.candidateEmail || inv.candidatePhone})`,
        status: "Success",
        latencyMs: 124,
        detail: `Signed ${inv.durationMinutes}m Cognitive & Psychometric invite sent via ${inv.channels.join(" + ")}`,
      });
    },
    [logAutomation]
  );

  const saveAssessmentReport = useCallback(
    (report: AssessmentReport) => {
      setReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)]);
      const autoAdvance =
        report.estimatedIq >= settings.autoAdvanceThresholdIq && report.integrityScore >= 80;
      setCandidates((prev) => {
        const match = prev.some(
          (c) =>
            (report.candidateId && c.id === report.candidateId) ||
            (report.candidateEmail &&
              c.email.toLowerCase() === report.candidateEmail.toLowerCase())
        );
        if (match) {
          return prev.map((c) =>
            (report.candidateId && c.id === report.candidateId) ||
            (report.candidateEmail &&
              c.email.toLowerCase() === report.candidateEmail.toLowerCase())
              ? {
                  ...c,
                  stage: autoAdvance ? "Interview" : "Completed",
                  reportId: report.id,
                  cognitiveIq: report.estimatedIq,
                  psychometricFit: report.sjtScore,
                  discCode: `${report.disc.primary}-${report.disc.secondary}`,
                }
              : c
          );
        }
        return [
          {
            id: report.candidateId || `cand_${Date.now()}`,
            name: report.candidateName,
            email: report.candidateEmail || "candidate@aetherhr.global",
            phone: report.candidatePhone || "",
            role: report.targetRole,
            department: "Assessment Portal",
            location: "Online Proctored",
            source: "Direct Portal",
            stage: autoAdvance ? "Interview" : "Completed",
            appliedAt: new Date().toISOString().slice(0, 10),
            expectedSalary: "TBD",
            reportId: report.id,
            cognitiveIq: report.estimatedIq,
            psychometricFit: report.sjtScore,
            discCode: `${report.disc.primary}-${report.disc.secondary}`,
          },
          ...prev,
        ];
      });
      logAutomation({
        event: autoAdvance ? "assessment.high_score" : "assessment.completed",
        channel: "Webhook",
        recipient: report.candidateName,
        status: "Success",
        latencyMs: 98,
        detail: `IQ ${report.estimatedIq} (${report.globalPercentile}th pct) | DISC ${report.disc.primary}-${report.disc.secondary} | Integrity ${report.integrityScore}%${
          autoAdvance ? " — Auto-Advanced to Interview!" : ""
        }`,
      });
    },
    [logAutomation, settings.autoAdvanceThresholdIq]
  );

  const toggleWorkflow = useCallback((id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  }, []);

  const addWorkflow: HRISContextValue["addWorkflow"] = useCallback(
    (wf) => {
      setWorkflows((prev) => [
        {
          ...wf,
          id: `wf_${Date.now()}`,
          runsCount: 0,
          successRate: 100,
          lastRunAt: null,
        },
        ...prev,
      ]);
      pushToast({
        title: locale === "id" ? "Workflow Otomatisasi Dibuat" : "Automation Workflow Created",
        description: wf.name,
        variant: "success",
      });
    },
    [locale, pushToast]
  );

  const updateOkrProgress = useCallback((okrId: string, krIndex: number, progress: number) => {
    setOkrs((prev) =>
      prev.map((o) => {
        if (o.id !== okrId) return o;
        const nextKrs = o.keyResults.map((kr, idx) =>
          idx === krIndex ? { ...kr, progress: Math.max(0, Math.min(100, progress)) } : kr
        );
        const avg = nextKrs.reduce((a, b) => a + b.progress, 0) / nextKrs.length;
        return {
          ...o,
          keyResults: nextKrs,
          status: avg >= 90 ? "Exceeded" : avg >= 65 ? "On Track" : "At Risk",
        };
      })
    );
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<IntegrationSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      pushToast({
        title: locale === "id" ? "Konfigurasi Tersimpan" : "Configuration Saved",
        description:
          locale === "id"
            ? "Kredensial & aturan otomatisasi langsung aktif."
            : "Credentials & automation rules are now live.",
        variant: "success",
      });
    },
    [locale, pushToast]
  );

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEmployees(SEED_EMPLOYEES);
    setAttendance(SEED_ATTENDANCE);
    setLeaves(SEED_LEAVES);
    setPayrollRuns([buildSeedPayrollRun(SEED_EMPLOYEES)]);
    setCandidates(SEED_CANDIDATES);
    setInvitations([]);
    setReports(SEED_REPORTS);
    setWorkflows(SEED_WORKFLOWS);
    setLogs(SEED_LOGS);
    setOkrs(SEED_OKRS);
    setSettings(DEFAULT_SETTINGS);
    pushToast({
      title: "Demo Dataset Reset",
      description: "Restored pristine international enterprise dataset.",
      variant: "info",
    });
  }, [pushToast]);

  const openInviteModal = useCallback((prefill?: QuickInvitePrefill) => {
    setInvitePrefill(prefill || null);
    setInviteModalOpen(true);
  }, []);

  const closeInviteModal = useCallback(() => {
    setInviteModalOpen(false);
    setInvitePrefill(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <HRISContext.Provider
      value={{
        hydrated,
        locale,
        setLocale,
        theme,
        setTheme,
        toggleTheme,
        employees,
        attendance,
        leaves,
        payrollRuns,
        candidates,
        invitations,
        reports,
        workflows,
        logs,
        okrs,
        settings,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        clockInEmployee,
        clockOutEmployee,
        submitLeaveRequest,
        decideLeaveRequest,
        addPayrollRun,
        addCandidate,
        updateCandidateStage,
        recordInvitation,
        saveAssessmentReport,
        toggleWorkflow,
        addWorkflow,
        logAutomation,
        updateOkrProgress,
        updateSettings,
        resetDemoData,
        inviteModalOpen,
        invitePrefill,
        openInviteModal,
        closeInviteModal,
        toasts,
        pushToast,
        dismissToast,
      }}
    >
      {children}
    </HRISContext.Provider>
  );
}

export function useHRIS() {
  const ctx = useContext(HRISContext);
  if (!ctx) throw new Error("useHRIS must be used within HRISProvider");
  return ctx;
}
