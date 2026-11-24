import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { signInviteToken, signWebhookPayload } from "@/lib/token";
import { ASSESSMENT_PRESETS } from "@/lib/psychometrics";
import type { AssessmentCategory } from "@/types/hris";

interface SendInviteRequest {
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  role: string;
  department?: string;
  companyName?: string;
  presetId?: string;
  categories?: AssessmentCategory[];
  durationMinutes?: number;
  expressLimitPerCategory?: number;
  expiryHours?: number;
  proctoringStrict?: boolean;
  channels: ("Email" | "WhatsApp")[];
  locale?: "id" | "en";
  customMessage?: string;
  // Optional live credentials passed from Settings UI (fallback to process.env)
  config?: {
    resendApiKey?: string;
    resendFromEmail?: string;
    smtpHost?: string;
    smtpPort?: string;
    smtpUser?: string;
    smtpPass?: string;
    whatsappMode?: "instant_link" | "meta_cloud" | "custom_gateway";
    whatsappAccessToken?: string;
    whatsappPhoneNumberId?: string;
    whatsappGatewayUrl?: string;
    whatsappGatewayToken?: string;
    primaryWebhookUrl?: string;
    webhookSecret?: string;
    slackWebhookUrl?: string;
  };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  return digits;
}

function buildEmailHtml(params: {
  candidateName: string;
  role: string;
  companyName: string;
  inviteUrl: string;
  durationMinutes: number;
  expiryDisplay: string;
  locale: "id" | "en";
  customMessage?: string;
}) {
  const isId = params.locale === "id";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#060913;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0;">
  <div style="max-width:600px;margin:28px auto;background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0891b2,#4f46e5,#059669);padding:28px 32px;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e0f2fe;font-weight:700;">${params.companyName}</div>
      <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;">${isId ? "Undangan Asesmen Kognitif & Psikotes Online" : "Cognitive & Psychometric Assessment Invitation"}</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;line-height:1.6;margin-top:0;">${isId ? `Halo <strong>${params.candidateName}</strong>,` : `Hello <strong>${params.candidateName}</strong>,`}</p>
      <p style="font-size:14px;line-height:1.6;color:#cbd5e1;">
        ${
          params.customMessage ||
          (isId
            ? `Selamat! Anda diundang untuk mengikuti tahap <strong>Asesmen Kemampuan Kognitif & Psikotes Internasional</strong> untuk posisi <strong>${params.role}</strong> di ${params.companyName}.`
            : `Congratulations! You have been invited to complete our <strong>International Cognitive & Psychometric Assessment</strong> for the <strong>${params.role}</strong> position at ${params.companyName}.`)
        }
      </p>
      <div style="background:#0b1120;border:1px solid #1e293b;border-radius:12px;padding:18px 20px;margin:22px 0;">
        <div style="font-size:13px;color:#94a3b8;margin-bottom:6px;">${isId ? "Detail Sesi Asesmen" : "Assessment Session Details"}</div>
        <div style="font-size:14px;color:#f8fafc;">• <strong>${isId ? "Posisi" : "Role"}:</strong> ${params.role}</div>
        <div style="font-size:14px;color:#f8fafc;">• <strong>${isId ? "Durasi Terkalibrasi" : "Calibrated Duration"}:</strong> ${params.durationMinutes} ${isId ? "Menit" : "Minutes"}</div>
        <div style="font-size:14px;color:#f8fafc;">• <strong>${isId ? "Batas Waktu Akses" : "Link Valid Until"}:</strong> ${params.expiryDisplay}</div>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${params.inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#6366f1);color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;font-size:15px;">
          ${isId ? "Mulai Tes Kognitif & Psikotes Sekarang →" : "Launch Cognitive & Psychometric Test →"}
        </a>
      </div>
      <p style="font-size:12px;color:#64748b;line-height:1.6;">
        ${isId ? "Atau salin tautan unik terenkripsi berikut ke browser Anda:" : "Or copy this unique cryptographically signed link into your browser:"}<br/>
        <a href="${params.inviteUrl}" style="color:#38bdf8;word-break:break-all;">${params.inviteUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const body = (await request.json()) as SendInviteRequest;

    if (!body.candidateName || !body.role) {
      return NextResponse.json(
        { ok: false, error: "candidateName and role are required" },
        { status: 400 }
      );
    }

    const preset =
      ASSESSMENT_PRESETS.find((p) => p.id === body.presetId) || ASSESSMENT_PRESETS[0];
    const categories: AssessmentCategory[] =
      body.categories && body.categories.length > 0 ? body.categories : preset.categories;
    const durationMinutes = body.durationMinutes || preset.durationMinutes;
    const expiryHours = body.expiryHours || 72;
    const issuedAt = Date.now();
    const expiresAt = issuedAt + expiryHours * 3600 * 1000;
    const companyName = body.companyName || "AetherHR Global Technologies";
    const locale = body.locale || "id";
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const token = signInviteToken({
      id: invitationId,
      candidateName: body.candidateName.trim(),
      candidateEmail: (body.candidateEmail || "").trim(),
      candidatePhone: normalizePhone(body.candidatePhone || ""),
      role: body.role.trim(),
      department: body.department || "General",
      companyName,
      categories,
      presetId: preset.id,
      durationMinutes,
      expressLimitPerCategory:
        body.expressLimitPerCategory ?? preset.expressLimitPerCategory,
      proctoringStrict: body.proctoringStrict ?? true,
      issuedAt,
      expiresAt,
    });

    const host = request.headers.get("host") || "hris-automation.vercel.app";
    const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || `${proto}://${host}`;
    const inviteUrl = `${origin}/assess/${token}`;
    const expiryDisplay = new Date(expiresAt).toLocaleString(
      locale === "id" ? "id-ID" : "en-US",
      { dateStyle: "medium", timeStyle: "short" }
    );

    const channels = body.channels?.length ? body.channels : ["Email", "WhatsApp"];
    const cleanPhone = normalizePhone(body.candidatePhone || "");

    // Build personalized WhatsApp message
    const defaultWaMsg =
      locale === "id"
        ? `Halo *${body.candidateName}* 👋\n\nAnda diundang oleh *${companyName}* untuk mengikuti *Tes Kemampuan Kognitif & Psikotes Online* untuk posisi *${body.role}*.\n\n⏱ Durasi: *${durationMinutes} Menit*\n📋 Modul: *${categories.length} Baterai Asesmen*\n⏳ Berlaku hingga: *${expiryDisplay}*\n\nSilakan klik tautan eksklusif Anda di bawah ini untuk memulai tes:\n${inviteUrl}\n\nPastikan koneksi stabil & lingkungan tenang. Semoga sukses! 🚀`
        : `Hello *${body.candidateName}* 👋\n\nYou are invited by *${companyName}* to complete the *International Cognitive & Psychometric Assessment* for the *${body.role}* position.\n\n⏱ Duration: *${durationMinutes} Minutes*\n📋 Modules: *${categories.length} Assessment Batteries*\n⏳ Valid until: *${expiryDisplay}*\n\nLaunch your exclusive encrypted assessment link below:\n${inviteUrl}\n\nPlease ensure a quiet space & stable connection. Best of luck! 🚀`;

    const waMessage = body.customMessage
      ? `${body.customMessage}\n\nLink Tes: ${inviteUrl}`
      : defaultWaMsg;

    const whatsappLaunchUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

    const emailSubject =
      locale === "id"
        ? `[${companyName}] Undangan Tes Kognitif & Psikotes — ${body.role}`
        : `[${companyName}] Cognitive & Psychometric Assessment Invitation — ${body.role}`;

    const emailHtml = buildEmailHtml({
      candidateName: body.candidateName,
      role: body.role,
      companyName,
      inviteUrl,
      durationMinutes,
      expiryDisplay,
      locale,
      customMessage: body.customMessage,
    });

    const mailtoUrl = `mailto:${encodeURIComponent(body.candidateEmail || "")}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(waMessage.replace(/\*/g, ""))}`;

    // 1. EMAIL DISPATCH (Resend -> SMTP -> Smart Sandbox)
    let emailStatus: "Delivered (Live)" | "Queued (Smart Sandbox)" | "Not Sent" | "Failed" =
      "Not Sent";
    let emailDetail = "Channel not selected";

    if (channels.includes("Email") && body.candidateEmail) {
      const resendKey = body.config?.resendApiKey || process.env.RESEND_API_KEY;
      const resendFrom =
        body.config?.resendFromEmail ||
        process.env.RESEND_FROM_EMAIL ||
        "AetherHR <onboarding@resend.dev>";
      const smtpHost = body.config?.smtpHost || process.env.SMTP_HOST;
      const smtpUser = body.config?.smtpUser || process.env.SMTP_USER;
      const smtpPass = body.config?.smtpPass || process.env.SMTP_PASS;
      const smtpPort = Number(body.config?.smtpPort || process.env.SMTP_PORT || 587);

      if (resendKey) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: resendFrom,
              to: [body.candidateEmail],
              subject: emailSubject,
              html: emailHtml,
            }),
          });
          if (res.ok) {
            emailStatus = "Delivered (Live)";
            emailDetail = `Sent via Resend API to ${body.candidateEmail}`;
          } else {
            const errText = await res.text();
            emailStatus = "Queued (Smart Sandbox)";
            emailDetail = `Resend returned ${res.status}; mailto & link ready (${errText.slice(0, 120)})`;
          }
        } catch (err) {
          emailStatus = "Queued (Smart Sandbox)";
          emailDetail = `Resend unreachable (${err instanceof Error ? err.message : "network error"}); instant link ready`;
        }
      } else if (smtpHost && smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });
          await transporter.sendMail({
            from: smtpUser,
            to: body.candidateEmail,
            subject: emailSubject,
            html: emailHtml,
          });
          emailStatus = "Delivered (Live)";
          emailDetail = `Sent via SMTP (${smtpHost}) to ${body.candidateEmail}`;
        } catch (err) {
          emailStatus = "Queued (Smart Sandbox)";
          emailDetail = `SMTP fallback (${err instanceof Error ? err.message : "error"}); mailto ready`;
        }
      } else {
        emailStatus = "Queued (Smart Sandbox)";
        emailDetail =
          "Signed link & HTML email generated — configure Resend/SMTP in Settings for silent background send, or click 1-Tap Mailto.";
      }
    }

    // 2. WHATSAPP DISPATCH (Meta Cloud API -> Fonnte/Custom Gateway -> Instant wa.me)
    let whatsappStatus: "Delivered (API)" | "Ready (wa.me Dispatch)" | "Not Sent" | "Failed" =
      "Not Sent";
    let whatsappDetail = "Channel not selected";

    if (channels.includes("WhatsApp")) {
      const waToken = body.config?.whatsappAccessToken || process.env.WHATSAPP_ACCESS_TOKEN;
      const waPhoneId = body.config?.whatsappPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
      const gwUrl = body.config?.whatsappGatewayUrl || process.env.WHATSAPP_GATEWAY_URL;
      const gwToken = body.config?.whatsappGatewayToken || process.env.WHATSAPP_GATEWAY_TOKEN;

      if (waToken && waPhoneId && cleanPhone) {
        try {
          const waRes = await fetch(
            `https://graph.facebook.com/v21.0/${waPhoneId}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${waToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: cleanPhone,
                type: "text",
                text: { preview_url: true, body: waMessage },
              }),
            }
          );
          if (waRes.ok) {
            whatsappStatus = "Delivered (API)";
            whatsappDetail = `Sent via Meta WhatsApp Cloud API to +${cleanPhone}`;
          } else {
            whatsappStatus = "Ready (wa.me Dispatch)";
            whatsappDetail = `Meta API ${waRes.status} — 1-Click wa.me launcher ready`;
          }
        } catch {
          whatsappStatus = "Ready (wa.me Dispatch)";
          whatsappDetail = "1-Click WhatsApp launcher ready";
        }
      } else if (gwUrl && cleanPhone) {
        try {
          const gwRes = await fetch(gwUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(gwToken ? { Authorization: gwToken } : {}),
            },
            body: JSON.stringify({
              target: cleanPhone,
              phone: cleanPhone,
              message: waMessage,
              inviteUrl,
            }),
          });
          if (gwRes.ok) {
            whatsappStatus = "Delivered (API)";
            whatsappDetail = `Dispatched via WhatsApp Gateway (${gwUrl}) to +${cleanPhone}`;
          } else {
            whatsappStatus = "Ready (wa.me Dispatch)";
            whatsappDetail = `Gateway returned ${gwRes.status}; 1-Click wa.me ready`;
          }
        } catch {
          whatsappStatus = "Ready (wa.me Dispatch)";
          whatsappDetail = "Gateway offline — 1-Click wa.me launcher ready";
        }
      } else {
        whatsappStatus = "Ready (wa.me Dispatch)";
        whatsappDetail = `Personalized WhatsApp invite ready for +${cleanPhone || "recipient"} (1-click launch or connect Meta/Fonnte API in Settings).`;
      }
    }

    // 3. OPTIONAL OUTBOUND WEBHOOK / SLACK BROADCAST
    let webhookDispatched = false;
    const webhookUrl = body.config?.primaryWebhookUrl || process.env.DEFAULT_WEBHOOK_URL;
    if (webhookUrl && webhookUrl.startsWith("http")) {
      const eventPayload = JSON.stringify({
        event: "invitation.sent",
        timestamp: new Date().toISOString(),
        data: {
          invitationId,
          candidateName: body.candidateName,
          candidateEmail: body.candidateEmail,
          candidatePhone: cleanPhone,
          role: body.role,
          inviteUrl,
          durationMinutes,
          expiresAt: new Date(expiresAt).toISOString(),
        },
      });
      fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AetherHR-Event": "invitation.sent",
          "X-AetherHR-Signature": signWebhookPayload(eventPayload, body.config?.webhookSecret),
        },
        body: eventPayload,
      }).catch(() => {});
      webhookDispatched = true;
    }

    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - started,
      invitation: {
        id: invitationId,
        token,
        inviteUrl,
        candidateId: body.candidateId || `cand_${Date.now()}`,
        candidateName: body.candidateName.trim(),
        candidateEmail: body.candidateEmail || "",
        candidatePhone: cleanPhone,
        role: body.role.trim(),
        department: body.department || "General",
        categories,
        presetId: preset.id,
        durationMinutes,
        expiresAt: new Date(expiresAt).toISOString(),
        sentAt: new Date(issuedAt).toISOString(),
        channels,
        emailStatus,
        whatsappStatus,
        whatsappLaunchUrl,
        proctoringStrict: body.proctoringStrict ?? true,
        status: "Pending",
      },
      delivery: {
        emailDetail,
        whatsappDetail,
        mailtoUrl,
        whatsappLaunchUrl,
        whatsappMessageText: waMessage,
        emailSubject,
        webhookDispatched,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to dispatch invitation",
      },
      { status: 500 }
    );
  }
}
