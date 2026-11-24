"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, BrainCircuit, ArrowLeft } from "lucide-react";
import { LiveAssessmentRunner, type RunnerConfig } from "@/components/assessments/LiveAssessmentRunner";
import type { SignedInvitePayload } from "@/lib/token";

export default function CandidateTokenAssessmentPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<RunnerConfig | null>(null);

  useEffect(() => {
    let active = true;
    async function verify() {
      if (!token) {
        setError("Missing assessment invitation token.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/assessments/token?token=${encodeURIComponent(token)}`);
        const data = (await res.json()) as {
          valid: boolean;
          expired?: boolean;
          error?: string;
          payload?: SignedInvitePayload;
        };
        if (!active) return;
        if (!res.ok || !data.valid || !data.payload) {
          setError(data.error || "Invalid or tampered invitation link.");
        } else if (data.expired) {
          setError("This assessment invitation link has expired. Please request a fresh invite from HR.");
        } else {
          const p = data.payload;
          setConfig({
            sessionId: p.id,
            candidateName: p.candidateName,
            candidateEmail: p.candidateEmail,
            candidatePhone: p.candidatePhone,
            role: p.role,
            companyName: p.companyName,
            categories: p.categories,
            presetId: p.presetId,
            durationMinutes: p.durationMinutes,
            expressLimitPerCategory: p.expressLimitPerCategory,
            proctoringStrict: p.proctoringStrict,
          });
        }
      } catch {
        if (active) setError("Network error while verifying cryptographic invitation token.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void verify();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center animate-pulse">
          <BrainCircuit className="w-8 h-8 text-white" />
        </div>
        <div className="text-sm font-bold text-slate-300">
          Verifying HMAC-SHA256 Signed Assessment Token...
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-panel rounded-2xl border border-rose-500/40 p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h1 className="text-lg font-black">Invitation Verification Failed</h1>
          <p className="text-xs text-slate-400">{error}</p>
          <Link
            href="/assessments"
            className="btn-quantum inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Assessment Center
          </Link>
        </div>
      </div>
    );
  }

  return <LiveAssessmentRunner config={config} />;
}
