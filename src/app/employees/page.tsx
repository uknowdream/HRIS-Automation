"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Download,
  Mail,
  MessageCircle,
  MapPin,
  BrainCircuit,
  Network,
  LayoutGrid,
  X,
  Building2,
  CheckCircle2,
  Sparkles,
  Lock,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { formatCurrency } from "@/lib/payroll-engine";
import type { Currency, Employee, EmploymentType } from "@/types/hris";

export default function EmployeesPage() {
  const {
    locale,
    activeRole,
    selectedEntity,
    currentEmployee,
    hasPermission,
    recordAuditLog,
    employees,
    addEmployee,
    updateEmployee,
    offboardEmployee,
    openInviteModal,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";

  const canManageEmployees = hasPermission("employees:manage");
  const canViewComp = hasPermission("employees:compensation");
  const canViewIq = hasPermission("assessments:manage");

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "org">("grid");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [editingEmp, setEditingEmp] = useState(false);
  const [editRole, setEditRole] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editStatus, setEditStatus] = useState<Employee["status"]>("Active");
  const [addOpen, setAddOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("Jakarta, ID");
  const [country, setCountry] = useState("Indonesia");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("Full-Time");
  const [baseSalary, setBaseSalary] = useState("25000000");
  const [currency, setCurrency] = useState<Currency>("IDR");

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))),
    [employees]
  );

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchEntity =
        selectedEntity === "ALL" ||
        (selectedEntity === "Europe"
          ? e.country === "Germany" || e.country === "United Kingdom"
          : e.country === selectedEntity);
      const matchDept = deptFilter === "ALL" || e.department === deptFilter;
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q);
      return matchEntity && matchDept && matchQ;
    });
  }, [employees, selectedEntity, deptFilter, query]);

  const handleExportCsv = () => {
    const headers = [
      "Code",
      "Name",
      "Email",
      "Phone",
      "Role",
      "Department",
      "Country",
      "Type",
      "Status",
      ...(canViewComp ? ["Currency", "BaseSalary"] : []),
    ];
    const rows = filtered.map((e) => [
      e.employeeCode,
      `"${e.name}"`,
      e.email,
      e.phone,
      `"${e.role}"`,
      `"${e.department}"`,
      e.country,
      e.employmentType,
      e.status,
      ...(canViewComp ? [e.currency, e.baseSalary] : []),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aetherhr-employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    recordAuditLog({
      module: "People & JML",
      action: "directory.csv_exported",
      target: `${filtered.length} Employee Profiles`,
      severity: canViewComp ? "SENSITIVE" : "INFO",
      detail: `Exported employee directory CSV (${canViewComp ? "with compensation" : "public fields only"}).`,
    });
    pushToast({
      title: isId ? "CSV Direktori Diunduh" : "Employee CSV Exported",
      description: `${filtered.length} records exported.`,
      variant: "success",
    });
  };

  const handleSelectEmp = (emp: Employee) => {
    setSelectedEmp(emp);
    if (canViewComp && emp.id !== currentEmployee.id) {
      recordAuditLog({
        module: "People & JML",
        action: "employee.compensation_viewed",
        target: `${emp.name} (${emp.employeeCode})`,
        severity: "INFO",
        detail: `Opened 360° employee record including compensation (${activeRole}).`,
      });
    }
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !canManageEmployees) return;
    addEmployee({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@aetherhr.global`,
      phone: phone.replace(/[^\d]/g, "") || "6281200000000",
      role: role.trim(),
      department,
      location,
      country,
      timezone: country === "Indonesia" ? "Asia/Jakarta (UTC+7)" : "UTC+0",
      employmentType,
      status: "Onboarding",
      joinDate: new Date().toISOString().slice(0, 10),
      managerName: "Nadia Kusuma",
      baseSalary: Number(baseSalary) || 20000000,
      allowances: Math.round((Number(baseSalary) || 20000000) * 0.15),
      currency,
      taxStatus: "TK/0",
      cognitiveIq: 125,
      discProfile: "D-C",
      performanceScore: 88,
      potentialScore: 90,
      attendanceRate: 100,
      skills: ["Cloud HRIS", "Automation", "Collaboration"],
    });
    setAddOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setRole("");
  };

  const canSeeSelectedEmpComp =
    selectedEmp && (canViewComp || selectedEmp.id === currentEmployee.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {isId ? "Direktori Karyawan Global & Bagan Organisasi" : "Global People Directory & Org Chart"}
          </h1>
          <p className="text-xs sm:text-sm hr-muted mt-1">
            {isId
              ? "Kelola profil 360° karyawan lintas negara, status onboarding otomatis, dan struktur organisasi."
              : "Manage 360° multi-country employee profiles, zero-touch onboarding, and org hierarchy."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border p-0.5 hr-subtle">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-300"
                  : "hr-muted"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("org")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === "org"
                  ? "bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-300"
                  : "hr-muted"
              }`}
            >
              <Network className="w-3.5 h-3.5" /> Org Chart
            </button>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="hr-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {canManageEmployees && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="btn-quantum px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {isId ? "Tambah Karyawan (Auto-Onboard)" : "Add Employee (Auto-Onboard)"}
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="hr-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 hr-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isId ? "Cari nama, jabatan, kode, atau lokasi..." : "Search name, role, code, or city..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl hr-input text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setDeptFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              deptFilter === "ALL"
                ? "bg-indigo-600 text-white"
                : "hr-subtle hr-muted hover:text-indigo-600"
            }`}
          >
            {isId ? "Semua" : "All"} ({employees.length})
          </button>
          {departments.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                deptFilter === d
                  ? "bg-indigo-600 text-white"
                  : "hr-subtle hr-muted hover:text-indigo-600"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              onClick={() => handleSelectEmp(emp)}
              className="hr-card rounded-2xl p-5 cursor-pointer flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${emp.avatarColor} flex items-center justify-center font-black text-white shadow-sm shrink-0`}
                  >
                    {emp.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm truncate">{emp.name}</div>
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                      {emp.role}
                    </div>
                    <div className="text-[11px] hr-muted font-mono">{emp.employeeCode}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                    emp.status === "Active"
                      ? "badge-success"
                      : emp.status === "Onboarding"
                      ? "badge-info"
                      : "badge-warning"
                  }`}
                >
                  {emp.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl hr-subtle">
                  <div className="text-[10px] hr-muted flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Dept
                  </div>
                  <div className="font-semibold truncate mt-0.5">{emp.department}</div>
                </div>
                <div className="p-2.5 rounded-xl hr-subtle">
                  <div className="text-[10px] hr-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </div>
                  <div className="font-semibold truncate mt-0.5">{emp.location}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-2 text-xs">
                  {canViewIq ? (
                    <>
                      <span className="badge-info px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1">
                        <BrainCircuit className="w-3 h-3" /> IQ {emp.cognitiveIq || 120}
                      </span>
                      <span className="px-2 py-0.5 rounded-md hr-subtle font-mono text-[11px]">
                        {emp.discProfile || "D-C"}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] hr-muted">{emp.employmentType}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`https://wa.me/${emp.phone}?text=${encodeURIComponent(
                      `Halo ${emp.name}, pesan dari HRIS AetherHR.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg badge-success"
                    title="WhatsApp Direct"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`mailto:${emp.email}`}
                    className="p-2 rounded-lg badge-info"
                    title="Email Direct"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Interactive Org Chart Hierarchy View */
        <div className="hr-card rounded-2xl p-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex flex-col items-center p-4 rounded-2xl hr-subtle border-indigo-500/30">
              <span className="text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                Global Executive Leadership
              </span>
              <span className="text-base font-extrabold mt-1">
                {employees[0]?.name || "Nadia Kusuma"}
              </span>
              <span className="text-xs hr-muted">{employees[0]?.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {departments.map((dept) => {
              const members = employees.filter((e) => e.department === dept);
              return (
                <div key={dept} className="p-4 rounded-2xl hr-subtle space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      {dept}
                    </span>
                    <span className="badge-info text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {members.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectEmp(m)}
                        className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 flex items-center gap-2.5 transition"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.avatarColor} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}
                        >
                          {m.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{m.name}</div>
                          <div className="text-[10px] hr-muted truncate">{m.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 360 Employee Slide-Over Drawer */}
      {selectedEmp && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm"
          onClick={() => setSelectedEmp(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#0d1117] border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedEmp.avatarColor} flex items-center justify-center text-lg font-black text-white`}
                >
                  {selectedEmp.avatarInitials}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold">{selectedEmp.name}</h2>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    {selectedEmp.role}
                  </p>
                  <p className="text-[11px] hr-muted font-mono">
                    {selectedEmp.employeeCode} · {selectedEmp.location}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="p-2 rounded-lg hr-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl hr-subtle">
                <div className="hr-muted">Monthly Gross</div>
                {canSeeSelectedEmpComp ? (
                  <div className="text-sm font-extrabold mt-0.5 text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(selectedEmp.baseSalary + selectedEmp.allowances, selectedEmp.currency)}
                  </div>
                ) : (
                  <div className="text-xs font-bold mt-1 hr-muted flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-500" /> Protected by RBAC
                  </div>
                )}
              </div>
              <div className="p-3 rounded-xl hr-subtle">
                <div className="hr-muted">Cognitive / DISC</div>
                {canViewIq || selectedEmp.id === currentEmployee.id ? (
                  <div className="text-sm font-extrabold mt-0.5 text-indigo-600 dark:text-indigo-400">
                    IQ {selectedEmp.cognitiveIq || 122} · {selectedEmp.discProfile || "D-C"}
                  </div>
                ) : (
                  <div className="text-xs font-bold mt-1 hr-muted flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-500" /> Confidential
                  </div>
                )}
              </div>
              <div className="p-3 rounded-xl hr-subtle">
                <div className="hr-muted">Performance / Attendance</div>
                <div className="text-sm font-bold mt-0.5">
                  {selectedEmp.performanceScore}% · {selectedEmp.attendanceRate}%
                </div>
              </div>
              <div className="p-3 rounded-xl hr-subtle">
                <div className="hr-muted">Tax Status / Timezone</div>
                <div className="text-sm font-bold mt-0.5 truncate">
                  {canSeeSelectedEmpComp ? selectedEmp.taxStatus : "•••"} · {selectedEmp.timezone.split(" ")[0]}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold hr-muted mb-2">Verified Core Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedEmp.skills.map((s) => (
                  <span key={s} className="badge-info px-2.5 py-1 rounded-lg text-xs font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="text-xs font-bold hr-muted mb-2">Instant Actions</div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${selectedEmp.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-emerald py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <a
                  href={`mailto:${selectedEmp.email}`}
                  className="btn-quantum py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-4 h-4" /> Email
                </a>
              </div>

              {canViewIq && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedEmp;
                    setSelectedEmp(null);
                    setEditingEmp(false);
                    openInviteModal({
                      candidateName: target.name,
                      candidateEmail: target.email,
                      candidatePhone: target.phone,
                      role: `Internal Promotion Assessment — ${target.role}`,
                      department: target.department,
                    });
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold badge-info hover:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {isId ? "Kirim Asesmen Promosi (Psikotes)" : "Send Internal Promotion Psychometric Test"}
                </button>
              )}

              {canManageEmployees && (
                !editingEmp ? (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditRole(selectedEmp.role);
                        setEditDept(selectedEmp.department);
                        setEditSalary(String(selectedEmp.baseSalary));
                        setEditStatus(selectedEmp.status);
                        setEditingEmp(true);
                      }}
                      className="py-2 rounded-xl text-xs font-bold hr-btn-secondary"
                    >
                      {isId ? "Edit Profil & Gaji" : "Edit Profile & Pay"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        offboardEmployee(selectedEmp.id);
                        setSelectedEmp(null);
                        setEditingEmp(false);
                      }}
                      className="py-2 rounded-xl text-xs font-bold badge-danger"
                    >
                      {isId ? "Offboard (Leaver Flow)" : "Offboard (Leaver)"}
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const patch: Partial<Employee> = {
                        role: editRole.trim() || selectedEmp.role,
                        department: editDept.trim() || selectedEmp.department,
                        baseSalary: Number(editSalary) || selectedEmp.baseSalary,
                        status: editStatus,
                      };
                      updateEmployee(selectedEmp.id, patch);
                      setSelectedEmp({ ...selectedEmp, ...patch });
                      setEditingEmp(false);
                      pushToast({
                        title: isId ? "Profil Karyawan Diperbarui" : "Employee Profile Updated",
                        description: `${selectedEmp.name} synced to Payroll & Audit Log.`,
                        variant: "success",
                      });
                    }}
                    className="p-3.5 rounded-xl hr-subtle space-y-2.5 text-xs mt-2"
                  >
                    <div className="font-bold">Edit Employee Record</div>
                    <input
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      placeholder="Role"
                      className="w-full px-3 py-2 rounded-lg hr-input"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editDept}
                        onChange={(e) => setEditDept(e.target.value)}
                        placeholder="Department"
                        className="px-3 py-2 rounded-lg hr-input"
                      />
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as Employee["status"])}
                        className="px-3 py-2 rounded-lg hr-input"
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Onboarding">Onboarding</option>
                        <option value="Probation">Probation</option>
                      </select>
                    </div>
                    <input
                      type="number"
                      value={editSalary}
                      onChange={(e) => setEditSalary(e.target.value)}
                      placeholder="Base Salary"
                      className="w-full px-3 py-2 rounded-lg hr-input font-mono"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingEmp(false)}
                        className="px-3 py-1.5 rounded-lg hr-btn-secondary"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-quantum px-4 py-1.5 rounded-lg font-bold">
                        Save Changes
                      </button>
                    </div>
                  </form>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {addOpen && canManageEmployees && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-lg hr-card rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {isId ? "Tambah Karyawan & Jalankan Auto-Onboarding" : "Add Employee & Trigger Zero-Touch Onboarding"}
              </h2>
              <button type="button" onClick={() => setAddOpen(false)} className="hr-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isId ? "Nama Lengkap *" : "Full Name *"}
                  className="px-3 py-2.5 rounded-xl hr-input"
                />
                <input
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={isId ? "Jabatan *" : "Job Title *"}
                  className="px-3 py-2.5 rounded-xl hr-input"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="px-3 py-2.5 rounded-xl hr-input"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="WhatsApp (e.g. 62812...)"
                  className="px-3 py-2.5 rounded-xl hr-input"
                />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="px-3 py-2.5 rounded-xl hr-input font-semibold"
                >
                  <option>Engineering</option>
                  <option>People & HR Tech</option>
                  <option>Finance & Legal</option>
                  <option>Product & Growth</option>
                  <option>Operations</option>
                </select>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="px-3 py-2.5 rounded-xl hr-input font-semibold"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Remote Global">Remote Global</option>
                  <option value="Contract">Contract</option>
                  <option value="Executive">Executive</option>
                </select>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="px-3 py-2.5 rounded-xl hr-input"
                />
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  className="px-3 py-2.5 rounded-xl hr-input"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="px-3 py-2.5 rounded-xl hr-input font-bold"
                >
                  <option value="IDR">IDR (Rupiah)</option>
                  <option value="USD">USD ($)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="Base Monthly Salary"
                  className="px-3 py-2.5 rounded-xl hr-input font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="hr-btn-secondary px-4 py-2 rounded-xl font-semibold"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button type="submit" className="btn-quantum px-5 py-2 rounded-xl font-bold">
                  {isId ? "Simpan & Onboard Otomatis" : "Create & Trigger Onboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
