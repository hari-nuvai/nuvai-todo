import { NextRequest, NextResponse } from "next/server";
import { listAccounts, createAccount } from "@/lib/db/tracking-queries";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const planType = url.searchParams.get("planType") ?? undefined;
    const data = await listAccounts({ status, planType });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const account = await createAccount(body);
  await audit("CREATE", "account", account.id, { email: account.email });
  return NextResponse.json(account, { status: 201 });
}
