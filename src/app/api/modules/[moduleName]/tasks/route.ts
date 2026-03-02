import { NextResponse } from "next/server";
import { getTasksForModule, addTask } from "@/lib/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ moduleName: string }> }
) {
  const { moduleName } = await params;
  try {
    const tasks = await getTasksForModule(decodeURIComponent(moduleName));
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ moduleName: string }> }
) {
  const { moduleName } = await params;
  const body = await req.json();
  try {
    const task = await addTask({
      moduleName: decodeURIComponent(moduleName),
      text: body.text,
      phase: body.phase,
      assignee: body.assignee,
      date: body.date,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to add task";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
