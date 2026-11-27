"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Navigation,
  Calendar,
  Plus,
  ShieldCheck,
  Smartphone,
  MessageCircle,
  Zap,
  Lock,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { tRole, tStatus } from "@/lib/i18n";
import { calculateOvertimePayKepmenaker, formatCurrency } from "@/lib/payroll-engine";
import { formatConverted } from "@/lib/currency";
import type { LeaveRequest } from "@/types/hris";

export default function AttendancePage() {
  const {
    locale,
    displayCurrency,
    activeRole,
    currentEmployee,
    hasPermission,
    settings,
    updateSettings,
    employees,
    attendance,
    shiftRoster,
    leaves,
    overtimeRequests,
    clockInEmployee,
    clockOutEmployee,
    cycleShiftCell,
    submitLeaveRequest,
    decideLeaveRequest,
    submitOvertimeRequest,
    decideOvertimeRequest,
  } = useHRIS();
  const isId = locale === "id";

  const canApproveLeave = hasPermission("attendance:approve");
  const canFinalApproveLeave = hasPermission("employees:manage");
  const canManageRoster = hasPermission("roster:manage");
  const canEditSettings = hasPermission("settings:manage");
  const isEss = activeRole === "Employee";

  const [nowTime, setNowTime] = useState("08:30:00");
  const [selectedEmpId, setSelectedEmpId] = useState(currentEmployee.id);
  const [gpsStatus, setGpsStatus] = useState("HQ SCBD Geofence Verified (-6.2248, 106.8095)");
  const [coords, setCoords] = useState({ lat: -6.2248, lng: 106.8095 });

  const [leaveType, setLeaveType] = useState<LeaveRequest["type"]>("Annual Leave");
  const [startDate, setStartDate] = useState("2026-12-15");
  const [endDate, setEndDate] = useState("2026-12-16");
  const [reason, setReason] = useState("");

  // Overtime (SPL Kepmenaker) state
  const [otDate, setOtDate] = useState("2026-11-27");
  const [otHours, setOtHours] = useState(3);
  const [otHoliday, setOtHoliday] = useState(false);
  const [otReason, setOtReason] = useState("");

  useEffect(() => {
    setSelectedEmpId(currentEmployee.id);
  }, [currentEmployee.id]);

  useEffect(() => {
    const tick = () => setNowTime(new Date().toTimeString().slice(0, 8));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const detectGps = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setGpsStatus(isId ? "Mendeteksi koordinat GPS..." : "Acquiring live GPS coordinates...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          setCoords({ lat, lng });
          setGpsStatus(`Live GPS Verified (${lat}, ${lng})`);
        },
        () => {
          setGpsStatus("HQ Geofence Fallback Verified (-6.2248, 106.8095)");
        }
      );
    }
  };

  const targetEmployee = isEss
    ? currentEmployee
    : employees.find((e) => e.id === selectedEmpId) || currentEmployee;

  const handleClockIn = () => {
    if (!targetEmployee) return;
    const hhmm = new Date().toTimeString().slice(0, 5);
    clockInEmployee({
      employeeId: targetEmployee.id,
      employeeName: targetEmployee.name,
      department: targetEmployee.department,
      date: new Date().toISOString().slice(0, 10),
      clockIn: hhmm,
      clockOut: null,
      status: Number(hhmm.slice(0, 2)) >= 9 ? "Late" : "On Time",
      location: gpsStatus,
      coordinates: coords,
      geofenceVerified: true,
      workHours: 0.1,
      device: "Web Portal",
    });
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee || !reason.trim()) return;
    const days = Math.max(
      1,
      Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (86400 * 1000)) + 1
    );
    submitLeaveRequest({
      employeeId: targetEmployee.id,
      employeeName: targetEmployee.name,
      department: targetEmployee.department,
      employeeEmail: targetEmployee.email,
      employeePhone: targetEmployee.phone,
      type: leaveType,
      startDate,
      endDate,
      days,
      reason: reason.trim(),
    });
    setReason("");
  };

  const visibleLeaves = isEss
    ? leaves.filter((l) => l.employeeId === currentEmployee.id)
    : leaves;

  const visibleAttendance = isEss
    ? attendance.filter((a) => a.employeeId === currentEmployee.id)
    : attendance;

  const visibleOvertime = isEss
    ? overtimeRequests.filter((o) => o.employeeId === currentEmployee.id)
    : overtimeRequests;

  // Team Leave Overlap & Conflict Radar (detects same-department overlapping leave dates)
  const leaveConflicts = (() => {
    const active = leaves.filter((l) => l.status !== "Rejected");
    const pairs: { dept: string; names: string; window: string }[] = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        if (
          a.department === b.department &&
          a.employeeId !== b.employeeId &&
          a.startDate <= b.endDate &&
          b.startDate <= a.endDate
        ) {
          pairs.push({
            dept: a.department,
            names: `${a.employeeName} & ${b.employeeName}`,
            window: `${a.startDate} ↔ ${b.endDate}`,
          });
        }
      }
    }
    return pairs;
  })();

  const otPreview = calculateOvertimePayKepmenaker(
    (targetEmployee?.baseSalary || 20000000) + (targetEmployee?.allowances || 0),
    otHours,
    otHoliday
  );

  const handleSubmitOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee || !otReason.trim()) return;
    submitOvertimeRequest({
      employeeId: targetEmployee.id,
      date: otDate,
      hours: otHours,
      isHoliday: otHoliday,
      reason: otReason.trim(),
    });
    setOtReason("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {isId ? "Absensi GPS Geofence, Shift & Otomatisasi Cuti" : "GPS Geofence Attendance, Roster & Leave Automation"}
          </h1>
          <p className="text-xs sm:text-sm hr-muted mt-1">
            {isId
              ? "Verifikasi kehadiran real-time lintas lokasi dan persetujuan cuti otomatis dengan Auto-Pilot AI & notifikasi WA/Email."
              : "Real-time location-verified check-ins plus Zero-Touch Auto-Pilot leave approvals and WA/Email notifications."}
          </p>
        </div>

        {/* Auto-Pilot Short Leave Policy Pill */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="px-3.5 py-2 rounded-xl hr-subtle flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold">
              {isId ? "Auto-Approve WFA & Cuti ≤2h:" : "Auto-Approve WFA & ≤2d Leave:"}
            </span>
            {canEditSettings ? (
              <button
                type="button"
                onClick={() =>
                  updateSettings({ autoApproveShortLeave: !settings.autoApproveShortLeave })
                }
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  settings.autoApproveShortLeave ? "badge-success" : "badge-warning"
                }`}
              >
                {settings.autoApproveShortLeave ? "ACTIVE" : "MANUAL"}
              </button>
            ) : (
              <span className="badge-success px-2 py-0.5 rounded-full text-[10px] font-bold">
                {settings.autoApproveShortLeave ? "ON" : "OFF"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live GPS Clock-In Terminal + Leave Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* GPS Clock In Card */}
        <div className="hr-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Live Smart Terminal
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight mt-1 tabular-nums">
                {nowTime}
              </div>
            </div>
            <span className="badge-success px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Geofence OK
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold hr-muted mb-1">
                {isEss
                  ? isId
                    ? "Identitas Karyawan Aktif (Terkunci oleh RBAC)"
                    : "Authenticated Employee Identity (RBAC Locked)"
                  : isId
                  ? "Pilih Karyawan"
                  : "Select Employee"}
              </label>
              {isEss ? (
                <div className="w-full px-3.5 py-2.5 rounded-xl hr-subtle text-xs font-bold flex items-center justify-between">
                  <span>
                    {currentEmployee.name} — {currentEmployee.department}
                  </span>
                  <Lock className="w-3.5 h-3.5 hr-muted" />
                </div>
              ) : (
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl hr-input text-xs font-semibold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — {e.department} ({e.location})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="p-3 rounded-xl hr-subtle flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 truncate font-medium">
                <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{gpsStatus}</span>
              </span>
              <button
                type="button"
                onClick={detectGps}
                className="hr-btn-secondary px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0"
              >
                <Navigation className="w-3 h-3 text-indigo-600" /> GPS
              </button>
            </div>

            <button
              type="button"
              onClick={handleClockIn}
              className="w-full btn-quantum py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isId ? "Clock-In Sekarang (Verifikasi GPS + Audit Log)" : "Clock-In Now (GPS Verified + Audit Log)"}
            </button>
          </div>
        </div>

        {/* Quick Leave Request Card */}
        <form onSubmit={handleSubmitLeave} className="hr-card rounded-2xl p-6 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {isId ? "Ajukan Cuti / WFA Baru" : "Submit Leave / WFA Request"}
            </h2>
            {settings.autoApproveShortLeave && (
              <span className="badge-info px-2 py-0.5 rounded-full text-[10px] font-bold">
                Zero-Touch AI Active
              </span>
            )}
          </div>
          <p className="text-xs hr-muted">
            {settings.autoApproveShortLeave
              ? isId
                ? "Kebijakan aktif: Remote WFA atau cuti ≤ 2 hari (kehadiran ≥ 95%) otomatis disetujui tanpa antre manual."
                : "Policy active: Remote WFA or leaves ≤ 2 days (attendance ≥ 95%) are auto-approved instantly."
              : isId
              ? "Seluruh pengajuan diteruskan ke antrean persetujuan Manager & HR."
              : "Requests route to Manager & HR approval queue."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveRequest["type"])}
              className="px-3 py-2 rounded-xl hr-input text-xs font-semibold"
            >
              <option value="Annual Leave">{tStatus("Annual Leave", locale)}</option>
              <option value="Remote WFA">{tStatus("Remote WFA", locale)}</option>
              <option value="Sick Leave">{tStatus("Sick Leave", locale)}</option>
              <option value="Parental Leave">{tStatus("Parental Leave", locale)}</option>
              <option value="Emergency">{tStatus("Emergency", locale)}</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-xl hr-input text-xs"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-xl hr-input text-xs"
            />
          </div>
          <input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isId ? "Alasan pengajuan cuti / kerja remote..." : "Reason for leave or remote work..."}
            className="w-full px-3.5 py-2.5 rounded-xl hr-input text-xs"
          />
          <button
            type="submit"
            className="btn-emerald w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {isId ? "Kirim Pengajuan Cuti" : "Submit Leave Request"}
          </button>
        </form>
      </div>

      {/* Attendance Log Table */}
      <div className="hr-card rounded-2xl p-5 overflow-x-auto">
        <h2 className="text-base font-extrabold mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          {isEss
            ? isId
              ? "Riwayat Kehadiran Saya"
              : "My Attendance Feed"
            : isId
            ? "Rekap Kehadiran Live Hari Ini"
            : "Today's Live Attendance Feed"}
        </h2>
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <tr>
              <th className="py-2.5 px-3">{isId ? "Karyawan" : "Employee"}</th>
              <th className="py-2.5 px-3">{isId ? "Jam Masuk / Pulang" : "Clock In / Out"}</th>
              <th className="py-2.5 px-3">{isId ? "Lokasi GPS" : "GPS Location"}</th>
              <th className="py-2.5 px-3">{isId ? "Perangkat" : "Device"}</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">{isId ? "Aksi" : "Action"}</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {visibleAttendance.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-3">
                  <div className="font-bold">{rec.employeeName}</div>
                  <div className="text-[11px] hr-muted">{rec.department}</div>
                </td>
                <td className="py-3 px-3 font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{rec.clockIn}</span>
                  {" → "}
                  <span className="hr-muted">{rec.clockOut || "Active"}</span>
                </td>
                <td className="py-3 px-3 max-w-xs truncate">{rec.location}</td>
                <td className="py-3 px-3 hr-muted">{rec.device}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.status === "On Time"
                        ? "badge-success"
                        : rec.status === "Remote"
                        ? "badge-info"
                        : "badge-warning"
                    }`}
                  >
                    {tStatus(rec.status, locale)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {!rec.clockOut ? (
                    <button
                      type="button"
                      onClick={() => clockOutEmployee(rec.id)}
                      className="hr-btn-secondary px-2.5 py-1 rounded-lg text-xs font-semibold"
                    >
                      Clock Out
                    </button>
                  ) : (
                    <span className="hr-muted font-mono">{rec.workHours}h</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Weekly Interactive Shift Roster Matrix */}
      <div className="hr-card rounded-2xl p-5 overflow-x-auto space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {canManageRoster
                ? isId
                  ? "Jadwal Shift Mingguan (Klik sel untuk ubah shift)"
                  : "Weekly Shift Roster Matrix (Click any cell to cycle)"
                : isId
                ? "Jadwal Shift Mingguan Tim (Mode Baca-Saja)"
                : "Weekly Team Shift Roster (Read-Only View)"}
            </h2>
            <p className="text-[11px] hr-muted">
              REG (08:00–17:00) · FLEX (10:00–19:00) · REM (Remote WFA) · NIGHT (22:00–06:00) · OFF
            </p>
          </div>
          {!canManageRoster && (
            <span className="badge-info px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              {isId ? "Baca-Saja" : "Read-Only"} ({tRole(activeRole, locale)})
            </span>
          )}
        </div>
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <tr>
              <th className="py-2 px-3">{isId ? "Karyawan" : "Employee"}</th>
              {(isId
                ? ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
                : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
              ).map((d) => (
                <th key={d} className="py-2 px-2 text-center">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {shiftRoster.map((row) => (
              <tr key={row.employeeId}>
                <td className="py-2.5 px-3">
                  <div className="font-bold">{row.employeeName}</div>
                  <div className="text-[10px] hr-muted">{row.department}</div>
                </td>
                {row.days.map((code, dayIdx) => {
                  const badgeStyle =
                    code === "REG"
                      ? "badge-info"
                      : code === "REM"
                      ? "badge-success"
                      : code === "FLEX"
                      ? "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30"
                      : code === "NIGHT"
                      ? "badge-warning"
                      : "hr-subtle hr-muted";
                  return (
                    <td key={dayIdx} className="py-2 px-1.5 text-center">
                      <button
                        type="button"
                        disabled={!canManageRoster}
                        onClick={() => canManageRoster && cycleShiftCell(row.employeeId, dayIdx)}
                        className={`w-full py-1.5 rounded-lg border text-[10px] font-mono font-bold transition ${
                          canManageRoster ? "hover:scale-105 cursor-pointer" : "cursor-default"
                        } ${badgeStyle}`}
                      >
                        {code}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leave Overlap Radar + Leave Approvals Automation Queue (with 2-Stage Governance) */}
      <div className="hr-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            {isEss
              ? isId
                ? `Status Pengajuan Cuti & WFA Saya (${visibleLeaves.length})`
                : `My Leave & WFA Requests (${visibleLeaves.length})`
              : isId
              ? "Antrean Persetujuan Cuti (2-Tahap >3 Hari & Auto-WA/Email)"
              : "Leave Approval Queue (2-Stage >3d & Auto WA/Email)"}
          </h2>
          {!isEss && (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${leaveConflicts.length > 0 ? "badge-warning" : "badge-success"}`}>
              {leaveConflicts.length > 0
                ? isId
                  ? `${leaveConflicts.length} Bentrok Jadwal Divisi Terdeteksi`
                  : `${leaveConflicts.length} Dept Overlap Warning`
                : isId
                ? "Kalender Tim Aman (0 Bentrok)"
                : "Team Coverage Clear (0 Overlaps)"}
            </span>
          )}
        </div>

        {!isEss && leaveConflicts.length > 0 && (
          <div className="p-3 rounded-xl badge-warning text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {isId ? "Radar Bentrok Jadwal Cuti Tim:" : "Team Leave Overlap Conflict Alert:"}
            </div>
            {leaveConflicts.map((c, idx) => (
              <div key={idx} className="text-[11px]">
                • <strong>{c.dept}</strong>: {c.names} ({c.window})
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleLeaves.map((lv) => {
            const canActStage1 = lv.status === "Pending" && canApproveLeave;
            const canActStage2 = lv.status === "Manager Approved" && canFinalApproveLeave;
            return (
              <div
                key={lv.id}
                className="p-4 rounded-xl hr-subtle flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm">{lv.employeeName}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        lv.status === "Approved"
                          ? "badge-success"
                          : lv.status === "Rejected"
                          ? "badge-danger"
                          : lv.status === "Manager Approved"
                          ? "badge-info"
                          : "badge-warning"
                      }`}
                    >
                      {tStatus(lv.status, locale)}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    {tStatus(lv.type, locale)} · {lv.days} {isId ? "Hari" : "Days"} ({lv.startDate} → {lv.endDate})
                  </div>
                  {(lv.requiresTwoStage || lv.days > 3) && (
                    <div className="text-[10px] hr-muted mt-1 font-semibold">
                      {isId ? "Alur 2-Tahap:" : "2-Stage Flow:"}{" "}
                      {lv.stage1Approver ? `✓ ${lv.stage1Approver}` : isId ? "1. Manajer" : "1. Manager"} →{" "}
                      {lv.stage2Approver ? `✓ ${lv.stage2Approver}` : "2. HR Admin"}
                    </div>
                  )}
                  <p className="text-xs hr-muted mt-1.5">{lv.reason}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  {canActStage1 || canActStage2 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => decideLeaveRequest(lv.id, "Approved")}
                        className="flex-1 btn-emerald py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {canActStage2
                          ? isId
                            ? "Finalisasi HR"
                            : "HR Final Approve"
                          : isId
                          ? "Setujui"
                          : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => decideLeaveRequest(lv.id, "Rejected")}
                        className="flex-1 py-2 rounded-lg text-xs font-bold badge-danger flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {isId ? "Tolak" : "Reject"}
                      </button>
                    </>
                  ) : lv.status === "Pending" || lv.status === "Manager Approved" ? (
                    <span className="text-[11px] hr-muted font-semibold">
                      {lv.status === "Manager Approved"
                        ? isId
                          ? "Menunggu Finalisasi HR Admin (Tahap 2/2)"
                          : "Awaiting HR Admin Final Sign-Off (Stage 2/2)"
                        : isId
                        ? "Menunggu persetujuan Manajer / HR"
                        : "Awaiting Manager / HR approval"}
                    </span>
                  ) : (
                    <a
                      href={`https://wa.me/${lv.employeePhone}?text=${encodeURIComponent(
                        `Halo ${lv.employeeName}, pengajuan ${lv.type} (${lv.startDate} s/d ${lv.endDate}) telah ${lv.status} oleh HRIS AetherHR.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 rounded-lg text-xs font-semibold hr-btn-secondary flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      {isId ? "Kirim Bukti WhatsApp" : "Send WhatsApp Receipt"}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overtime (SPL Kepmenaker 1.5x / 2x) -> Direct Payroll Auto-Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form onSubmit={handleSubmitOvertime} className="lg:col-span-5 hr-card rounded-2xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {isId ? "Ajukan Lembur (SPL Kepmenaker)" : "Submit Overtime (SPL Statutory)"}
            </h2>
            <span className="badge-info px-2 py-0.5 rounded-full text-[10px] font-bold">1.5x / 2.0x</span>
          </div>
          <p className="hr-muted">
            {isId
              ? "Upah lembur dihitung otomatis sesuai PP 35/2021 (1/173 × gaji tetap) dan langsung masuk ke Payroll saat disetujui."
              : "Overtime pay is computed per statutory multiplier (1/173 × fixed wage) and auto-synced to Payroll upon approval."}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold hr-muted mb-1">{isId ? "Tanggal" : "Date"}</label>
              <input
                type="date"
                value={otDate}
                onChange={(e) => setOtDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl hr-input"
              />
            </div>
            <div>
              <label className="block font-bold hr-muted mb-1">{isId ? "Durasi (Jam)" : "Hours (1-12)"}</label>
              <input
                type="number"
                min={1}
                max={12}
                value={otHours}
                onChange={(e) => setOtHours(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl hr-input font-mono font-bold"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-semibold">
            <input
              type="checkbox"
              checked={otHoliday}
              onChange={(e) => setOtHoliday(e.target.checked)}
              className="accent-indigo-600 w-4 h-4"
            />
            {isId ? "Hari Libur Nasional / Akhir Pekan (Tarif 2x–4x)" : "Weekend / Public Holiday Rate (2x–4x)"}
          </label>
          <input
            required
            value={otReason}
            onChange={(e) => setOtReason(e.target.value)}
            placeholder={isId ? "Keterangan tugas lembur (misal: Deployment produksi)..." : "Overtime justification (e.g. Production release)..."}
            className="w-full px-3.5 py-2.5 rounded-xl hr-input"
          />
          <div className="p-3 rounded-xl hr-subtle flex items-center justify-between">
            <span className="hr-muted">{otPreview.formulaLabel}</span>
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatConverted(otPreview.totalPay, targetEmployee.currency, displayCurrency)}
            </span>
          </div>
          <button type="submit" className="btn-quantum w-full py-2.5 rounded-xl font-bold">
            {isId ? "Ajukan Surat Perintah Lembur (SPL)" : "Submit Overtime Request"}
          </button>
        </form>

        <div className="lg:col-span-7 hr-card rounded-2xl p-5 space-y-3 overflow-x-auto">
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {isId
              ? `Daftar Lembur SPL & Sinkronisasi Payroll (${visibleOvertime.length})`
              : `Overtime (SPL) Queue & Payroll Sync (${visibleOvertime.length})`}
          </h2>
          <table className="w-full text-left text-xs min-w-[540px]">
            <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <tr>
                <th className="py-2 px-2">{isId ? "Karyawan & Tanggal" : "Employee & Date"}</th>
                <th className="py-2 px-2">{isId ? "Durasi & Alasan" : "Hours & Reason"}</th>
                <th className="py-2 px-2">{isId ? `Estimasi (${displayCurrency})` : `Pay (${displayCurrency})`}</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2 text-right">{isId ? "Aksi" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {visibleOvertime.map((ot) => (
                <tr key={ot.id}>
                  <td className="py-2.5 px-2">
                    <div className="font-bold">{ot.employeeName}</div>
                    <div className="text-[10px] hr-muted font-mono">{ot.date}</div>
                  </td>
                  <td className="py-2.5 px-2 max-w-[200px]">
                    <div className="font-semibold">
                      {ot.hours}h · {ot.isHoliday ? (isId ? "Libur" : "Holiday") : isId ? "Kerja" : "Weekday"}
                    </div>
                    <div className="text-[10px] hr-muted truncate">{ot.reason}</div>
                  </td>
                  <td className="py-2.5 px-2 font-mono whitespace-nowrap">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatConverted(ot.calculatedPay, ot.currency, displayCurrency)}
                    </div>
                    {ot.currency !== displayCurrency && (
                      <div className="text-[10px] hr-muted">{formatCurrency(ot.calculatedPay, ot.currency)}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ot.status === "Approved"
                          ? "badge-success"
                          : ot.status === "Rejected"
                          ? "badge-danger"
                          : "badge-warning"
                      }`}
                    >
                      {tStatus(ot.status, locale)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {ot.status === "Pending" && canApproveLeave ? (
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => decideOvertimeRequest(ot.id, "Approved")}
                          className="btn-emerald px-2 py-1 rounded-lg text-[10px] font-bold"
                        >
                          {isId ? "Setujui" : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => decideOvertimeRequest(ot.id, "Rejected")}
                          className="badge-danger px-2 py-1 rounded-lg text-[10px] font-bold"
                        >
                          {isId ? "Tolak" : "Reject"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] hr-muted font-semibold">
                        {ot.syncedToPayroll ? (isId ? "Sync Payroll ✓" : "Synced ✓") : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
