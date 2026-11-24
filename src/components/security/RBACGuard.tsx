"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { ALL_ROLES, checkRolePermission } from "@/lib/rbac";
import type { ActiveRole, AuditModule, PermissionKey } from "@/types/hris";

interface RBACGuardProps {
  requiredPermission: PermissionKey;
  moduleName: AuditModule;
  resourceLabel: string;
  children: React.ReactNode;
}

export function RBACGuard({
  requiredPermission,
  moduleName,
  resourceLabel,
  children,
}: RBACGuardProps) {
  const router = useRouter();
  const {
    locale,
    activeRole,
    switchRole,
    hasPermission,
    rolePermissions,
    recordAuditLog,
  } = useHRIS();
  const isId = locale === "id";
  const allowed = hasPermission(requiredPermission);
  const loggedRef = useRef<string>("");

  useEffect(() => {
    const sig = `${activeRole}:${requiredPermission}:${resourceLabel}`;
    if (!allowed && loggedRef.current !== sig) {
      loggedRef.current = sig;
      recordAuditLog({
        module: "RBAC & Security",
        action: "rbac.access_denied",
        target: `${resourceLabel} (${requiredPermission})`,
        severity: "SECURITY",
        detail: `Zero-Trust Guard blocked ${activeRole} from accessing ${moduleName} [${resourceLabel}].`,
      });
    }
  }, [activeRole, allowed, moduleName, recordAuditLog, requiredPermission, resourceLabel]);

  if (allowed) {
    return <>{children}</>;
  }

  const authorizedRoles: ActiveRole[] = ALL_ROLES.filter((r) =>
    checkRolePermission(r, requiredPermission, rolePermissions)
  );

  return (
    <div className="max-w-2xl mx-auto my-8 hr-card rounded-3xl p-7 sm:p-9 space-y-6 border-rose-500/30">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl badge-danger flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full badge-danger text-[11px] font-bold">
            <Lock className="w-3 h-3" />
            {isId ? "Zero-Trust RBAC · Akses Dibatasi & Tercatat" : "Zero-Trust RBAC · Access Restricted & Logged"}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {isId
              ? `Role "${activeRole}" Tidak Memiliki Izin Modul Ini`
              : `Role "${activeRole}" Cannot Access This Module`}
          </h1>
          <p className="text-xs sm:text-sm hr-muted leading-relaxed">
            {isId
              ? `Percobaan akses ke "${resourceLabel}" membutuhkan izin [${requiredPermission}] dan telah otomatis dicatat ke dalam Security Audit Log kriptografi untuk kepatuhan ISO 27001.`
              : `Access to "${resourceLabel}" requires permission [${requiredPermission}] and has been automatically recorded in the cryptographic Security Audit Trail.`}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl hr-subtle space-y-2.5 text-xs">
        <div className="font-bold flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          {isId
            ? "Role yang Diizinkan Mengakses Fitur Ini (Klik untuk Simulasi Perspektif Role):"
            : "Authorized Roles for This Feature (Click to Switch Demo Role Perspective):"}
        </div>
        <div className="flex flex-wrap gap-2">
          {authorizedRoles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => switchRole(r)}
              className="px-3 py-1.5 rounded-xl hr-btn-secondary font-bold text-xs inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {isId ? `Beralih ke ${r}` : `Switch to ${r}`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          {isId ? "Kembali ke Workspace Saya" : "Return to My Workspace"}
        </button>
        <span className="text-[11px] font-mono hr-muted">
          Event: rbac.access_denied · Logged ✓
        </span>
      </div>
    </div>
  );
}
