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

### 3. Complete Enterprise HRIS Modules
- **Executive Command Center (`/`)** — Live KPIs, SVG telemetry charts, global entity distribution, and automation feed.
- **Global People Directory & Org Chart (`/employees`)** — Multi-country 360° profiles, org hierarchy, CSV export & zero-touch onboarding.
- **GPS Geofence Attendance & Leave (`/attendance`)** — Live HTML5 Geolocation check-in/out & leave approval auto-notifications.
- **Multi-Currency Payroll & Tax Engine (`/payroll`, `/api/payroll/calculate`)** — Indonesian **PPh 21 TER + BPJS**, Singapore **CPF**, US **FICA**, EU & UK calculations with printable digital payslips & ERP CSV export.
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
