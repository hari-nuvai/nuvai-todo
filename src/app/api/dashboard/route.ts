import { NextResponse } from "next/server";
import { dashboard } from "@/lib/db/queries";

export async function GET() {
  try {
    const data = await dashboard();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
