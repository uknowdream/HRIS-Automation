import { NextResponse } from "next/server";
import { ALL_QUESTIONS, ASSESSMENT_BATTERIES, ASSESSMENT_PRESETS } from "@/lib/psychometrics";
import { ALL_ROLES, PERMISSION_CATALOG } from "@/lib/rbac";
import { ALL_CURRENCIES } from "@/lib/currency";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "operational",
    platform: "AetherHR Enterprise Global HRIS & Psychometric Automation Suite",
    version: "8.0.0",
    timestamp: new Date().toISOString(),
    metrics: {
      totalQuestionBank: ALL_QUESTIONS.length,
      assessmentBatteries: ASSESSMENT_BATTERIES.length,
      assessmentPresets: ASSESSMENT_PRESETS.length,
      rbacTiers: ALL_ROLES.length,
      rbacPermissions: PERMISSION_CATALOG.length,
      supportedCurrencies: ALL_CURRENCIES,
    },
    capabilities: {
      questionBankTotal: ALL_QUESTIONS.length,
      batteries: ASSESSMENT_BATTERIES.length,
      presets: ASSESSMENT_PRESETS.length,
      rbacRoles: ALL_ROLES.length,
      currencies: ALL_CURRENCIES.length,
      features: [
        "Global Multi-Currency Payroll (IDR PPh 21 TER + BPJS, SGD CPF, USD FICA, EUR, GBP)",
        "THR Keagamaan, PKWT PP 35/2021 Compensation & 1721-A1 Annual Tax Calculator",
        "Kepmenaker SPL Overtime Calculation & Auto-Payroll Sync",
        "Multi-Level Maker-Checker Governance (Leaves > 3d, Expenses > $500, Payroll Sign-Off)",
        "5-Tier Granular RBAC + Role-Scoped Notifications + Tamper-Evident SHA-256 Audit Ledger",
        "104-Question Seeded-Randomized Proctored Cognitive & Psychometric Assessment Suite",
        "Personal ESS Profile & Data Change Request Workflow (/profile)",
        "Public International Career Portal with AI CV Role-Fit Matcher (/careers)",
        "Omni-Channel Automation (Resend/SMTP Email, Meta/Fonnte/wa.me WhatsApp, Signed Webhooks, .ICS)",
        "OWASP Top 10 Security (scrypt Password Hashing, HttpOnly HMAC-SHA256 Sessions, SSRF Guard, Rate Limiter)",
        "Mobile PWA (/mobile) + React Native Expo Companion App",
      ],
    },
  });
}
