"use client";

import React, { useMemo, useState } from "react";
import {
  Wallet,
  Play,
  Printer,
  Download,
  MessageCircle,
  CheckCircle2,
  X,
  Globe2,
  Calculator,
  Sparkles,
  Send,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { calculateEmployeePayslip, formatCurrency } from "@/lib/payroll-engine";
import { convertCurrency, formatConverted } from "@/lib/currency";
import { tRole, tStatus } from "@/lib/i18n";
import type { PayslipItem } from "@/types/hris";

export default function PayrollPage() {
  const {
    locale,
    displayCurrency,
    activeRole,
    selectedEntity,
    currentEmployee,
    hasPermission,
    recordAuditLog,
    employees,
    expenses,
    payrollRuns,
    addPayrollRun,
    broadcastAllPayslips,
    pushToast,
  } = useHRIS();
  const isId = locale === "id";

  const canViewAllPayroll = hasPermission("payroll:view_all");
  const canRunPayroll = hasPermission("payroll:run");

  const [running, setRunning] = useState(false);
  const [period, setPeriod] = useState("2026-12");
  const [selectedSlip, setSelectedSlip] = useState<PayslipItem | null>(null);
  const activeRun = payrollRuns[0];

  const approvedReimbursements = expenses.filter((e) => e.syncedToPayroll);
  const reimbursementMap = approvedReimbursements.reduce<Record<string, number>>((acc, ex) => {
    const emp = employees.find((e) => e.id === ex.employeeId);
    if (emp) {
      acc[emp.id] = (acc[emp.id] || 0) + convertCurrency(ex.amount, ex.currency, emp.currency);
    }
    return acc;
  }, {});

  const personalSlip = useMemo(() => {
    const fromRun = activeRun?.items.find((i) => i.employeeId === currentEmployee.id);
    if (fromRun) return fromRun;
    return calculateEmployeePayslip(currentEmployee, 0, reimbursementMap[currentEmployee.id] || 0);
  }, [activeRun, currentEmployee, reimbursementMap]);

  const visibleItems = useMemo(() => {
    if (!activeRun) return [];
    if (!canViewAllPayroll) {
      return [personalSlip];
    }
    return activeRun.items.filter((item) => {
      if (selectedEntity === "ALL") return true;
      const emp = employees.find((e) => e.id === item.employeeId);
      if (!emp) return true;
      if (selectedEntity === "Europe") {
        return emp.country === "Germany" || emp.country === "United Kingdom";
      }
      return emp.country === selectedEntity;
    });
  }, [activeRun, canViewAllPayroll, employees, personalSlip, selectedEntity]);

  const handleRunPayroll = async () => {
    if (!canRunPayroll) return;
    setRunning(true);
    try {
      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees, period, bonusMap: reimbursementMap }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      addPayrollRun(data.payrollRun);
    } catch (err) {
      pushToast({
        title: isId ? "Gagal Menjalankan Payroll" : "Payroll Error",
        description: err instanceof Error ? err.message : "Failed to run payroll",
        variant: "error",
      });
    } finally {
      setRunning(false);
    }
  };

  const exportPayrollCsv = () => {
    if (!activeRun || !canRunPayroll) return;
    const headers = [
      "Code",
      "Name",
      "Dept",
      "NativeCurrency",
      "GrossNative",
      "NetNative",
      `Net_${displayCurrency}`,
      "TaxRule",
    ];
    const rows = visibleItems.map((i) => [
      i.employeeCode,
      `"${i.employeeName}"`,
      `"${i.department}"`,
      i.currency,
      i.grossSalary,
      i.netSalary,
      convertCurrency(i.netSalary, i.currency, displayCurrency),
      `"${i.taxRateLabel}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aetherhr-payroll-${activeRun.period}-${displayCurrency}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    recordAuditLog({
      module: "Payroll & Tax",
      action: "payroll.erp_csv_exported",
      target: `Period ${activeRun.period} (${visibleItems.length} rows in ${displayCurrency})`,
      severity: "CRITICAL",
      detail: `Exported confidential payroll journal CSV (${displayCurrency}).`,
    });
    pushToast({
      title: isId ? "Jurnal Payroll CSV Diunduh" : "Payroll CSV Exported",
      description: isId
        ? `${visibleItems.length} slip gaji diekspor (${displayCurrency}).`
        : `${visibleItems.length} payslips exported (${displayCurrency}).`,
      variant: "success",
    });
  };

  const handleOpenSlip = (item: PayslipItem) => {
    recordAuditLog({
      module: "Payroll & Tax",
      action: "payslip.viewed",
      target: `${item.employeeName} (${activeRun?.period || period})`,
      severity: item.employeeId === currentEmployee.id ? "INFO" : "SENSITIVE",
      detail: `Viewed confidential digital payslip (${item.currency}).`,
    });
    setSelectedSlip(item);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {canViewAllPayroll
              ? isId
                ? `Mesin Payroll Multi-Mata Uang & PPh 21 TER (${displayCurrency})`
                : `Global Multi-Currency Payroll & Tax Engine (${displayCurrency})`
              : isId
              ? `Brankas Slip Gaji Pribadi (${currentEmployee.name})`
              : `Personal Confidential Payslip Vault (${currentEmployee.name})`}
          </h1>
          <p className="text-xs sm:text-sm hr-muted mt-1">
            {canViewAllPayroll
              ? isId
                ? `Seluruh total konsolidasi otomatis dikonversi ke mata uang tampilan aktif (${displayCurrency}), lengkap dengan PPh 21 TER, BPJS, CPF & FICA.`
                : `All consolidated totals automatically synchronize to your active display currency (${displayCurrency}), with PPh 21 TER, BPJS, CPF & FICA.`
              : isId
              ? `Mode Self-Service Terproteksi RBAC: Hanya menampilkan rincian gaji, potongan pajak, dan slip PDF milik Anda (${displayCurrency}).`
              : `RBAC-Scoped Self-Service Mode: Displays strictly your own earnings, statutory deductions, and PDF payslips (${displayCurrency}).`}
          </p>
        </div>

        {canRunPayroll ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl hr-input text-xs font-mono font-semibold"
            />
            <button
              type="button"
              onClick={exportPayrollCsv}
              className="hr-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> ERP CSV ({displayCurrency})
            </button>
            {activeRun && (
              <button
                type="button"
                onClick={() => broadcastAllPayslips(activeRun.period, visibleItems.length)}
                className="btn-emerald px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isId ? "Broadcast Slip (WA+Email)" : "Broadcast All Payslips"}
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleRunPayroll()}
              disabled={running}
              className="btn-quantum px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60"
            >
              <Play className="w-4 h-4" />
              {running
                ? isId
                  ? "Menghitung Pajak..."
                  : "Computing Taxes..."
                : isId
                ? "Jalankan Auto-Payroll"
                : "Run Automated Payroll"}
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl badge-info text-xs font-bold self-start lg:self-auto">
            <Lock className="w-3.5 h-3.5" />
            {tRole(activeRole, locale)} ·{" "}
            {isId ? "Gaji Rekan Kerja Disembunyikan" : "Peer Salaries Protected"}
          </div>
        )}
      </div>

      {/* Approved Reimbursements Sync Banner */}
      {canViewAllPayroll && approvedReimbursements.length > 0 && (
        <div className="p-3.5 rounded-2xl badge-success flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {isId
              ? `${approvedReimbursements.length} klaim reimbursement disetujui siap dikonversi kurs & digabungkan otomatis pada eksekusi Payroll berikutnya.`
              : `${approvedReimbursements.length} approved expense claims are queued for FX-converted merge on the next Payroll Run.`}
          </span>
        </div>
      )}

      {/* Summary Strip Synchronized to displayCurrency */}
      {canViewAllPayroll && activeRun ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">
              {isId ? "Periode Payroll Aktif" : "Active Payroll Period"}
            </div>
            <div className="text-2xl font-extrabold mt-1 text-indigo-600 dark:text-indigo-400">
              {activeRun.period}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {tStatus(activeRun.status, locale)} ·{" "}
              {visibleItems.length} {isId ? "Karyawan" : "Staff"}
            </div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">
              {isId ? `Total Gaji Kotor (${displayCurrency})` : `Consolidated Gross (${displayCurrency})`}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold mt-1 tabular-nums truncate">
              {formatConverted(activeRun.totalGrossUSD, "USD", displayCurrency)}
            </div>
            <div className="text-[11px] hr-muted mt-1 flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
              {isId ? "Konsolidasi 5 Mata Uang" : "5 Currencies Consolidated"}
            </div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">
              {isId ? `Total Gaji Bersih (${displayCurrency})` : `Consolidated Net Payout (${displayCurrency})`}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
              {formatConverted(activeRun.totalNetUSD, "USD", displayCurrency)}
            </div>
            <div className="text-[11px] hr-muted mt-1">
              {isId ? "Pencairan Otomatis via Bank API" : "Auto-disbursed via Bank API"}
            </div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">
              {isId ? "Mesin Pajak & Kepatuhan" : "Compliance Engines Active"}
            </div>
            <div className="text-base font-extrabold mt-1 text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> PPh 21 TER + BPJS + CPF
            </div>
            <div className="text-[11px] hr-muted mt-1">
              {isId ? "PP 58/2023 & Pajak Internasional" : "PP 58/2023 & Global Statutory"}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">
              {isId ? `Gaji Kotor Saya (${displayCurrency})` : `Personal Gross (${displayCurrency})`}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold mt-1 tabular-nums">
              {formatConverted(personalSlip.grossSalary, personalSlip.currency, displayCurrency)}
            </div>
            <div className="text-[11px] hr-muted mt-1">{personalSlip.taxRateLabel}</div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">
              {isId ? `Potongan Pajak & BPJS (${displayCurrency})` : `Statutory Deductions (${displayCurrency})`}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold mt-1 text-rose-600 dark:text-rose-400 tabular-nums">
              -{formatConverted(personalSlip.incomeTax + personalSlip.bpjsHealth + personalSlip.bpjsEmployment, personalSlip.currency, displayCurrency)}
            </div>
            <div className="text-[11px] hr-muted mt-1">
              {isId ? "Dihitung otomatis sesuai PTKP" : "Auto-calculated & verified"}
            </div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">
              {isId ? `Gaji Bersih Diterima (${displayCurrency})` : `Net Take-Home (${displayCurrency})`}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatConverted(personalSlip.netSalary, personalSlip.currency, displayCurrency)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isId ? "Brankas Rahasia Karyawan" : "Confidential ESS Vault"}
            </div>
          </div>
        </div>
      )}

      {/* Payslips Table */}
      <div className="hr-card rounded-2xl p-5 overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {canViewAllPayroll
              ? isId
                ? `Jurnal Slip Gaji Periode ${activeRun?.period || period}`
                : activeRun?.label || "Global Payroll Ledger"
              : isId
              ? "Rincian Slip Gaji Digital Saya"
              : "My Digital Payslip Statement"}
          </h2>
          {activeRun && (
            <span className="text-xs hr-muted font-mono">
              ID: {activeRun.id} · FX: {displayCurrency}
            </span>
          )}
        </div>
        <table className="w-full text-left text-xs min-w-[800px]">
          <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <tr>
              <th className="py-2.5 px-3">{isId ? "Karyawan" : "Employee"}</th>
              <th className="py-2.5 px-3">{isId ? "Gaji Kotor (Gross)" : "Gross Salary"}</th>
              <th className="py-2.5 px-3">{isId ? "Aturan Pajak & BPJS" : "Tax & Statutory Rule"}</th>
              <th className="py-2.5 px-3">{isId ? "Total Potongan" : "Deductions"}</th>
              <th className="py-2.5 px-3">
                {isId ? `Gaji Bersih (${displayCurrency})` : `Net Take-Home (${displayCurrency})`}
              </th>
              <th className="py-2.5 px-3 text-right">{isId ? "Slip & Kirim" : "Payslip & Dispatch"}</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {visibleItems.map((item) => {
              const emp = employees.find((e) => e.id === item.employeeId);
              const totalDed = item.incomeTax + item.bpjsHealth + item.bpjsEmployment;
              return (
                <tr key={item.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <div className="font-bold">{item.employeeName}</div>
                    <div className="text-[11px] hr-muted">
                      {item.employeeCode} · {item.department}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono whitespace-nowrap">
                    <div className="font-semibold">
                      {formatConverted(item.grossSalary, item.currency, displayCurrency)}
                    </div>
                    {item.currency !== displayCurrency && (
                      <div className="text-[10px] hr-muted">
                        ({formatCurrency(item.grossSalary, item.currency)})
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="badge-info px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {item.taxRateLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
                    -{formatConverted(totalDed, item.currency, displayCurrency)}
                  </td>
                  <td className="py-3 px-3 font-mono whitespace-nowrap">
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatConverted(item.netSalary, item.currency, displayCurrency)}
                    </div>
                    {item.currency !== displayCurrency && (
                      <div className="text-[10px] hr-muted">
                        {isId ? "Asli" : "Native"}: {formatCurrency(item.netSalary, item.currency)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenSlip(item)}
                        className="btn-quantum px-3 py-1.5 rounded-lg text-[11px] font-bold"
                      >
                        {isId ? "Slip PDF" : "Payslip"}
                      </button>
                      {canViewAllPayroll && emp && (
                        <a
                          href={`https://wa.me/${emp.phone}?text=${encodeURIComponent(
                            `Halo ${item.employeeName}, Slip Gaji periode ${activeRun?.period} telah diterbitkan!\nNet Take-Home: ${formatCurrency(
                              item.netSalary,
                              item.currency
                            )}\nRule: ${item.taxRateLabel}\n— AetherHR Global Payroll`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg badge-success"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Printable Executive Payslip Modal */}
      {selectedSlip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setSelectedSlip(null)}
        >
          <div
            className="w-full max-w-xl hr-card rounded-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                  {isId
                    ? "Slip Gaji Digital Rahasia · Terverifikasi"
                    : "Confidential Digital Payslip · Verified"}
                </div>
                <h2 className="text-lg font-extrabold mt-1">{selectedSlip.employeeName}</h2>
                <div className="text-xs hr-muted">
                  {selectedSlip.role} · {selectedSlip.employeeCode} ·{" "}
                  {isId ? "Periode" : "Period"} {activeRun?.period || period}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="no-print p-1.5 rounded-lg hr-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl hr-subtle space-y-2">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                  {isId ? "Pendapatan" : "Earnings"} ({displayCurrency})
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">{isId ? "Gaji Pokok" : "Base Salary"}</span>
                  <span className="font-mono font-semibold">
                    {formatConverted(selectedSlip.baseSalary, selectedSlip.currency, displayCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">{isId ? "Tunjangan & Reimburse" : "Allowances & Expenses"}</span>
                  <span className="font-mono font-semibold">
                    {formatConverted(selectedSlip.allowances, selectedSlip.currency, displayCurrency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold" style={{ borderColor: "var(--border-subtle)" }}>
                  <span>{isId ? "Total Bruto" : "Total Gross"}</span>
                  <span className="font-mono">
                    {formatConverted(selectedSlip.grossSalary, selectedSlip.currency, displayCurrency)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl hr-subtle space-y-2">
                <div className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                  {isId ? "Potongan Wajib" : "Statutory Deductions"} ({displayCurrency})
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">{isId ? "Pajak Penghasilan" : "Income Tax"}</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    -{formatConverted(selectedSlip.incomeTax, selectedSlip.currency, displayCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">{isId ? "BPJS Kesehatan" : "Health / BPJS Kes"}</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    -{formatConverted(selectedSlip.bpjsHealth, selectedSlip.currency, displayCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">{isId ? "BPJS TK / Pensiun" : "Pension / JHT / CPF"}</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    -{formatConverted(selectedSlip.bpjsEmployment, selectedSlip.currency, displayCurrency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl badge-success flex items-center justify-between">
              <div>
                <div className="text-xs font-bold">
                  {isId ? "Gaji Bersih Diterima (Take-Home Pay)" : "Net Take-Home Pay"}
                </div>
                <div className="text-[11px] opacity-80">{selectedSlip.taxRateLabel}</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-2xl font-extrabold">
                  {formatConverted(selectedSlip.netSalary, selectedSlip.currency, displayCurrency)}
                </div>
                {selectedSlip.currency !== displayCurrency && (
                  <div className="text-[11px] opacity-80">
                    ({formatCurrency(selectedSlip.netSalary, selectedSlip.currency)})
                  </div>
                )}
              </div>
            </div>

            <div className="no-print flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-quantum px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> {isId ? "Cetak / Simpan PDF" : "Print / Save PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
