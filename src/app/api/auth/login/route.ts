import { NextRequest, NextResponse } from "next/server";
import {
  ACCOUNTS_COOKIE_NAME,
  checkRateLimit,
  DEMO_MFA_CODE,
  findEnterpriseAccount,
  parseAccountsVaultCookie,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyPassword,
  type AuthUserSession,
} from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const rl = checkRateLimit(`login:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: `Terlalu banyak percobaan login. Coba lagi dalam ${rl.resetInSec}d.` },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      otp?: string;
      step?: "verify_credentials" | "complete_login";
      ssoProvider?: string;
      demoEmail?: string;
    };

    const vault = parseAccountsVaultCookie(request.cookies.get(ACCOUNTS_COOKIE_NAME)?.value);
    const email = (body.demoEmail || body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Valid work email is required / Masukkan email kerja yang valid." },
        { status: 400 }
      );
    }

    const found = findEnterpriseAccount(email, vault);

    let session: AuthUserSession;
    if (body.demoEmail) {
      if (!found) {
        return NextResponse.json(
          { ok: false, error: "Demo role account not found." },
          { status: 404 }
        );
      }
      session = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        companyName: found.companyName,
        defaultCurrency: found.defaultCurrency,
        avatarInitials: found.avatarInitials,
        mfaVerified: true,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 24 * 3600 * 1000,
      };
    } else if (body.ssoProvider) {
      session = {
        id: found?.id || `sso_${Date.now()}`,
        name:
          found?.name ||
          email
            .split("@")[0]
            .replace(/[._-]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        role: found?.role || "HR Admin",
        companyName: found?.companyName || "AetherHR Global Technologies",
        defaultCurrency: found?.defaultCurrency || "IDR",
        avatarInitials: found?.avatarInitials || email.slice(0, 2).toUpperCase(),
        mfaVerified: true,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 24 * 3600 * 1000,
      };
    } else {
      const pwd = body.password || "";
      if (!found || !verifyPassword(pwd, found.passwordHash)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Email atau password salah (atau akun belum terdaftar). Silakan cek kredensial atau daftar akun baru.",
          },
          { status: 401 }
        );
      }

      // Step 1 pre-MFA credential check: validate email+password BEFORE advancing UI to OTP step!
      if (body.step === "verify_credentials") {
        return NextResponse.json({
          ok: true,
          mfaRequired: true,
          accountPreview: {
            name: found.name,
            email: found.email,
            role: found.role,
            companyName: found.companyName,
          },
        });
      }

      // If OTP was submitted from UI MFA step, strictly verify 6-digit MFA code
      if (body.otp !== undefined && body.otp.trim() !== DEMO_MFA_CODE) {
        return NextResponse.json(
          {
            ok: false,
            error: "Kode verifikasi MFA 6-digit tidak valid (Gunakan kode authenticator: 482910).",
          },
          { status: 401 }
        );
      }

      session = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        companyName: found.companyName,
        defaultCurrency: found.defaultCurrency,
        avatarInitials: found.avatarInitials,
        mfaVerified: true,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 24 * 3600 * 1000,
      };
    }

    const token = signSessionToken(session);
    const res = NextResponse.json({ ok: true, user: session });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 3600,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request payload" }, { status: 400 });
  }
}
