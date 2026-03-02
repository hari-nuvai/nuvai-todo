import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .selectDistinct({ assignee: tasks.assignee })
    .from(tasks)
    .where(sql`${tasks.assignee} != 'Unassigned'`)
    .orderBy(tasks.assignee);
  return NextResponse.json(rows.map((r) => r.assignee));
}
