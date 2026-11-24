"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  ActiveRole,
  AssessmentReport,
  AttendanceRecord,
  AutomationLog,
  AutomationWorkflow,
  Candidate,
  CandidateInvitation,
  CandidateStage,
  CompanyAnnouncement,
  CompanyAsset,
  Employee,
  ExpenseClaim,
  HRDocument,
  IntegrationSettings,
  LearningCourse,
  LeaveRequest,
  Locale,
  OKRItem,
  OnboardingChecklist,
  PayrollRun,
  ShiftCode,
  ShiftRosterRow,
  ThemeMode,
} from "@/types/hris";
import {
  buildSeedPayrollRun,
  DEFAULT_SETTINGS,
  SEED_ANNOUNCEMENTS,
  SEED_ASSETS,
  SEED_ATTENDANCE,
  SEED_CANDIDATES,
  SEED_CHECKLISTS,
  SEED_COURSES,
  SEED_DOCUMENTS,
  SEED_EMPLOYEES,
  SEED_EXPENSES,
  SEED_LEAVES,
  SEED_LOGS,
  SEED_OKRS,
  SEED_REPORTS,
  SEED_SHIFT_ROSTER,
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
  activeRole: ActiveRole;
  setActiveRole: (r: ActiveRole) => void;

  // Domain State
  employees: Employee[];
  attendance: AttendanceRecord[];
  shiftRoster: ShiftRosterRow[];
  leaves: LeaveRequest[];
  payrollRuns: PayrollRun[];
  expenses: ExpenseClaim[];
  assets: CompanyAsset[];
  documents: HRDocument[];
  announcements: CompanyAnnouncement[];
  checklists: OnboardingChecklist[];
  courses: LearningCourse[];
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
  cycleShiftCell: (employeeId: string, dayIndex: number) => void;

  submitLeaveRequest: (req: Omit<LeaveRequest, "id" | "status" | "submittedAt">) => void;
  decideLeaveRequest: (id: string, decision: "Approved" | "Rejected") => void;

  addPayrollRun: (run: PayrollRun) => void;

  submitExpenseClaim: (claim: Omit<ExpenseClaim, "id" | "status">) => void;
  decideExpenseClaim: (id: string, decision: "Approved" | "Rejected") => void;

  addAsset: (asset: Omit<CompanyAsset, "id">) => void;
  assignAsset: (assetId: string, employeeId: string | null, employeeName: string, department: string) => void;

  signDocument: (docId: string, signerName: string, signatureDataUrl: string) => void;
  addDocument: (doc: Omit<HRDocument, "id">) => void;
  publishAnnouncement: (ann: Omit<CompanyAnnouncement, "id" | "publishedAt">) => void;

  toggleChecklistTask: (checklistId: string, taskId: string) => void;
  completeCourse: (courseId: string) => void;

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

  inviteModalOpen: boolean;
  invitePrefill: QuickInvitePrefill | null;
  openInviteModal: (prefill?: QuickInvitePrefill) => void;
  closeInviteModal: () => void;

  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const STORAGE_KEY = "aetherhr_enterprise_state_v3";

const HRISContext = createContext<HRISContextValue | null>(null);

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-cyan-600",
];

const SHIFT_ORDER: ShiftCode[] = ["REG", "FLEX", "REM", "NIGHT", "OFF"];

export function HRISProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [locale, setLocale] = useState<Locale>("id");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [activeRole, setActiveRole] = useState<ActiveRole>("HR Admin");

  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(SEED_ATTENDANCE);
  const [shiftRoster, setShiftRoster] = useState<ShiftRosterRow[]>(SEED_SHIFT_ROSTER);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(SEED_LEAVES);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => [
    buildSeedPayrollRun(SEED_EMPLOYEES),
  ]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>(SEED_EXPENSES);
  const [assets, setAssets] = useState<CompanyAsset[]>(SEED_ASSETS);
  const [documents, setDocuments] = useState<HRDocument[]>(SEED_DOCUMENTS);
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>(SEED_ANNOUNCEMENTS);
  const [checklists, setChecklists] = useState<OnboardingChecklist[]>(SEED_CHECKLISTS);
  const [courses, setCourses] = useState<LearningCourse[]>(SEED_COURSES);
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.locale) setLocale(parsed.locale);
        if (parsed.theme === "dark" || parsed.theme === "light") setTheme(parsed.theme);
        if (parsed.activeRole) setActiveRole(parsed.activeRole);
        if (Array.isArray(parsed.employees) && parsed.employees.length) setEmployees(parsed.employees);
        if (Array.isArray(parsed.attendance)) setAttendance(parsed.attendance);
        if (Array.isArray(parsed.shiftRoster)) setShiftRoster(parsed.shiftRoster);
        if (Array.isArray(parsed.leaves)) setLeaves(parsed.leaves);
        if (Array.isArray(parsed.payrollRuns) && parsed.payrollRuns.length) setPayrollRuns(parsed.payrollRuns);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
        if (Array.isArray(parsed.assets)) setAssets(parsed.assets);
        if (Array.isArray(parsed.documents)) setDocuments(parsed.documents);
        if (Array.isArray(parsed.announcements)) setAnnouncements(parsed.announcements);
        if (Array.isArray(parsed.checklists)) setChecklists(parsed.checklists);
        if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
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

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          locale,
          theme,
          activeRole,
          employees,
          attendance,
          shiftRoster,
          leaves,
          payrollRuns,
          expenses,
          assets,
          documents,
          announcements,
          checklists,
          courses,
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
      // Ignore quota
    }
  }, [
    hydrated,
    locale,
    theme,
    activeRole,
    employees,
    attendance,
    shiftRoster,
    leaves,
    payrollRuns,
    expenses,
    assets,
    documents,
    announcements,
    checklists,
    courses,
    candidates,
    invitations,
    reports,
    workflows,
    logs,
    okrs,
    settings,
  ]);

  // Apply dark class only when dark mode is chosen (default is crisp Executive Light!)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
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
        detail: `Zero-Touch Onboarding triggered: Digital ID ${newEmp.employeeCode}, 30-60-90 checklist & Mobile PWA access provisioned.`,
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

  const cycleShiftCell = useCallback((employeeId: string, dayIndex: number) => {
    setShiftRoster((prev) =>
      prev.map((row) => {
        if (row.employeeId !== employeeId) return row;
        const nextDays = [...row.days] as ShiftRosterRow["days"];
        const curIdx = SHIFT_ORDER.indexOf(nextDays[dayIndex]);
        nextDays[dayIndex] = SHIFT_ORDER[(curIdx + 1) % SHIFT_ORDER.length];
        return { ...row, days: nextDays };
      })
    );
  }, []);

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

  const submitExpenseClaim = useCallback(
    (claim: Omit<ExpenseClaim, "id" | "status">) => {
      const created: ExpenseClaim = { ...claim, id: `exp_${Date.now()}`, status: "Pending" };
      setExpenses((prev) => [created, ...prev]);
      logAutomation({
        event: "expense.submitted",
        channel: "System",
        recipient: claim.employeeName,
        status: "Success",
        latencyMs: 48,
        detail: `${claim.category} claim (${claim.currency} ${claim.amount.toLocaleString("en-US")}) submitted for finance review.`,
      });
      pushToast({
        title: locale === "id" ? "Klaim Reimburse Diajukan" : "Expense Claim Submitted",
        description: `${claim.employeeName} — ${claim.category}`,
        variant: "info",
      });
    },
    [locale, logAutomation, pushToast]
  );

  const decideExpenseClaim = useCallback(
    (id: string, decision: "Approved" | "Rejected") => {
      const target = expenses.find((e) => e.id === id);
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: decision, syncedToPayroll: decision === "Approved" }
            : e
        )
      );
      if (target) {
        logAutomation({
          event: "expense.approved",
          channel: "Email",
          recipient: target.employeeName,
          status: "Success",
          latencyMs: 96,
          detail:
            decision === "Approved"
              ? `Reimbursement approved & auto-queued into next Payroll cycle (${target.currency} ${target.amount.toLocaleString("en-US")}).`
              : `Reimbursement claim rejected — notification sent.`,
        });
        pushToast({
          title:
            decision === "Approved"
              ? locale === "id"
                ? "Reimburse Disetujui & Sync ke Payroll"
                : "Expense Approved & Synced to Payroll"
              : locale === "id"
              ? "Reimburse Ditolak"
              : "Expense Rejected",
          description: target.employeeName,
          variant: decision === "Approved" ? "success" : "warning",
        });
      }
    },
    [expenses, locale, logAutomation, pushToast]
  );

  const addAsset = useCallback(
    (asset: Omit<CompanyAsset, "id">) => {
      setAssets((prev) => [{ ...asset, id: `ast_${Date.now()}` }, ...prev]);
      pushToast({
        title: locale === "id" ? "Aset IT Ditambahkan" : "IT Asset Registered",
        description: `${asset.assetTag} — ${asset.name}`,
        variant: "success",
      });
    },
    [locale, pushToast]
  );

  const assignAsset = useCallback(
    (assetId: string, employeeId: string | null, employeeName: string, department: string) => {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? {
                ...a,
                assignedToId: employeeId,
                assignedToName: employeeName,
                department,
                status: employeeId ? "Assigned" : "In Stock",
                assignedDate: new Date().toISOString().slice(0, 10),
              }
            : a
        )
      );
      pushToast({
        title: locale === "id" ? "Status Aset Diperbarui" : "Asset Assignment Updated",
        description: employeeId ? `Assigned to ${employeeName}` : "Returned to HQ Vault",
        variant: "info",
      });
    },
    [locale, pushToast]
  );

  const signDocument = useCallback(
    (docId: string, signerName: string, signatureDataUrl: string) => {
      const hashHex = Array.from({ length: 24 }, (_, i) =>
        ((docId.charCodeAt(i % docId.length) + signerName.length * (i + 7)) % 16).toString(16)
      ).join("");
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                status: "Signed",
                signedBy: signerName,
                signedAt: new Date().toISOString(),
                signatureDataUrl,
                verificationHash: `sha256:${hashHex}`,
              }
            : d
        )
      );
      logAutomation({
        event: "contract.signed",
        channel: "Email",
        recipient: signerName,
        status: "Success",
        latencyMs: 118,
        detail: `Digital E-Signature sealed with SHA-256 verification hash (${hashHex.slice(0, 12)}...).`,
      });
      pushToast({
        title: locale === "id" ? "Dokumen Resmi Ditandatangani (E-Sign)" : "Document E-Signed & Sealed",
        description: `Signed by ${signerName} · SHA-256 Verified`,
        variant: "success",
      });
    },
    [locale, logAutomation, pushToast]
  );

  const addDocument = useCallback(
    (doc: Omit<HRDocument, "id">) => {
      setDocuments((prev) => [{ ...doc, id: `doc_${Date.now()}` }, ...prev]);
      pushToast({
        title: locale === "id" ? "Dokumen Kontrak Dibuat" : "HR Contract Created",
        description: doc.title,
        variant: "success",
      });
    },
    [locale, pushToast]
  );

  const publishAnnouncement = useCallback(
    (ann: Omit<CompanyAnnouncement, "id" | "publishedAt">) => {
      setAnnouncements((prev) => [
        { ...ann, id: `ann_${Date.now()}`, publishedAt: new Date().toISOString() },
        ...prev,
      ]);
      logAutomation({
        event: "announcement.broadcast",
        channel: "WhatsApp",
        recipient: `All ${employees.length} Global Employees`,
        status: "Success",
        latencyMs: 134,
        detail: `Broadcasted "${ann.title}" via ${ann.channels.join(", ")}`,
      });
      pushToast({
        title: locale === "id" ? "Pengumuman Dikirim ke Semua Karyawan" : "Announcement Broadcasted",
        description: ann.title,
        variant: "success",
      });
    },
    [employees.length, locale, logAutomation, pushToast]
  );

  const toggleChecklistTask = useCallback((checklistId: string, taskId: string) => {
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? {
              ...c,
              tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
            }
          : c
      )
    );
  }, []);

  const completeCourse = useCallback(
    (courseId: string) => {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                completedByUser: true,
                completionRate: Math.min(100, c.completionRate + 12),
              }
            : c
        )
      );
      pushToast({
        title: locale === "id" ? "Sertifikat LMS Diterbitkan!" : "LMS Certificate Issued!",
        description: "Verified training credential synced to employee profile.",
        variant: "success",
      });
    },
    [locale, pushToast]
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
        detail: `Candidate entered ATS pipeline from ${created.source}.`,
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
        detail: `IQ ${report.estimatedIq} (${report.globalPercentile}th pct) | DISC ${report.disc.primary}-${report.disc.secondary} | Integrity ${report.integrityScore}%`,
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
        { ...wf, id: `wf_${Date.now()}`, runsCount: 0, successRate: 100, lastRunAt: null },
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
    setShiftRoster(SEED_SHIFT_ROSTER);
    setLeaves(SEED_LEAVES);
    setPayrollRuns([buildSeedPayrollRun(SEED_EMPLOYEES)]);
    setExpenses(SEED_EXPENSES);
    setAssets(SEED_ASSETS);
    setDocuments(SEED_DOCUMENTS);
    setAnnouncements(SEED_ANNOUNCEMENTS);
    setChecklists(SEED_CHECKLISTS);
    setCourses(SEED_COURSES);
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
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
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
        activeRole,
        setActiveRole,
        employees,
        attendance,
        shiftRoster,
        leaves,
        payrollRuns,
        expenses,
        assets,
        documents,
        announcements,
        checklists,
        courses,
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
        cycleShiftCell,
        submitLeaveRequest,
        decideLeaveRequest,
        addPayrollRun,
        submitExpenseClaim,
        decideExpenseClaim,
        addAsset,
        assignAsset,
        signDocument,
        addDocument,
        publishAnnouncement,
        toggleChecklistTask,
        completeCourse,
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
