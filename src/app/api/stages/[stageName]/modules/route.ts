import { NextResponse } from "next/server";
import { getModulesForStage } from "@/lib/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ stageName: string }> }
) {
  const { stageName } = await params;
  try {
    const mods = await getModulesForStage(decodeURIComponent(stageName));
    return NextResponse.json(mods);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Stage not found";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
