import { NextResponse } from "next/server";
import { listStages, createStage } from "@/lib/db/queries";

export async function GET() {
  const stagesList = await listStages();
  return NextResponse.json(stagesList);
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const stage = await createStage(body.name, body.order);
    return NextResponse.json(stage, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create stage";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
