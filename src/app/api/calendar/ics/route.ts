import { NextRequest, NextResponse } from "next/server";

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "AetherHR Cognitive & Psychometric Assessment";
  const description =
    searchParams.get("description") ||
    "Scheduled automated session via AetherHR Global HRIS Automation Platform.";
  const location = searchParams.get("location") || "https://hris-automation.vercel.app";
  const durationMin = Number(searchParams.get("duration") || "60");
  const startParam = searchParams.get("start");

  const startDate = startParam ? new Date(startParam) : new Date(Date.now() + 24 * 3600 * 1000);
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

  const safeDesc = description.replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AetherHR Global//HRIS Automation Engine 2.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:aetherhr-${Date.now()}@aetherhr.global`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${safeDesc}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="aetherhr-invite.ics"`,
    },
  });
}
