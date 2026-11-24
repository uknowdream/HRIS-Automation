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
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { formatCurrency } from "@/lib/payroll-engine";
import type { Currency, Employee, EmploymentType } from "@/types/hris";

export default function EmployeesPage() {
  const {
    locale,
    selectedEntity,
    employees,
    addEmployee,
    updateEmployee,
    offboardEmployee,
    openInviteModal,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";

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

  // Add Form State
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
      "Currency",
      "BaseSalary",
      "IQ",
      "DISC",
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
      e.currency,
      e.baseSalary,
      e.cognitiveIq || "",
      e.discProfile || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aetherhr-employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({
      title: isId ? "CSV Direktori Diunduh" : "Employee CSV Exported",
      description: `${filtered.length} records exported.`,
      variant: "success",
    });
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyan-400" />
            {isId ? "Direktori Karyawan Global & Bagan Organisasi" : "Global People Directory & Org Chart"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isId
              ? "Kelola profil 360° karyawan lintas negara, status onboarding otomatis, baseline psikotes & kontak WA/Email."
              : "Manage 360° multi-country employee profiles, zero-touch onboarding, psychometric baselines, and WA/Email dispatch."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-700/70 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 ${
                viewMode === "grid" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode("org")}
              className={`px-3 py-2 text-xs font-semibold flex items-center gap-1.5 ${
                viewMode === "org" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400"
              }`}
            >
              <Network className="w-3.5 h-3.5" /> Org Chart
            </button>
          </div>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="btn-quantum px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {isId ? "Tambah Karyawan (Auto-Onboard)" : "Add Employee (Auto-Onboard)"}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isId ? "Cari nama, jabatan, kode, atau lokasi..." : "Search name, role, code, or city..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/70 border border-slate-700/70 text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setDeptFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              deptFilter === "ALL"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-900/60 text-slate-400 border border-slate-800"
            }`}
          >
            {isId ? "Semua" : "All"} ({employees.length})
          </button>
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                deptFilter === d
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "grid" ? (
        /* Employee Directory Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmp(emp)}
              className="glass-card rounded-2xl p-5 cursor-pointer flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${emp.avatarColor} flex items-center justify-center font-black text-white shadow-lg`}
                  >
                    {emp.avatarInitials}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{emp.name}</div>
                    <div className="text-xs text-cyan-400 font-medium">{emp.role}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{emp.employeeCode}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    emp.status === "Active"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : emp.status === "Onboarding"
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {emp.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Dept
                  </div>
                  <div className="font-semibold truncate mt-0.5">{emp.department}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </div>
                  <div className="font-semibold truncate mt-0.5">{emp.location}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/70">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-mono font-bold flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3" /> IQ {emp.cognitiveIq || 120}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                    {emp.discProfile || "D-C"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`https://wa.me/${emp.phone}?text=${encodeURIComponent(
                      `Halo ${emp.name}, pesan dari HRIS AetherHR.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition"
                    title="WhatsApp Direct"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`mailto:${emp.email}`}
                    className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition"
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
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40">
              <span className="text-[10px] uppercase tracking-widest text-cyan-300 font-bold">
                Global Executive Leadership
              </span>
              <span className="text-base font-black mt-1">
                {employees[0]?.name || "Nadia Kusuma"}
              </span>
              <span className="text-xs text-slate-400">{employees[0]?.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {departments.map((dept) => {
              const members = employees.filter((e) => e.department === dept);
              return (
                <div
                  key={dept}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-wide">
                      {dept}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {members.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedEmp(m)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950/70 hover:border-cyan-500/40 border border-slate-800/80 flex items-center gap-2.5 transition"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.avatarColor} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}
                        >
                          {m.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{m.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{m.role}</div>
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
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setSelectedEmp(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-5"
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
                  <h2 className="text-lg font-black">{selectedEmp.name}</h2>
                  <p className="text-xs text-cyan-400 font-semibold">{selectedEmp.role}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedEmp.employeeCode} · {selectedEmp.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmp(null)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Monthly Gross</div>
                <div className="text-sm font-black mt-0.5 text-emerald-400">
                  {formatCurrency(selectedEmp.baseSalary + selectedEmp.allowances, selectedEmp.currency)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Cognitive / DISC</div>
                <div className="text-sm font-black mt-0.5 text-cyan-400">
                  IQ {selectedEmp.cognitiveIq || 122} · {selectedEmp.discProfile || "D-C"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Performance / Potential</div>
                <div className="text-sm font-bold mt-0.5">
                  {selectedEmp.performanceScore}% / {selectedEmp.potentialScore}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Tax Status / Timezone</div>
                <div className="text-sm font-bold mt-0.5 truncate">
                  {selectedEmp.taxStatus} · {selectedEmp.timezone.split(" ")[0]}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 mb-2">Verified Core Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedEmp.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/12 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-2">Instant Actions</div>
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
              <button
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

              {!editingEmp ? (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
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
                      description: `${selectedEmp.name} synced to Payroll & Directory.`,
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-lg glass-panel rounded-2xl border border-cyan-500/30 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                {isId ? "Tambah Karyawan & Jalankan Auto-Onboarding" : "Add Employee & Trigger Zero-Touch Onboarding"}
              </h2>
              <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isId ? "Nama Lengkap *" : "Full Name *"}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
                <input
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={isId ? "Jabatan *" : "Job Title *"}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="WhatsApp (e.g. 62812...)"
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
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
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
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
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
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
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs border border-slate-700"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
                <button type="submit" className="btn-quantum px-5 py-2 rounded-xl text-xs font-bold">
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
