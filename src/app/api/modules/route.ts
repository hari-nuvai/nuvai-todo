import { NextResponse } from "next/server";
import { listModules, createModule } from "@/lib/db/queries";

export async function GET() {
  const mods = await listModules();
  return NextResponse.json(mods);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  try {
    const mod = await createModule(name);
    return NextResponse.json(mod, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Module already exists or invalid" },
      { status: 409 }
    );
  }
}
