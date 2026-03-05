import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Old modules from initial seed that don't match CSV
const OLD_MODULES = [
  "NuvaiIDE",
  "NuvaiStudio",
  "TracerLines",
  "NuAnimations",
  "nuvai-commons",
  "nuvai-ds",
  "nuvai-open-telemetry",
  "nuvai-commons-derive",
];

async function cleanup() {
  for (const name of OLD_MODULES) {
    const [mod] = await db
      .select()
      .from(schema.modules)
      .where(eq(schema.modules.name, name))
      .limit(1);
    if (mod) {
      await db.delete(schema.modules).where(eq(schema.modules.id, mod.id));
      console.log(`Deleted old module: ${name}`);
    }
  }

  // List remaining
  const remaining = await db.select().from(schema.modules);
  console.log(
    `\nRemaining modules (${remaining.length}):`,
    remaining.map((m) => m.name).join(", ")
  );
}

cleanup().catch(console.error);
