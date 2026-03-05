import { NextResponse } from "next/server";
import { getStageModuleMatrix } from "@/lib/db/queries";

export async function GET() {
  try {
    const matrix = await getStageModuleMatrix();
    return NextResponse.json(matrix, {
      headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load matrix" }, { status: 500 });
  }
}
