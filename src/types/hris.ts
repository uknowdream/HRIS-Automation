export type Locale = "id" | "en";
export type ThemeMode = "light" | "dark";
export type ActiveRole = "HR Admin" | "Department Manager" | "Employee";
export type EntityScope = "ALL" | "Indonesia" | "Singapore" | "United States" | "Europe";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: ActiveRole;
  companyName: string;
  avatarInitials: string;
  mfaVerified: boolean;
}

export interface HRNotification {
  id: string;
  title: string;
  message: string;
  category: "approval" | "assessment" | "payroll" | "security" | "automation";
  read: boolean;
  createdAt: string;
  href: string;
}

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
  birthday?: string; // MM-DD
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

export type ShiftCode = "REG" | "FLEX" | "REM" | "NIGHT" | "OFF";

export interface ShiftRosterRow {
  employeeId: string;
  employeeName: string;
  department: string;
  days: [ShiftCode, ShiftCode, ShiftCode, ShiftCode, ShiftCode, ShiftCode, ShiftCode]; // Mon..Sun
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
  incomeTax: number;
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
  period: string;
  label: string;
  runDate: string;
  status: "Completed" | "Draft" | "Processing";
  totalEmployees: number;
  totalGrossUSD: number;
  totalNetUSD: number;
  items: PayslipItem[];
}

// ==========================================
// NEW V3.0 ENTERPRISE HRIS MODULES
// ==========================================

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  category: "Travel & Flights" | "Home Office & Gear" | "Medical & Wellness" | "Client Hospitality" | "Training & Cert";
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  receiptRef: string;
  status: "Pending" | "Approved" | "Paid in Payroll" | "Rejected";
  syncedToPayroll?: boolean;
}

export interface CompanyAsset {
  id: string;
  assetTag: string;
  name: string;
  category: "Laptop" | "Smartphone" | "Monitor" | "Access Card" | "Software Seat";
  serialNumber: string;
  assignedToId: string | null;
  assignedToName: string;
  department: string;
  condition: "Excellent" | "Good" | "Maintenance";
  status: "Assigned" | "In Stock" | "Pending Return";
  purchaseValueUSD: number;
  assignedDate: string;
}

export interface HRDocument {
  id: string;
  title: string;
  docType: "PKWTT Permanent" | "PKWT Fixed-Term" | "Global EOR Contract" | "Offer Letter" | "Mutual NDA" | "Policy Handbook";
  employeeId: string;
  employeeName: string;
  department: string;
  issueDate: string;
  expiryDate: string | null; // null for permanent
  status: "Signed" | "Awaiting Signature" | "Expiring Soon" | "Draft";
  signedBy?: string;
  signedAt?: string;
  signatureDataUrl?: string;
  verificationHash?: string;
}

export interface CompanyAnnouncement {
  id: string;
  title: string;
  body: string;
  category: "Policy" | "Company News" | "Payroll & Tax" | "Event";
  author: string;
  publishedAt: string;
  channels: ("Portal" | "Email" | "WhatsApp" | "Mobile Push")[];
  pinned?: boolean;
}

export interface OnboardingChecklist {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  type: "Onboarding (30-60-90)" | "Offboarding Exit";
  startDate: string;
  buddyName: string;
  tasks: {
    id: string;
    phase: "Day 1" | "Week 1" | "Month 1" | "Exit";
    title: string;
    owner: "HR" | "IT" | "Manager" | "Employee";
    done: boolean;
  }[];
}

export interface LearningCourse {
  id: string;
  title: string;
  category: "Compliance & Security" | "Leadership & EQ" | "AI & Automation" | "HR & Tax Law";
  durationHours: number;
  mandatory: boolean;
  enrolledCount: number;
  completionRate: number;
  certificateCode: string;
  completedByUser: boolean;
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
  rotation: number;
  fill: "solid" | "outline" | "striped" | "half";
  color: string;
  size?: "sm" | "md" | "lg";
  dotPos?: "none" | "top" | "right" | "bottom" | "left" | "center";
}

export interface MatrixVisualSpec {
  grid: (MatrixCellSpec | null)[];
  options: MatrixCellSpec[];
}

export interface AssessmentQuestion {
  id: string;
  category: AssessmentCategory;
  format: QuestionFormat;
  difficulty: 1 | 2 | 3;
  timeBudgetSec: number;
  prompt: { id: string; en: string };
  context?: { id: string; en: string };
  options?: {
    id: string;
    label: { id: string; en: string };
    discTrait?: "D" | "I" | "S" | "C";
    sjtScore?: number;
  }[];
  correctOptionId?: string;
  explanation?: { id: string; en: string };
  big5Trait?: "O" | "C" | "E" | "A" | "S";
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
  cognitiveOverallPct: number;
  estimatedIq: number;
  globalPercentile: number;
  stenScore: number;
  domainScores: {
    category: AssessmentCategory;
    label: string;
    correct: number;
    total: number;
    percentage: number;
  }[];
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    emotionalStability: number;
  };
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
  sjtScore: number;
  integrityScore: number;
  tabSwitches: number;
  proctoringEvents: ProctoringEvent[];
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

export type AutomationTrigger =
  | "candidate.created"
  | "invitation.sent"
  | "assessment.completed"
  | "assessment.high_score"
  | "leave.submitted"
  | "leave.approved"
  | "expense.approved"
  | "contract.signed"
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
  resendApiKey: string;
  resendFromEmail: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  whatsappMode: "instant_link" | "meta_cloud" | "custom_gateway";
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  whatsappGatewayUrl: string;
  whatsappGatewayToken: string;
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
    progress: number;
  }[];
  quarter: string;
  status: "On Track" | "At Risk" | "Exceeded";
}
