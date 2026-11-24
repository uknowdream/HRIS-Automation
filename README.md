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

### 3. Complete Enterprise HRIS Modules (v6.0 Zero-Trust RBAC, SHA-256 Audit Ledger & AI Auto-Pilot)
- **5-Tier Granular Role-Based Access Control (`src/lib/rbac.ts`, `RBACGuard.tsx`)** — Enforces 17 feature permissions across **Super Admin**, **HR Admin**, **Finance & Payroll**, **Department Manager**, and **Employee Self-Service (ESS)** with live role-permission matrix customization and confidential data masking.
- **Role-Scoped Security & Activity Audit Ledger (`/audit-logs`)** — Tamper-evident `SHA-256` hash-chained activity log automatically filtered to each role's clearance (e.g., Finance sees Payroll/Expense logs; HR sees People/ATS/Psychometrics; Super Admin sees all 10 audit domains; unauthorized attempts trigger `rbac.access_denied` security events), with CSV & SIEM JSON export.
- **Autonomous Event-Driven Automation Bus & AI Auto-Pilot (`HRISContext.tsx`, `/automation`)** — Live domain events automatically trigger matching workflows, increment run counters, fire outbound webhooks, auto-approve Remote WFA / ≤2-day leaves, auto-sync micro-reimbursements to Payroll, and fast-track high-IQ candidates to Interview.
- **Enterprise Auth, MFA & RBAC (`/login`, `/signup`, `/forgot-password`, `/api/auth/*`)** — Real `scrypt` password hashing (`timingSafeEqual`), signed `HttpOnly` `HMAC-SHA256` session cookies, 2-step MFA verification, 2-step workspace onboarding wizard, and 5-tier RBAC demo access.
- **OWASP Top 10 Cybersecurity Hardening (`next.config.ts`, `src/lib/security.ts`)** — Enforced CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, HTML-escaped email templates (XSS prevention), sliding-window API rate limiting, and OWASP A10 SSRF private-IP/metadata blocklist on outbound webhooks.
- **Interactive Notification Center & Multi-Entity Switcher (`AppShell.tsx`)** — Collapsible icon rail (`252px` ↔ `72px`), Multi-Entity switcher (`Global`, `Indonesia`, `Singapore`, `US`, `Europe`), live Read/Unread Notification Drawer with category filters (`All`, `Unread`, `Approvals`, `Security`), Global `Ctrl+K` Command Palette, and **AetherAI HR Copilot**.
- **Executive HRIS Dashboard (`/`)** — Quiet-chrome executive KPI cards scoped by entity, Tabbed Priority Action Center (`Leave`, `Expense`, `E-Sign`), Payroll Readiness, Company Announcements, Dept Distribution & Top Psychometric Talent.
- **Automated Joiner–Mover–Leaver (JML) Lifecycle (`/recruitment`, `/employees`, `/learning`, `/finance-ops`)** — 1-click **Hire & Auto-Onboard** converts ATS candidates directly into Employees + PKWTT Offer Contracts + 30-60-90 Onboarding Checklists; 1-click **Offboard (Leaver Flow)** flags assigned IT Assets as `Pending Return`, creates Exit Checklists, and logs SSO revocation.
- **Digital Contracts, E-Signature & Announcements (`/documents`)** — Interactive HTML5 Canvas E-Signature Pad with SHA-256 verification hash, printable signed PDF viewer, PKWT expiry alerts & company broadcasts.
- **30-60-90 Onboarding & Corporate LMS (`/learning`)** — Cross-functional onboarding task pipelines & printable compliance certificates.
- **GPS Geofence Attendance, Shift Roster & Leave (`/attendance`)** — Live HTML5 Geolocation check-in/out, interactive Mon–Sun Shift Roster matrix & leave approval auto-notifications.
- **Multi-Currency Payroll & Tax Engine (`/payroll`, `/api/payroll/calculate`)** — Indonesian **PPh 21 TER + BPJS**, Singapore **CPF**, US **FICA**, EU & UK calculations with automatic approved-expense sync, printable digital payslips & ERP CSV export.
- **Expense Reimbursements & IT Asset Inventory (`/finance-ops`)** — Expense claims auto-synced to Payroll + corporate laptop/device lifecycle tracking.
- **OKRs & 9-Box Talent Matrix (`/performance`)** — Interactive talent calibration and quarterly OKR tracking.
- **Dual Mobile App (`/mobile` PWA + `/mobile-app` React Native Expo)** — Installable Progressive Web App + standalone Expo iOS/Android project.

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
