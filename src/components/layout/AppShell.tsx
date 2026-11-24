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
  Zap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { getDict } from "@/lib/i18n";
import { QuickInviteModal } from "@/components/modals/QuickInviteModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    locale,
    setLocale,
    theme,
    toggleTheme,
    openInviteModal,
    employees,
    candidates,
    leaves,
    workflows,
    toasts,
    dismissToast,
  } = useHRIS();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");

  const dict = getDict(locale);
  const isCandidatePortal = pathname?.startsWith("/assess/");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
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

  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const activeFlows = workflows.filter((w) => w.enabled).length;

  const navItems = [
    { href: "/", label: dict.nav.dashboard, icon: LayoutDashboard, badge: null },
    { href: "/employees", label: dict.nav.employees, icon: Users, badge: String(employees.length) },
    {
      href: "/attendance",
      label: dict.nav.attendance,
      icon: Clock,
      badge: pendingLeaves > 0 ? `${pendingLeaves}` : null,
    },
    { href: "/payroll", label: dict.nav.payroll, icon: Wallet, badge: "5 FX" },
    {
      href: "/recruitment",
      label: dict.nav.recruitment,
      icon: UserPlus,
      badge: String(candidates.length),
    },
    {
      href: "/assessments",
      label: dict.nav.assessments,
      icon: BrainCircuit,
      badge: "104Q",
    },
    {
      href: "/automation",
      label: dict.nav.automation,
      icon: Workflow,
      badge: `${activeFlows} ON`,
    },
    { href: "/performance", label: dict.nav.performance, icon: Target, badge: null },
    { href: "/mobile", label: dict.nav.mobile, icon: Smartphone, badge: "PWA" },
    { href: "/settings", label: dict.nav.settings, icon: Settings, badge: null },
  ];

  const filteredCommands = [
    ...navItems.map((n) => ({
      id: n.href,
      title: n.label,
      subtitle: `Navigate to ${n.href}`,
      action: () => router.push(n.href),
    })),
    {
      id: "action-invite",
      title: locale === "id" ? "Kirim Undangan Tes (Email + WhatsApp)" : "Send Email & WhatsApp Assessment Invite",
      subtitle: "Generate signed link + QR + WA launcher",
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
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-68 lg:fixed lg:inset-y-0 glass-panel border-r border-slate-800/70 z-30">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-emerald-400 p-[2px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-black text-lg gradient-text">
              A
            </div>
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
              AetherHR
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Global
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{dict.brandSubtitle}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-cyan-500/20 via-indigo-500/15 to-transparent text-cyan-300 border border-cyan-500/35 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-cyan-400" : ""}`} />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ${
                      active
                        ? "bg-cyan-500/25 text-cyan-200"
                        : "bg-slate-800/80 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Telemetry Card */}
        <div className="p-3.5 border-t border-slate-800/60">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/12 via-indigo-500/12 to-emerald-500/12 border border-cyan-500/25">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {dict.topbar.liveStatus}
              </span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {locale === "id"
                ? "Email, WhatsApp, Webhook HMAC & 104 Soal Psikotes siap otomatis."
                : "Email, WhatsApp, HMAC Webhooks & 104 Psychometric Items ready."}
            </p>
            <button
              onClick={() => openInviteModal()}
              className="mt-2.5 w-full btn-quantum py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {dict.topbar.quickInvite}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 min-w-0 lg:pl-68 flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* Top Executive Bar */}
        <header className="no-print sticky top-0 z-20 glass-panel border-b border-slate-800/60 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-700/60 hover:bg-slate-800/60"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2.5 w-full max-w-md px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-cyan-500/40 text-left text-xs text-slate-400 transition"
            >
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate flex-1">{dict.topbar.searchPlaceholder}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Invite Button */}
            <button
              onClick={() => openInviteModal()}
              className="hidden sm:flex btn-quantum px-3.5 py-2 rounded-xl text-xs font-bold items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{dict.topbar.quickInvite}</span>
            </button>

            {/* Mobile App Quick Link */}
            <Link
              href="/mobile"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </Link>

            {/* Bilingual Toggle */}
            <button
              onClick={() => setLocale(locale === "id" ? "en" : "id")}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-700/70 bg-slate-900/50 hover:border-cyan-400/50 text-xs font-bold transition"
              title="Switch Bahasa Indonesia / English"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{locale.toUpperCase()}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-700/70 bg-slate-900/50 hover:border-cyan-400/50 transition"
              aria-label="Toggle theme"
              title="Toggle Dark / Light Mode"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] bg-slate-950 border-r border-slate-800 h-full flex flex-col p-4 z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800">
              <span className="font-extrabold text-base gradient-text">AetherHR Global</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      active
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Navigation (PWA Native Feel) */}
      <nav className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 glass-panel border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
        {[
          { href: "/", icon: LayoutDashboard, label: "Home" },
          { href: "/assessments", icon: BrainCircuit, label: "Psikotes" },
          { href: "/recruitment", icon: Send, label: "Invite" },
          { href: "/automation", icon: Workflow, label: "Auto" },
          { href: "/mobile", icon: Smartphone, label: "App" },
        ].map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold ${
                active ? "text-cyan-400" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Command Palette Modal */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-lg glass-panel rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <input
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder={dict.topbar.searchPlaceholder}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button onClick={() => setCmdOpen(false)} className="text-xs text-slate-400">
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
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-cyan-500/12 flex items-center justify-between transition"
                >
                  <div>
                    <div className="text-xs font-bold">{cmd.title}</div>
                    <div className="text-[11px] text-slate-400">{cmd.subtitle}</div>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">↵</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Quick Invite Modal */}
      <QuickInviteModal />

      {/* Toast Stack */}
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
          className="glass-panel rounded-xl p-3.5 border border-cyan-500/35 shadow-xl flex items-start gap-2.5"
        >
          {t.variant === "warning" || t.variant === "error" ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : t.variant === "info" ? (
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold">{t.title}</div>
            {t.description && (
              <div className="text-[11px] text-slate-400 mt-0.5">{t.description}</div>
            )}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
