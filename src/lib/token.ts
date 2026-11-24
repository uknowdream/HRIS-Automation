import crypto from "crypto";
import type { AssessmentCategory } from "@/types/hris";

const SIGNING_SECRET =
  process.env.AETHER_SIGNING_SECRET || "aetherhr-enterprise-global-hmac-2026-secret";

export interface SignedInvitePayload {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  role: string;
  department: string;
  companyName: string;
  categories: AssessmentCategory[];
  presetId: string;
  durationMinutes: number;
  expressLimitPerCategory?: number;
  proctoringStrict: boolean;
  issuedAt: number;
  expiresAt: number;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString("utf8");
}

export function signInviteToken(payload: SignedInvitePayload): string {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(body)
    .digest();
  return `${body}.${base64UrlEncode(sig)}`;
}

export function verifyInviteToken(
  token: string
): { valid: true; payload: SignedInvitePayload; expired: boolean } | { valid: false; error: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "Malformed invitation token format" };
    }
    const [body, providedSig] = parts;
    const expectedSig = base64UrlEncode(
      crypto.createHmac("sha256", SIGNING_SECRET).update(body).digest()
    );
    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, error: "Invalid cryptographic token signature" };
    }
    const payload = JSON.parse(base64UrlDecode(body)) as SignedInvitePayload;
    const expired = Date.now() > payload.expiresAt;
    return { valid: true, payload, expired };
  } catch {
    return { valid: false, error: "Unable to decode invitation token" };
  }
}

export function signWebhookPayload(body: string, secret?: string): string {
  const key = secret && secret.trim().length > 0 ? secret : SIGNING_SECRET;
  return `sha256=${crypto.createHmac("sha256", key).update(body).digest("hex")}`;
}
