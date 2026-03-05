import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function run() {
  // List all modules
  const all = await db.select().from(schema.modules);
  console.log("All modules:", all.map((m) => m.name).join(", "));

  // Find todo module (try various names)
  for (const name of ["NuvaiTodo", "todo", "Todo", "nuvai-todo"]) {
    const [mod] = await db
      .select()
      .from(schema.modules)
      .where(eq(schema.modules.name, name))
      .limit(1);
    if (mod) {
      console.log(`Found: "${mod.name}" (id: ${mod.id})`);
      const [stage] = await db
        .select()
        .from(schema.stages)
        .where(eq(schema.stages.name, "Completed"))
        .limit(1);
      if (stage) {
        await db
          .delete(schema.moduleStages)
          .where(eq(schema.moduleStages.moduleId, mod.id));
        await db.insert(schema.moduleStages).values({
          moduleId: mod.id,
          stageId: stage.id,
          owner: "Hari",
        });
        console.log(`"${mod.name}" marked as Completed, owner: Hari`);
      }
      return;
    }
  }
  console.log("Todo module not found under any name.");
}

run().catch(console.error);
