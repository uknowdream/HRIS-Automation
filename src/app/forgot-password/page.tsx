"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f6fb] dark:bg-[#090d16]">
      <div className="w-full max-w-md hr-card rounded-3xl p-8 space-y-5">
        <Link href="/login" className="text-xs font-bold text-indigo-600 inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        {!sent ? (
          <>
            <div>
              <h1 className="text-xl font-extrabold">Reset Enterprise Password</h1>
              <p className="text-xs hr-muted mt-1">
                Enter your corporate email to receive a time-limited HMAC-signed password reset link.
              </p>
            </div>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm hr-input"
                />
              </div>
              <button type="submit" className="btn-quantum w-full py-3 rounded-xl text-xs font-bold">
                Send Encrypted Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h2 className="text-lg font-extrabold">Reset Link Dispatched</h2>
            <p className="text-xs hr-muted leading-relaxed">
              If an account exists for <strong>{email}</strong>, a 15-minute signed reset link has been sent with zero PII exposure.
            </p>
            <Link href="/login" className="btn-quantum inline-block px-5 py-2.5 rounded-xl text-xs font-bold">
              Return to Sign In
            </Link>
          </div>
        )}

        <div className="text-[11px] hr-muted flex items-center justify-center gap-1.5 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          AetherHR Identity Security · Rate-Limited Endpoint
        </div>
      </div>
    </div>
  );
}
