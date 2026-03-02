import { NextResponse } from "next/server";
import { dailySummary } from "@/lib/db/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;
  const data = await dailySummary(date);
  return NextResponse.json(data);
}
