import crypto from "crypto";
import type { ActiveRole } from "@/types/hris";

const SESSION_SECRET =
  process.env.AETHER_SIGNING_SECRET || "aetherhr-v5-enterprise-session-hmac-secret-2026";

export const SESSION_COOKIE_NAME = "aether_session";

export interface AuthUserSession {
  id: string;
  name: string;
  email: string;
  role: ActiveRole;
  companyName: string;
  avatarInitials: string;
  mfaVerified: boolean;
  issuedAt: number;
  expiresAt: number;
}

// ==========================================
// 1. HTML ESCAPING (OWASP A03 XSS Prevention)
// ==========================================
export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ==========================================
// 2. PASSWORD HASHING (OWASP A02 / A07 scrypt)
// ==========================================
export function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, s, 64).toString("hex");
  return `${s}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

// ==========================================
// 3. SIGNED STATELESS SESSION COOKIES (HMAC-SHA256)
// ==========================================
function b64u(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function unb64u(input: string): string {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64").toString("utf8");
}

export function signSessionToken(session: AuthUserSession): string {
  const body = b64u(JSON.stringify(session));
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest();
  return `${body}.${b64u(sig)}`;
}

export function verifySessionToken(token: string | undefined): AuthUserSession | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expected = b64u(crypto.createHmac("sha256", SESSION_SECRET).update(body).digest());
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(unb64u(body)) as AuthUserSession;
    if (Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ==========================================
// 4. SLIDING-WINDOW RATE LIMITER (OWASP A07)
// ==========================================
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const entry = rateBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetInSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

// ==========================================
// 5. SSRF PRIVATE-NETWORK GUARD (OWASP A10)
// ==========================================
export function isSsrfRestrictedUrl(rawUrl: string): { blocked: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { blocked: true, reason: "Malformed URL" };
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { blocked: true, reason: "Only http/https protocols are allowed" };
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host === "169.254.169.254" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return { blocked: true, reason: "Private, loopback, or cloud metadata addresses are blocked (OWASP A10 SSRF)" };
  }
  return { blocked: false };
}

// ==========================================
// 6. DEMO ENTERPRISE ACCOUNTS (scrypt hashed)
// ==========================================
export const DEMO_USERS: {
  id: string;
  name: string;
  email: string;
  role: ActiveRole;
  companyName: string;
  avatarInitials: string;
  passwordHash: string;
}[] = [
  {
    id: "usr-admin-01",
    name: "Nadia Kusuma",
    email: "nadia.kusuma@aetherhr.global",
    role: "HR Admin",
    companyName: "AetherHR Global Technologies",
    avatarInitials: "NK",
    passwordHash: hashPassword("Admin@2026!", "aether_salt_admin"),
  },
  {
    id: "usr-mgr-02",
    name: "Marcus Tan",
    email: "marcus.tan@aetherhr.global",
    role: "Department Manager",
    companyName: "AetherHR Global Technologies",
    avatarInitials: "MT",
    passwordHash: hashPassword("Manager@2026!", "aether_salt_mgr"),
  },
  {
    id: "usr-emp-03",
    name: "Raka Pradipta",
    email: "raka.pradipta@aetherhr.global",
    role: "Employee",
    companyName: "AetherHR Global Technologies",
    avatarInitials: "RP",
    passwordHash: hashPassword("Employee@2026!", "aether_salt_emp"),
  },
];
