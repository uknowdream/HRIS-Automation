import { NextResponse } from "next/server";
import { ALL_QUESTIONS, ASSESSMENT_BATTERIES, ASSESSMENT_PRESETS } from "@/lib/psychometrics";

export async function GET() {
  return NextResponse.json({
    status: "operational",
    platform: "AetherHR Global HRIS & Psychometric Automation",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    runtime: "nodejs-fluid-compute",
    capabilities: {
      questionBankTotal: ALL_QUESTIONS.length,
      batteries: ASSESSMENT_BATTERIES.length,
      presets: ASSESSMENT_PRESETS.length,
      signedStatelessTokens: true,
      emailProviders: {
        resendEnvConfigured: Boolean(process.env.RESEND_API_KEY),
        smtpEnvConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
      },
      whatsappProviders: {
        metaCloudEnvConfigured: Boolean(
          process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
        ),
        customGatewayEnvConfigured: Boolean(process.env.WHATSAPP_GATEWAY_URL),
        instantDispatchReady: true,
      },
      webhooks: {
        outboundHmacSha256: true,
        inboundRestApi: "/api/webhooks/inbound",
        calendarIcsEngine: "/api/calendar/ics",
      },
    },
  });
}
