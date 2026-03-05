import { eq, and, sql, gte, lte } from "drizzle-orm";
import { db, withRetry } from "./index";
import {
  modules,
  tasks,
  stages,
  moduleStages,
} from "./schema";

// ── Modules ──────────────────────────────────────────

export async function listModules() {
  return db.select().from(modules).orderBy(modules.name);
}

export async function createModule(name: string) {
  const [mod] = await db.insert(modules).values({ name }).returning();
  const notStarted = await getStageByName("Not Started");
  if (notStarted) {
    await db
      .insert(moduleStages)
      .values({ moduleId: mod.id, stageId: notStarted.id })
      .onConflictDoNothing();
  }
  return mod;
}

export async function getModuleByName(name: string) {
  const [mod] = await db
    .select()
    .from(modules)
    .where(eq(modules.name, name))
    .limit(1);
  return mod ?? null;
}

export async function renameModule(oldName: string, newName: string) {
  const mod = await getModuleByName(oldName);
  if (!mod) return null;
  const [updated] = await db
    .update(modules)
    .set({ name: newName })
    .where(eq(modules.id, mod.id))
    .returning();
  return updated ?? null;
}

export async function deleteModule(name: string) {
  const mod = await getModuleByName(name);
  if (!mod) return null;
  await db.delete(modules).where(eq(modules.id, mod.id));
  return mod;
}

// ── Tasks ────────────────────────────────────────────

export async function addTask(params: {
  moduleName: string;
  text: string;
  phase?: number;
  assignee?: string;
  date?: string;
  stageName?: string;
}) {
  const mod = await getModuleByName(params.moduleName);
  if (!mod) throw new Error(`Module "${params.moduleName}" not found`);

  let stageId: number | null = null;
  const stageName = params.stageName ?? "Not Started";
  const stage = await getStageByName(stageName);
  if (stage) {
    stageId = stage.id;
  } else if (params.stageName) {
    throw new Error(`Stage "${params.stageName}" not found`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const [task] = await db
    .insert(tasks)
    .values({
      moduleId: mod.id,
      stageId,
      text: params.text,
      phase: params.phase ?? 0,
      assignee: params.assignee ?? "Unassigned",
      date: params.date ?? today,
    })
    .returning();
  return task;
}

export async function completeTask(moduleName: string, taskId: number) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  const [task] = await db
    .update(tasks)
    .set({ done: true, completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.moduleId, mod.id)))
    .returning();
  return task ?? null;
}

export async function assignTask(
  moduleName: string,
  taskId: number,
  assignee: string
) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  const [task] = await db
    .update(tasks)
    .set({ assignee, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.moduleId, mod.id)))
    .returning();
  return task ?? null;
}

export async function updateTaskText(
  moduleName: string,
  taskId: number,
  text: string
) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  const [task] = await db
    .update(tasks)
    .set({ text, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.moduleId, mod.id)))
    .returning();
  return task ?? null;
}

export async function updateTaskDate(
  moduleName: string,
  taskId: number,
  date: string
) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  const [task] = await db
    .update(tasks)
    .set({ date, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.moduleId, mod.id)))
    .returning();
  return task ?? null;
}

export async function updateTaskPhase(
  moduleName: string,
  taskId: number,
  phase: number
) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  const [task] = await db
    .update(tasks)
    .set({ phase, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.moduleId, mod.id)))
    .returning();
  return task ?? null;
}

export async function removeTask(moduleName: string, taskId: number) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  const [task] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.moduleId, mod.id)))
    .returning();
  return task ?? null;
}

export async function getTasksForModule(moduleName: string) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  return db
    .select()
    .from(tasks)
    .where(eq(tasks.moduleId, mod.id))
    .orderBy(tasks.phase, tasks.createdAt);
}

// ── Daily Summary ────────────────────────────────────

export async function dailySummary(date?: string) {
  const targetDate = date ?? new Date().toISOString().slice(0, 10);

  const rows = await db
    .select({
      moduleName: modules.name,
      taskId: tasks.id,
      text: tasks.text,
      phase: tasks.phase,
      assignee: tasks.assignee,
      done: tasks.done,
    })
    .from(tasks)
    .innerJoin(modules, eq(tasks.moduleId, modules.id))
    .where(eq(tasks.date, targetDate))
    .orderBy(modules.name, tasks.phase);

  // Group by module
  const grouped: Record<
    string,
    { taskId: number; text: string; phase: number; assignee: string; done: boolean }[]
  > = {};
  for (const r of rows) {
    if (!grouped[r.moduleName]) grouped[r.moduleName] = [];
    grouped[r.moduleName].push({
      taskId: r.taskId,
      text: r.text,
      phase: r.phase,
      assignee: r.assignee,
      done: r.done,
    });
  }
  return { date: targetDate, modules: grouped };
}

// ── Dashboard ────────────────────────────────────────

export async function dashboard() {
  return withRetry(async () => {
  const allTasks = await db
    .select({
      moduleName: modules.name,
      phase: tasks.phase,
      assignee: tasks.assignee,
      done: tasks.done,
      stageName: stages.name,
    })
    .from(tasks)
    .innerJoin(modules, eq(tasks.moduleId, modules.id))
    .leftJoin(stages, eq(tasks.stageId, stages.id));

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.done).length;
  const pending = total - completed;

  // By module
  const byModule: Record<string, { total: number; done: number }> = {};
  // By assignee
  const byAssignee: Record<string, { total: number; done: number }> = {};
  // By phase
  const byPhase: Record<number, { total: number; done: number }> = {};
  // By stage
  const byStage: Record<string, { total: number; done: number }> = {};

  for (const t of allTasks) {
    // module
    if (!byModule[t.moduleName])
      byModule[t.moduleName] = { total: 0, done: 0 };
    byModule[t.moduleName].total++;
    if (t.done) byModule[t.moduleName].done++;

    // assignee
    if (!byAssignee[t.assignee])
      byAssignee[t.assignee] = { total: 0, done: 0 };
    byAssignee[t.assignee].total++;
    if (t.done) byAssignee[t.assignee].done++;

    // phase
    if (!byPhase[t.phase]) byPhase[t.phase] = { total: 0, done: 0 };
    byPhase[t.phase].total++;
    if (t.done) byPhase[t.phase].done++;

    // stage
    const sName = t.stageName ?? "Unassigned";
    if (!byStage[sName]) byStage[sName] = { total: 0, done: 0 };
    byStage[sName].total++;
    if (t.done) byStage[sName].done++;
  }

  return { total, completed, pending, byModule, byAssignee, byPhase, byStage };
  });
}

// ── Extra helpers for UI ─────────────────────────────

export async function getAllTasks(filters?: {
  date?: string;
  phase?: number;
  assignee?: string;
  done?: boolean;
  module?: string;
  stage?: string;
  weekStart?: string;
  weekEnd?: string;
}) {
  const rows = await db
    .select({
      id: tasks.id,
      text: tasks.text,
      phase: tasks.phase,
      assignee: tasks.assignee,
      date: tasks.date,
      done: tasks.done,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      moduleName: modules.name,
      stageName: stages.name,
    })
    .from(tasks)
    .innerJoin(modules, eq(tasks.moduleId, modules.id))
    .leftJoin(stages, eq(tasks.stageId, stages.id))
    .orderBy(tasks.phase, tasks.createdAt);

  let filtered = rows;
  if (filters?.date) filtered = filtered.filter((r) => r.date === filters.date);
  if (filters?.weekStart && filters?.weekEnd)
    filtered = filtered.filter(
      (r) => r.date >= filters.weekStart! && r.date <= filters.weekEnd!
    );
  if (filters?.phase !== undefined)
    filtered = filtered.filter((r) => r.phase === filters.phase);
  if (filters?.assignee)
    filtered = filtered.filter((r) => r.assignee === filters.assignee);
  if (filters?.done !== undefined)
    filtered = filtered.filter((r) => r.done === filters.done);
  if (filters?.module)
    filtered = filtered.filter((r) => r.moduleName === filters.module);
  if (filters?.stage)
    filtered = filtered.filter((r) => r.stageName === filters.stage);

  return filtered;
}

// ── Stages ──────────────────────────────────────────

export async function listStages() {
  return db.select().from(stages).orderBy(stages.order);
}

export async function createStage(name: string, order: number) {
  const [stage] = await db.insert(stages).values({ name, order }).returning();
  return stage;
}

export async function getStageByName(name: string) {
  const [stage] = await db
    .select()
    .from(stages)
    .where(eq(stages.name, name))
    .limit(1);
  return stage ?? null;
}

// ── Module-Stage Links ──────────────────────────────

export async function linkModuleToStage(
  moduleName: string,
  stageName: string
) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);
  const stage = await getStageByName(stageName);
  if (!stage) throw new Error(`Stage "${stageName}" not found`);

  const [link] = await db
    .insert(moduleStages)
    .values({ moduleId: mod.id, stageId: stage.id })
    .onConflictDoNothing()
    .returning();
  return link ?? null;
}

export async function unlinkModuleFromStage(
  moduleName: string,
  stageName: string
) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);
  const stage = await getStageByName(stageName);
  if (!stage) throw new Error(`Stage "${stageName}" not found`);

  const [deleted] = await db
    .delete(moduleStages)
    .where(
      and(
        eq(moduleStages.moduleId, mod.id),
        eq(moduleStages.stageId, stage.id)
      )
    )
    .returning();
  return deleted ?? null;
}

export async function getStagesForModule(moduleName: string) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  return db
    .select({
      id: stages.id,
      name: stages.name,
      order: stages.order,
    })
    .from(moduleStages)
    .innerJoin(stages, eq(moduleStages.stageId, stages.id))
    .where(eq(moduleStages.moduleId, mod.id))
    .orderBy(stages.order);
}

export async function getModulesForStage(stageName: string) {
  const stage = await getStageByName(stageName);
  if (!stage) throw new Error(`Stage "${stageName}" not found`);

  return db
    .select({
      id: modules.id,
      name: modules.name,
    })
    .from(moduleStages)
    .innerJoin(modules, eq(moduleStages.moduleId, modules.id))
    .where(eq(moduleStages.stageId, stage.id))
    .orderBy(modules.name);
}

// ── Owner (single per module-status) ────────────────

export async function setOwner(moduleName: string, ownerName: string | null) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  const [link] = await db
    .select()
    .from(moduleStages)
    .where(eq(moduleStages.moduleId, mod.id))
    .limit(1);
  if (!link) throw new Error(`Module "${moduleName}" has no status link`);

  const [updated] = await db
    .update(moduleStages)
    .set({ owner: ownerName })
    .where(eq(moduleStages.id, link.id))
    .returning();
  return updated;
}

export async function getOwner(moduleName: string) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);

  const [link] = await db
    .select({ owner: moduleStages.owner })
    .from(moduleStages)
    .where(eq(moduleStages.moduleId, mod.id))
    .limit(1);
  return link?.owner ?? null;
}

export async function setModuleStatus(moduleName: string, statusName: string) {
  const mod = await getModuleByName(moduleName);
  if (!mod) throw new Error(`Module "${moduleName}" not found`);
  const stage = await getStageByName(statusName);
  if (!stage) throw new Error(`Status "${statusName}" not found`);

  // Read current owner before deleting
  const [existing] = await db
    .select({ owner: moduleStages.owner })
    .from(moduleStages)
    .where(eq(moduleStages.moduleId, mod.id))
    .limit(1);

  // Delete existing link
  await db.delete(moduleStages).where(eq(moduleStages.moduleId, mod.id));

  // Create new link preserving owner
  const [created] = await db
    .insert(moduleStages)
    .values({ moduleId: mod.id, stageId: stage.id, owner: existing?.owner ?? null })
    .returning();
  return created;
}

// ── Stage-Module Matrix ─────────────────────────────

export async function getStageModuleMatrix() {
  return withRetry(async () => {
  const allStagesList = await listStages();

  // Get all links: module name, stage name, owner
  const links = await db
    .select({
      moduleName: modules.name,
      stageName: stages.name,
      owner: moduleStages.owner,
    })
    .from(moduleStages)
    .innerJoin(modules, eq(moduleStages.moduleId, modules.id))
    .innerJoin(stages, eq(moduleStages.stageId, stages.id))
    .orderBy(modules.name);

  // Each module has one status (stage) and one owner
  const rows = links.map((l) => ({
    module: l.moduleName,
    status: l.stageName,
    owner: l.owner ?? "",
  }));

  // Summary counts per status
  const summary: Record<string, number> = {};
  for (const s of allStagesList) {
    summary[s.name] = 0;
  }
  for (const r of rows) {
    if (summary[r.status] !== undefined) summary[r.status]++;
  }

  return { stages: allStagesList, rows, summary };
  });
}

// ── Weekly Summary ──────────────────────────────────

export async function weeklySummary(weekStart?: string) {
  // Default to current week's Monday
  const start =
    weekStart ?? getMonday(new Date()).toISOString().slice(0, 10);
  const end = getFriday(new Date(start + "T00:00:00"))
    .toISOString()
    .slice(0, 10);

  const rows = await db
    .select({
      moduleName: modules.name,
      stageName: stages.name,
      taskId: tasks.id,
      text: tasks.text,
      phase: tasks.phase,
      assignee: tasks.assignee,
      date: tasks.date,
      done: tasks.done,
    })
    .from(tasks)
    .innerJoin(modules, eq(tasks.moduleId, modules.id))
    .leftJoin(stages, eq(tasks.stageId, stages.id))
    .where(and(gte(tasks.date, start), lte(tasks.date, end)))
    .orderBy(modules.name, stages.order, tasks.phase);

  // Group by module → stage
  const grouped: Record<
    string,
    Record<
      string,
      {
        taskId: number;
        text: string;
        phase: number;
        assignee: string;
        date: string;
        done: boolean;
      }[]
    >
  > = {};
  for (const r of rows) {
    const modKey = r.moduleName;
    const stageKey = r.stageName ?? "Unassigned";
    if (!grouped[modKey]) grouped[modKey] = {};
    if (!grouped[modKey][stageKey]) grouped[modKey][stageKey] = [];
    grouped[modKey][stageKey].push({
      taskId: r.taskId,
      text: r.text,
      phase: r.phase,
      assignee: r.assignee,
      date: r.date,
      done: r.done,
    });
  }

  const total = rows.length;
  const completed = rows.filter((r) => r.done).length;

  return { weekStart: start, weekEnd: end, total, completed, modules: grouped };
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function getFriday(d: Date): Date {
  const monday = getMonday(d);
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);
}
