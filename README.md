# AetherHR — International HRIS, Cognitive & Psychometric Assessment & Omni-Channel Automation Platform

[![Deployed on Vercel](https://img.shields.io/badge/Vercel-hris--automation-black?logo=vercel)](https://hris-automation.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-06b6d4)](https://nextjs.org)
[![React Native Expo](https://img.shields.io/badge/Mobile-PWA%20%2B%20Expo-10b981)](./mobile-app)

**AetherHR** is an international-grade **HRIS Management System (Web + Installable Mobile PWA + React Native Expo App)** combining core global workforce management, a calibrated **104-question Cognitive & Psychometric Assessment Suite**, and **omni-channel Email, WhatsApp, and HMAC-SHA256 Webhook Automation**.

## Core Capabilities

### 1. International Cognitive & Psychometric Assessment Suite (104 Calibrated Items · 8 Batteries)
- **Numerical Reasoning (15 Qs · 15m)** — Financial ratios, growth compounding, sequences, throughput & probability
- **Verbal Reasoning & Critical Logic (15 Qs · 12m)** — Deductive syllogisms, SHL-style passages, logical fallacies & analogies
- **Abstract Visual Matrices — Raven's Style (15 Qs · 15m)** — Custom vector SVG 3×3 pattern matrices & alphanumeric ciphers
- **Spatial & Algorithmic Deduction (12 Qs · 12m)** — 3D folding, dependency graphs, coordinates & ring topologies
- **Perceptual Speed & Audit Accuracy — Kraepelin Style (10 Qs · 5m)** — Rapid precision checking under time pressure
- **Big Five Personality Inventory — OCEAN (15 Qs · 8m)** — 5-point Likert scale with reverse-scored validity items
- **DISC Behavioral Profiling (12 Qs · 8m)** — Dominance, Influence, Steadiness, Compliance & Executive Archetypes
- **Situational Judgment Test — SJT (10 Qs · 10m)** — Global corporate leadership, data security, ethics & crisis scenarios
- **Anti-Cheat Proctoring & Precision Timer** — Countdown with auto-submit, tab-switch / copy / fullscreen telemetry, Integrity Score, Radar Chart, IQ + Percentile + Sten Score, printable PDF certificate, and **stateless HMAC-SHA256 cross-device signed links (`/assess/[token]`)**.

### 2. Omni-Channel Email, WhatsApp & Webhook Automation
- **Email Dispatch (`/api/invitations/send`)** — Native **Resend API**, **Custom SMTP (`nodemailer`)**, plus zero-config branded HTML & `mailto:` instant fallback.
- **WhatsApp Dispatch** — Native **Meta WhatsApp Business Cloud API**, **Fonnte / Wablas / Custom Gateway POST**, plus zero-config **1-Click `wa.me` Personalized Launcher** and scannable QR codes.
- **Universal Webhooks (`/api/webhooks/trigger` & `/api/webhooks/inbound`)** — Real `HMAC-SHA256` signed outbound POSTs (Zapier, Make, n8n, Slack, MS Teams, custom ERP) and inbound REST API receiver.
- **Calendar Automation (`/api/calendar/ics`)** — RFC-5545 `.ics` calendar invitations for Google Calendar, Outlook, and Apple Calendar.

### 3. Complete Enterprise HRIS Modules (v8.0 International Perfection Suite)
- **5-Tier Granular Role-Based Access Control (`src/lib/rbac.ts`, `RBACGuard.tsx`)** — Enforces 17 feature permissions across **Super Admin**, **HR Admin**, **Finance & Payroll**, **Department Manager**, and **Employee Self-Service (ESS)** with live role-permission matrix customization, **role-scoped notifications**, role-aware `Ctrl+K` Command Palette, and confidential data masking.
- **Personal ESS Profile & Data Change Requests (`/profile`)** — Dedicated self-service hub for every role (personal payslip summary, leave balance, SPL overtime, contracts, MFA/HttpOnly session status, active RBAC permission badges) plus **Maker–Checker HR approval workflow** for Bank Account, PTKP Tax Code, WhatsApp, and Emergency Contact updates.
- **Public International Career Portal + AI CV Fit Matcher (`/careers`)** — Standalone public career portal (no login required) with global multi-currency salary bands, live **AI Role-Fit Keyword Matcher (0–100%)**, direct ATS submission, and instant **HMAC-SHA256 Psychometric Assessment** launch.
- **Multi-Level Governance (*Maker – Checker – Approver*)** — 2-stage approvals for leaves `> 3 days` (`Manager → HR Admin`) and high-value reimbursements `> $500` (`Manager → Finance`), Four-Eyes **Maker–Checker Payroll Verification**, and **Type-to-Confirm Destructive Offboarding** safety modal.
- **Kepmenaker SPL Overtime, Leave Overlap Radar & THR/PKWT/1721-A1 Engine (`/attendance`, `/payroll`)** — Statutory `1.5x / 2.0x / 3.0x` SPL overtime calculator auto-synced into Payroll runs, same-department team leave overlap conflict detector, plus **THR Keagamaan (Permenaker 6/2016)**, **PKWT Compensation (PP 35/2021)**, and **Form 1721-A1 Annual Tax Simulator**.
- **Global 5-Currency FX Engine & 100% Bilingual Parity (`ID` / `EN`)** — Instant global conversion across `IDR`, `USD`, `SGD`, `EUR`, and `GBP` synchronized across Dashboard, Payroll, Expenses, IT Assets, Careers, Mobile PWA, and Settings, with full Indonesian/English parity including `PsychometricReportView` and `QuickInviteModal`.
- **Seeded-Randomized Proctored Psychometrics (`/assessments`, `/assess/[token]`)** — 104 calibrated items across 8 batteries with deterministic per-session item randomization, anti-cheat proctoring telemetry, and SVG Raven visual matrices.
- **Role-Scoped Security & Activity Audit Ledger (`/audit-logs`)** — Tamper-evident `SHA-256` hash-chained activity log automatically filtered to each role's clearance (unauthorized attempts trigger `rbac.access_denied` security events), with CSV & SIEM JSON export.
- **Autonomous Event-Driven Automation Bus & AI Auto-Pilot (`HRISContext.tsx`, `/automation`)** — Live domain events automatically trigger matching workflows, increment run counters, fire SSRF-guarded outbound webhooks, auto-approve Remote WFA / ≤2-day leaves, auto-sync micro-reimbursements to Payroll, and fast-track high-IQ candidates to Interview.
- **Enterprise Auth, 2-Step Pre-MFA & Persistent Accounts (`/login`, `/signup`, `/forgot-password`, `/api/auth/*`)** — Real `scrypt` password hashing (`timingSafeEqual`), signed `HttpOnly` `HMAC-SHA256` session cookies, strict unregistered-email & wrong-OTP rejection, persistent **Sign Up → Sign Out → Re-Login** round-trip, and `PATCH /api/auth/session` role/currency sync across refreshes.
- **OWASP Top 10 Cybersecurity Hardening (`next.config.ts`, `src/lib/security.ts`)** — Enforced CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, HTML-escaped email templates, sliding-window API rate limiting across auth/invitations/inbound webhooks, and OWASP A10 SSRF private-IP/metadata blocklist across ALL outbound webhook & gateway endpoints.
- **True Hierarchical Reporting Tree & Automated JML (`/employees`, `/documents`, `/learning`)** — Visual executive-to-direct-reports Org Tree with span of control, 1-click **Hire & Auto-Onboard**, HTML5 Canvas E-Signature with SHA-256 sealing, 30-60-90 Onboarding Checklists & LMS Certificates.
- **Dual Mobile App (`/mobile` PWA + `/mobile-app` React Native Expo)** — Installable Progressive Web App with role-aware bottom tab bar + standalone Expo iOS/Android project.

## Running Locally

```bash
npm install
npm run dev
```

For the native iOS/Android Expo project:

```bash
cd mobile-app
npm install
npx expo start
```

## Environment Variables (Optional — Also Configurable Live in `/settings`)
Copy `.env.example` to `.env.local` to pre-configure `RESEND_API_KEY`, `SMTP_*`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_GATEWAY_URL`, `DEFAULT_WEBHOOK_URL`, and `AETHER_SIGNING_SECRET`.
