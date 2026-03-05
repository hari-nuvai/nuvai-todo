import { NextResponse } from "next/server";
import { getTrackingDashboard } from "@/lib/db/tracking-queries";

export async function GET() {
  try {
    const data = await getTrackingDashboard();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load tracking dashboard" }, { status: 500 });
  }
}
