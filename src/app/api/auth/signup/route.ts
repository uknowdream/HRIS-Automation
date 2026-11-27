import { NextRequest, NextResponse } from "next/server";
import {
  ACCOUNTS_COOKIE_NAME,
  checkRateLimit,
  findEnterpriseAccount,
  hashPassword,
  parseAccountsVaultCookie,
  registerAccountInMemory,
  SESSION_COOKIE_NAME,
  signPayload,
  signSessionToken,
  type AuthUserSession,
  type StoredUserAccount,
} from "@/lib/security";
import type { ActiveRole, Currency } from "@/types/hris";

const ALLOWED_ROLES: ActiveRole[] = [
  "Super Admin",
  "HR Admin",
  "Finance & Payroll",
  "Department Manager",
  "Employee",
];

const ALLOWED_CURRENCIES: Currency[] = ["IDR", "USD", "SGD", "EUR", "GBP"];

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const rl = checkRateLimit(`signup:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: `Rate limit reached. Retry in ${rl.resetInSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      companyName?: string;
      role?: ActiveRole;
      currency?: Currency;
    };

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const companyName = (body.companyName || "AetherHR Global Technologies").trim();
    const role: ActiveRole =
      body.role && ALLOWED_ROLES.includes(body.role) ? body.role : "Super Admin";
    const defaultCurrency: Currency =
      body.currency && ALLOWED_CURRENCIES.includes(body.currency) ? body.currency : "IDR";

    if (name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Nama lengkap minimal 2 karakter / Full name must be at least 2 characters." },
        { status: 400 }
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Masukkan alamat email kerja yang valid." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password minimal 8 karakter untuk keamanan enterprise." },
        { status: 400 }
      );
    }

    const vault = parseAccountsVaultCookie(request.cookies.get(ACCOUNTS_COOKIE_NAME)?.value);
    const existing = findEnterpriseAccount(email, vault);
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Email ini sudah terdaftar. Silakan langsung Sign In." },
        { status: 409 }
      );
    }

    const initials = name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newAccount: StoredUserAccount = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role,
      companyName,
      defaultCurrency,
      avatarInitials: initials || "AE",
      passwordHash: hashPassword(password),
    };

    registerAccountInMemory(newAccount);
    const updatedVault = [...vault.filter((u) => u.email !== email).slice(-9), newAccount];

    const session: AuthUserSession = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      companyName: newAccount.companyName,
      defaultCurrency: newAccount.defaultCurrency,
      avatarInitials: newAccount.avatarInitials,
      mfaVerified: true,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 3600 * 1000,
    };

    const res = NextResponse.json({ ok: true, user: session });
    res.cookies.set(SESSION_COOKIE_NAME, signSessionToken(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 3600,
    });
    res.cookies.set(ACCOUNTS_COOKIE_NAME, signPayload(updatedVault), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 3600,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid signup request" }, { status: 400 });
  }
}
