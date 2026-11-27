"use client";

import React, { useEffect, useState } from "react";
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
  Zap,
  Lock,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import { formatCurrency } from "@/lib/payroll-engine";
import { convertCurrency, formatConverted } from "@/lib/currency";
import { tStatus } from "@/lib/i18n";
import type { CompanyAsset, Currency, ExpenseClaim } from "@/types/hris";

export default function FinanceOpsPage() {
  const {
    locale,
    displayCurrency,
    activeRole,
    currentEmployee,
    hasPermission,
    settings,
    employees,
    expenses,
    assets,
    submitExpenseClaim,
    decideExpenseClaim,
    addAsset,
    assignAsset,
  } = useHRIS();
  const isId = locale === "id";

  const canApproveExpenses = hasPermission("expenses:approve");
  const canManageAssets = hasPermission("assets:manage");
  const isEss = activeRole === "Employee";

  const [tab, setTab] = useState<"expenses" | "assets">("expenses");
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);

  const [empId, setEmpId] = useState(currentEmployee.id);
  const [category, setCategory] = useState<ExpenseClaim["category"]>("Travel & Flights");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("1500000");
  const [currency, setCurrency] = useState<Currency>(displayCurrency);

  const [assetTag, setAssetTag] = useState("AET-MBP-031");
  const [assetName, setAssetName] = useState('MacBook Pro 14" M4 (24GB)');
  const [assetCat, setAssetCat] = useState<CompanyAsset["category"]>("Laptop");
  const [serial, setSerial] = useState("C02ZQ991MD6X");
  const [assetVal, setAssetVal] = useState("2199");

  useEffect(() => {
    setEmpId(currentEmployee.id);
  }, [currentEmployee.id]);

  useEffect(() => {
    setCurrency(displayCurrency);
  }, [displayCurrency]);

  const visibleExpenses = isEss
    ? expenses.filter((e) => e.employeeId === currentEmployee.id)
    : expenses;

  const visibleAssets = isEss
    ? assets.filter((a) => a.assignedToId === currentEmployee.id)
    : assets;

  const pendingClaims = visibleExpenses.filter((e) => e.status === "Pending").length;
  const syncedClaims = visibleExpenses.filter((e) => e.syncedToPayroll).length;
  const totalAssetValueUsd = visibleAssets.reduce((s, a) => s + a.purchaseValueUSD, 0);
  const inStockAssets = assets.filter((a) => a.status === "In Stock").length;

  const microThresholdFormatted = formatCurrency(
    convertCurrency(settings.microExpenseLimitUSD, "USD", displayCurrency),
    displayCurrency
  );

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = isEss
      ? currentEmployee
      : employees.find((item) => item.id === empId) || currentEmployee;
    if (!emp || !desc.trim()) return;
    submitExpenseClaim({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      category,
      description: desc.trim(),
      amount: Number(amount) || 500,
      currency,
      date: new Date().toISOString().slice(0, 10),
      receiptRef: `RCP-${Date.now().toString().slice(-5)}.pdf`,
    });
    setDesc("");
    setClaimModalOpen(false);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !canManageAssets) return;
    addAsset({
      assetTag: assetTag.trim(),
      name: assetName.trim(),
      category: assetCat,
      serialNumber: serial.trim(),
      assignedToId: null,
      assignedToName: isId ? "Belum Dipinjamkan (Gudang HQ)" : "Unassigned (HQ Vault)",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {isEss
              ? isId
                ? `Reimburse & Perangkat Kerja Saya (${currentEmployee.name})`
                : `My Reimbursements & Assigned Gear (${currentEmployee.name})`
              : isId
              ? `Reimbursement & Inventaris Aset IT (${displayCurrency})`
              : `Expense Reimbursements & IT Asset Inventory (${displayCurrency})`}
          </h1>
          <p className="text-xs sm:text-sm hr-muted mt-1">
            {isId
              ? `Klaim kecil ≤ ${microThresholdFormatted} otomatis disetujui AI & digabungkan ke Payroll bulanan.`
              : `Micro-claims ≤ ${microThresholdFormatted} are auto-approved by AI Auto-Pilot and merged into monthly payroll.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border p-0.5 hr-subtle">
            <button
              type="button"
              onClick={() => setTab("expenses")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                tab === "expenses"
                  ? "bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-300"
                  : "hr-muted"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> {isId ? "Reimburse" : "Expenses"} ({visibleExpenses.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("assets")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                tab === "assets"
                  ? "bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-300"
                  : "hr-muted"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> {isId ? "Aset IT" : "IT Assets"} ({visibleAssets.length})
            </button>
          </div>
          {tab === "expenses" ? (
            <button
              type="button"
              onClick={() => setClaimModalOpen(true)}
              className="btn-quantum px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {isId ? "Ajukan Klaim" : "New Expense"}
            </button>
          ) : canManageAssets ? (
            <button
              type="button"
              onClick={() => setAssetModalOpen(true)}
              className="btn-quantum px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {isId ? "Tambah Aset IT" : "Register Asset"}
            </button>
          ) : null}
        </div>
      </div>

      {settings.autoApproveMicroExpense && (
        <div className="p-3.5 rounded-2xl badge-info flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 shrink-0" />
            {isId
              ? `Auto-Pilot Aktif: Klaim reimbursement bernilai ≤ ${microThresholdFormatted} otomatis disetujui & masuk ke antrean Payroll berikutnya.`
              : `Auto-Pilot Active: Expense claims ≤ ${microThresholdFormatted} are instantaneously approved & synced to Payroll.`}
          </span>
        </div>
      )}

      {/* KPI Cards Synced to displayCurrency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="hr-card rounded-2xl p-5">
          <div className="text-xs hr-muted font-medium">
            {isId ? "Klaim Menunggu Persetujuan" : "Pending Expense Claims"}
          </div>
          <div className="text-2xl font-extrabold mt-1 text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingClaims}
          </div>
          <div className="text-[11px] hr-muted mt-1">
            {isId ? "Notifikasi otomatis ke Keuangan" : "Auto-notified to Finance"}
          </div>
        </div>
        <div className="hr-card rounded-2xl p-5">
          <div className="text-xs hr-muted font-medium">
            {isId ? "Tersinkron ke Payroll" : "Synced to Next Payroll"}
          </div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 tabular-nums">
            <Wallet className="w-5 h-5" /> {syncedClaims}
          </div>
          <div className="text-[11px] hr-muted mt-1">
            {isId ? "Tanpa rekap manual" : "Zero manual spreadsheet transfer"}
          </div>
        </div>
        <div className="hr-card rounded-2xl p-5">
          <div className="text-xs hr-muted font-medium">
            {isEss
              ? isId
                ? `Nilai Perangkat Saya (${displayCurrency})`
                : `My Assigned Gear (${displayCurrency})`
              : isId
              ? `Total Nilai Aset IT (${displayCurrency})`
              : `Total IT Hardware (${displayCurrency})`}
          </div>
          <div className="text-xl sm:text-2xl font-extrabold mt-1 text-indigo-600 dark:text-indigo-400 tabular-nums truncate">
            {formatConverted(totalAssetValueUsd, "USD", displayCurrency)}
          </div>
          <div className="text-[11px] hr-muted mt-1">
            {visibleAssets.length} {isId ? "Perangkat Terlacak" : "Tracked Devices"}
          </div>
        </div>
        <div className="hr-card rounded-2xl p-5">
          <div className="text-xs hr-muted font-medium">
            {isId ? "Stok Gudang HQ Siap Pakai" : "Available Vault Stock"}
          </div>
          <div className="text-2xl font-extrabold mt-1 flex items-center gap-2 tabular-nums">
            <Package className="w-5 h-5 text-teal-600" /> {inStockAssets}
          </div>
          <div className="text-[11px] hr-muted mt-1">
            {isId ? "Siap untuk karyawan baru" : "Ready for new hire onboarding"}
          </div>
        </div>
      </div>

      {tab === "expenses" ? (
        <div className="hr-card rounded-2xl p-5 overflow-x-auto">
          <h2 className="text-base font-extrabold mb-4">
            {isEss
              ? isId
                ? "Riwayat Klaim Reimbursement Saya"
                : "My Reimbursement Ledger"
              : isId
              ? "Daftar Klaim Reimbursement Karyawan"
              : "Employee Expense & Reimbursement Ledger"}
          </h2>
          <table className="w-full text-left text-xs min-w-[780px]">
            <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <tr>
                <th className="py-2.5 px-3">{isId ? "Karyawan" : "Employee"}</th>
                <th className="py-2.5 px-3">{isId ? "Kategori & Bukti" : "Category & Receipt"}</th>
                <th className="py-2.5 px-3">{isId ? "Deskripsi" : "Description"}</th>
                <th className="py-2.5 px-3">
                  {isId ? `Nominal (${displayCurrency})` : `Amount (${displayCurrency})`}
                </th>
                <th className="py-2.5 px-3">{isId ? "Status" : "Status"}</th>
                <th className="py-2.5 px-3 text-right">{isId ? "Aksi" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {visibleExpenses.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <div className="font-bold">{ex.employeeName}</div>
                    <div className="text-[11px] hr-muted">{ex.department} · {ex.date}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-indigo-600 dark:text-indigo-400">{ex.category}</div>
                    <div className="text-[10px] font-mono hr-muted">{ex.receiptRef}</div>
                  </td>
                  <td className="py-3 px-3 max-w-xs">{ex.description}</td>
                  <td className="py-3 px-3 font-mono whitespace-nowrap">
                    <div className="font-extrabold">
                      {formatConverted(ex.amount, ex.currency, displayCurrency)}
                    </div>
                    {ex.currency !== displayCurrency && (
                      <div className="text-[10px] hr-muted">
                        ({formatCurrency(ex.amount, ex.currency)})
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ex.status === "Approved" || ex.status === "Paid in Payroll"
                          ? "badge-success"
                          : ex.status === "Rejected"
                          ? "badge-danger"
                          : "badge-warning"
                      }`}
                    >
                      {tStatus(ex.status, locale)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {ex.status === "Pending" && canApproveExpenses ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => decideExpenseClaim(ex.id, "Approved")}
                          className="btn-emerald px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {isId ? "Setujui" : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => decideExpenseClaim(ex.id, "Rejected")}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold badge-danger inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> {isId ? "Tolak" : "Reject"}
                        </button>
                      </div>
                    ) : ex.status === "Pending" ? (
                      <span className="text-[11px] hr-muted font-semibold">
                        {isId ? "Menunggu Verifikasi" : "Pending Review"}
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {ex.syncedToPayroll
                          ? isId
                            ? "Tersinkron ke Payroll ✓"
                            : "Payroll Synced ✓"
                          : isId
                          ? "Selesai"
                          : "Closed"}
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
          <h2 className="text-base font-extrabold mb-4">
            {isEss
              ? isId
                ? "Perangkat Kerja yang Dipinjamkan Kepada Saya"
                : "Corporate Devices Assigned to Me"
              : isId
              ? "Pelacakan Perangkat & Aset IT Perusahaan"
              : "Corporate Hardware & IT Asset Lifecycle"}
          </h2>
          <table className="w-full text-left text-xs min-w-[820px]">
            <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <tr>
                <th className="py-2.5 px-3">{isId ? "Kode & Perangkat" : "Asset Tag & Device"}</th>
                <th className="py-2.5 px-3">{isId ? "Nomor Seri" : "Serial Number"}</th>
                <th className="py-2.5 px-3">{isId ? "Pemegang Aset" : "Assigned Holder"}</th>
                <th className="py-2.5 px-3">
                  {isId ? `Nilai Aset (${displayCurrency})` : `Value (${displayCurrency})`}
                </th>
                <th className="py-2.5 px-3">{isId ? "Status" : "Status"}</th>
                <th className="py-2.5 px-3 text-right">{isId ? "Mutasi / Pengembalian" : "Custody"}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {visibleAssets.map((ast) => (
                <tr key={ast.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3">
                    <div className="font-bold">{ast.name}</div>
                    <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                      {ast.assetTag} · {ast.category}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono hr-muted">{ast.serialNumber}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold">{ast.assignedToName}</div>
                    <div className="text-[11px] hr-muted">{ast.department}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {formatConverted(ast.purchaseValueUSD, "USD", displayCurrency)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ast.status === "Assigned"
                          ? "badge-info"
                          : ast.status === "Pending Return"
                          ? "badge-warning"
                          : "badge-success"
                      }`}
                    >
                      {tStatus(ast.status, locale)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {canManageAssets ? (
                      <div className="inline-flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 hr-muted" />
                        <select
                          aria-label={`Assign ${ast.assetTag}`}
                          value={ast.assignedToId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              assignAsset(
                                ast.id,
                                null,
                                isId ? "Gudang HQ (Tersedia)" : "Unassigned (HQ Vault)",
                                "IT Inventory"
                              );
                            } else {
                              const emp = employees.find((item) => item.id === val);
                              if (emp) assignAsset(ast.id, emp.id, emp.name, emp.department);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold hr-input"
                        >
                          <option value="">
                            {isId ? "Kembalikan ke Gudang HQ" : "Return to HQ Vault"}
                          </option>
                          {employees.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name} ({e.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] hr-muted">
                        <Lock className="w-3 h-3" /> {isId ? "Dikelola IT/Keuangan" : "Managed by IT/Finance"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit Expense Claim Modal */}
      {claimModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setClaimModalOpen(false)}
        >
          <div
            className="w-full max-w-md hr-card rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {isId ? "Ajukan Klaim Reimbursement Baru" : "Submit New Expense Claim"}
              </h3>
              <button type="button" onClick={() => setClaimModalOpen(false)}>
                <X className="w-5 h-5 hr-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmitClaim} className="space-y-3 text-xs">
              {!isEss && (
                <select
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl hr-input font-semibold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — {e.department}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseClaim["category"])}
                className="w-full px-3 py-2.5 rounded-xl hr-input font-semibold"
              >
                <option value="Travel & Flights">{isId ? "Perjalanan & Tiket" : "Travel & Flights"}</option>
                <option value="Home Office & Gear">{isId ? "Perangkat Kerja" : "Home Office & Gear"}</option>
                <option value="Medical & Wellness">{isId ? "Kesehatan & Medis" : "Medical & Wellness"}</option>
                <option value="Client Hospitality">{isId ? "Jamuan Klien" : "Client Hospitality"}</option>
                <option value="Training & Cert">{isId ? "Pelatihan & Sertifikasi" : "Training & Cert"}</option>
              </select>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="px-3 py-2.5 rounded-xl hr-input font-bold"
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="col-span-2 px-3 py-2.5 rounded-xl hr-input font-mono font-bold"
                />
              </div>
              <input
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={isId ? "Deskripsi pengeluaran & referensi kwitansi..." : "Expense description & business purpose..."}
                className="w-full px-3 py-2.5 rounded-xl hr-input"
              />
              <button type="submit" className="btn-quantum w-full py-2.5 rounded-xl font-bold">
                {isId ? "Kirim Klaim Reimbursement" : "Submit Claim"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Register IT Asset Modal */}
      {assetModalOpen && canManageAssets && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setAssetModalOpen(false)}
        >
          <div
            className="w-full max-w-md hr-card rounded-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {isId ? "Registrasi Perangkat Aset IT" : "Register Corporate IT Asset"}
              </h3>
              <button type="button" onClick={() => setAssetModalOpen(false)}>
                <X className="w-5 h-5 hr-muted" />
              </button>
            </div>
            <form onSubmit={handleAddAsset} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  placeholder="Asset Tag"
                  className="px-3 py-2.5 rounded-xl hr-input font-mono"
                />
                <select
                  value={assetCat}
                  onChange={(e) => setAssetCat(e.target.value as CompanyAsset["category"])}
                  className="px-3 py-2.5 rounded-xl hr-input font-semibold"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Smartphone">Smartphone</option>
                  <option value="Access Card">{isId ? "Kartu Akses" : "Access Card"}</option>
                  <option value="Software Seat">{isId ? "Lisensi Software" : "Software Seat"}</option>
                </select>
              </div>
              <input
                required
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder={isId ? "Nama Model Perangkat" : "Device Model Name"}
                className="w-full px-3 py-2.5 rounded-xl hr-input"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder={isId ? "Nomor Seri" : "Serial Number"}
                  className="px-3 py-2.5 rounded-xl hr-input font-mono"
                />
                <input
                  type="number"
                  required
                  value={assetVal}
                  onChange={(e) => setAssetVal(e.target.value)}
                  placeholder="USD Value"
                  className="px-3 py-2.5 rounded-xl hr-input font-mono"
                />
              </div>
              <button type="submit" className="btn-quantum w-full py-2.5 rounded-xl font-bold">
                {isId ? "Simpan ke Inventaris IT" : "Save Asset to Vault"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
