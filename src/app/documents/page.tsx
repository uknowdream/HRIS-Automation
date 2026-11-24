"use client";

import React, { useRef, useState } from "react";
import {
  FileSignature,
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  Plus,
  PenTool,
  Printer,
  ShieldCheck,
  X,
  RotateCcw,
  Send,
} from "lucide-react";
import { useHRIS } from "@/context/HRISContext";
import type { CompanyAnnouncement, HRDocument } from "@/types/hris";

export default function DocumentsAndESignPage() {
  const {
    locale,
    activeRole,
    authUser,
    currentEmployee,
    hasPermission,
    employees,
    documents,
    announcements,
    signDocument,
    addDocument,
    publishAnnouncement,
  } = useHRIS();
  const isId = locale === "id";
  const canManageDocs = hasPermission("documents:manage");
  const isEss = activeRole === "Employee";

  const [signingDoc, setSigningDoc] = useState<HRDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<HRDocument | null>(null);
  const [signerName, setSignerName] = useState(authUser.name);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  // Create Document Modal
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<HRDocument["docType"]>("PKWT Fixed-Term");
  const [docEmpId, setDocEmpId] = useState(employees[0]?.id || "emp-01");
  const [docExpiry, setDocExpiry] = useState("2027-11-24");

  // Announcement Form
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annCat, setAnnCat] = useState<CompanyAnnouncement["category"]>("Policy");

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    drawingRef.current = true;
    setHasDrawn(true);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirmSign = () => {
    if (!signingDoc || !signerName.trim()) return;
    const dataUrl = canvasRef.current ? canvasRef.current.toDataURL("image/png") : "";
    signDocument(signingDoc.id, signerName.trim(), dataUrl);
    setSigningDoc(null);
    setHasDrawn(false);
  };

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((item) => item.id === docEmpId) || employees[0];
    if (!emp || !docTitle.trim()) return;
    addDocument({
      title: docTitle.trim(),
      docType,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      issueDate: new Date().toISOString().slice(0, 10),
      expiryDate: docType === "PKWTT Permanent" ? null : docExpiry,
      status: "Awaiting Signature",
    });
    setDocTitle("");
    setNewDocOpen(false);
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim() || !canManageDocs) return;
    publishAnnouncement({
      title: annTitle.trim(),
      body: annBody.trim(),
      category: annCat,
      author: `${authUser.name} · ${activeRole}`,
      channels: ["Portal", "Email", "WhatsApp", "Mobile Push"],
    });
    setAnnTitle("");
    setAnnBody("");
  };

  const visibleDocuments = isEss
    ? documents.filter((d) => d.employeeId === currentEmployee.id)
    : documents;

  const expiringDocs = visibleDocuments.filter(
    (d) => d.status === "Expiring Soon" || d.status === "Awaiting Signature"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <FileSignature className="w-6 h-6 text-indigo-600 dark:text-cyan-400" />
            {isId ? "Kontrak Digital, E-Signature & Pengumuman Perusahaan" : "Digital Contracts, E-Signature & Announcements"}
          </h1>
          <p className="text-xs hr-muted mt-1">
            {isId
              ? "Tanda tangan elektronik (Canvas E-Sign + SHA-256), radar pengingat kontrak PKWT habis masa berlaku, dan broadcast kebijakan."
              : "Live Canvas E-Signature with SHA-256 sealing, contract expiry alerts, and omnichannel policy broadcasts."}
          </p>
        </div>
        {canManageDocs && (
          <button
            type="button"
            onClick={() => setNewDocOpen(true)}
            className="btn-quantum px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> {isId ? "Buat Kontrak / Offer Letter" : "Draft Contract / Offer"}
          </button>
        )}
      </div>

      {/* Expiry / Pending Signature Radar */}
      {expiringDocs.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/12 border border-amber-500/35 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              {expiringDocs.length}{" "}
              {isId
                ? "dokumen membutuhkan tanda tangan E-Sign atau segera berakhir masa kontraknya (PKWT Radar)."
                : "contracts require E-Signature or are expiring soon."}
            </span>
          </div>
          <button
            onClick={() => setSigningDoc(expiringDocs[0])}
            className="btn-quantum px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <PenTool className="w-3.5 h-3.5" /> {isId ? "Tanda Tangani Sekarang" : "E-Sign Now"}
          </button>
        </div>
      )}

      {/* Contracts & E-Sign Vault */}
      <div className="hr-card rounded-2xl p-5 overflow-x-auto">
        <h2 className="text-base font-bold mb-4">
          {isId ? "Brankas Dokumen HR & Status E-Signature" : "HR Contract Vault & E-Signature Status"}
        </h2>
        <table className="w-full text-left text-xs min-w-[780px]">
          <thead className="hr-muted border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <tr>
              <th className="py-2.5 px-3">Document & Type</th>
              <th className="py-2.5 px-3">Employee / Candidate</th>
              <th className="py-2.5 px-3">Expiry / Term</th>
              <th className="py-2.5 px-3">Verification Hash</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {visibleDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-indigo-500/4">
                <td className="py-3 px-3">
                  <div className="font-bold">{doc.title}</div>
                  <div className="text-[11px] text-indigo-600 dark:text-cyan-400 font-semibold">{doc.docType}</div>
                </td>
                <td className="py-3 px-3">
                  <div className="font-semibold">{doc.employeeName}</div>
                  <div className="text-[11px] hr-muted">{doc.department}</div>
                </td>
                <td className="py-3 px-3 font-mono">
                  {doc.expiryDate || "Permanent (Indefinite)"}
                </td>
                <td className="py-3 px-3 font-mono text-[10px] hr-muted">
                  {doc.verificationHash ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" /> {doc.verificationHash.slice(0, 20)}...
                    </span>
                  ) : (
                    "Pending Signature"
                  )}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === "Signed"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : doc.status === "Expiring Soon"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300"
                    }`}
                  >
                    {doc.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  {doc.status !== "Signed" ? (
                    <button
                      onClick={() => setSigningDoc(doc)}
                      className="btn-quantum px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <PenTool className="w-3 h-3" /> E-Sign
                    </button>
                  ) : (
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="px-3 py-1.5 rounded-lg hr-btn-secondary text-[11px] font-semibold inline-flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" /> View Signed PDF
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Announcements Broadcast Center */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {canManageDocs && (
          <form onSubmit={handlePublishAnnouncement} className="xl:col-span-5 hr-card rounded-2xl p-5 space-y-3.5">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              {isId ? "Siarkan Pengumuman Perusahaan" : "Broadcast Company Announcement"}
            </h2>
            <select
              value={annCat}
              onChange={(e) => setAnnCat(e.target.value as CompanyAnnouncement["category"])}
              className="w-full px-3 py-2 rounded-xl text-xs hr-input"
            >
              <option value="Policy">HR Policy Update</option>
              <option value="Payroll & Tax">Payroll & Tax Notice</option>
              <option value="Company News">Company News</option>
              <option value="Event">Townhall & Event</option>
            </select>
            <input
              required
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder={isId ? "Judul pengumuman..." : "Announcement headline..."}
              className="w-full px-3 py-2.5 rounded-xl text-xs hr-input"
            />
            <textarea
              required
              rows={3}
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              placeholder={isId ? "Isi pesan pengumuman yang dikirim ke Portal, Email, WA & Mobile App..." : "Message to publish across Portal, Email, WhatsApp & Mobile App..."}
              className="w-full px-3 py-2.5 rounded-xl text-xs hr-input"
            />
            <button type="submit" className="btn-emerald w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> {isId ? "Publikasikan ke Semua Karyawan" : "Broadcast to All Employees"}
            </button>
          </form>
        )}

        <div className={`${canManageDocs ? "xl:col-span-7" : "xl:col-span-12"} hr-card rounded-2xl p-5 space-y-3`}>
          <h2 className="text-base font-bold">
            {isId ? "Papan Pengumuman Aktif" : "Live Company Feed"} ({announcements.length})
          </h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="p-4 rounded-xl hr-subtle space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/12 text-indigo-600 dark:text-indigo-300">
                    {a.category}
                  </span>
                  <span className="text-[11px] hr-muted">{a.channels.join(" · ")}</span>
                </div>
                <h3 className="text-sm font-black">{a.title}</h3>
                <p className="text-xs hr-muted leading-relaxed">{a.body}</p>
                <div className="text-[11px] font-semibold text-indigo-600 dark:text-cyan-400 pt-1">
                  {a.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Canvas E-Signature Modal */}
      {signingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSigningDoc(null)}
        >
          <div className="w-full max-w-lg hr-card rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-cyan-400">
                  SHA-256 Digital E-Signature Pad
                </span>
                <h3 className="text-base font-black mt-0.5">{signingDoc.title}</h3>
                <p className="text-xs hr-muted">{signingDoc.employeeName} · {signingDoc.docType}</p>
              </div>
              <button onClick={() => setSigningDoc(null)}><X className="w-5 h-5 hr-muted" /></button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">Signer Full Name</label>
              <input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs hr-input"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">
                  {isId ? "Goreskan Tanda Tangan di Area Putih:" : "Draw Signature Below (Mouse or Touch):"}
                </span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-indigo-600 font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={460}
                height={150}
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
                className="w-full h-36 rounded-xl bg-white border-2 border-dashed border-indigo-300 cursor-crosshair touch-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] hr-muted flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {hasDrawn ? "Signature stroke captured" : "Click & drag to sign (or type-seal)"}
              </span>
              <button
                onClick={handleConfirmSign}
                className="btn-emerald px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {isId ? "Sahkan & Segel SHA-256" : "Sign & Seal SHA-256"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signed Legal Contract Viewer Modal */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewingDoc(null)}
        >
          <div className="w-full max-w-2xl hr-card rounded-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-cyan-400">
                  AetherHR Global Technologies · Executed Legal Document
                </div>
                <h3 className="text-lg font-black mt-1">{viewingDoc.title}</h3>
                <p className="text-xs hr-muted">
                  {viewingDoc.docType} · Party: {viewingDoc.employeeName} ({viewingDoc.department})
                </p>
              </div>
              <button onClick={() => setViewingDoc(null)} className="no-print"><X className="w-5 h-5 hr-muted" /></button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed hr-muted">
              <p>
                This Employment & Confidentiality Agreement is executed electronically between <strong>AetherHR Global Technologies</strong> and <strong>{viewingDoc.employeeName}</strong> effective <strong>{viewingDoc.issueDate}</strong>{viewingDoc.expiryDate ? ` through ${viewingDoc.expiryDate}` : " on a permanent basis"}.
              </p>
              <p>
                Both parties affirm compliance with applicable international labor standards, data protection (UU PDP / GDPR), intellectual property confidentiality, and statutory compensation & social security provisions.
              </p>
            </div>

            <div className="p-4 rounded-xl hr-subtle border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Electronic Signature Seal</span>
                <span className="badge-success px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SHA-256 Verified
                </span>
              </div>
              {viewingDoc.signatureDataUrl ? (
                <div className="bg-white rounded-lg p-2 border border-slate-200 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingDoc.signatureDataUrl}
                    alt={`Signature of ${viewingDoc.signedBy}`}
                    className="h-20 object-contain"
                  />
                </div>
              ) : (
                <div className="font-serif italic text-xl text-indigo-700 dark:text-indigo-300 py-2">
                  {viewingDoc.signedBy || viewingDoc.employeeName}
                </div>
              )}
              <div className="text-[11px] font-mono hr-muted space-y-0.5">
                <div>Signed By: {viewingDoc.signedBy}</div>
                <div>Timestamp: {viewingDoc.signedAt || viewingDoc.issueDate}</div>
                <div>Fingerprint: {viewingDoc.verificationHash}</div>
              </div>
            </div>

            <div className="no-print flex justify-end gap-2">
              <button onClick={() => setViewingDoc(null)} className="px-4 py-2 rounded-xl text-xs hr-btn-secondary">Close</button>
              <button onClick={() => window.print()} className="btn-quantum px-5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Print / Save Signed PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contract Modal */}
      {newDocOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setNewDocOpen(false)}
        >
          <div className="w-full max-w-md hr-card rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">{isId ? "Buat Dokumen Kontrak Baru" : "Draft New HR Contract"}</h3>
              <button onClick={() => setNewDocOpen(false)}><X className="w-5 h-5 hr-muted" /></button>
            </div>
            <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
              <input required value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Contract / Offer Letter Title *" className="w-full px-3 py-2.5 rounded-xl hr-input" />
              <select value={docType} onChange={(e) => setDocType(e.target.value as HRDocument["docType"])} className="w-full px-3 py-2.5 rounded-xl hr-input">
                <option value="PKWT Fixed-Term">PKWT Fixed-Term</option>
                <option value="PKWTT Permanent">PKWTT Permanent</option>
                <option value="Global EOR Contract">Global EOR Contract</option>
                <option value="Offer Letter">Offer Letter</option>
                <option value="Mutual NDA">Mutual NDA</option>
              </select>
              <select value={docEmpId} onChange={(e) => setDocEmpId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl hr-input">
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                ))}
              </select>
              <input type="date" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} className="w-full px-3 py-2.5 rounded-xl hr-input" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNewDocOpen(false)} className="px-4 py-2 rounded-xl hr-btn-secondary">Cancel</button>
                <button type="submit" className="btn-quantum px-5 py-2 rounded-xl font-bold">Create & Send for E-Sign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
