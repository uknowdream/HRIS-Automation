import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
} from "@/lib/security";
import type { ActiveRole, Currency } from "@/types/hris";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(cookie);
  return NextResponse.json({
    authenticated: Boolean(session),
    user: session,
  });
}

/**
 * Keeps the server-side HttpOnly session cookie strictly synchronized whenever the user
 * switches RBAC perspective, updates display currency, or updates workspace identity.
 */
export async function PATCH(request: NextRequest) {
  try {
    const existing = verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    const patch = (await request.json()) as {
      role?: ActiveRole;
      name?: string;
      email?: string;
      avatarInitials?: string;
      companyName?: string;
      defaultCurrency?: Currency;
    };

    if (!existing) {
      return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
    }

    const updated = {
      ...existing,
      ...(patch.role ? { role: patch.role } : {}),
      ...(patch.name ? { name: patch.name } : {}),
      ...(patch.email ? { email: patch.email } : {}),
      ...(patch.avatarInitials ? { avatarInitials: patch.avatarInitials } : {}),
      ...(patch.companyName ? { companyName: patch.companyName } : {}),
      ...(patch.defaultCurrency ? { defaultCurrency: patch.defaultCurrency } : {}),
    };

    const res = NextResponse.json({ ok: true, authenticated: true, user: updated });
    res.cookies.set(SESSION_COOKIE_NAME, signSessionToken(updated), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 3600,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid session update" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, authenticated: false });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
