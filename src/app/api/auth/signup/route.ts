import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  SESSION_COOKIE_NAME,
  signSessionToken,
  type AuthUserSession,
} from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const rl = checkRateLimit(`signup:${ip}`, 15, 60_000);
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
    };

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const companyName = (body.companyName || "AetherHR Global Technologies").trim();

    if (name.length < 2) {
      return NextResponse.json({ ok: false, error: "Full name must be at least 2 characters." }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid work email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters for enterprise security." },
        { status: 400 }
      );
    }

    const initials = name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const session: AuthUserSession = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role: "HR Admin",
      companyName,
      avatarInitials: initials || "HR",
      mfaVerified: true,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 3600 * 1000,
    };

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
    return NextResponse.json({ ok: false, error: "Invalid signup request" }, { status: 400 });
  }
}
