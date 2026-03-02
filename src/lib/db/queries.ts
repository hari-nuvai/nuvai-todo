import { eq, and, sql } from "drizzle-orm";
import { db } from "./index";
import { modules, tasks } from "./schema";

// ── Modules ──────────────────────────────────────────

export async function listModules() {
  return db.select().from(modules).orderBy(modules.name);
}

export async function createModule(name: string) {
  const [mod] = await db.insert(modules).values({ name }).returning();
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
}) {
  const mod = await getModuleByName(params.moduleName);
  if (!mod) throw new Error(`Module "${params.moduleName}" not found`);

  const today = new Date().toISOString().slice(0, 10);
  const [task] = await db
    .insert(tasks)
    .values({
      moduleId: mod.id,
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
  const allTasks = await db
    .select({
      moduleName: modules.name,
      phase: tasks.phase,
      assignee: tasks.assignee,
      done: tasks.done,
    })
    .from(tasks)
    .innerJoin(modules, eq(tasks.moduleId, modules.id));

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.done).length;
  const pending = total - completed;

  // By module
  const byModule: Record<string, { total: number; done: number }> = {};
  // By assignee
  const byAssignee: Record<string, { total: number; done: number }> = {};
  // By phase
  const byPhase: Record<number, { total: number; done: number }> = {};

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
  }

  return { total, completed, pending, byModule, byAssignee, byPhase };
}

// ── Extra helpers for UI ─────────────────────────────

export async function getAllTasks(filters?: {
  date?: string;
  phase?: number;
  assignee?: string;
  done?: boolean;
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
    })
    .from(tasks)
    .innerJoin(modules, eq(tasks.moduleId, modules.id))
    .orderBy(tasks.phase, tasks.createdAt);

  let filtered = rows;
  if (filters?.date) filtered = filtered.filter((r) => r.date === filters.date);
  if (filters?.phase !== undefined)
    filtered = filtered.filter((r) => r.phase === filters.phase);
  if (filters?.assignee)
    filtered = filtered.filter((r) => r.assignee === filters.assignee);
  if (filters?.done !== undefined)
    filtered = filtered.filter((r) => r.done === filters.done);

  return filtered;
}
