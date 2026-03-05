import { NextRequest, NextResponse } from "next/server";
import { getAccountUsers, assignUser, removeUser } from "@/lib/db/tracking-queries";
import { audit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const users = await getAccountUsers(id);
  return NextResponse.json(users);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const user = await assignUser({ accountId: id, ...body });
  await audit("ASSIGN_USER", "account", id, { userName: user.userName });
  return NextResponse.json(user, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId)
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  const deleted = await removeUser(userId);
  if (!deleted)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit("REMOVE_USER", "account", deleted.accountId, {
    userName: deleted.userName,
  });
  return NextResponse.json(deleted);
}
