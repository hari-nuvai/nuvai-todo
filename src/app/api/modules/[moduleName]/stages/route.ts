import { NextResponse } from "next/server";
import { getStagesForModule } from "@/lib/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ moduleName: string }> }
) {
  const { moduleName } = await params;
  try {
    const stagesList = await getStagesForModule(
      decodeURIComponent(moduleName)
    );
    return NextResponse.json(stagesList);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Module not found";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
