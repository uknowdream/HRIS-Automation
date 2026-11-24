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
import type { PayslipItem } from "@/types/hris";

export default function PayrollPage() {
  const {
    locale,
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
    if (emp && emp.currency === ex.currency) {
      acc[emp.id] = (acc[emp.id] || 0) + ex.amount;
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
        title: "Payroll Error",
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
      "Currency",
      "Base",
      "Allowances",
      "Gross",
      "IncomeTax",
      "BPJS/Health",
      "BPJS/Pension",
      "NetSalary",
      "TaxRule",
    ];
    const rows = visibleItems.map((i) => [
      i.employeeCode,
      `"${i.employeeName}"`,
      `"${i.department}"`,
      i.currency,
      i.baseSalary,
      i.allowances,
      i.grossSalary,
      i.incomeTax,
      i.bpjsHealth,
      i.bpjsEmployment,
      i.netSalary,
      `"${i.taxRateLabel}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aetherhr-payroll-${activeRun.period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    recordAuditLog({
      module: "Payroll & Tax",
      action: "payroll.erp_csv_exported",
      target: `Period ${activeRun.period} (${visibleItems.length} rows)`,
      severity: "CRITICAL",
      detail: `Exported confidential payroll journal CSV for ERP reconciliation.`,
    });
    pushToast({
      title: isId ? "Jurnal Payroll CSV Diunduh" : "Payroll CSV Exported",
      description: `${visibleItems.length} payslips exported for finance ERP sync.`,
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
      {/* Clean Enterprise Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {canViewAllPayroll
              ? isId
                ? "Global Multi-Currency Payroll & PPh 21 TER Engine"
                : "Global Multi-Currency Payroll & Tax Automation"
              : isId
              ? `Brankas Slip Gaji Pribadi (${currentEmployee.name})`
              : `Personal Confidential Payslip Vault (${currentEmployee.name})`}
          </h1>
          <p className="text-xs sm:text-sm hr-muted mt-1">
            {canViewAllPayroll
              ? isId
                ? "Perhitungan otomatis PPh 21 TER + BPJS Kesehatan/TK (IDR), CPF (SGD), US FICA (USD), EU & UK dengan distribusi slip gaji WA/Email."
                : "Automated PPh 21 TER + BPJS (IDR), Singapore CPF (SGD), US FICA (USD), EU & UK deductions with instant payslip dispatch."
              : isId
              ? "Mode Self-Service Terenkripsi RBAC: Hanya menampilkan rincian gaji, pajak PPh 21/statutory, dan slip PDF milik Anda sendiri."
              : "RBAC-Scoped Self-Service Mode: Displays strictly your own monthly earnings, statutory deductions, and downloadable PDF payslips."}
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
              <Download className="w-3.5 h-3.5" /> ERP CSV
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
            Role: {activeRole} · {isId ? "Gaji Rekan Kerja Disembunyikan" : "Peer Salaries Protected"}
          </div>
        )}
      </div>

      {/* Approved Reimbursements Sync Banner */}
      {canViewAllPayroll && approvedReimbursements.length > 0 && (
        <div className="p-3.5 rounded-2xl badge-success flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {isId
              ? `${approvedReimbursements.length} klaim reimbursement disetujui siap digabungkan otomatis saat Anda klik "Jalankan Auto-Payroll".`
              : `${approvedReimbursements.length} approved expense claims are queued to auto-merge into allowances on the next Payroll Run.`}
          </span>
        </div>
      )}

      {/* Summary Strip */}
      {canViewAllPayroll && activeRun ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">Active Payroll Period</div>
            <div className="text-2xl font-extrabold mt-1 text-indigo-600 dark:text-indigo-400">
              {activeRun.period}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {activeRun.status} · {visibleItems.length} Staff
            </div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">Consolidated Gross (USD Eq.)</div>
            <div className="text-2xl font-extrabold mt-1 tabular-nums">
              ${activeRun.totalGrossUSD.toLocaleString("en-US")}
            </div>
            <div className="text-[11px] hr-muted mt-1 flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-indigo-600" /> 5 Currencies Consolidated
            </div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">Consolidated Net Payout (USD Eq.)</div>
            <div className="text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
              ${activeRun.totalNetUSD.toLocaleString("en-US")}
            </div>
            <div className="text-[11px] hr-muted mt-1">Auto-disbursed via Bank API</div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">Compliance Engines Active</div>
            <div className="text-base font-extrabold mt-1 text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> PPh 21 TER + BPJS + CPF
            </div>
            <div className="text-[11px] hr-muted mt-1">PP 58/2023 & Global Statutory</div>
          </div>
        </div>
      ) : (
        /* ESS Personal Summary Cards */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">{isId ? "Gaji Kotor (Gross)" : "Personal Gross Pay"}</div>
            <div className="text-2xl font-extrabold mt-1 tabular-nums">
              {formatCurrency(personalSlip.grossSalary, personalSlip.currency)}
            </div>
            <div className="text-[11px] hr-muted mt-1">{personalSlip.taxRateLabel}</div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">{isId ? "Total Potongan Pajak & BPJS" : "Statutory Deductions"}</div>
            <div className="text-2xl font-extrabold mt-1 text-rose-600 dark:text-rose-400 tabular-nums">
              -{formatCurrency(personalSlip.incomeTax + personalSlip.bpjsHealth + personalSlip.bpjsEmployment, personalSlip.currency)}
            </div>
            <div className="text-[11px] hr-muted mt-1">Auto-calculated & verified</div>
          </div>
          <div className="hr-card rounded-2xl p-5">
            <div className="text-xs hr-muted font-medium">{isId ? "Take-Home Pay Bersih" : "Net Take-Home Pay"}</div>
            <div className="text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(personalSlip.netSalary, personalSlip.currency)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Confidential ESS Vault
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
              ? activeRun?.label || "Global Payroll Ledger"
              : isId
              ? "Riwayat Slip Gaji Digital Saya"
              : "My Digital Payslip Statement"}
          </h2>
          {activeRun && (
            <span className="text-xs hr-muted font-mono">
              Run ID: {activeRun.id}
            </span>
          )}
        </div>
        <table className="w-full text-left text-xs min-w-[780px]">
          <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <tr>
              <th className="py-2.5 px-3">Employee</th>
              <th className="py-2.5 px-3">Gross Salary</th>
              <th className="py-2.5 px-3">Tax & Statutory Rule</th>
              <th className="py-2.5 px-3">Deductions</th>
              <th className="py-2.5 px-3">Net Take-Home</th>
              <th className="py-2.5 px-3 text-right">Payslip & Dispatch</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {visibleItems.map((item) => {
              const emp = employees.find((e) => e.id === item.employeeId);
              return (
                <tr key={item.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <div className="font-bold">{item.employeeName}</div>
                    <div className="text-[11px] hr-muted">
                      {item.employeeCode} · {item.department}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold whitespace-nowrap">
                    {formatCurrency(item.grossSalary, item.currency)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="badge-info px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {item.taxRateLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
                    -{formatCurrency(item.incomeTax + item.bpjsHealth + item.bpjsEmployment, item.currency)}
                  </td>
                  <td className="py-3 px-3 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatCurrency(item.netSalary, item.currency)}
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
                          title="Send WhatsApp Payslip Notice"
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
                  AetherHR Global Technologies · Confidential Digital Payslip
                </div>
                <h2 className="text-lg font-extrabold mt-1">{selectedSlip.employeeName}</h2>
                <div className="text-xs hr-muted">
                  {selectedSlip.role} · {selectedSlip.employeeCode} · Period {activeRun?.period || period}
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
                  Earnings
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">Base Salary</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(selectedSlip.baseSalary, selectedSlip.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">Allowances & Reimbursements</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(selectedSlip.allowances, selectedSlip.currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold" style={{ borderColor: "var(--border-subtle)" }}>
                  <span>Total Gross</span>
                  <span className="font-mono">
                    {formatCurrency(selectedSlip.grossSalary, selectedSlip.currency)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl hr-subtle space-y-2">
                <div className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                  Statutory Deductions
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">Income Tax</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    -{formatCurrency(selectedSlip.incomeTax, selectedSlip.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">Health / BPJS Kes</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    -{formatCurrency(selectedSlip.bpjsHealth, selectedSlip.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="hr-muted">Pension / JHT / CPF</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    -{formatCurrency(selectedSlip.bpjsEmployment, selectedSlip.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl badge-success flex items-center justify-between">
              <div>
                <div className="text-xs font-bold">Net Take-Home Pay</div>
                <div className="text-[11px] opacity-80">{selectedSlip.taxRateLabel}</div>
              </div>
              <div className="text-2xl font-extrabold font-mono">
                {formatCurrency(selectedSlip.netSalary, selectedSlip.currency)}
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
