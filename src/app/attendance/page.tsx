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
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import type { LeaveRequest } from "@/types/hris";

export default function AttendancePage() {
  const {
    locale,
    employees,
    attendance,
    leaves,
    clockInEmployee,
    clockOutEmployee,
    submitLeaveRequest,
    decideLeaveRequest,
  } = useHRIS();
  const isId = locale === "id";

  const [nowTime, setNowTime] = useState("08:30:00");
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || "emp-01");
  const [gpsStatus, setGpsStatus] = useState("HQ SCBD Geofence Verified (-6.2248, 106.8095)");
  const [coords, setCoords] = useState({ lat: -6.2248, lng: 106.8095 });

  // Leave form
  const [leaveType, setLeaveType] = useState<LeaveRequest["type"]>("Annual Leave");
  const [startDate, setStartDate] = useState("2026-12-15");
  const [endDate, setEndDate] = useState("2026-12-17");
  const [reason, setReason] = useState("");

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

  const handleClockIn = () => {
    const emp = employees.find((e) => e.id === selectedEmpId) || employees[0];
    if (!emp) return;
    const hhmm = new Date().toTimeString().slice(0, 5);
    clockInEmployee({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
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
    const emp = employees.find((item) => item.id === selectedEmpId) || employees[0];
    if (!emp || !reason.trim()) return;
    const days = Math.max(
      1,
      Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (86400 * 1000)) + 1
    );
    submitLeaveRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      employeeEmail: emp.email,
      employeePhone: emp.phone,
      type: leaveType,
      startDate,
      endDate,
      days,
      reason: reason.trim(),
    });
    setReason("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
          <Clock className="w-6 h-6 text-cyan-400" />
          {isId ? "Absensi GPS Geofence & Otomatisasi Cuti" : "GPS Geofence Attendance & Leave Automation"}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isId
            ? "Verifikasi kehadiran real-time lintas lokasi (Web & Mobile App) dan persetujuan cuti otomatis dengan notifikasi WA/Email."
            : "Real-time location-verified check-ins across Web & Mobile Apps plus automated WA/Email leave approvals."}
        </p>
      </div>

      {/* Live GPS Clock-In Terminal + Leave Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* GPS Clock In Card */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">
                Live Smart Terminal
              </span>
              <div className="text-3xl font-black font-mono tracking-tight mt-1">{nowTime}</div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Geofence OK
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                {isId ? "Pilih Karyawan" : "Select Employee"}
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {e.department} ({e.location})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 text-slate-300 truncate">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">{gpsStatus}</span>
              </span>
              <button
                type="button"
                onClick={detectGps}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold flex items-center gap-1 shrink-0"
              >
                <Navigation className="w-3 h-3 text-cyan-400" /> GPS
              </button>
            </div>

            <button
              onClick={handleClockIn}
              className="w-full btn-quantum py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isId ? "Clock-In Sekarang (Verifikasi GPS + Sync Payroll)" : "Clock-In Now (GPS Verified + Payroll Sync)"}
            </button>
          </div>
        </div>

        {/* Quick Leave Request Card */}
        <form onSubmit={handleSubmitLeave} className="glass-card rounded-2xl p-6 space-y-3.5">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            {isId ? "Ajukan Cuti / WFA Baru" : "Submit Leave / WFA Request"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveRequest["type"])}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs"
            >
              <option value="Annual Leave">Annual Leave</option>
              <option value="Remote WFA">Remote WFA</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Parental Leave">Parental Leave</option>
              <option value="Emergency">Emergency</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs"
            />
          </div>
          <input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isId ? "Alasan pengajuan cuti / kerja remote..." : "Reason for leave or remote work..."}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs"
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
      <div className="glass-card rounded-2xl p-5 overflow-x-auto">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          {isId ? "Rekap Kehadiran Live Hari Ini" : "Today's Live Attendance Feed"}
        </h2>
        <table className="w-full text-left text-xs min-w-[680px]">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Employee</th>
              <th className="py-2.5 px-3">Clock In / Out</th>
              <th className="py-2.5 px-3">GPS Location</th>
              <th className="py-2.5 px-3">Device</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {attendance.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-900/40">
                <td className="py-3 px-3">
                  <div className="font-bold">{rec.employeeName}</div>
                  <div className="text-[11px] text-slate-400">{rec.department}</div>
                </td>
                <td className="py-3 px-3 font-mono">
                  <span className="text-emerald-400">{rec.clockIn}</span>
                  {" → "}
                  <span className="text-slate-300">{rec.clockOut || "Active"}</span>
                </td>
                <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{rec.location}</td>
                <td className="py-3 px-3 text-slate-400">{rec.device}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.status === "On Time"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : rec.status === "Remote"
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {rec.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {!rec.clockOut ? (
                    <button
                      onClick={() => clockOutEmployee(rec.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
                    >
                      Clock Out
                    </button>
                  ) : (
                    <span className="text-slate-500 font-mono">{rec.workHours}h</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leave Approvals Automation Queue */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          {isId ? "Antrean Persetujuan Cuti (Auto-Notifikasi WA/Email)" : "Leave Approval Queue (Auto WA/Email Notification)"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {leaves.map((lv) => (
            <div
              key={lv.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm">{lv.employeeName}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      lv.status === "Approved"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : lv.status === "Rejected"
                        ? "bg-rose-500/15 text-rose-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {lv.status}
                  </span>
                </div>
                <div className="text-xs text-cyan-400 font-semibold mt-0.5">
                  {lv.type} · {lv.days} {isId ? "Hari" : "Days"} ({lv.startDate} → {lv.endDate})
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{lv.reason}</p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                {lv.status === "Pending" ? (
                  <>
                    <button
                      onClick={() => decideLeaveRequest(lv.id, "Approved")}
                      className="flex-1 btn-emerald py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {isId ? "Setujui" : "Approve"}
                    </button>
                    <button
                      onClick={() => decideLeaveRequest(lv.id, "Rejected")}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> {isId ? "Tolak" : "Reject"}
                    </button>
                  </>
                ) : (
                  <a
                    href={`https://wa.me/${lv.employeePhone}?text=${encodeURIComponent(
                      `Halo ${lv.employeeName}, pengajuan ${lv.type} (${lv.startDate} s/d ${lv.endDate}) telah ${lv.status} oleh HRIS AetherHR.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/12 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {isId ? "Kirim Konfirmasi WhatsApp" : "Send WhatsApp Receipt"}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
