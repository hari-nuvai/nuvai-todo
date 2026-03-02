import { NextResponse } from "next/server";
import { getStageModuleMatrix } from "@/lib/db/queries";

export async function GET() {
  const matrix = await getStageModuleMatrix();
  return NextResponse.json(matrix);
}
