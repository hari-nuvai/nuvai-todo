import { NextRequest, NextResponse } from "next/server";
import { listLaptops, createLaptop } from "@/lib/db/tracking-queries";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? undefined;
    const assignedTo = url.searchParams.get("assignedTo") ?? undefined;
    const data = await listLaptops({ type, assignedTo });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const laptop = await createLaptop(body);
  await audit("CREATE", "laptop", laptop.id, { assetTag: laptop.assetTag });
  return NextResponse.json(laptop, { status: 201 });
}
