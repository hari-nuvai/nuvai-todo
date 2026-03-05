import { NextRequest, NextResponse } from "next/server";
import { getLaptopById, updateLaptop } from "@/lib/db/tracking-queries";
import { audit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const laptop = await getLaptopById(id);
  if (!laptop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(laptop);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const updated = await updateLaptop(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit("UPDATE", "laptop", id, body);
  return NextResponse.json(updated);
}
