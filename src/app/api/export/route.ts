import { NextRequest, NextResponse } from "next/server";
import { getExportData } from "@/lib/db/tracking-queries";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "accounts";
  const data = await getExportData(type);
  return NextResponse.json(data);
}
