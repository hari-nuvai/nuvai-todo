import { NextResponse } from "next/server";
import { getOwner, setOwner } from "@/lib/db/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const moduleName = searchParams.get("module");
  if (!moduleName) {
    return NextResponse.json(
      { error: "module query param required" },
      { status: 400 }
    );
  }
  try {
    const owner = await getOwner(moduleName);
    return NextResponse.json({ owner });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to get owner";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const updated = await setOwner(body.module, body.owner);
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to set owner";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
