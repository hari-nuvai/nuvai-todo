import { NextResponse } from "next/server";
import { getModuleByName, deleteModule, renameModule } from "@/lib/db/queries";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ moduleName: string }> }
) {
  const { moduleName } = await params;
  const body = await req.json();
  const newName = body.name?.trim();
  if (!newName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const existing = await getModuleByName(newName);
  if (existing) {
    return NextResponse.json({ error: "A module with that name already exists" }, { status: 409 });
  }
  const updated = await renameModule(decodeURIComponent(moduleName), newName);
  if (!updated) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
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
