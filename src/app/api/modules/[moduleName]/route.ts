import { NextResponse } from "next/server";
import { getModuleByName, deleteModule } from "@/lib/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ moduleName: string }> }
) {
  const { moduleName } = await params;
  const mod = await getModuleByName(decodeURIComponent(moduleName));
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  return NextResponse.json(mod);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ moduleName: string }> }
) {
  const { moduleName } = await params;
  const mod = await deleteModule(decodeURIComponent(moduleName));
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  return NextResponse.json({ deleted: mod.name });
}
