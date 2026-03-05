// Run: npx tsx scripts/set-module-owners.ts
// Sets owner on module_stages where owner IS NULL
// Specific overrides: Claude Account -> pothihai, RanMaps -> Vikash
// Default: Hari

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull } from "drizzle-orm";
import { modules, moduleStages } from "../src/lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const OWNER_OVERRIDES: Record<string, string> = {
  "Claude Account": "pothihai",
  Internal: "Hari",
  RanMaps: "Vikash",
};
const DEFAULT_OWNER = "Hari";

async function main() {
  const links = await db
    .select({
      id: moduleStages.id,
      moduleId: moduleStages.moduleId,
      owner: moduleStages.owner,
      moduleName: modules.name,
    })
    .from(moduleStages)
    .innerJoin(modules, eq(moduleStages.moduleId, modules.id))
    .where(isNull(moduleStages.owner));

  if (links.length === 0) {
    console.log("All modules already have owners. Nothing to do.");
    return;
  }

  console.log(`Found ${links.length} modules without owners:`);

  for (const link of links) {
    const owner = OWNER_OVERRIDES[link.moduleName] ?? DEFAULT_OWNER;
    await db
      .update(moduleStages)
      .set({ owner })
      .where(eq(moduleStages.id, link.id));
    console.log(`  ${link.moduleName} -> ${owner}`);
  }

  console.log("Done!");
}

main().catch(console.error);
