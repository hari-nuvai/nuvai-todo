import { NextResponse } from "next/server";
import { completeTask, assignTask, removeTask } from "@/lib/db/queries";

type Params = { params: Promise<{ moduleName: string; taskId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { moduleName, taskId } = await params;
  const body = await req.json();
  const id = parseInt(taskId, 10);
  const mod = decodeURIComponent(moduleName);

  try {
    if (body.action === "complete") {
      const task = await completeTask(mod, id);
      if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(task);
    }

    if (body.action === "assign" && body.assignee) {
      const task = await assignTask(mod, id, body.assignee);
      if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(task);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { moduleName, taskId } = await params;
  const id = parseInt(taskId, 10);
  const mod = decodeURIComponent(moduleName);

  try {
    const task = await removeTask(mod, id);
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: task.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
