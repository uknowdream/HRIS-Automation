"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Bot,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  LogIn,
  Building2,
  Check,
  Trash2,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { getDict, tRole } from "@/lib/i18n";
import { ALL_CURRENCIES } from "@/lib/currency";
import { ALL_ROLES } from "@/lib/rbac";
import { QuickInviteModal } from "@/components/modals/QuickInviteModal";
import { AetherCopilot } from "@/components/ai/AetherCopilot";
import type { ActiveRole, Currency, EntityScope, HRNotification, PermissionKey } from "@/types/hris";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pendingCount?: number;
  requiredPerm?: PermissionKey;
}

const ENTITY_OPTIONS: { id: EntityScope; label: string; sub: string }[] = [
  { id: "ALL", label: "AetherHR Global", sub: "All 5 Global Entities" },
  { id: "Indonesia", label: "PT Aether Indonesia", sub: "IDR · PPh 21 TER + BPJS" },
  { id: "Singapore", label: "Aether Singapore", sub: "SGD · CPF & IRAS" },
  { id: "United States", label: "Aether US Inc.", sub: "USD · Federal + FICA" },
  { id: "Europe", label: "Aether Europe GmbH", sub: "EUR / GBP · EU Payroll" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    hydrated,
    isAuthenticated,
    locale,
    setLocale,
    displayCurrency,
    setDisplayCurrency,
    theme,
    toggleTheme,
    activeRole,
    switchRole,
    hasPermission,
    selectedEntity,
    setSelectedEntity,
    authUser,
    signOut,
    openInviteModal,
    employees,
    leaves,
    expenses,
    documents,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearReadNotifications,
    toasts,
    dismissToast,
  } = useHRIS();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "approval" | "security">("all");
  const [entityMenuOpen, setEntityMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");

  const notifRef = useRef<HTMLDivElement | null>(null);
  const entityRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const dict = getDict(locale);
  const isId = locale === "id";
  const isStandalonePage =
    pathname?.startsWith("/assess/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setNotifOpen(false);
        setEntityMenuOpen(false);
        setProfileMenuOpen(false);
        setCopilotOpen(false);
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (entityRef.current && !entityRef.current.contains(target)) setEntityMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isStandalonePage && hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, isStandalonePage, router]);

  if (isStandalonePage) {
    return (
      <div className="min-h-screen aether-grid-bg">
        {children}
        <ToastOverlay toasts={toasts} dismiss={dismissToast} />
      </div>
    );
  }

  if (hydrated && !isAuthenticated) {
    return (
      <div className="min-h-screen aether-grid-bg flex items-center justify-center p-6">
        <div className="hr-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <ShieldCheck className="w-10 h-10 text-indigo-600 mx-auto" />
          <h1 className="text-lg font-extrabold">
            {isId ? "Sesi Telah Keluar (Signed Out)" : "Session Signed Out"}
          </h1>
          <p className="text-xs hr-muted">
            {isId
              ? "Silakan masuk kembali ke akun HRIS Anda untuk mengakses workspace."
              : "Please sign in to your HRIS account to access the workspace."}
          </p>
          <Link
            href="/login"
            className="btn-quantum inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold w-full"
          >
            <LogIn className="w-4 h-4" />
            {isId ? "Ke Halaman Login" : "Go to Sign In"}
          </Link>
        </div>
      </div>
    );
  }

  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const pendingExpenses = expenses.filter((e) => e.status === "Pending").length;
  const actionDocs = documents.filter(
    (d) => d.status === "Awaiting Signature" || d.status === "Expiring Soon"
  ).length;

  const rawGroups: { title: string; items: NavItem[] }[] = [
    {
      title: dict.groups.overview,
      items: [{ href: "/", label: dict.nav.dashboard, icon: LayoutDashboard }],
    },
    {
      title: dict.groups.coreHr,
      items: [
        { href: "/employees", label: dict.nav.employees, icon: Users },
        {
          href: "/documents",
          label: dict.nav.documents,
          icon: FileSignature,
          pendingCount: activeRole === "Employee" ? undefined : actionDocs,
        },
        { href: "/learning", label: dict.nav.learning, icon: GraduationCap },
      ],
    },
    {
      title: dict.groups.timePay,
      items: [
        {
          href: "/attendance",
          label: dict.nav.attendance,
          icon: Clock,
          pendingCount: hasPermission("attendance:approve") ? pendingLeaves : undefined,
        },
        { href: "/payroll", label: dict.nav.payroll, icon: Wallet },
        {
          href: "/finance-ops",
          label: dict.nav.financeOps,
          icon: Receipt,
          pendingCount: hasPermission("expenses:approve") ? pendingExpenses : undefined,
        },
      ],
    },
    {
      title: dict.groups.talent,
      items: [
        {
          href: "/recruitment",
          label: dict.nav.recruitment,
          icon: UserPlus,
          requiredPerm: "recruitment:manage",
        },
        {
          href: "/assessments",
          label: dict.nav.assessments,
          icon: BrainCircuit,
          requiredPerm: "assessments:manage",
        },
        { href: "/performance", label: dict.nav.performance, icon: Target },
      ],
    },
    {
      title: dict.groups.platform,
      items: [
        {
          href: "/automation",
          label: dict.nav.automation,
          icon: Workflow,
          requiredPerm: "automation:manage",
        },
        {
          href: "/audit-logs",
          label: dict.nav.auditLogs,
          icon: ShieldCheck,
          requiredPerm: "audit:view",
        },
        { href: "/mobile", label: dict.nav.mobile, icon: Smartphone },
        {
          href: "/settings",
          label: dict.nav.settings,
          icon: Settings,
          requiredPerm: "settings:manage",
        },
      ],
    },
  ];

  const navGroups = rawGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.requiredPerm || hasPermission(i.requiredPerm)),
    }))
    .filter((g) => g.items.length > 0);

  const allNavFlat = navGroups.flatMap((g) => g.items);
  const currentNavItem = allNavFlat.find((n) =>
    n.href === "/" ? pathname === "/" : pathname?.startsWith(n.href)
  );
  const activeEntityMeta =
    ENTITY_OPTIONS.find((e) => e.id === selectedEntity) || ENTITY_OPTIONS[0];

  const visibleNotifications = notifications.filter((n) => {
    if (notifFilter === "unread") return !n.read;
    if (notifFilter === "approval") return n.category === "approval";
    if (notifFilter === "security") return n.category === "security";
    return true;
  });

  const handleNotifClick = (n: HRNotification) => {
    markNotificationRead(n.id);
    setNotifOpen(false);
    router.push(n.href);
  };

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await signOut();
    router.push("/login");
  };

  const filteredCommands = [
    ...allNavFlat.map((n) => ({
      id: n.href,
      title: n.label,
      subtitle: `Go to ${n.href}`,
      action: () => router.push(n.href),
    })),
    {
      id: "action-invite",
      title: isId ? "Kirim Undangan Psikotes (Email + WhatsApp)" : "Send Email & WhatsApp Test Invite",
      subtitle: "HMAC-SHA256 signed link + QR + wa.me",
      action: () => openInviteModal(),
    },
    {
      id: "action-login",
      title: isId ? "Halaman Login / Ganti Akun" : "Sign In / Switch Account",
      subtitle: "/login — MFA & SSO Portal",
      action: () => router.push("/login"),
    },
    {
      id: "action-signup",
      title: isId ? "Daftar Workspace Baru (Sign Up)" : "Create New Company Workspace",
      subtitle: "/signup — 2-step Enterprise Setup",
      action: () => router.push("/signup"),
    },
    ...employees.slice(0, 6).map((e) => ({
      id: e.id,
      title: e.name,
      subtitle: `${e.role} · ${e.location}`,
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
      {/* Clean Light-First Modern HRIS Sidebar (Deel / Rippling / Linear / Mekari Talenta) */}
      <aside
        className={`no-print hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r transition-all duration-200 bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-800/80 ${
          collapsed ? "lg:w-[72px]" : "lg:w-[252px]"
        }`}
      >
        {/* Top Multi-Entity Workspace Switcher */}
        <div
          ref={entityRef}
          className="relative px-3 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-1.5"
        >
          <button
            type="button"
            onClick={() => !collapsed && setEntityMenuOpen((p) => !p)}
            className="flex items-center gap-2.5 flex-1 min-w-0 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
              A
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-extrabold tracking-tight truncate">
                    {activeEntityMeta.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {activeEntityMeta.sub}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Sidebar Rail"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {entityMenuOpen && !collapsed && (
            <div className="absolute left-3 right-3 top-[60px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5 z-50 space-y-0.5">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isId ? "Pilih Entitas Perusahaan" : "Switch Legal Entity"}
              </div>
              {ENTITY_OPTIONS.map((ent) => (
                <button
                  key={ent.id}
                  onClick={() => {
                    setSelectedEntity(ent.id);
                    setEntityMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition ${
                    selectedEntity === ent.id
                      ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{ent.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{ent.sub}</div>
                  </div>
                  {selectedEntity === ent.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quiet-Chrome Grouped Navigation (Zero Badge Spam!) */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              {!collapsed && (
                <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center ${
                      collapsed ? "justify-center px-2" : "justify-between px-2.5"
                    } py-2 rounded-lg text-[13px] transition ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-[17px] h-[17px] shrink-0 ${
                          active
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && item.pendingCount && item.pendingCount > 0 ? (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center tabular-nums">
                        {item.pendingCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Clean User Profile & Role Popover Footer */}
        <div
          ref={profileRef}
          className="relative p-2.5 border-t border-slate-200/80 dark:border-slate-800/80"
        >
          <button
            type="button"
            onClick={() => setProfileMenuOpen((p) => !p)}
            className={`w-full flex items-center ${
              collapsed ? "justify-center" : "gap-2.5"
            } p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition text-left`}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {authUser.avatarInitials}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{authUser.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {tRole(activeRole, locale)} · {displayCurrency}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </>
            )}
          </button>

          {profileMenuOpen && (
            <div className="absolute left-2.5 bottom-[64px] w-60 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-2 text-xs">
              <div className="px-2 py-1.5 border-b border-slate-200 dark:border-slate-800">
                <div className="font-bold truncate">{authUser.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{authUser.email}</div>
              </div>

              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isId ? "Simulasi 5 Role RBAC" : "Switch RBAC Role (5 Tiers)"}
                </div>
                {ALL_ROLES.map((roleOpt) => (
                  <button
                    key={roleOpt}
                    onClick={() => {
                      switchRole(roleOpt);
                      setProfileMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      activeRole === roleOpt
                        ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{tRole(roleOpt, locale)}</span>
                    {activeRole === roleOpt && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>

              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 space-y-0.5">
                <Link
                  href="/login"
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                  {isId ? "Halaman Sign In / Ganti Akun" : "Sign In / Switch Account"}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  {isId ? "Daftar Workspace Baru" : "Register New Workspace"}
                </Link>
                <button
                  onClick={() => void handleSignOut()}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {isId ? "Keluar (Sign Out)" : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen pb-16 lg:pb-0 transition-all duration-200 ${
          collapsed ? "lg:pl-[72px]" : "lg:pl-[252px]"
        }`}
      >
        {/* Crisp Minimalist Topbar */}
        <header className="no-print sticky top-0 z-20 bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
              <span className="text-slate-400 font-medium">{activeEntityMeta.label}</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {currentNavItem?.label || dict.nav.dashboard}
              </span>
            </div>

            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 flex-1 min-w-0 max-w-xs sm:max-w-sm px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 hover:border-indigo-400 text-left text-xs text-slate-500 dark:text-slate-400 transition"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">{dict.topbar.searchPlaceholder}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Display Currency Switcher (Syncs all KPIs, Payroll & Expenses!) */}
            <select
              aria-label="Global Display Currency"
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
              className="px-2 py-1.5 rounded-lg text-xs font-mono font-bold hr-input cursor-pointer"
              title={dict.topbar.currencyTitle}
            >
              {ALL_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Quick Topbar RBAC Role Selector */}
            <select
              aria-label="Active RBAC Role"
              value={activeRole}
              onChange={(e) => switchRole(e.target.value as ActiveRole)}
              className="hidden xl:block px-2.5 py-1.5 rounded-lg text-xs font-bold hr-input cursor-pointer"
              title={isId ? "Ganti Role Akses RBAC" : "Switch Active RBAC Role"}
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {tRole(r, locale)}
                </option>
              ))}
            </select>

            <button
              onClick={() => setCopilotOpen((p) => !p)}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-500/30 hover:bg-indigo-100 transition"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AetherAI</span>
            </button>

            {hasPermission("assessments:manage") && (
              <button
                onClick={() => openInviteModal()}
                className="hidden sm:inline-flex btn-quantum px-3 py-1.5 rounded-lg text-xs font-semibold items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dict.topbar.quickInvite}</span>
              </button>
            )}

            {/* REAL Interactive Notification Center */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((p) => !p)}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                aria-label="Notifications"
                title={isId ? "Pusat Notifikasi" : "Notification Center"}
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-11 w-[calc(100vw-1.5rem)] sm:w-[380px] bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold">
                        {isId ? "Notifikasi" : "Notifications"}
                      </span>
                      <span className="badge-info px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums">
                        {unreadNotificationsCount} {isId ? "Baru" : "Unread"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {isId ? "Tandai dibaca" : "Mark all read"}
                        </button>
                      )}
                      <button
                        onClick={clearReadNotifications}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                        title={isId ? "Hapus notifikasi terbaca" : "Clear read notifications"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 text-[11px]">
                    {(
                      [
                        { id: "all", label: isId ? "Semua" : "All" },
                        { id: "unread", label: isId ? "Belum Dibaca" : "Unread" },
                        { id: "approval", label: isId ? "Persetujuan" : "Approvals" },
                        { id: "security", label: isId ? "Keamanan" : "Security" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setNotifFilter(t.id)}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          notifFilter === t.id
                            ? "bg-indigo-600 text-white"
                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                    {visibleNotifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        {isId ? "Tidak ada notifikasi pada filter ini ✓" : "No notifications in this view ✓"}
                      </div>
                    ) : (
                      visibleNotifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-start gap-2.5 transition ${
                            !n.read ? "bg-indigo-50/40 dark:bg-indigo-500/5" : ""
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              !n.read ? "bg-indigo-600" : "bg-transparent"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold truncate">{n.title}</span>
                              <span className="text-[10px] uppercase font-mono text-slate-400 shrink-0">
                                {n.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setLocale(locale === "id" ? "en" : "id")}
              className="px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 text-slate-600 dark:text-slate-300"
              title="Switch ID / EN"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{locale.toUpperCase()}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Toggle theme"
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-xs font-semibold"
              title="Sign In / Switch Account"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isId ? "Akun" : "Auth"}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 max-w-[1520px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[84vw] bg-white dark:bg-[#0d1117] h-full flex flex-col p-4 z-10 overflow-y-auto border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">A</div>
                <span className="font-extrabold text-sm">AetherHR PRO</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 flex-1">
              {navGroups.map((g) => (
                <div key={g.title} className="space-y-0.5">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{g.title}</div>
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                          active
                            ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </span>
                        {item.pendingCount && item.pendingCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                            {item.pendingCount}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Mobile Role Switcher"
                  value={activeRole}
                  onChange={(e) => {
                    switchRole(e.target.value as ActiveRole);
                    setMobileMenuOpen(false);
                  }}
                  className="px-2 py-1.5 rounded-lg text-xs font-bold hr-input"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {tRole(r, locale)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Mobile Currency Switcher"
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
                  className="px-2 py-1.5 rounded-lg text-xs font-mono font-bold hr-input"
                >
                  {ALL_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void handleSignOut();
                  }}
                  className="flex-1 text-center py-2 rounded-lg badge-danger text-xs font-bold"
                >
                  {isId ? "Keluar (Sign Out)" : "Sign Out"}
                </button>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg btn-quantum text-xs font-bold"
                >
                  {isId ? "Daftar Baru" : "Sign Up"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role-Synchronized & Bilingual Mobile Bottom Tab Bar */}
      <nav className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {(hasPermission("assessments:manage")
          ? [
              { href: "/", icon: LayoutDashboard, label: isId ? "Beranda" : "Home" },
              { href: "/attendance", icon: Clock, label: isId ? "Absensi" : "Time" },
              { href: "/assessments", icon: BrainCircuit, label: isId ? "Psikotes" : "IQ Test" },
              { href: "/payroll", icon: Wallet, label: isId ? "Payroll" : "Pay" },
              { href: "/mobile", icon: Smartphone, label: "App" },
            ]
          : hasPermission("payroll:view_all")
          ? [
              { href: "/", icon: LayoutDashboard, label: isId ? "Beranda" : "Home" },
              { href: "/payroll", icon: Wallet, label: "Payroll" },
              { href: "/finance-ops", icon: Receipt, label: isId ? "Reimburse" : "Expense" },
              { href: "/audit-logs", icon: ShieldCheck, label: "Audit" },
              { href: "/mobile", icon: Smartphone, label: "App" },
            ]
          : [
              { href: "/", icon: LayoutDashboard, label: isId ? "Beranda" : "Home" },
              { href: "/attendance", icon: Clock, label: isId ? "Absensi" : "Time" },
              { href: "/payroll", icon: Wallet, label: isId ? "Slip Gaji" : "My Pay" },
              { href: "/documents", icon: FileSignature, label: isId ? "Kontrak" : "Docs" },
              { href: "/mobile", icon: Smartphone, label: "App" },
            ]
        ).map((tab) => {
          const Icon = tab.icon;
          const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold ${
                active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"
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
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/50 backdrop-blur-sm"
          onClick={() => setCmdOpen(false)}
        >
          <div className="w-full max-w-lg hr-card rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <input
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder={dict.topbar.searchPlaceholder}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button onClick={() => setCmdOpen(false)} className="text-xs hr-muted">ESC</button>
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
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/15 flex items-center justify-between transition"
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

      {/* Floating AetherAI Copilot Button */}
      {!copilotOpen && (
        <button
          onClick={() => setCopilotOpen(true)}
          className="no-print fixed bottom-20 lg:bottom-6 right-5 z-40 btn-quantum px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg"
          aria-label="Open AetherAI HR Copilot"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">AetherAI</span>
        </button>
      )}

      <AetherCopilot open={copilotOpen} onClose={() => setCopilotOpen(false)} />
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
    <div className="no-print fixed bottom-36 lg:bottom-20 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
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
