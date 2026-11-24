"use client";

import React, { useState } from "react";
import {
  Receipt,
  Laptop,
  Plus,
  CheckCircle2,
  XCircle,
  Wallet,
  Package,
  X,
  ArrowRightLeft,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { formatCurrency } from "@/lib/payroll-engine";
import type { CompanyAsset, Currency, ExpenseClaim } from "@/types/hris";

export default function FinanceOpsPage() {
  const {
    locale,
    employees,
    expenses,
    assets,
    submitExpenseClaim,
    decideExpenseClaim,
    addAsset,
    assignAsset,
  } = useHRIS();
  const isId = locale === "id";

  const [tab, setTab] = useState<"expenses" | "assets">("expenses");
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);

  // Claim form
  const [empId, setEmpId] = useState(employees[0]?.id || "emp-01");
  const [category, setCategory] = useState<ExpenseClaim["category"]>("Travel & Flights");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("1500000");
  const [currency, setCurrency] = useState<Currency>("IDR");

  // Asset form
  const [assetTag, setAssetTag] = useState("AET-MBP-031");
  const [assetName, setAssetName] = useState('MacBook Pro 14" M4 (24GB)');
  const [assetCat, setAssetCat] = useState<CompanyAsset["category"]>("Laptop");
  const [serial, setSerial] = useState("C02ZQ991MD6X");
  const [assetVal, setAssetVal] = useState("2199");

  const pendingClaims = expenses.filter((e) => e.status === "Pending").length;
  const syncedClaims = expenses.filter((e) => e.syncedToPayroll).length;
  const totalAssetValue = assets.reduce((s, a) => s + a.purchaseValueUSD, 0);
  const inStockAssets = assets.filter((a) => a.status === "In Stock").length;

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((item) => item.id === empId) || employees[0];
    if (!emp || !desc.trim()) return;
    submitExpenseClaim({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      category,
      description: desc.trim(),
      amount: Number(amount) || 500000,
      currency,
      date: new Date().toISOString().slice(0, 10),
      receiptRef: `RCP-${Date.now().toString().slice(-5)}.pdf`,
    });
    setDesc("");
    setClaimModalOpen(false);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;
    addAsset({
      assetTag: assetTag.trim(),
      name: assetName.trim(),
      category: assetCat,
      serialNumber: serial.trim(),
      assignedToId: null,
      assignedToName: "Unassigned (HQ Vault)",
      department: "IT Inventory",
      condition: "Excellent",
      status: "In Stock",
      purchaseValueUSD: Number(assetVal) || 1500,
      assignedDate: new Date().toISOString().slice(0, 10),
    });
    setAssetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-indigo-600 dark:text-cyan-400" />
            {isId ? "Reimbursement & Inventaris Aset IT" : "Expense Reimbursements & IT Asset Inventory"}
          </h1>
          <p className="text-xs hr-muted mt-1">
            {isId
              ? "Persetujuan klaim reimburse otomatis masuk ke Payroll bulanan, plus pelacakan laptop, monitor & perangkat karyawan."
              : "Approved reimbursements automatically merge into monthly payroll, paired with real-time company hardware inventory."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-strong)" }}>
            <button
              onClick={() => setTab("expenses")}
              className={`px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 ${
                tab === "expenses" ? "bg-indigo-600 text-white" : "hr-muted"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> {isId ? "Reimburse" : "Expenses"} ({expenses.length})
            </button>
            <button
              onClick={() => setTab("assets")}
              className={`px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 ${
                tab === "assets" ? "bg-indigo-600 text-white" : "hr-muted"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> {isId ? "Aset IT" : "IT Assets"} ({assets.length})
            </button>
          </div>
          {tab === "expenses" ? (
            <button
              onClick={() => setClaimModalOpen(true)}
              className="btn-quantum px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {isId ? "Ajukan Klaim" : "New Expense"}
            </button>
          ) : (
            <button
              onClick={() => setAssetModalOpen(true)}
              className="btn-quantum px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {isId ? "Tambah Aset IT" : "Register Asset"}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="hr-card rounded-2xl p-5">
          <div className="text-xs hr-muted font-medium">
            {isId ? "Klaim Menunggu Approval" : "Pending Expense Claims"}
          </div>
          <div className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">
            {pendingClaims}
          </div>
          <div className="text-[11px] hr-muted mt-1">Auto-notified to Finance Manager</div>
        </div>
        <div className="hr-card rounded-2xl p-5">
          <div className="text-xs hr-muted font-medium">
            {isId ? "Tersinkron ke Payroll" : "Synced to Next Payroll"}
          </div>
          <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Wallet className="w-5 h-5" /> {syncedClaims}
          </div>
          <div className="text-[11px] hr-muted mt-1">Zero manual spreadsheet transfer</div>
        </div>
        <div className="hr-card rounded-2xl p-5">
          <div className="text-xs hr-muted font-medium">
            {isId ? "Total Nilai Aset IT" : "Total IT Hardware Value"}
          </div>
          <div className="text-2xl font-black mt-1 text-indigo-600 dark:text-cyan-400">
            ${totalAssetValue.toLocaleString("en-US")}
          </div>
          <div className="text-[11px] hr-muted mt-1">{assets.length} Tracked Corporate Devices</div>
        </div>
        <div className="hr-card rounded-2xl p-5">
          <div className="text-xs hr-muted font-medium">
            {isId ? "Stok Siap Pakai (HQ Vault)" : "Available Vault Stock"}
          </div>
          <div className="text-2xl font-black mt-1 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" /> {inStockAssets}
          </div>
          <div className="text-[11px] hr-muted mt-1">Ready for new hire onboarding</div>
        </div>
      </div>

      {tab === "expenses" ? (
        <div className="hr-card rounded-2xl p-5 overflow-x-auto">
          <h2 className="text-base font-bold mb-4">
            {isId ? "Daftar Klaim Reimbursement Karyawan" : "Employee Expense & Reimbursement Ledger"}
          </h2>
          <table className="w-full text-left text-xs min-w-[780px]">
            <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Category & Receipt</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {expenses.map((ex) => (
                <tr key={ex.id} className="hover:bg-indigo-500/4">
                  <td className="py-3 px-3">
                    <div className="font-bold">{ex.employeeName}</div>
                    <div className="text-[11px] hr-muted">{ex.department} · {ex.date}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-indigo-600 dark:text-cyan-400">{ex.category}</div>
                    <div className="text-[10px] font-mono hr-muted">{ex.receiptRef}</div>
                  </td>
                  <td className="py-3 px-3 max-w-xs">{ex.description}</td>
                  <td className="py-3 px-3 font-mono font-black whitespace-nowrap">
                    {formatCurrency(ex.amount, ex.currency)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ex.status === "Approved" || ex.status === "Paid in Payroll"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : ex.status === "Rejected"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                      }`}
                    >
                      {ex.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {ex.status === "Pending" ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => decideExpenseClaim(ex.id, "Approved")}
                          className="btn-emerald px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => decideExpenseClaim(ex.id, "Rejected")}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500/12 text-rose-600 dark:text-rose-300 inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {ex.syncedToPayroll ? "Payroll Synced ✓" : "Closed"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hr-card rounded-2xl p-5 overflow-x-auto">
          <h2 className="text-base font-bold mb-4">
            {isId ? "Pelacakan Perangkat & Aset IT Perusahaan" : "Corporate Hardware & IT Asset Lifecycle"}
          </h2>
          <table className="w-full text-left text-xs min-w-[820px]">
            <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <tr>
                <th className="py-2.5 px-3">Asset Tag & Device</th>
                <th className="py-2.5 px-3">Serial Number</th>
                <th className="py-2.5 px-3">Assigned Holder</th>
                <th className="py-2.5 px-3">Value (USD)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Reassign / Return</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {assets.map((ast) => (
                <tr key={ast.id} className="hover:bg-indigo-500/4">
                  <td className="py-3 px-3">
                    <div className="font-bold">{ast.name}</div>
                    <div className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400">
                      {ast.assetTag} · {ast.category}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono hr-muted">{ast.serialNumber}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold">{ast.assignedToName}</div>
                    <div className="text-[11px] hr-muted">{ast.department}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    ${ast.purchaseValueUSD.toLocaleString("en-US")}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ast.status === "Assigned"
                          ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {ast.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 hr-muted" />
                      <select
                        aria-label={`Assign ${ast.assetTag}`}
                        value={ast.assignedToId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            assignAsset(ast.id, null, "Unassigned (HQ Vault)", "IT Inventory");
                          } else {
                            const emp = employees.find((item) => item.id === val);
                            if (emp) assignAsset(ast.id, emp.id, emp.name, emp.department);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold hr-input"
                      >
                        <option value="">Return to HQ Vault</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Expense Modal */}
      {claimModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setClaimModalOpen(false)}
        >
          <div className="w-full max-w-md hr-card rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">{isId ? "Ajukan Klaim Reimburse" : "Submit Expense Claim"}</h3>
              <button onClick={() => setClaimModalOpen(false)}><X className="w-5 h-5 hr-muted" /></button>
            </div>
            <form onSubmit={handleSubmitClaim} className="space-y-3 text-xs">
              <select value={empId} onChange={(e) => setEmpId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl hr-input">
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                ))}
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseClaim["category"])} className="w-full px-3 py-2.5 rounded-xl hr-input">
                <option value="Travel & Flights">Travel & Flights</option>
                <option value="Home Office & Gear">Home Office & Gear</option>
                <option value="Medical & Wellness">Medical & Wellness</option>
                <option value="Client Hospitality">Client Hospitality</option>
                <option value="Training & Cert">Training & Cert</option>
              </select>
              <input required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description & vendor..." className="w-full px-3 py-2.5 rounded-xl hr-input" />
              <div className="grid grid-cols-2 gap-2.5">
                <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="px-3 py-2.5 rounded-xl hr-input">
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                  <option value="EUR">EUR</option>
                </select>
                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="px-3 py-2.5 rounded-xl hr-input font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setClaimModalOpen(false)} className="px-4 py-2 rounded-xl hr-btn-secondary">Cancel</button>
                <button type="submit" className="btn-quantum px-5 py-2 rounded-xl font-bold">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register IT Asset Modal */}
      {assetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setAssetModalOpen(false)}
        >
          <div className="w-full max-w-md hr-card rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">{isId ? "Registrasi Aset IT Baru" : "Register Corporate IT Asset"}</h3>
              <button onClick={() => setAssetModalOpen(false)}><X className="w-5 h-5 hr-muted" /></button>
            </div>
            <form onSubmit={handleAddAsset} className="space-y-3 text-xs">
              <input required value={assetTag} onChange={(e) => setAssetTag(e.target.value)} placeholder="Asset Tag (e.g. AET-MBP-031)" className="w-full px-3 py-2.5 rounded-xl hr-input font-mono" />
              <input required value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Device Model" className="w-full px-3 py-2.5 rounded-xl hr-input" />
              <div className="grid grid-cols-2 gap-2.5">
                <select value={assetCat} onChange={(e) => setAssetCat(e.target.value as CompanyAsset["category"])} className="px-3 py-2.5 rounded-xl hr-input">
                  <option value="Laptop">Laptop</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Smartphone">Smartphone</option>
                  <option value="Access Card">Access Card</option>
                  <option value="Software Seat">Software Seat</option>
                </select>
                <input type="number" value={assetVal} onChange={(e) => setAssetVal(e.target.value)} placeholder="Value USD" className="px-3 py-2.5 rounded-xl hr-input font-mono" />
              </div>
              <input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Serial Number" className="w-full px-3 py-2.5 rounded-xl hr-input font-mono" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAssetModalOpen(false)} className="px-4 py-2 rounded-xl hr-btn-secondary">Cancel</button>
                <button type="submit" className="btn-quantum px-5 py-2 rounded-xl font-bold">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
