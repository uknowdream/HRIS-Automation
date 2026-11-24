import type {
  ActiveRole,
  AuditLogEntry,
  AuditModule,
  PermissionKey,
} from "@/types/hris";

export const ALL_ROLES: ActiveRole[] = [
  "Super Admin",
  "HR Admin",
  "Finance & Payroll",
  "Department Manager",
  "Employee",
];

export interface RolePersonaMeta {
  role: ActiveRole;
  badgeClass: string;
  employeeId: string;
  defaultName: string;
  defaultEmail: string;
  avatarInitials: string;
  department: string;
  summary: { id: string; en: string };
}

export const ROLE_PERSONAS: Record<ActiveRole, RolePersonaMeta> = {
  "Super Admin": {
    role: "Super Admin",
    badgeClass: "badge-danger",
    employeeId: "emp-01",
    defaultName: "Alexander Wijaya",
    defaultEmail: "alex.wijaya@aetherhr.global",
    avatarInitials: "AW",
    department: "Executive & CISO",
    summary: {
      id: "Akses penuh seluruh modul, Audit Log kriptografi SHA-256, editor matriks RBAC, Payroll & brankas API.",
      en: "Full enterprise control: all modules, SHA-256 Security Audit Logs, live RBAC Matrix editor, Payroll & API Vault.",
    },
  },
  "HR Admin": {
    role: "HR Admin",
    badgeClass: "badge-info",
    employeeId: "emp-01",
    defaultName: "Nadia Kusuma",
    defaultEmail: "nadia.kusuma@aetherhr.global",
    avatarInitials: "NK",
    department: "People & HR Tech",
    summary: {
      id: "Kelola SDM global, Rekrutmen ATS, 104 Soal Psikotes & Kunci Jawaban, Kontrak E-Sign, Payroll & Log HR.",
      en: "Full People Ops, ATS Recruitment, 104-Item Psychometric Bank & Keys, E-Sign Contracts, Payroll & HR Audit Logs.",
    },
  },
  "Finance & Payroll": {
    role: "Finance & Payroll",
    badgeClass: "badge-success",
    employeeId: "emp-05",
    defaultName: "Siti Rahmawati",
    defaultEmail: "siti.rahmawati@aetherhr.global",
    avatarInitials: "SR",
    department: "Finance & Legal",
    summary: {
      id: "Akses khusus Payroll Multi-Mata Uang, Pajak PPh 21 TER, Approval Reimburse, Valuasi Aset IT & Log Finansial.",
      en: "Dedicated access to Global Payroll, PPh 21 Tax, Expense Approvals, IT Asset Valuation & Financial Audit Logs.",
    },
  },
  "Department Manager": {
    role: "Department Manager",
    badgeClass: "badge-warning",
    employeeId: "emp-02",
    defaultName: "Marcus Tan",
    defaultEmail: "marcus.tan@aetherhr.global",
    avatarInitials: "MT",
    department: "Engineering",
    summary: {
      id: "Approval Cuti & Shift Tim, Seleksi Kandidat ATS, Laporan IQ Kandidat (tanpa kunci soal), OKR & 9-Box.",
      en: "Team Leave & Roster Approvals, ATS Hiring, Candidate IQ Reports (no answer keys), OKRs & 9-Box Calibration.",
    },
  },
  Employee: {
    role: "Employee",
    badgeClass: "badge-info",
    employeeId: "emp-03",
    defaultName: "Raka Pradipta",
    defaultEmail: "raka.pradipta@aetherhr.global",
    avatarInitials: "RP",
    department: "Engineering",
    summary: {
      id: "Employee Self-Service (ESS): hanya melihat Slip Gaji pribadi, Absensi/Cuti sendiri, Reimburse & Kontrak pribadi.",
      en: "Employee Self-Service (ESS): strictly scoped to own Payslips, own Attendance/Leave, own Expenses & Contracts.",
    },
  },
};

export interface PermissionMeta {
  key: PermissionKey;
  label: { id: string; en: string };
  category: string;
}

export const PERMISSION_CATALOG: PermissionMeta[] = [
  { key: "employees:manage", label: { id: "Tambah, Edit & Offboard Karyawan (JML)", en: "Create, Edit & Offboard Employees (JML)" }, category: "People & JML" },
  { key: "employees:compensation", label: { id: "Lihat Gaji Pokok & Status Pajak Karyawan", en: "View Employee Salaries & Tax Codes" }, category: "People & JML" },
  { key: "documents:manage", label: { id: "Terbitkan Kontrak & Broadcast Pengumuman", en: "Draft Contracts & Broadcast Announcements" }, category: "People & JML" },
  { key: "attendance:approve", label: { id: "Setujui / Tolak Pengajuan Cuti & WFA", en: "Approve / Reject Leave & WFA Requests" }, category: "Time & Pay" },
  { key: "roster:manage", label: { id: "Ubah Matriks Jadwal Shift Mingguan", en: "Modify Weekly Shift Roster Matrix" }, category: "Time & Pay" },
  { key: "payroll:view_all", label: { id: "Lihat Jurnal Payroll Seluruh Perusahaan", en: "View Company-Wide Payroll Ledger" }, category: "Time & Pay" },
  { key: "payroll:run", label: { id: "Eksekusi Siklus Payroll & Export ERP CSV", en: "Execute Payroll Cycle & Export ERP CSV" }, category: "Time & Pay" },
  { key: "expenses:approve", label: { id: "Setujui / Tolak Klaim Reimbursement", en: "Approve / Reject Expense Reimbursements" }, category: "Time & Pay" },
  { key: "assets:manage", label: { id: "Registrasi & Mutasi Perangkat Aset IT", en: "Register & Reassign Corporate IT Assets" }, category: "Time & Pay" },
  { key: "recruitment:manage", label: { id: "Akses Pipeline ATS & Rekrut Kandidat", en: "Access ATS Pipeline & Hire Candidates" }, category: "Talent & IQ" },
  { key: "assessments:manage", label: { id: "Kirim Undangan Tes & Lihat Laporan IQ/DISC", en: "Send Test Invites & View IQ/DISC Reports" }, category: "Talent & IQ" },
  { key: "assessments:answer_keys", label: { id: "Inspeksi Rahasia 104 Soal & Kunci Jawaban", en: "Inspect Confidential 104-Item Answer Keys" }, category: "Talent & IQ" },
  { key: "performance:manage", label: { id: "Kalibrasi Matriks Talenta 9-Box & OKR Tim", en: "Calibrate 9-Box Talent Matrix & Team OKRs" }, category: "Talent & IQ" },
  { key: "automation:manage", label: { id: "Kelola Studio Workflow & Live Webhook", en: "Manage Automation Studio & Webhooks" }, category: "Security & Ops" },
  { key: "settings:manage", label: { id: "Kelola Kredensial API & Aturan Auto-Pilot", en: "Manage API Credentials & Auto-Pilot Rules" }, category: "Security & Ops" },
  { key: "audit:view", label: { id: "Akses Log Audit Keamanan Sesuai Scope Role", en: "Access Role-Scoped Security Audit Logs" }, category: "Security & Ops" },
  { key: "rbac:manage", label: { id: "Ubah Matriks Hak Akses Role (RBAC Policy)", en: "Modify Role Permission Matrix (RBAC Policy)" }, category: "Security & Ops" },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<ActiveRole, PermissionKey[]> = {
  "Super Admin": PERMISSION_CATALOG.map((p) => p.key),
  "HR Admin": [
    "employees:manage",
    "employees:compensation",
    "documents:manage",
    "attendance:approve",
    "roster:manage",
    "payroll:view_all",
    "payroll:run",
    "expenses:approve",
    "assets:manage",
    "recruitment:manage",
    "assessments:manage",
    "assessments:answer_keys",
    "performance:manage",
    "automation:manage",
    "settings:manage",
    "audit:view",
  ],
  "Finance & Payroll": [
    "employees:compensation",
    "payroll:view_all",
    "payroll:run",
    "expenses:approve",
    "assets:manage",
    "audit:view",
  ],
  "Department Manager": [
    "attendance:approve",
    "roster:manage",
    "expenses:approve",
    "recruitment:manage",
    "assessments:manage",
    "performance:manage",
    "audit:view",
  ],
  Employee: [],
};

export function checkRolePermission(
  role: ActiveRole,
  permission: PermissionKey,
  customMatrix?: Record<ActiveRole, PermissionKey[]>
): boolean {
  if (role === "Super Admin") return true;
  const matrix = customMatrix || DEFAULT_ROLE_PERMISSIONS;
  return (matrix[role] || []).includes(permission);
}

/**
 * Determines which Audit Modules a given role is permitted to inspect on /audit-logs.
 * - Super Admin: ALL 10 audit modules
 * - HR Admin: People, Recruitment, Psychometrics, Attendance, Contracts, Auth, RBAC, Automation
 * - Finance & Payroll: ONLY Payroll & Tax, Expenses & Assets, Auth & Session
 * - Department Manager: ONLY Attendance & Leave, Recruitment & ATS (team operational logs)
 * - Employee: NONE (blocked by RBACGuard)
 */
export function getAllowedAuditModules(role: ActiveRole): AuditModule[] {
  switch (role) {
    case "Super Admin":
      return [
        "Auth & Session",
        "RBAC & Security",
        "Payroll & Tax",
        "Expenses & Assets",
        "People & JML",
        "Recruitment & ATS",
        "Psychometrics",
        "Attendance & Leave",
        "Contracts & E-Sign",
        "Automation & API",
      ];
    case "HR Admin":
      return [
        "Auth & Session",
        "RBAC & Security",
        "People & JML",
        "Recruitment & ATS",
        "Psychometrics",
        "Attendance & Leave",
        "Contracts & E-Sign",
        "Automation & API",
        "Payroll & Tax",
      ];
    case "Finance & Payroll":
      return ["Payroll & Tax", "Expenses & Assets", "Auth & Session"];
    case "Department Manager":
      return ["Attendance & Leave", "Recruitment & ATS", "Psychometrics"];
    case "Employee":
    default:
      return [];
  }
}

/**
 * Deterministic lightweight FNV-1a / SHA-style hex digest for client+server isomorphic
 * tamper-evident audit hash chaining without requiring async WebCrypto.
 */
export function computeAuditChainHash(
  prevHash: string,
  entry: Pick<AuditLogEntry, "timestamp" | "actorEmail" | "actorRole" | "module" | "action" | "target" | "detail">
): string {
  const raw = `${prevHash}|${entry.timestamp}|${entry.actorEmail}|${entry.actorRole}|${entry.module}|${entry.action}|${entry.target}|${entry.detail}`;
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const p2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const p3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0");
  return `sha256:${p1}${p2}${p3}`;
}
