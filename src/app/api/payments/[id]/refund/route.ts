import { NextRequest, NextResponse } from "next/server";
import { refundPayment } from "@/lib/db/tracking-queries";
import { audit } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const updated = await refundPayment(id, body.reason);
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit("REFUND", "payment", id, { reason: body.reason });
  return NextResponse.json(updated);
}
