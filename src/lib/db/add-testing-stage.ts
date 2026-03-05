import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function addTestingStage() {
  // Insert Testing stage with order 3
  await db
    .insert(schema.stages)
    .values({ name: "Testing", order: 3 })
    .onConflictDoNothing({ target: schema.stages.name });

  // Bump orders for Completed, Blocked, On Hold
  const updates: [string, number][] = [
    ["Completed", 4],
    ["Blocked", 5],
    ["On Hold", 6],
  ];
  for (const [name, order] of updates) {
    await db
      .update(schema.stages)
      .set({ order })
      .where(eq(schema.stages.name, name));
  }

  const all = await db.select().from(schema.stages).orderBy(schema.stages.order);
  console.log("Stages:", all.map((s) => `${s.order}. ${s.name}`).join(", "));
}

addTestingStage().catch(console.error);
