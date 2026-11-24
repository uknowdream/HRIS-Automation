import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  DEMO_USERS,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyPassword,
  type AuthUserSession,
} from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const rl = checkRateLimit(`login:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many sign-in attempts. Retry in ${rl.resetInSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      ssoProvider?: string;
      demoEmail?: string;
    };

    const email = (body.demoEmail || body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Valid work email is required." }, { status: 400 });
    }

    const found = DEMO_USERS.find((u) => u.email.toLowerCase() === email);

    let session: AuthUserSession;
    if (body.demoEmail && found) {
      session = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        companyName: found.companyName,
        avatarInitials: found.avatarInitials,
        mfaVerified: true,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 24 * 3600 * 1000,
      };
    } else if (body.ssoProvider) {
      session = {
        id: found?.id || `sso_${Date.now()}`,
        name: found?.name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        role: found?.role || "HR Admin",
        companyName: found?.companyName || "AetherHR Global Technologies",
        avatarInitials: found?.avatarInitials || email.slice(0, 2).toUpperCase(),
        mfaVerified: true,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 24 * 3600 * 1000,
      };
    } else {
      const pwd = body.password || "";
      if (pwd.length < 6) {
        return NextResponse.json(
          { ok: false, error: "Password must be at least 6 characters." },
          { status: 401 }
        );
      }
      if (found && !verifyPassword(pwd, found.passwordHash)) {
        return NextResponse.json(
          { ok: false, error: "Invalid email or password. Use the demo credentials or Sign Up." },
          { status: 401 }
        );
      }
      const fallbackName = email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      session = {
        id: found?.id || `usr_${Date.now()}`,
        name: found?.name || fallbackName,
        email,
        role: found?.role || "HR Admin",
        companyName: found?.companyName || "AetherHR Global Technologies",
        avatarInitials: found?.avatarInitials || fallbackName.slice(0, 2).toUpperCase(),
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
