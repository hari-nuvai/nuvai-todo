import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import { modules, stages, moduleStages, tasks } from "./schema";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Stages = work statuses
const STAGES = [
  { name: "Not Started", order: 1 },
  { name: "In Progress", order: 2 },
  { name: "Testing", order: 3 },
  { name: "Completed", order: 4 },
  { name: "Blocked", order: 5 },
  { name: "On Hold", order: 6 },
];

// Task item with per-task assignee from CSV
interface TaskSeed { text: string; assignee: string; }

// Modules from CSV — single owner, status, priority, tasks with correct assignees
const MODULES: {
  name: string;
  status: string;
  owner: string;
  priority: number; // 0=critical,1=high,2=medium,3=low
  tasks: TaskSeed[];
}[] = [
  {
    name: "NuStrategy",
    status: "Not Started",
    owner: "Rakhi",
    priority: 0,
    tasks: [
      { text: "Frontend review and update in progress", assignee: "Abhishek" },
      { text: "Deploy the current version in Azure", assignee: "Sen" },
      { text: "Integrate with NuPlan and test", assignee: "Rakhi" },
      { text: "Code needs review", assignee: "Navamohan" },
    ],
  },
  {
    name: "Persona",
    status: "In Progress",
    owner: "Rakhi",
    priority: 1,
    tasks: [
      { text: "Bug fixing (Creator & End User)", assignee: "Jagan" },
    ],
  },
  {
    name: "NuPlan",
    status: "In Progress",
    owner: "DD",
    priority: 0,
    tasks: [
      { text: "Testing knuckles integration", assignee: "DD" },
      { text: "Endpoint and artifact generation", assignee: "Ramya" },
      { text: "Basic website with valid output", assignee: "DD" },
    ],
  },
  {
    name: "NuCraft",
    status: "In Progress",
    owner: "Rakhi",
    priority: 0,
    tasks: [
      { text: "KT", assignee: "Jagan" },
      { text: "Start migration to Knyra on Monday", assignee: "Srini" },
    ],
  },
  {
    name: "Knuckles",
    status: "In Progress",
    owner: "Jagan",
    priority: 2,
    tasks: [
      { text: "Working on context relevant issues (15 issues)", assignee: "Jagan" },
    ],
  },
  {
    name: "Knead",
    status: "In Progress",
    owner: "Jagan",
    priority: 2,
    tasks: [
      { text: "Integration testing", assignee: "Jagan" },
    ],
  },
  {
    name: "Knyra",
    status: "In Progress",
    owner: "Jagan",
    priority: 2,
    tasks: [
      { text: "Integration testing", assignee: "Jagan" },
    ],
  },
  {
    name: "Nuvai Engine",
    status: "In Progress",
    owner: "PP",
    priority: 1,
    tasks: [
      { text: "Integrate stage 2", assignee: "PP" },
      { text: "Plan stage 5 and 6 integration (not yet started)", assignee: "PP" },
    ],
  },
  {
    name: "Registry",
    status: "In Progress",
    owner: "Hari",
    priority: 0,
    tasks: [
      { text: "Testing by pushing", assignee: "Hari" },
    ],
  },
  {
    name: "Contigra",
    status: "In Progress",
    owner: "Hari",
    priority: 1,
    tasks: [
      { text: "Testing locally and writing up Contigra", assignee: "Hari" },
    ],
  },
  {
    name: "Nuvai Auth",
    status: "In Progress",
    owner: "Hari",
    priority: 0,
    tasks: [
      { text: "Launching v1", assignee: "Hari" },
      { text: "Infra sizing", assignee: "Milan" },
    ],
  },
  {
    name: "NuOps",
    status: "In Progress",
    owner: "Milan",
    priority: 2,
    tasks: [
      { text: "Fixing bugs and TUI", assignee: "Lavanya" },
      { text: "Building correlation engine", assignee: "Karthick" },
    ],
  },
  {
    name: "Nuvai Code",
    status: "In Progress",
    owner: "PP",
    priority: 0,
    tasks: [
      { text: "Testing", assignee: "Sathya" },
    ],
  },
  {
    name: "TUI",
    status: "Not Started",
    owner: "Jagan",
    priority: 1,
    tasks: [],
  },
  {
    name: "Nuvai Studio",
    status: "In Progress",
    owner: "Luthdran",
    priority: 1,
    tasks: [
      { text: "Planner (product compass and user journey)", assignee: "Prainart" },
      { text: "Tracer lines integration once completed", assignee: "Luthdran" },
      { text: "Review ideator (done by EOD)", assignee: "Luthdran" },
    ],
  },
  {
    name: "IDE",
    status: "Blocked",
    owner: "Tarun",
    priority: 1,
    tasks: [
      { text: "Push to dev and resolve conflicts", assignee: "Rakhi" },
      { text: "NuStudio container review needed", assignee: "Jagan" },
    ],
  },
  {
    name: "Tracer Lines",
    status: "In Progress",
    owner: "Luthdran",
    priority: 2,
    tasks: [
      { text: "Testing tracer line features", assignee: "Luthdran" },
      { text: "Bug in knuckles", assignee: "Luthdran" },
    ],
  },
  {
    name: "Nuvai Gateway",
    status: "In Progress",
    owner: "Addy",
    priority: 0,
    tasks: [
      { text: "Start work on new features", assignee: "Addy" },
      { text: "Improve UX", assignee: "Vikash" },
      { text: "Knyra new memory system must be integrated", assignee: "Jagan" },
    ],
  },
  {
    name: "Nuvai Server",
    status: "On Hold",
    owner: "Rakhi",
    priority: 0,
    tasks: [
      { text: "Parked until NuPlan is integrated with knuckles", assignee: "PP" },
    ],
  },
  {
    name: "Tamar",
    status: "Not Started",
    owner: "Sen",
    priority: 0,
    tasks: [
      { text: "Jagan needs to handover", assignee: "Jagan" },
    ],
  },
  {
    name: "SOTA",
    status: "Not Started",
    owner: "Jagan",
    priority: 1,
    tasks: [
      { text: "Cleaning branches and fixing bugs in nuvai code", assignee: "Sen" },
      { text: "Test with nuvai code", assignee: "PP" },
    ],
  },
  {
    name: "Nuvai Landing Page",
    status: "In Progress",
    owner: "Vikash",
    priority: 1,
    tasks: [
      { text: "Jagan should review and Siva should start training", assignee: "Siva" },
    ],
  },
  {
    name: "User Portal",
    status: "Not Started",
    owner: "",
    priority: 3,
    tasks: [],
  },
];

async function seed() {
  // Clean old lifecycle stages if they exist
  console.log("Cleaning old lifecycle stages...");
  for (const name of ["Ideation", "Planning", "Implementation", "Validation", "Deployment", "Analytics", "Common"]) {
    await db.delete(stages).where(eq(stages.name, name));
  }

  console.log("Seeding stages (work statuses)...");
  for (const s of STAGES) {
    await db.insert(stages).values(s).onConflictDoNothing({ target: stages.name });
  }

  console.log("Seeding modules...");
  for (const m of MODULES) {
    await db.insert(modules).values({ name: m.name }).onConflictDoNothing({ target: modules.name });
  }

  const allStages = await db.select().from(stages);
  const allModules = await db.select().from(modules);
  const stageMap = new Map(allStages.map((s) => [s.name, s.id]));
  const moduleMap = new Map(allModules.map((m) => [m.name, m.id]));

  console.log("Linking modules to status with owner...");
  for (const m of MODULES) {
    const moduleId = moduleMap.get(m.name);
    const stageId = stageMap.get(m.status);
    if (!moduleId || !stageId) continue;

    const [existing] = await db
      .select()
      .from(moduleStages)
      .where(and(eq(moduleStages.moduleId, moduleId), eq(moduleStages.stageId, stageId)))
      .limit(1);

    if (existing) {
      await db
        .update(moduleStages)
        .set({ owner: m.owner || null })
        .where(eq(moduleStages.id, existing.id));
    } else {
      // Delete any old status link first
      await db.delete(moduleStages).where(eq(moduleStages.moduleId, moduleId));
      await db
        .insert(moduleStages)
        .values({ moduleId, stageId, owner: m.owner || null });
    }
  }

  console.log("Seeding tasks from CSV pending items...");
  const today = new Date().toISOString().slice(0, 10);
  for (const m of MODULES) {
    const moduleId = moduleMap.get(m.name);
    const stageId = stageMap.get(m.status);
    if (!moduleId || m.tasks.length === 0) continue;

    for (const t of m.tasks) {
      // Check if task already exists (idempotent)
      const [existing] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.moduleId, moduleId), eq(tasks.text, t.text)))
        .limit(1);

      if (!existing) {
        await db.insert(tasks).values({
          moduleId,
          stageId: stageId ?? null,
          text: t.text,
          phase: m.priority,
          assignee: t.assignee || m.owner || "Unassigned",
          date: today,
        });
      }
    }
  }

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
