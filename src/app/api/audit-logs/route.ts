import { NextRequest, NextResponse } from "next/server";
import { listAuditLogs } from "@/lib/db/tracking-queries";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const entityType = url.searchParams.get("entityType") ?? undefined;
    const userId = url.searchParams.get("userId") ?? undefined;
    const data = await listAuditLogs({ entityType, userId });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
