import { NextResponse } from "next/server";
import { dashboard } from "@/lib/db/queries";

export async function GET() {
  const data = await dashboard();
  return NextResponse.json(data);
}
