import { NextResponse } from "next/server";
import { weeklySummary } from "@/lib/db/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart") ?? undefined;
  const summary = await weeklySummary(weekStart);
  return NextResponse.json(summary);
}
