export type Locale = "id" | "en";
export type ThemeMode = "dark" | "light";

export type Currency = "IDR" | "USD" | "SGD" | "EUR" | "GBP";

export type EmploymentType = "Full-Time" | "Remote Global" | "Contract" | "Executive";
export type EmployeeStatus = "Active" | "On Leave" | "Onboarding" | "Probation";

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string; // E.164 e.g. 6281234567890
  avatarInitials: string;
  avatarColor: string;
  role: string;
  department: string;
  location: string;
  country: string;
  timezone: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  joinDate: string;
  managerName: string;
  baseSalary: number;
  allowances: number;
  currency: Currency;
  taxStatus: "TK/0" | "TK/1" | "K/0" | "K/1" | "K/2" | "K/3";
  cognitiveIq?: number;
  discProfile?: string;
  performanceScore: number; // 1-100
  potentialScore: number; // 1-100
  attendanceRate: number; // 0-100
  skills: string[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: "On Time" | "Late" | "Remote" | "Half Day" | "Absent";
  location: string;
  coordinates: { lat: number; lng: number };
  geofenceVerified: boolean;
  workHours: number;
  device: "Web Portal" | "Mobile App (iOS)" | "Mobile App (Android)" | "Biometric Hub";
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  employeeEmail: string;
  employeePhone: string;
  type: "Annual Leave" | "Sick Leave" | "Remote WFA" | "Parental Leave" | "Emergency";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
  autoNotified?: boolean;
}

export interface PayslipItem {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  role: string;
  currency: Currency;
  baseSalary: number;
  allowances: number;
  overtimePay: number;
  grossSalary: number;
  incomeTax: number; // PPh 21 TER or international withholding
  bpjsHealth: number;
  bpjsEmployment: number;
  otherDeductions: number;
  netSalary: number;
  employerContributions: number;
  taxRateLabel: string;
  status: "Paid" | "Scheduled" | "Processing";
  dispatchedVia: ("Email" | "WhatsApp")[];
}

export interface PayrollRun {
  id: string;
  period: string; // e.g., "2026-11"
  label: string;
  runDate: string;
  status: "Completed" | "Draft" | "Processing";
  totalEmployees: number;
  totalGrossUSD: number;
  totalNetUSD: number;
  items: PayslipItem[];
}

// ==========================================
// COGNITIVE & PSYCHOMETRIC ASSESSMENT TYPES
// ==========================================

export type AssessmentCategory =
  | "numerical"
  | "verbal"
  | "abstract"
  | "spatial"
  | "speed"
  | "big5"
  | "disc"
  | "sjt";

export type QuestionFormat = "mcq" | "matrix" | "likert" | "disc" | "sjt";

export interface MatrixCellSpec {
  shape: "circle" | "square" | "triangle" | "diamond" | "hexagon" | "cross" | "star" | "bar" | "none";
  count: number;
  rotation: number; // degrees
  fill: "solid" | "outline" | "striped" | "half";
  color: string;
  size?: "sm" | "md" | "lg";
  dotPos?: "none" | "top" | "right" | "bottom" | "left" | "center";
}

export interface MatrixVisualSpec {
  grid: (MatrixCellSpec | null)[]; // 9 cells, index 8 is null ("?")
  options: MatrixCellSpec[]; // 4 visual options
}

export interface AssessmentQuestion {
  id: string;
  category: AssessmentCategory;
  format: QuestionFormat;
  difficulty: 1 | 2 | 3; // 1=Standard, 2=Advanced, 3=Executive
  timeBudgetSec: number;
  prompt: {
    id: string;
    en: string;
  };
  context?: {
    id: string;
    en: string;
  };
  options?: {
    id: string;
    label: { id: string; en: string };
    discTrait?: "D" | "I" | "S" | "C";
    sjtScore?: number; // 1-4 weighted effectiveness
  }[];
  correctOptionId?: string;
  explanation?: {
    id: string;
    en: string;
  };
  big5Trait?: "O" | "C" | "E" | "A" | "S"; // S = Emotional Stability (reverse of Neuroticism)
  big5Reverse?: boolean;
  matrixVisual?: MatrixVisualSpec;
}

export interface AssessmentBatteryMeta {
  id: AssessmentCategory;
  name: { id: string; en: string };
  shortName: { id: string; en: string };
  description: { id: string; en: string };
  durationMinutes: number;
  questionCount: number;
  type: "cognitive" | "psychometric";
  color: string;
  badge: string;
}

export interface AssessmentPreset {
  id: string;
  name: { id: string; en: string };
  description: { id: string; en: string };
  categories: AssessmentCategory[];
  durationMinutes: number;
  expressLimitPerCategory?: number;
  targetLevel: string;
}

export interface ProctoringEvent {
  type: "tab_switch" | "window_blur" | "fullscreen_exit" | "copy_attempt" | "context_menu" | "webcam_enabled";
  timestamp: string;
  detail: string;
}

export interface AssessmentReport {
  id: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  targetRole: string;
  presetName: string;
  completedAt: string;
  durationUsedSec: number;
  durationAllocatedSec: number;
  totalQuestions: number;
  answeredQuestions: number;
  // Cognitive Metrics
  cognitiveOverallPct: number;
  estimatedIq: number; // 75 - 145
  globalPercentile: number; // 1 - 99
  stenScore: number; // 1 - 10
  domainScores: {
    category: AssessmentCategory;
    label: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
  // Big Five OCEAN (0-100)
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    emotionalStability: number;
  };
  // DISC Profile (0-100 normalized)
  disc: {
    D: number;
    I: number;
    S: number;
    C: number;
    primary: "D" | "I" | "S" | "C";
    secondary: "D" | "I" | "S" | "C";
    archetype: string;
    summary: string;
  };
  // SJT
  sjtScore: number; // 0-100
  // Proctoring & Integrity
  integrityScore: number; // 0-100
  tabSwitches: number;
  proctoringEvents: ProctoringEvent[];
  // Decision
  recommendation: "STRONG_HIRE" | "RECOMMENDED" | "CONSIDER" | "NOT_RECOMMENDED";
  executiveSummary: string;
  strengths: string[];
  developmentAreas: string[];
  interviewProbes: string[];
}

export type CandidateStage =
  | "Applied"
  | "Invited"
  | "Testing"
  | "Completed"
  | "Interview"
  | "Offer"
  | "Hired";

export interface CandidateInvitation {
  id: string;
  token: string;
  inviteUrl: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  role: string;
  department: string;
  categories: AssessmentCategory[];
  presetId: string;
  durationMinutes: number;
  expiresAt: string;
  sentAt: string;
  channels: ("Email" | "WhatsApp")[];
  emailStatus: "Delivered (Live)" | "Queued (Smart Sandbox)" | "Not Sent" | "Failed";
  whatsappStatus: "Delivered (API)" | "Ready (wa.me Dispatch)" | "Not Sent" | "Failed";
  whatsappLaunchUrl?: string;
  proctoringStrict: boolean;
  status: "Pending" | "Opened" | "Completed" | "Expired";
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  location: string;
  source: "LinkedIn" | "Direct Portal" | "JobStreet" | "Referral" | "Webhook API";
  stage: CandidateStage;
  appliedAt: string;
  expectedSalary: string;
  invitationId?: string;
  inviteUrl?: string;
  reportId?: string;
  cognitiveIq?: number;
  psychometricFit?: number;
  discCode?: string;
  notes?: string;
}

// ==========================================
// AUTOMATION, WEBHOOKS & INTEGRATIONS
// ==========================================

export type AutomationTrigger =
  | "candidate.created"
  | "invitation.sent"
  | "assessment.completed"
  | "assessment.high_score"
  | "leave.submitted"
  | "leave.approved"
  | "payroll.completed"
  | "employee.onboarded"
  | "attendance.late";

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  condition?: string;
  actions: {
    type: "email" | "whatsapp" | "webhook" | "slack" | "calendar" | "stage_move" | "pdf_report";
    label: string;
    target?: string;
  }[];
  enabled: boolean;
  runsCount: number;
  successRate: number;
  lastRunAt: string | null;
}

export interface IntegrationConnector {
  id: string;
  name: string;
  category: "Email" | "WhatsApp" | "Automation" | "Messaging" | "Calendar" | "HR & Finance";
  description: string;
  status: "Connected" | "Ready to Configure" | "Active (Instant Mode)";
  endpointHint: string;
  configuredKeyField?: keyof IntegrationSettings;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  event: string;
  channel: "Email" | "WhatsApp" | "Webhook" | "Slack" | "System" | "Calendar";
  recipient: string;
  status: "Success" | "Sandbox" | "Failed";
  latencyMs: number;
  detail: string;
}

export interface IntegrationSettings {
  companyName: string;
  companyDomain: string;
  companyLogoText: string;
  defaultTimezone: string;
  defaultCurrency: Currency;
  // Email
  resendApiKey: string;
  resendFromEmail: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  // WhatsApp
  whatsappMode: "instant_link" | "meta_cloud" | "custom_gateway";
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappGatewayUrl: string;
  whatsappGatewayToken: string;
  // Webhooks & Integrations
  primaryWebhookUrl: string;
  webhookSecret: string;
  slackWebhookUrl: string;
  teamsWebhookUrl: string;
  inboundApiKey: string;
  autoAdvanceThresholdIq: number;
  enableStrictProctoringDefault: boolean;
}

export interface OKRItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  objective: string;
  keyResults: {
    title: string;
    progress: number; // 0-100
  }[];
  quarter: string;
  status: "On Track" | "At Risk" | "Exceeded";
}
