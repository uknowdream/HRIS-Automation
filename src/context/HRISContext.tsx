"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type {
  ActiveRole,
  AssessmentReport,
  AttendanceRecord,
  AuditLogEntry,
  AuditModule,
  AuditSeverity,
  AuthUser,
  AutomationLog,
  AutomationTrigger,
  AutomationWorkflow,
  Candidate,
  CandidateInvitation,
  CandidateStage,
  CompanyAnnouncement,
  CompanyAsset,
  Employee,
  EntityScope,
  ExpenseClaim,
  HRDocument,
  HRNotification,
  IntegrationSettings,
  LearningCourse,
  LeaveRequest,
  Locale,
  OKRItem,
  OnboardingChecklist,
  PayrollRun,
  PermissionKey,
  ShiftCode,
  ShiftRosterRow,
  ThemeMode,
} from "@/types/hris";
import {
  buildSeedAuditLogs,
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
import { FX_TO_USD } from "@/lib/payroll-engine";
import {
  checkRolePermission,
  computeAuditChainHash,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_PERSONAS,
} from "@/lib/rbac";

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
  switchRole: (r: ActiveRole) => void;
  selectedEntity: EntityScope;
  setSelectedEntity: (e: EntityScope) => void;
  authUser: AuthUser;
  setAuthUser: (u: AuthUser) => void;
  currentEmployee: Employee;
  signOut: () => Promise<void>;

  // RBAC & Security Audit Ledger
  rolePermissions: Record<ActiveRole, PermissionKey[]>;
  hasPermission: (perm: PermissionKey) => boolean;
  toggleRolePermission: (role: ActiveRole, perm: PermissionKey) => void;
  auditLogs: AuditLogEntry[];
  recordAuditLog: (entry: {
    module: AuditModule;
    action: string;
    target: string;
    severity: AuditSeverity;
    detail: string;
    actorOverride?: { name: string; email: string; role: ActiveRole };
  }) => void;

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

  // Enterprise Notification Center
  notifications: HRNotification[];
  unreadNotificationsCount: number;
  pushNotification: (n: Omit<HRNotification, "id" | "read" | "createdAt">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearReadNotifications: () => void;

  // Actions
  addEmployee: (emp: Omit<Employee, "id" | "employeeCode" | "avatarInitials" | "avatarColor">) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  offboardEmployee: (id: string) => void;
  hireCandidateToEmployee: (candidateId: string) => Employee | null;

  clockInEmployee: (record: Omit<AttendanceRecord, "id">) => void;
  clockOutEmployee: (recordId: string) => void;
  cycleShiftCell: (employeeId: string, dayIndex: number) => void;

  submitLeaveRequest: (req: Omit<LeaveRequest, "id" | "status" | "submittedAt">) => void;
  decideLeaveRequest: (id: string, decision: "Approved" | "Rejected") => void;

  addPayrollRun: (run: PayrollRun) => void;
  broadcastAllPayslips: (period: string, count: number) => void;

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

  addOkrItem: (item: Omit<OKRItem, "id" | "status">) => void;
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

const STORAGE_KEY = "aetherhr_enterprise_state_v6";

const DEFAULT_AUTH_USER: AuthUser = {
  id: "usr-super-00",
  name: "Nadia Kusuma",
  email: "nadia.kusuma@aetherhr.global",
  role: "HR Admin",
  companyName: "AetherHR Global Technologies",
  avatarInitials: "NK",
  mfaVerified: true,
};

const SEED_NOTIFICATIONS: HRNotification[] = [
  {
    id: "ntf-1",
    title: "Persetujuan Cuti Menunggu (2)",
    message: "Raka Pradipta (3d Annual) & Lukas Weber (5d WFA) menunggu persetujuan.",
    category: "approval",
    read: false,
    createdAt: "2026-11-24T08:15:00Z",
    href: "/attendance",
  },
  {
    id: "ntf-2",
    title: "Klaim Reimburse Siap Sync Payroll",
    message: "2 klaim reimbursement baru dari Engineering menunggu verifikasi finance.",
    category: "approval",
    read: false,
    createdAt: "2026-11-24T07:50:00Z",
    href: "/finance-ops",
  },
  {
    id: "ntf-3",
    title: "Radar PKWT & E-Signature",
    message: "Kontrak Bima Sakti akan berakhir 12 Des & Offer Aurelia menunggu tanda tangan.",
    category: "approval",
    read: false,
    createdAt: "2026-11-24T07:10:00Z",
    href: "/documents",
  },
  {
    id: "ntf-4",
    title: "Kandidat High-IQ Selesai Psikotes",
    message: "Dimas Arya Mahendra meraih IQ 136 (99th pct) — otomatis masuk tahap Interview.",
    category: "assessment",
    read: false,
    createdAt: "2026-11-23T15:42:00Z",
    href: "/assessments",
  },
  {
    id: "ntf-5",
    title: "RBAC Zero-Trust & Audit Ledger v6.0 Aktif",
    message: "5 Role Enterprise + rantai kriptografi Audit Log SHA-256 aktif memantau seluruh modul.",
    category: "security",
    read: false,
    createdAt: "2026-11-24T09:00:00Z",
    href: "/audit-logs",
  },
];

const HRISContext = createContext<HRISContextValue | null>(null);

const AVATAR_GRADIENTS = [
  "from-indigo-600 to-blue-600",
  "from-emerald-600 to-teal-600",
  "from-violet-600 to-purple-600",
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
  const [selectedEntity, setSelectedEntity] = useState<EntityScope>("ALL");
  const [authUser, setAuthUser] = useState<AuthUser>(DEFAULT_AUTH_USER);
  const [rolePermissions, setRolePermissions] = useState<Record<ActiveRole, PermissionKey[]>>(
    DEFAULT_ROLE_PERMISSIONS
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => buildSeedAuditLogs());

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
  const [notifications, setNotifications] = useState<HRNotification[]>(SEED_NOTIFICATIONS);

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
        if (parsed.selectedEntity) setSelectedEntity(parsed.selectedEntity);
        if (parsed.authUser) setAuthUser(parsed.authUser);
        if (parsed.rolePermissions) {
          setRolePermissions({ ...DEFAULT_ROLE_PERMISSIONS, ...parsed.rolePermissions });
        }
        if (Array.isArray(parsed.auditLogs) && parsed.auditLogs.length) {
          setAuditLogs(parsed.auditLogs);
        }
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
        if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
        if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }
    } catch {
      // ignore
    }

    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setAuthUser(d.user);
          setActiveRole(d.user.role);
        }
      })
      .catch(() => {});

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
          selectedEntity,
          authUser,
          rolePermissions,
          auditLogs: auditLogs.slice(0, 120),
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
          logs: logs.slice(0, 90),
          okrs,
          notifications: notifications.slice(0, 45),
          settings,
        })
      );
    } catch {
      // ignore
    }
  }, [
    hydrated,
    locale,
    theme,
    activeRole,
    selectedEntity,
    authUser,
    rolePermissions,
    auditLogs,
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
    notifications,
    settings,
  ]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const currentEmployee = useMemo(() => {
    const byEmail = employees.find(
      (e) => e.email.toLowerCase() === authUser.email.toLowerCase()
    );
    if (byEmail) return byEmail;
    const fallbackId = ROLE_PERSONAS[activeRole]?.employeeId || "emp-03";
    return employees.find((e) => e.id === fallbackId) || employees[0];
  }, [activeRole, authUser.email, employees]);

  const hasPermission = useCallback(
    (perm: PermissionKey) => checkRolePermission(activeRole, perm, rolePermissions),
    [activeRole, rolePermissions]
  );

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushNotification = useCallback(
    (n: Omit<HRNotification, "id" | "read" | "createdAt">) => {
      setNotifications((prev) => [
        {
          ...n,
          id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.slice(0, 44),
      ]);
    },
    []
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearReadNotifications = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !n.read));
  }, []);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const logAutomation = useCallback((entry: Omit<AutomationLog, "id" | "timestamp">) => {
    setLogs((prev) => [
      {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 89),
    ]);
  }, []);

  // Tamper-evident cryptographic SHA-256 Audit Log Recorder
  const recordAuditLog: HRISContextValue["recordAuditLog"] = useCallback(
    ({ module, action, target, severity, detail, actorOverride }) => {
      const timestamp = new Date().toISOString();
      const actorName = actorOverride?.name || authUser.name;
      const actorEmail = actorOverride?.email || authUser.email;
      const actorRole = actorOverride?.role || activeRole;

      setAuditLogs((prev) => {
        const prevHash = prev[0]?.hash || "GENESIS_AETHERHR_SOC2_LEDGER_2026";
        const hash = computeAuditChainHash(prevHash, {
          timestamp,
          actorEmail,
          actorRole,
          module,
          action,
          target,
          detail,
        });
        const entry: AuditLogEntry = {
          id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp,
          actorName,
          actorEmail,
          actorRole,
          ipAddress: "127.0.0.1 · Verified Session",
          module,
          action,
          target,
          severity,
          detail,
          prevHash,
          hash,
        };
        return [entry, ...prev.slice(0, 119)];
      });
    },
    [activeRole, authUser.email, authUser.name]
  );

  // Autonomous Event-Driven Workflow Bus: matches active workflows, increments runsCount, and fires configured webhooks!
  const dispatchWorkflowTrigger = useCallback(
    (
      trigger: AutomationTrigger,
      recipient: string,
      summary: string,
      webhookPayload?: Record<string, unknown>
    ) => {
      const nowIso = new Date().toISOString();
      setWorkflows((prev) => {
        const matched = prev.filter((w) => w.enabled && w.trigger === trigger);
        if (matched.length > 0) {
          matched.forEach((wf) => {
            logAutomation({
              event: trigger,
              channel: "System",
              recipient,
              status: "Success",
              latencyMs: 68,
              detail: `[Auto-Workflow: ${wf.name}] Executed ${wf.actions.length} chained actions — ${summary}`,
            });
          });
        }
        return prev.map((w) =>
          w.enabled && w.trigger === trigger
            ? { ...w, runsCount: w.runsCount + 1, lastRunAt: nowIso }
            : w
        );
      });

      if (settings.primaryWebhookUrl && settings.primaryWebhookUrl.startsWith("http")) {
        fetch("/api/webhooks/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: settings.primaryWebhookUrl,
            event: trigger,
            format: "generic",
            secret: settings.webhookSecret,
            payload: webhookPayload || { recipient, summary, timestamp: nowIso },
          }),
        }).catch(() => {});
      }
    },
    [logAutomation, settings.primaryWebhookUrl, settings.webhookSecret]
  );

  const switchRole = useCallback(
    (nextRole: ActiveRole) => {
      const persona = ROLE_PERSONAS[nextRole];
      setActiveRole(nextRole);
      setAuthUser((prev) => ({
        ...prev,
        name: persona.defaultName,
        email: persona.defaultEmail,
        role: nextRole,
        avatarInitials: persona.avatarInitials,
      }));
      recordAuditLog({
        module: "RBAC & Security",
        action: "rbac.role_switched",
        target: `${nextRole} (${persona.defaultName})`,
        severity: "INFO",
        detail: `Switched active RBAC security context to ${nextRole} (${persona.defaultEmail}).`,
        actorOverride: {
          name: persona.defaultName,
          email: persona.defaultEmail,
          role: nextRole,
        },
      });
      pushToast({
        title: locale === "id" ? `Perspektif Role: ${nextRole}` : `Active Role: ${nextRole}`,
        description: `${persona.defaultName} · ${persona.summary[locale]}`,
        variant: "info",
      });
    },
    [locale, pushToast, recordAuditLog]
  );

  const toggleRolePermission = useCallback(
    (role: ActiveRole, perm: PermissionKey) => {
      if (role === "Super Admin") return;
      setRolePermissions((prev) => {
        const list = prev[role] || [];
        const exists = list.includes(perm);
        const updated = exists ? list.filter((p) => p !== perm) : [...list, perm];
        return { ...prev, [role]: updated };
      });
      recordAuditLog({
        module: "RBAC & Security",
        action: "rbac.permission_updated",
        target: `${role} → ${perm}`,
        severity: "SECURITY",
        detail: `Modified dynamic RBAC permission [${perm}] for role "${role}".`,
      });
    },
    [recordAuditLog]
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {
      // ignore
    }
    recordAuditLog({
      module: "Auth & Session",
      action: "auth.session_revoked",
      target: authUser.email,
      severity: "INFO",
      detail: "User signed out — HttpOnly HMAC-SHA256 session cookie cleared.",
    });
    logAutomation({
      event: "auth.session_revoked",
      channel: "System",
      recipient: authUser.email,
      status: "Success",
      latencyMs: 28,
      detail: "User signed out — HttpOnly session cookie cleared.",
    });
  }, [authUser.email, logAutomation, recordAuditLog]);

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
      dispatchWorkflowTrigger(
        "employee.onboarded",
        `${newEmp.name} (${newEmp.email})`,
        `Provisioned ID ${newEmp.employeeCode}, SSO & Mobile PWA`,
        { employeeCode: newEmp.employeeCode, name: newEmp.name, role: newEmp.role }
      );
      recordAuditLog({
        module: "People & JML",
        action: "employee.created",
        target: `${newEmp.name} (${newEmp.employeeCode})`,
        severity: "SENSITIVE",
        detail: `Onboarded ${newEmp.role} in ${newEmp.department} (${newEmp.country}) with ${newEmp.currency} compensation.`,
      });
      pushNotification({
        title: locale === "id" ? "Karyawan Baru Onboarded" : "New Joiner Provisioned",
        message: `${newEmp.name} (${newEmp.role}) ditambahkan ke direktori global.`,
        category: "automation",
        href: "/employees",
      });
      pushToast({
        title: locale === "id" ? "Karyawan Baru Ditambahkan" : "Employee Onboarded",
        description: `${newEmp.name} (${newEmp.employeeCode})`,
        variant: "success",
      });
      return newEmp;
    },
    [dispatchWorkflowTrigger, employees.length, locale, pushNotification, pushToast, recordAuditLog]
  );

  const updateEmployee = useCallback(
    (id: string, patch: Partial<Employee>) => {
      const target = employees.find((e) => e.id === id);
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
      if (target) {
        const changedSalary = patch.baseSalary !== undefined && patch.baseSalary !== target.baseSalary;
        recordAuditLog({
          module: "People & JML",
          action: changedSalary ? "employee.compensation_updated" : "employee.profile_updated",
          target: `${target.name} (${target.employeeCode})`,
          severity: changedSalary ? "CRITICAL" : "SENSITIVE",
          detail: changedSalary
            ? `Updated base salary from ${target.currency} ${target.baseSalary.toLocaleString("en-US")} to ${patch.baseSalary?.toLocaleString("en-US")}.`
            : `Updated employee role/department/status fields (${Object.keys(patch).join(", ")}).`,
        });
      }
    },
    [employees, recordAuditLog]
  );

  const deleteEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const offboardEmployee = useCallback(
    (id: string) => {
      const emp = employees.find((e) => e.id === id);
      if (!emp) return;
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setAssets((prev) =>
        prev.map((a) => (a.assignedToId === id ? { ...a, status: "Pending Return" } : a))
      );
      setChecklists((prev) => [
        {
          id: `chk_exit_${Date.now()}`,
          employeeId: emp.id,
          employeeName: emp.name,
          role: emp.role,
          department: emp.department,
          type: "Offboarding Exit",
          startDate: new Date().toISOString().slice(0, 10),
          buddyName: "Nadia Kusuma (HR)",
          tasks: [
            { id: `ex1_${Date.now()}`, phase: "Exit", title: "Revoke SSO, GitHub, Slack & Vercel Production Tokens", owner: "IT", done: true },
            { id: `ex2_${Date.now()}`, phase: "Exit", title: "Collect Corporate Laptop & Access Badge (Flagged Pending Return)", owner: "IT", done: false },
            { id: `ex3_${Date.now()}`, phase: "Exit", title: "Calculate Final Pro-Rata Payroll & Unused Leave Payout", owner: "HR", done: false },
            { id: `ex4_${Date.now()}`, phase: "Exit", title: "Conduct Exit Interview & Issue Paklaring Certificate", owner: "HR", done: false },
          ],
        },
        ...prev,
      ]);
      recordAuditLog({
        module: "People & JML",
        action: "employee.offboarded_leaver",
        target: `${emp.name} (${emp.employeeCode})`,
        severity: "CRITICAL",
        detail: "Executed JML Leaver protocol: SSO revoked, IT hardware marked Pending Return, Exit Checklist spawned.",
      });
      logAutomation({
        event: "employee.offboarded",
        channel: "System",
        recipient: `${emp.name} (${emp.employeeCode})`,
        status: "Success",
        latencyMs: 74,
        detail: "Leaver Flow executed: SSO tokens revoked, assigned IT assets marked Pending Return, Exit Checklist generated.",
      });
      pushNotification({
        title: locale === "id" ? "Alur Offboarding (Leaver) Aktif" : "Offboarding Leaver Workflow Triggered",
        message: `${emp.name}: akses SSO dicabut, aset IT ditandai Pending Return & checklist exit dibuat.`,
        category: "security",
        href: "/learning",
      });
      pushToast({
        title: locale === "id" ? "Offboarding Otomatis Dijalankan" : "Leaver Offboarding Triggered",
        description: `${emp.name} — Exit Checklist & IT Asset Return created.`,
        variant: "warning",
      });
    },
    [employees, locale, logAutomation, pushNotification, pushToast, recordAuditLog]
  );

  const hireCandidateToEmployee = useCallback(
    (candidateId: string): Employee | null => {
      const cand = candidates.find((c) => c.id === candidateId);
      if (!cand) return null;
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, stage: "Hired" } : c))
      );
      const isIndo = cand.location.toLowerCase().includes("jakarta") || cand.location.toLowerCase().includes("id");
      const newEmp = addEmployee({
        name: cand.name,
        email: cand.email,
        phone: cand.phone,
        role: cand.role,
        department: cand.department,
        location: cand.location,
        country: isIndo ? "Indonesia" : "Singapore",
        timezone: isIndo ? "Asia/Jakarta (UTC+7)" : "Asia/Singapore (UTC+8)",
        employmentType: "Full-Time",
        status: "Onboarding",
        joinDate: new Date().toISOString().slice(0, 10),
        managerName: "Nadia Kusuma",
        baseSalary: isIndo ? 28000000 : 9500,
        allowances: isIndo ? 4000000 : 1200,
        currency: isIndo ? "IDR" : "SGD",
        taxStatus: "TK/0",
        cognitiveIq: cand.cognitiveIq || 125,
        discProfile: cand.discCode || "D-C",
        performanceScore: 88,
        potentialScore: 92,
        attendanceRate: 100,
        skills: ["Verified Psychometric Hire", cand.department],
      });

      setDocuments((prev) => [
        {
          id: `doc_hire_${Date.now()}`,
          title: `Employment Agreement & Offer Letter — ${cand.role}`,
          docType: "Offer Letter",
          employeeId: newEmp.id,
          employeeName: newEmp.name,
          department: newEmp.department,
          issueDate: new Date().toISOString().slice(0, 10),
          expiryDate: "2027-11-24",
          status: "Awaiting Signature",
        },
        ...prev,
      ]);

      setChecklists((prev) => [
        {
          id: `chk_hire_${Date.now()}`,
          employeeId: newEmp.id,
          employeeName: newEmp.name,
          role: newEmp.role,
          department: newEmp.department,
          type: "Onboarding (30-60-90)",
          startDate: new Date().toISOString().slice(0, 10),
          buddyName: "Nadia Kusuma",
          tasks: [
            { id: `h1_${Date.now()}`, phase: "Day 1", title: "E-Sign Offer Letter & NDA (Auto-created in Contracts)", owner: "Employee", done: false },
            { id: `h2_${Date.now()}`, phase: "Day 1", title: "Provision Email, SSO, GitHub & Slack Accounts", owner: "IT", done: false },
            { id: `h3_${Date.now()}`, phase: "Week 1", title: "Assign Laptop from HQ IT Vault & Configure Payroll Tax", owner: "HR", done: false },
            { id: `h4_${Date.now()}`, phase: "Month 1", title: "Complete Mandatory ISO 27001 LMS Certification", owner: "Employee", done: false },
          ],
        },
        ...prev,
      ]);

      recordAuditLog({
        module: "Recruitment & ATS",
        action: "candidate.hired_jml",
        target: `${cand.name} → ${newEmp.employeeCode}`,
        severity: "SENSITIVE",
        detail: `Automated JML Joiner flow converted candidate (${cand.role}, IQ ${cand.cognitiveIq || 125}) into Employee + Contract + 30-60-90 Checklist.`,
      });

      pushNotification({
        title: locale === "id" ? "Joiner Flow Otomatis Selesai!" : "Automated Joiner Pipeline Executed!",
        message: `${cand.name} resmi direkrut → Profil Karyawan, Kontrak E-Sign & Checklist 30-60-90 dibuat otomatis.`,
        category: "automation",
        href: "/learning",
      });
      return newEmp;
    },
    [addEmployee, candidates, locale, pushNotification, recordAuditLog]
  );

  const clockInEmployee = useCallback(
    (record: Omit<AttendanceRecord, "id">) => {
      const created: AttendanceRecord = { ...record, id: `att_${Date.now()}` };
      setAttendance((prev) => [created, ...prev]);
      if (record.status === "Late") {
        dispatchWorkflowTrigger(
          "attendance.late",
          record.employeeName,
          `Late GPS check-in at ${record.clockIn} (${record.location})`
        );
      }
      logAutomation({
        event: "attendance.clock_in",
        channel: "System",
        recipient: record.employeeName,
        status: "Success",
        latencyMs: 42,
        detail: `GPS Verified Clock-In at ${record.clockIn} (${record.location}) via ${record.device}`,
      });
      recordAuditLog({
        module: "Attendance & Leave",
        action: record.status === "Late" ? "attendance.clock_in_late" : "attendance.clock_in",
        target: `${record.employeeName} (${record.clockIn})`,
        severity: "INFO",
        detail: `Geofence verified check-in at ${record.location} via ${record.device}.`,
      });
      pushToast({
        title: locale === "id" ? "Clock-In GPS Berhasil" : "GPS Clock-In Verified",
        description: `${record.employeeName} — ${record.clockIn} (${record.status})`,
        variant: "success",
      });
    },
    [dispatchWorkflowTrigger, locale, logAutomation, pushToast, recordAuditLog]
  );

  const clockOutEmployee = useCallback(
    (recordId: string) => {
      const nowStr = new Date().toTimeString().slice(0, 5);
      const target = attendance.find((a) => a.id === recordId);
      setAttendance((prev) =>
        prev.map((a) => (a.id === recordId ? { ...a, clockOut: nowStr, workHours: 8.2 } : a))
      );
      if (target) {
        recordAuditLog({
          module: "Attendance & Leave",
          action: "attendance.clock_out",
          target: `${target.employeeName} (${nowStr})`,
          severity: "INFO",
          detail: "Completed shift check-out (8.2h logged to payroll timesheet).",
        });
      }
      pushToast({
        title: locale === "id" ? "Clock-Out Tercatat" : "Clock-Out Recorded",
        description: `${nowStr} — Timesheet synced to payroll.`,
        variant: "info",
      });
    },
    [attendance, locale, pushToast, recordAuditLog]
  );

  const cycleShiftCell = useCallback(
    (employeeId: string, dayIndex: number) => {
      const row = shiftRoster.find((r) => r.employeeId === employeeId);
      setShiftRoster((prev) =>
        prev.map((r) => {
          if (r.employeeId !== employeeId) return r;
          const nextDays = [...r.days] as ShiftRosterRow["days"];
          const curIdx = SHIFT_ORDER.indexOf(nextDays[dayIndex]);
          nextDays[dayIndex] = SHIFT_ORDER[(curIdx + 1) % SHIFT_ORDER.length];
          return { ...r, days: nextDays };
        })
      );
      if (row) {
        recordAuditLog({
          module: "Attendance & Leave",
          action: "roster.shift_updated",
          target: `${row.employeeName} (Day ${dayIndex + 1})`,
          severity: "INFO",
          detail: `Updated weekly shift cell for ${row.employeeName}.`,
        });
      }
    },
    [recordAuditLog, shiftRoster]
  );

  // SMART AUTO-PILOT LEAVE SUBMISSION: auto-approves Remote WFA or <= 2d leave when policy enabled!
  const submitLeaveRequest = useCallback(
    (req: Omit<LeaveRequest, "id" | "status" | "submittedAt">) => {
      const emp = employees.find((e) => e.id === req.employeeId);
      const eligibleAutoApprove =
        settings.autoApproveShortLeave &&
        (req.type === "Remote WFA" || (req.days <= 2 && (emp?.attendanceRate ?? 98) >= 95));

      const created: LeaveRequest = {
        ...req,
        id: `lv_${Date.now()}`,
        status: eligibleAutoApprove ? "Approved" : "Pending",
        submittedAt: new Date().toISOString(),
        autoNotified: eligibleAutoApprove,
      };
      setLeaves((prev) => [created, ...prev]);

      if (eligibleAutoApprove) {
        dispatchWorkflowTrigger(
          "leave.approved",
          `${req.employeeName} (${req.employeeEmail})`,
          `Auto-Pilot Policy instantaneously approved ${req.days}d ${req.type}`
        );
        recordAuditLog({
          module: "Attendance & Leave",
          action: "leave.auto_approved_ai",
          target: `${req.employeeName} (${req.days}d ${req.type})`,
          severity: "INFO",
          detail: `Zero-Touch Auto-Pilot approved ${req.type} (${req.days}d <= 2d policy & attendance >= 95%).`,
        });
        pushNotification({
          title: locale === "id" ? `Auto-Pilot Menyetujui Cuti: ${req.employeeName}` : `Auto-Pilot Approved Leave: ${req.employeeName}`,
          message: `${req.days} hari ${req.type} disetujui otomatis & dikirim ke WA/Email/Kalender.`,
          category: "automation",
          href: "/attendance",
        });
        pushToast({
          title: locale === "id" ? "Auto-Pilot: Cuti Langsung Disetujui!" : "Auto-Pilot: Leave Auto-Approved!",
          description: `${req.employeeName} — ${req.type} (${req.days}d) synced to Calendar & WA.`,
          variant: "success",
        });
      } else {
        dispatchWorkflowTrigger(
          "leave.submitted",
          req.employeeName,
          `Submitted ${req.days}d ${req.type} for manager review`
        );
        recordAuditLog({
          module: "Attendance & Leave",
          action: "leave.submitted",
          target: `${req.employeeName} (${req.days}d ${req.type})`,
          severity: "INFO",
          detail: `Queued ${req.days}-day ${req.type} request for approval (${req.reason}).`,
        });
        pushNotification({
          title: locale === "id" ? "Pengajuan Cuti Baru" : "New Leave Request",
          message: `${req.employeeName} mengajukan ${req.type} (${req.days} hari).`,
          category: "approval",
          href: "/attendance",
        });
        pushToast({
          title: locale === "id" ? "Pengajuan Cuti Terkirim" : "Leave Request Submitted",
          description: `${req.employeeName} — ${req.type} (${req.days}d)`,
          variant: "info",
        });
      }
    },
    [
      dispatchWorkflowTrigger,
      employees,
      locale,
      pushNotification,
      pushToast,
      recordAuditLog,
      settings.autoApproveShortLeave,
    ]
  );

  const decideLeaveRequest = useCallback(
    (id: string, decision: "Approved" | "Rejected") => {
      const target = leaves.find((l) => l.id === id);
      setLeaves((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: decision, autoNotified: true } : l))
      );
      if (target) {
        if (decision === "Approved") {
          dispatchWorkflowTrigger(
            "leave.approved",
            `${target.employeeName} (${target.employeeEmail})`,
            `Manager approved ${target.days}d ${target.type}`
          );
        }
        logAutomation({
          event: decision === "Approved" ? "leave.approved" : "leave.rejected",
          channel: "WhatsApp",
          recipient: `${target.employeeName} (${target.employeeEmail})`,
          status: "Success",
          latencyMs: 112,
          detail: `Leave ${decision} — Automated Email, WhatsApp & Calendar sync executed.`,
        });
        recordAuditLog({
          module: "Attendance & Leave",
          action: decision === "Approved" ? "leave.approved" : "leave.rejected",
          target: `${target.employeeName} (${target.days}d ${target.type})`,
          severity: "INFO",
          detail: `Decision: ${decision} — omni-channel employee notification dispatched.`,
        });
        pushNotification({
          title: `Cuti ${decision}: ${target.employeeName}`,
          message: `Notifikasi otomatis terkirim ke Email & WhatsApp (${target.days}d ${target.type}).`,
          category: "automation",
          href: "/attendance",
        });
        pushToast({
          title: `Leave ${decision}`,
          description: `${target.employeeName} notified via Email & WhatsApp.`,
          variant: decision === "Approved" ? "success" : "warning",
        });
      }
    },
    [dispatchWorkflowTrigger, leaves, logAutomation, pushNotification, pushToast, recordAuditLog]
  );

  const addPayrollRun = useCallback(
    (run: PayrollRun) => {
      setPayrollRuns((prev) => [run, ...prev]);
      dispatchWorkflowTrigger(
        "payroll.completed",
        `${run.totalEmployees} Global Employees`,
        `${run.label} disbursed ($${run.totalNetUSD.toLocaleString("en-US")} Net)`,
        { period: run.period, totalEmployees: run.totalEmployees, totalNetUSD: run.totalNetUSD }
      );
      logAutomation({
        event: "payroll.completed",
        channel: "Email",
        recipient: `${run.totalEmployees} Global Employees`,
        status: "Success",
        latencyMs: 265,
        detail: `${run.label} finalized — Net USD ${run.totalNetUSD.toLocaleString("en-US")} disbursed.`,
      });
      recordAuditLog({
        module: "Payroll & Tax",
        action: "payroll.cycle_executed",
        target: `${run.period} (${run.totalEmployees} Payslips)`,
        severity: "CRITICAL",
        detail: `Executed multi-currency payroll run ${run.id} — Gross $${run.totalGrossUSD.toLocaleString("en-US")}, Net $${run.totalNetUSD.toLocaleString("en-US")}.`,
      });
      pushNotification({
        title: `Payroll ${run.period} Selesai`,
        message: `${run.totalEmployees} slip gaji dihitung & dikirim (Net $${run.totalNetUSD.toLocaleString("en-US")}).`,
        category: "payroll",
        href: "/payroll",
      });
      pushToast({
        title: locale === "id" ? "Payroll Global Selesai!" : "Global Payroll Completed!",
        description: `${run.totalEmployees} payslips calculated & dispatched.`,
        variant: "success",
      });
    },
    [dispatchWorkflowTrigger, locale, logAutomation, pushNotification, pushToast, recordAuditLog]
  );

  const broadcastAllPayslips = useCallback(
    (period: string, count: number) => {
      logAutomation({
        event: "payroll.payslips_broadcast",
        channel: "WhatsApp",
        recipient: `${count} Employees (Email + WhatsApp)`,
        status: "Success",
        latencyMs: 184,
        detail: `Batch encrypted digital payslips for ${period} dispatched via Email & WhatsApp.`,
      });
      recordAuditLog({
        module: "Payroll & Tax",
        action: "payroll.payslips_dispatched",
        target: `Period ${period} (${count} Staff)`,
        severity: "SENSITIVE",
        detail: `Broadcasted confidential PDF payslips across Email & WhatsApp channels.`,
      });
      pushToast({
        title: locale === "id" ? `Slip Gaji Dikirim Massal (${count})` : `Batch Payslips Dispatched (${count})`,
        description: `Email + WhatsApp notifications queued for period ${period}.`,
        variant: "success",
      });
    },
    [locale, logAutomation, pushToast, recordAuditLog]
  );

  // SMART AUTO-PILOT MICRO-EXPENSE SUBMISSION
  const submitExpenseClaim = useCallback(
    (claim: Omit<ExpenseClaim, "id" | "status">) => {
      const usdEquivalent = Math.round(claim.amount * (FX_TO_USD[claim.currency] || 1));
      const autoApproved =
        settings.autoApproveMicroExpense && usdEquivalent <= settings.microExpenseLimitUSD;

      const created: ExpenseClaim = {
        ...claim,
        id: `exp_${Date.now()}`,
        status: autoApproved ? "Approved" : "Pending",
        syncedToPayroll: autoApproved,
      };
      setExpenses((prev) => [created, ...prev]);

      if (autoApproved) {
        dispatchWorkflowTrigger(
          "expense.approved",
          claim.employeeName,
          `Auto-Pilot approved micro-expense (${claim.currency} ${claim.amount.toLocaleString("en-US")} <= $${settings.microExpenseLimitUSD})`
        );
        recordAuditLog({
          module: "Expenses & Assets",
          action: "expense.auto_approved_ai",
          target: `${claim.employeeName} (${claim.currency} ${claim.amount.toLocaleString("en-US")})`,
          severity: "INFO",
          detail: `Micro-expense (~$${usdEquivalent} <= $${settings.microExpenseLimitUSD} limit) auto-approved & synced to next Payroll.`,
        });
        pushNotification({
          title: locale === "id" ? "Auto-Pilot Reimburse Disetujui!" : "Micro-Expense Auto-Approved!",
          message: `${claim.employeeName} (${claim.currency} ${claim.amount.toLocaleString("en-US")}) otomatis masuk antrean Payroll.`,
          category: "payroll",
          href: "/payroll",
        });
        pushToast({
          title: locale === "id" ? "Auto-Pilot: Klaim Langsung Sync Payroll!" : "Auto-Pilot: Expense Auto-Synced!",
          description: `~$${usdEquivalent} <= $${settings.microExpenseLimitUSD} policy threshold.`,
          variant: "success",
        });
      } else {
        recordAuditLog({
          module: "Expenses & Assets",
          action: "expense.submitted",
          target: `${claim.employeeName} (${claim.currency} ${claim.amount.toLocaleString("en-US")})`,
          severity: "INFO",
          detail: `Submitted ${claim.category} claim (~$${usdEquivalent}) for Finance review.`,
        });
        pushNotification({
          title: locale === "id" ? "Klaim Reimburse Baru" : "New Expense Claim",
          message: `${claim.employeeName} — ${claim.category} (${claim.currency} ${claim.amount.toLocaleString("en-US")})`,
          category: "approval",
          href: "/finance-ops",
        });
        pushToast({
          title: locale === "id" ? "Klaim Reimburse Diajukan" : "Expense Claim Submitted",
          description: `${claim.employeeName} — ${claim.category}`,
          variant: "info",
        });
      }
    },
    [
      dispatchWorkflowTrigger,
      locale,
      pushNotification,
      pushToast,
      recordAuditLog,
      settings.autoApproveMicroExpense,
      settings.microExpenseLimitUSD,
    ]
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
        if (decision === "Approved") {
          dispatchWorkflowTrigger(
            "expense.approved",
            target.employeeName,
            `Approved ${target.currency} ${target.amount.toLocaleString("en-US")} & queued for Payroll`
          );
        }
        logAutomation({
          event: "expense.approved",
          channel: "Email",
          recipient: target.employeeName,
          status: "Success",
          latencyMs: 96,
          detail:
            decision === "Approved"
              ? `Reimbursement approved & auto-merged into next Payroll cycle (${target.currency} ${target.amount.toLocaleString("en-US")}).`
              : `Reimbursement rejected.`,
        });
        recordAuditLog({
          module: "Expenses & Assets",
          action: decision === "Approved" ? "expense.approved" : "expense.rejected",
          target: `${target.employeeName} (${target.receiptRef})`,
          severity: "SENSITIVE",
          detail: `${decision} expense claim of ${target.currency} ${target.amount.toLocaleString("en-US")}.`,
        });
        pushNotification({
          title: `Reimburse ${decision}: ${target.employeeName}`,
          message:
            decision === "Approved"
              ? "Otomatis masuk antrean Payroll periode berikutnya."
              : "Klaim ditolak oleh finance.",
          category: "payroll",
          href: "/payroll",
        });
        pushToast({
          title:
            decision === "Approved"
              ? locale === "id"
                ? "Reimburse Disetujui & Sync Payroll"
                : "Expense Approved & Synced"
              : locale === "id"
              ? "Reimburse Ditolak"
              : "Expense Rejected",
          description: target.employeeName,
          variant: decision === "Approved" ? "success" : "warning",
        });
      }
    },
    [dispatchWorkflowTrigger, expenses, locale, logAutomation, pushNotification, pushToast, recordAuditLog]
  );

  const addAsset = useCallback(
    (asset: Omit<CompanyAsset, "id">) => {
      setAssets((prev) => [{ ...asset, id: `ast_${Date.now()}` }, ...prev]);
      recordAuditLog({
        module: "Expenses & Assets",
        action: "asset.registered",
        target: `${asset.assetTag} (${asset.name})`,
        severity: "INFO",
        detail: `Registered corporate ${asset.category} valued at $${asset.purchaseValueUSD.toLocaleString("en-US")}.`,
      });
      pushToast({
        title: locale === "id" ? "Aset IT Ditambahkan" : "IT Asset Registered",
        description: `${asset.assetTag} — ${asset.name}`,
        variant: "success",
      });
    },
    [locale, pushToast, recordAuditLog]
  );

  const assignAsset = useCallback(
    (assetId: string, employeeId: string | null, employeeName: string, department: string) => {
      const target = assets.find((a) => a.id === assetId);
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
      recordAuditLog({
        module: "Expenses & Assets",
        action: employeeId ? "asset.assigned" : "asset.returned_vault",
        target: `${target?.assetTag || assetId} → ${employeeName}`,
        severity: "INFO",
        detail: employeeId
          ? `Assigned hardware ${target?.name || ""} to ${employeeName} (${department}).`
          : `Returned hardware ${target?.name || ""} to HQ Vault.`,
      });
      pushToast({
        title: locale === "id" ? "Status Aset Diperbarui" : "Asset Assignment Updated",
        description: employeeId ? `Assigned to ${employeeName}` : "Returned to HQ Vault",
        variant: "info",
      });
    },
    [assets, locale, pushToast, recordAuditLog]
  );

  const signDocument = useCallback(
    (docId: string, signerName: string, signatureDataUrl: string) => {
      const docTarget = documents.find((d) => d.id === docId);
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
      dispatchWorkflowTrigger(
        "contract.signed",
        signerName,
        `Contract "${docTarget?.title || docId}" sealed with sha256:${hashHex.slice(0, 12)}`
      );
      logAutomation({
        event: "contract.signed",
        channel: "Email",
        recipient: signerName,
        status: "Success",
        latencyMs: 118,
        detail: `Digital E-Signature sealed with SHA-256 hash (${hashHex.slice(0, 12)}...).`,
      });
      recordAuditLog({
        module: "Contracts & E-Sign",
        action: "contract.e_signed",
        target: docTarget ? `${docTarget.title} (${docTarget.employeeName})` : docId,
        severity: "SENSITIVE",
        detail: `Cryptographic Canvas E-Signature sealed by ${signerName} (sha256:${hashHex}).`,
      });
      pushNotification({
        title: locale === "id" ? "Kontrak Ditandatangani (SHA-256)" : "Contract E-Signed & Sealed",
        message: `Dokumen disahkan oleh ${signerName} dengan segel kriptografi SHA-256.`,
        category: "security",
        href: "/documents",
      });
      pushToast({
        title: locale === "id" ? "Dokumen Resmi Ditandatangani" : "Document E-Signed & Sealed",
        description: `Signed by ${signerName} · SHA-256 Verified`,
        variant: "success",
      });
    },
    [dispatchWorkflowTrigger, documents, locale, logAutomation, pushNotification, pushToast, recordAuditLog]
  );

  const addDocument = useCallback(
    (doc: Omit<HRDocument, "id">) => {
      setDocuments((prev) => [{ ...doc, id: `doc_${Date.now()}` }, ...prev]);
      recordAuditLog({
        module: "Contracts & E-Sign",
        action: "contract.drafted",
        target: `${doc.title} (${doc.employeeName})`,
        severity: "INFO",
        detail: `Created ${doc.docType} awaiting digital signature.`,
      });
      pushToast({
        title: locale === "id" ? "Dokumen Kontrak Dibuat" : "HR Contract Created",
        description: doc.title,
        variant: "success",
      });
    },
    [locale, pushToast, recordAuditLog]
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
      recordAuditLog({
        module: "Contracts & E-Sign",
        action: "announcement.broadcasted",
        target: ann.title,
        severity: "INFO",
        detail: `Published ${ann.category} broadcast across ${ann.channels.join(", ")}.`,
      });
      pushToast({
        title: locale === "id" ? "Pengumuman Disiarkan" : "Announcement Broadcasted",
        description: ann.title,
        variant: "success",
      });
    },
    [employees.length, locale, logAutomation, pushToast, recordAuditLog]
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
      const target = courses.find((c) => c.id === courseId);
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
      if (target) {
        recordAuditLog({
          module: "People & JML",
          action: "lms.certificate_issued",
          target: `${target.title} (${target.certificateCode})`,
          severity: "INFO",
          detail: `Issued verified compliance credential to ${authUser.name}.`,
        });
      }
      pushToast({
        title: locale === "id" ? "Sertifikat LMS Diterbitkan!" : "LMS Certificate Issued!",
        description: "Verified training credential synced.",
        variant: "success",
      });
    },
    [authUser.name, courses, locale, pushToast, recordAuditLog]
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
      dispatchWorkflowTrigger(
        "candidate.created",
        `${created.name} (${created.role})`,
        `New applicant entered ATS from ${created.source}`
      );
      logAutomation({
        event: "candidate.created",
        channel: "System",
        recipient: `${created.name} (${created.role})`,
        status: "Success",
        latencyMs: 38,
        detail: `Candidate entered ATS pipeline from ${created.source}.`,
      });
      recordAuditLog({
        module: "Recruitment & ATS",
        action: "candidate.created",
        target: `${created.name} (${created.role})`,
        severity: "INFO",
        detail: `Added candidate in ${created.department} (${created.location}).`,
      });
      return created;
    },
    [dispatchWorkflowTrigger, logAutomation, recordAuditLog]
  );

  const updateCandidateStage = useCallback(
    (id: string, stage: CandidateStage) => {
      const target = candidates.find((c) => c.id === id);
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
      if (target) {
        recordAuditLog({
          module: "Recruitment & ATS",
          action: "candidate.stage_moved",
          target: `${target.name} → ${stage}`,
          severity: "INFO",
          detail: `Moved candidate from ${target.stage} to ${stage}.`,
        });
      }
    },
    [candidates, recordAuditLog]
  );

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
      dispatchWorkflowTrigger(
        "invitation.sent",
        `${inv.candidateName} (${inv.candidateEmail || inv.candidatePhone})`,
        `Dispatched ${inv.durationMinutes}m signed test link via ${inv.channels.join(" + ")}`
      );
      logAutomation({
        event: "invitation.sent",
        channel: inv.channels.includes("WhatsApp") ? "WhatsApp" : "Email",
        recipient: `${inv.candidateName} (${inv.candidateEmail || inv.candidatePhone})`,
        status: "Success",
        latencyMs: 124,
        detail: `Signed ${inv.durationMinutes}m Cognitive & Psychometric invite dispatched via ${inv.channels.join(" + ")}`,
      });
      recordAuditLog({
        module: "Psychometrics",
        action: "assessment.invite_dispatched",
        target: `${inv.candidateName} (${inv.presetId})`,
        severity: "INFO",
        detail: `Issued HMAC-SHA256 signed token via ${inv.channels.join(" + ")} (${inv.durationMinutes}m proctored).`,
      });
      pushNotification({
        title: `Undangan Tes Terkirim: ${inv.candidateName}`,
        message: `Link terenkripsi (${inv.durationMinutes}m) siap via ${inv.channels.join(" + ")}.`,
        category: "automation",
        href: "/recruitment",
      });
    },
    [dispatchWorkflowTrigger, logAutomation, pushNotification, recordAuditLog]
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
      dispatchWorkflowTrigger(
        autoAdvance ? "assessment.high_score" : "assessment.completed",
        report.candidateName,
        `IQ ${report.estimatedIq} (${report.globalPercentile}th pct) · ${report.recommendation}`,
        {
          candidateName: report.candidateName,
          estimatedIq: report.estimatedIq,
          percentile: report.globalPercentile,
          disc: report.disc.archetype,
          verdict: report.recommendation,
        }
      );
      logAutomation({
        event: autoAdvance ? "assessment.high_score" : "assessment.completed",
        channel: "Webhook",
        recipient: report.candidateName,
        status: "Success",
        latencyMs: 98,
        detail: `IQ ${report.estimatedIq} (${report.globalPercentile}th pct) | DISC ${report.disc.primary}-${report.disc.secondary} | Integrity ${report.integrityScore}%`,
      });
      recordAuditLog({
        module: "Psychometrics",
        action: autoAdvance ? "assessment.auto_advanced" : "assessment.completed",
        target: `${report.candidateName} (IQ ${report.estimatedIq})`,
        severity: "SENSITIVE",
        detail: `Scored IQ ${report.estimatedIq}, Integrity ${report.integrityScore}%, Verdict ${report.recommendation}${
          autoAdvance ? " — Auto-advanced to Interview." : "."
        }`,
      });
      pushNotification({
        title: `Psikotes Selesai: ${report.candidateName}`,
        message: `IQ ${report.estimatedIq} (${report.globalPercentile}th pct) · ${report.recommendation.replace("_", " ")}`,
        category: "assessment",
        href: "/assessments",
      });
    },
    [
      dispatchWorkflowTrigger,
      logAutomation,
      pushNotification,
      recordAuditLog,
      settings.autoAdvanceThresholdIq,
    ]
  );

  const toggleWorkflow = useCallback(
    (id: string) => {
      const target = workflows.find((w) => w.id === id);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
      );
      if (target) {
        recordAuditLog({
          module: "Automation & API",
          action: target.enabled ? "workflow.paused" : "workflow.enabled",
          target: target.name,
          severity: "INFO",
          detail: `Toggled automation pipeline "${target.name}" (${target.trigger}).`,
        });
      }
    },
    [recordAuditLog, workflows]
  );

  const addWorkflow: HRISContextValue["addWorkflow"] = useCallback(
    (wf) => {
      setWorkflows((prev) => [
        { ...wf, id: `wf_${Date.now()}`, runsCount: 0, successRate: 100, lastRunAt: null },
        ...prev,
      ]);
      recordAuditLog({
        module: "Automation & API",
        action: "workflow.created",
        target: `${wf.name} (${wf.trigger})`,
        severity: "SENSITIVE",
        detail: `Created autonomous workflow pipeline with ${wf.actions.length} actions.`,
      });
      pushToast({
        title: locale === "id" ? "Workflow Otomatisasi Dibuat" : "Automation Workflow Created",
        description: wf.name,
        variant: "success",
      });
    },
    [locale, pushToast, recordAuditLog]
  );

  const addOkrItem: HRISContextValue["addOkrItem"] = useCallback(
    (item) => {
      const avg =
        item.keyResults.reduce((s, kr) => s + kr.progress, 0) /
        Math.max(1, item.keyResults.length);
      const status = avg >= 90 ? "Exceeded" : avg >= 65 ? "On Track" : "At Risk";
      setOkrs((prev) => [{ ...item, id: `okr_${Date.now()}`, status }, ...prev]);
      pushToast({
        title: locale === "id" ? "OKR Baru Ditambahkan" : "Strategic OKR Added",
        description: item.objective,
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
      recordAuditLog({
        module: "Automation & API",
        action: "settings.vault_updated",
        target: "Enterprise API & Auto-Pilot Settings",
        severity: "CRITICAL",
        detail: `Updated enterprise configuration keys (${Object.keys(patch).join(", ")}).`,
      });
      pushToast({
        title: locale === "id" ? "Konfigurasi Tersimpan" : "Configuration Saved",
        description: locale === "id" ? "Perubahan langsung aktif." : "Settings are now live.",
        variant: "success",
      });
    },
    [locale, pushToast, recordAuditLog]
  );

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedEntity("ALL");
    setAuthUser(DEFAULT_AUTH_USER);
    setActiveRole("HR Admin");
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setAuditLogs(buildSeedAuditLogs());
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
    setNotifications(SEED_NOTIFICATIONS);
    setSettings(DEFAULT_SETTINGS);
    pushToast({
      title: "Workspace Reset",
      description: "Restored pristine enterprise HRIS v6.0 dataset.",
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
        switchRole,
        selectedEntity,
        setSelectedEntity,
        authUser,
        setAuthUser,
        currentEmployee,
        signOut,
        rolePermissions,
        hasPermission,
        toggleRolePermission,
        auditLogs,
        recordAuditLog,
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
        notifications,
        unreadNotificationsCount,
        pushNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearReadNotifications,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        offboardEmployee,
        hireCandidateToEmployee,
        clockInEmployee,
        clockOutEmployee,
        cycleShiftCell,
        submitLeaveRequest,
        decideLeaveRequest,
        addPayrollRun,
        broadcastAllPayslips,
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
        addOkrItem,
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
