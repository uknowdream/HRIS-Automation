"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  Wallet,
  UserPlus,
  BrainCircuit,
  Workflow,
  Target,
  Smartphone,
  Settings,
  Search,
  Send,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Receipt,
  FileSignature,
  GraduationCap,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { getDict } from "@/lib/i18n";
import { QuickInviteModal } from "@/components/modals/QuickInviteModal";
import type { ActiveRole } from "@/types/hris";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    locale,
    setLocale,
    theme,
    toggleTheme,
    activeRole,
    setActiveRole,
    openInviteModal,
    employees,
    candidates,
    leaves,
    expenses,
    documents,
    workflows,
    toasts,
    dismissToast,
  } = useHRIS();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");

  const dict = getDict(locale);
  const isId = locale === "id";
  const isCandidatePortal = pathname?.startsWith("/assess/");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (isCandidatePortal) {
    return (
      <div className="min-h-screen aether-grid-bg">
        {children}
        <ToastOverlay toasts={toasts} dismiss={dismissToast} />
      </div>
    );
  }

  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const pendingExpenses = expenses.filter((e) => e.status === "Pending");
  const actionDocs = documents.filter(
    (d) => d.status === "Awaiting Signature" || d.status === "Expiring Soon"
  );
  const activeFlows = workflows.filter((w) => w.enabled).length;
  const totalAlerts = pendingLeaves.length + pendingExpenses.length + actionDocs.length;

  const navGroups: {
    title: string;
    items: {
      href: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge: string | null;
    }[];
  }[] = [
    {
      title: dict.groups.overview,
      items: [{ href: "/", label: dict.nav.dashboard, icon: LayoutDashboard, badge: null }],
    },
    {
      title: dict.groups.coreHr,
      items: [
        { href: "/employees", label: dict.nav.employees, icon: Users, badge: String(employees.length) },
        {
          href: "/documents",
          label: dict.nav.documents,
          icon: FileSignature,
          badge: actionDocs.length > 0 ? `${actionDocs.length}` : null,
        },
        { href: "/learning", label: dict.nav.learning, icon: GraduationCap, badge: "LMS" },
      ],
    },
    {
      title: dict.groups.timePay,
      items: [
        {
          href: "/attendance",
          label: dict.nav.attendance,
          icon: Clock,
          badge: pendingLeaves.length > 0 ? `${pendingLeaves.length}` : null,
        },
        { href: "/payroll", label: dict.nav.payroll, icon: Wallet, badge: "5 FX" },
        {
          href: "/finance-ops",
          label: dict.nav.financeOps,
          icon: Receipt,
          badge: pendingExpenses.length > 0 ? `${pendingExpenses.length}` : null,
        },
      ],
    },
    {
      title: dict.groups.talent,
      items: [
        { href: "/recruitment", label: dict.nav.recruitment, icon: UserPlus, badge: String(candidates.length) },
        { href: "/assessments", label: dict.nav.assessments, icon: BrainCircuit, badge: "104Q" },
        { href: "/performance", label: dict.nav.performance, icon: Target, badge: null },
      ],
    },
    {
      title: dict.groups.platform,
      items: [
        { href: "/automation", label: dict.nav.automation, icon: Workflow, badge: `${activeFlows} ON` },
        { href: "/mobile", label: dict.nav.mobile, icon: Smartphone, badge: "PWA" },
        { href: "/settings", label: dict.nav.settings, icon: Settings, badge: null },
      ],
    },
  ];

  const allNavFlat = navGroups.flatMap((g) => g.items);

  const filteredCommands = [
    ...allNavFlat.map((n) => ({
      id: n.href,
      title: n.label,
      subtitle: `Navigate to ${n.href}`,
      action: () => router.push(n.href),
    })),
    {
      id: "action-invite",
      title: isId ? "Kirim Undangan Psikotes (Email + WhatsApp)" : "Send Email & WhatsApp Assessment Invite",
      subtitle: "Generate signed HMAC link + QR + wa.me launcher",
      action: () => openInviteModal(),
    },
    ...employees.slice(0, 6).map((e) => ({
      id: e.id,
      title: e.name,
      subtitle: `${e.role} • ${e.location}`,
      action: () => router.push("/employees"),
    })),
  ].filter(
    (c) =>
      !cmdQuery.trim() ||
      c.title.toLowerCase().includes(cmdQuery.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen aether-grid-bg flex flex-col lg:flex-row">
      {/* Executive Left Sidebar */}
      <aside
        className="no-print hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30 border-r"
        style={{
          backgroundColor: "var(--bg-sidebar)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Brand Header */}
        <div
          className="px-5 py-4 border-b flex items-center gap-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/25">
            A
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-[15px] tracking-tight flex items-center gap-1.5">
              <span>AetherHR</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/12 text-indigo-600 dark:text-indigo-300">
                PRO
              </span>
            </div>
            <div className="text-[11px] hr-muted truncate">{dict.brandSubtitle}</div>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider hr-muted">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[12.5px] font-semibold transition ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                        : "hr-muted hover:text-indigo-600 hover:bg-indigo-500/8"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Signed-In Executive Profile Footer */}
        <div
          className="p-3.5 border-t space-y-2.5"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-teal-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
              NK
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold truncate">Nadia Kusuma</div>
              <div className="text-[10px] hr-muted truncate">{activeRole} · Global HQ</div>
            </div>
          </div>
          <select
            aria-label="Switch Role View"
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value as ActiveRole)}
            className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-semibold hr-input"
          >
            <option value="HR Admin">Role: HR Admin (Full Access)</option>
            <option value="Department Manager">Role: Department Manager</option>
            <option value="Employee">Role: Employee Self-Service</option>
          </select>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* Clean Top Executive Header */}
        <header
          className="no-print sticky top-0 z-20 hr-panel border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl hr-btn-secondary"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2.5 w-full max-w-md px-3.5 py-2 rounded-xl hr-subtle hover:border-indigo-400 text-left text-xs hr-muted transition"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{dict.topbar.searchPlaceholder}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative">
            {/* Quick Invite CTA */}
            <button
              onClick={() => openInviteModal()}
              className="hidden sm:flex btn-quantum px-3.5 py-2 rounded-xl text-xs font-bold items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{dict.topbar.quickInvite}</span>
            </button>

            {/* Live Notification Center Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((p) => !p)}
                className="relative p-2 rounded-xl hr-btn-secondary"
                aria-label="Notifications"
                title={isId ? "Notifikasi & Persetujuan" : "Notifications & Approvals"}
              >
                <Bell className="w-4 h-4" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                    {totalAlerts}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 hr-card rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      {isId ? `Pusat Tindakan HR (${totalAlerts})` : `HR Action Alerts (${totalAlerts})`}
                    </span>
                    <button onClick={() => setNotifOpen(false)} className="text-xs hr-muted hover:text-indigo-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
                    {pendingLeaves.map((lv) => (
                      <Link
                        key={lv.id}
                        href="/attendance"
                        onClick={() => setNotifOpen(false)}
                        className="block p-2.5 rounded-xl hr-subtle hover:border-indigo-400 transition"
                      >
                        <div className="font-bold">{lv.employeeName} · {lv.type}</div>
                        <div className="text-[11px] hr-muted">{lv.days}d ({lv.startDate}) — Menunggu persetujuan</div>
                      </Link>
                    ))}
                    {pendingExpenses.map((ex) => (
                      <Link
                        key={ex.id}
                        href="/finance-ops"
                        onClick={() => setNotifOpen(false)}
                        className="block p-2.5 rounded-xl hr-subtle hover:border-indigo-400 transition"
                      >
                        <div className="font-bold">{ex.employeeName} · {ex.category}</div>
                        <div className="text-[11px] hr-muted">Klaim reimburse menunggu review finance</div>
                      </Link>
                    ))}
                    {actionDocs.map((doc) => (
                      <Link
                        key={doc.id}
                        href="/documents"
                        onClick={() => setNotifOpen(false)}
                        className="block p-2.5 rounded-xl hr-subtle hover:border-amber-400 transition"
                      >
                        <div className="font-bold text-amber-600 dark:text-amber-400">{doc.status}: {doc.employeeName}</div>
                        <div className="text-[11px] hr-muted truncate">{doc.title}</div>
                      </Link>
                    ))}
                    {totalAlerts === 0 && (
                      <div className="py-6 text-center hr-muted">Semua tugas HR sudah terselesaikan ✓</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bilingual Toggle */}
            <button
              onClick={() => setLocale(locale === "id" ? "en" : "id")}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl hr-btn-secondary text-xs font-bold"
              title="Switch Bahasa Indonesia / English"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
              <span>{locale.toUpperCase()}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hr-btn-secondary"
              aria-label="Toggle theme"
              title={theme === "light" ? "Switch to Obsidian Dark Mode" : "Switch to Executive Light Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="relative w-72 max-w-[82vw] h-full flex flex-col p-4 z-10 overflow-y-auto border-r"
            style={{ backgroundColor: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between pb-4 mb-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="font-extrabold text-base gradient-text">AetherHR PRO</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {navGroups.map((g) => (
                <div key={g.title} className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider hr-muted">{g.title}</div>
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                          active ? "bg-indigo-600 text-white" : "hr-muted"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10">{item.badge}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 hr-panel border-t px-2 py-1.5 flex items-center justify-around"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {[
          { href: "/", icon: LayoutDashboard, label: "Home" },
          { href: "/assessments", icon: BrainCircuit, label: "Psikotes" },
          { href: "/documents", icon: FileSignature, label: "E-Sign" },
          { href: "/finance-ops", icon: Receipt, label: "Claim" },
          { href: "/mobile", icon: Smartphone, label: "Mobile" },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold ${
                active ? "text-indigo-600 dark:text-cyan-400" : "hr-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Command Palette */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-lg hr-card rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <input
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder={dict.topbar.searchPlaceholder}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button onClick={() => setCmdOpen(false)} className="text-xs hr-muted">
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setCmdOpen(false);
                    setCmdQuery("");
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-indigo-500/10 flex items-center justify-between transition"
                >
                  <div>
                    <div className="text-xs font-bold">{cmd.title}</div>
                    <div className="text-[11px] hr-muted">{cmd.subtitle}</div>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-mono">↵</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <QuickInviteModal />
      <ToastOverlay toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}

function ToastOverlay({
  toasts,
  dismiss,
}: {
  toasts: ReturnType<typeof useHRIS>["toasts"];
  dismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="no-print fixed bottom-20 lg:bottom-5 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="hr-card rounded-xl p-3.5 shadow-xl flex items-start gap-2.5 border-l-4 border-l-indigo-600"
        >
          {t.variant === "warning" || t.variant === "error" ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          ) : t.variant === "info" ? (
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold">{t.title}</div>
            {t.description && <div className="text-[11px] hr-muted mt-0.5">{t.description}</div>}
          </div>
          <button onClick={() => dismiss(t.id)} className="hr-muted hover:text-indigo-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
