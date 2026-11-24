"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { formatCurrency } from "@/lib/payroll-engine";
import type { PayslipItem } from "@/types/hris";

export default function PayrollPage() {
  const { locale, employees, payrollRuns, addPayrollRun, pushToast } = useHRIS();
  const isId = locale === "id";

  const [running, setRunning] = useState(false);
  const [period, setPeriod] = useState("2026-12");
  const [selectedSlip, setSelectedSlip] = useState<PayslipItem | null>(null);
  const activeRun = payrollRuns[0];

  const handleRunPayroll = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees, period }),
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
    if (!activeRun) return;
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
    const rows = activeRun.items.map((i) => [
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
    pushToast({
      title: isId ? "Jurnal Payroll CSV Diunduh" : "Payroll CSV Exported",
      description: `${activeRun.items.length} payslips exported for finance ERP sync.`,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-amber-400" />
            {isId ? "Global Multi-Currency Payroll & PPh 21 TER Engine" : "Global Multi-Currency Payroll & Tax Automation"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isId
              ? "Perhitungan otomatis PPh 21 TER + BPJS Kesehatan/TK (IDR), CPF (SGD), US FICA (USD), EU & UK dengan distribusi slip gaji WA/Email."
              : "Automated PPh 21 TER + BPJS (IDR), Singapore CPF (SGD), US FICA (USD), EU & UK deductions with instant payslip dispatch."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono"
          />
          <button
            onClick={exportPayrollCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> ERP CSV
          </button>
          <button
            onClick={handleRunPayroll}
            disabled={running}
            className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60"
          >
            <Play className="w-4 h-4" />
            {running
              ? isId
                ? "Menghitung Pajak & BPJS..."
                : "Computing Global Taxes..."
              : isId
              ? "Jalankan Auto-Payroll Baru"
              : "Run Automated Payroll Cycle"}
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      {activeRun && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="text-xs text-slate-400">Active Payroll Period</div>
            <div className="text-xl font-black mt-1 text-cyan-400">{activeRun.period}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {activeRun.status} · {activeRun.totalEmployees} Staff
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="text-xs text-slate-400">Consolidated Gross (USD Eq.)</div>
            <div className="text-xl font-black mt-1">${activeRun.totalGrossUSD.toLocaleString("en-US")}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" /> 5 Currencies Consolidated
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="text-xs text-slate-400">Consolidated Net Payout (USD Eq.)</div>
            <div className="text-xl font-black mt-1 text-emerald-400">
              ${activeRun.totalNetUSD.toLocaleString("en-US")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Auto-disbursed via Bank API</div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="text-xs text-slate-400">Compliance Engines Active</div>
            <div className="text-base font-black mt-1 text-amber-400 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> PPh 21 TER + BPJS + CPF
            </div>
            <div className="text-[11px] text-slate-400 mt-1">PP 58/2023 & Global Statutory</div>
          </div>
        </div>
      )}

      {/* Payslips Table */}
      {activeRun && (
        <div className="glass-card rounded-2xl p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {activeRun.label}
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Run ID: {activeRun.id}
            </span>
          </div>
          <table className="w-full text-left text-xs min-w-[820px]">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Gross Salary</th>
                <th className="py-2.5 px-3">Tax & Statutory Rule</th>
                <th className="py-2.5 px-3">Deductions</th>
                <th className="py-2.5 px-3">Net Take-Home</th>
                <th className="py-2.5 px-3 text-right">Payslip & Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeRun.items.map((item) => {
                const emp = employees.find((e) => e.id === item.employeeId);
                return (
                  <tr key={item.employeeId} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3">
                      <div className="font-bold">{item.employeeName}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.employeeCode} · {item.department}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold whitespace-nowrap">
                      {formatCurrency(item.grossSalary, item.currency)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 text-[10px] font-semibold">
                        {item.taxRateLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-rose-400 whitespace-nowrap">
                      -{formatCurrency(item.incomeTax + item.bpjsHealth + item.bpjsEmployment, item.currency)}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-400 whitespace-nowrap">
                      {formatCurrency(item.netSalary, item.currency)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedSlip(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 font-semibold"
                        >
                          {isId ? "Slip PDF" : "Payslip"}
                        </button>
                        {emp && (
                          <a
                            href={`https://wa.me/${emp.phone}?text=${encodeURIComponent(
                              `Halo ${item.employeeName}, Slip Gaji periode ${activeRun.period} telah diterbitkan!\nNet Take-Home: ${formatCurrency(
                                item.netSalary,
                                item.currency
                              )}\nRule: ${item.taxRateLabel}\n— AetherHR Global Payroll`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
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
      )}

      {/* Printable Executive Payslip Modal */}
      {selectedSlip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setSelectedSlip(null)}
        >
          <div
            className="w-full max-w-xl glass-panel rounded-2xl border border-cyan-500/30 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                  AetherHR Global Technologies · Confidential Digital Payslip
                </div>
                <h2 className="text-lg font-black mt-1">{selectedSlip.employeeName}</h2>
                <div className="text-xs text-slate-400">
                  {selectedSlip.role} · {selectedSlip.employeeCode} · Period {activeRun?.period}
                </div>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                className="no-print p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                  Earnings
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Salary</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(selectedSlip.baseSalary, selectedSlip.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Allowances & Bonus</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(selectedSlip.allowances, selectedSlip.currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold">
                  <span>Total Gross</span>
                  <span className="font-mono">
                    {formatCurrency(selectedSlip.grossSalary, selectedSlip.currency)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="font-bold text-rose-400 uppercase tracking-wider text-[10px]">
                  Statutory Deductions
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Income Tax</span>
                  <span className="font-mono text-rose-300">
                    -{formatCurrency(selectedSlip.incomeTax, selectedSlip.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Health / BPJS Kes</span>
                  <span className="font-mono text-rose-300">
                    -{formatCurrency(selectedSlip.bpjsHealth, selectedSlip.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pension / JHT / CPF</span>
                  <span className="font-mono text-rose-300">
                    -{formatCurrency(selectedSlip.bpjsEmployment, selectedSlip.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-indigo-500/15 border border-emerald-500/35 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-300 font-semibold">Net Take-Home Pay</div>
                <div className="text-[11px] text-slate-400">{selectedSlip.taxRateLabel}</div>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(selectedSlip.netSalary, selectedSlip.currency)}
              </div>
            </div>

            <div className="no-print flex justify-end gap-2">
              <button
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
