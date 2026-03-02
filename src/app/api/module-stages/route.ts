import { NextResponse } from "next/server";
import {
  linkModuleToStage,
  unlinkModuleFromStage,
  setModuleStatus,
} from "@/lib/db/queries";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    // If used as status change (module + stage), use setModuleStatus
    const result = await setModuleStatus(body.module, body.stage);
    return NextResponse.json(result, { status: 200 });
  } catch {
    // Fallback to link
    try {
      const link = await linkModuleToStage(body.module, body.stage);
      return NextResponse.json(link, { status: 201 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
}

export async function DELETE(req: Request) {
  const body = await req.json();
  try {
    const deleted = await unlinkModuleFromStage(body.module, body.stage);
    if (!deleted)
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    return NextResponse.json(deleted);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to unlink";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
