import { NextResponse } from "next/server";
import { getAllTasks } from "@/lib/db/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filters: {
    date?: string;
    phase?: number;
    assignee?: string;
    done?: boolean;
  } = {};

  if (searchParams.has("date")) filters.date = searchParams.get("date")!;
  if (searchParams.has("phase"))
    filters.phase = parseInt(searchParams.get("phase")!, 10);
  if (searchParams.has("assignee"))
    filters.assignee = searchParams.get("assignee")!;
  if (searchParams.has("done")) filters.done = searchParams.get("done") === "true";

  const tasks = await getAllTasks(filters);
  return NextResponse.json(tasks);
}
