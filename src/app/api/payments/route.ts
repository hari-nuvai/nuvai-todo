import { NextRequest, NextResponse } from "next/server";
import { listPayments, createPayment } from "@/lib/db/tracking-queries";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const accountId = url.searchParams.get("accountId") ?? undefined;
    const refundedParam = url.searchParams.get("refunded");
    const refunded =
      refundedParam === "true" ? true : refundedParam === "false" ? false : undefined;
    const data = await listPayments({ accountId, refunded });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payment = await createPayment(body);
  await audit("CREATE", "payment", payment.id, {
    accountId: payment.accountId,
    amount: payment.amount,
  });
  return NextResponse.json(payment, { status: 201 });
}
