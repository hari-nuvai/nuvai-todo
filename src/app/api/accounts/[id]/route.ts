import { NextRequest, NextResponse } from "next/server";
import {
  getAccountById,
  updateAccount,
  deleteAccount,
} from "@/lib/db/tracking-queries";
import { audit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const account = await getAccountById(id);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const updated = await updateAccount(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit("UPDATE", "account", id, body);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteAccount(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit("DELETE", "account", id, { email: deleted.email });
  return NextResponse.json(deleted);
}
