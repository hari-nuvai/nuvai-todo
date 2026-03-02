import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  listModules,
  createModule,
  deleteModule,
  addTask,
  completeTask,
  assignTask,
  updateTaskText,
  removeTask,
  getTasksForModule,
  getAllTasks,
  dailySummary,
  dashboard,
  listStages,
  createStage,
  linkModuleToStage,
  unlinkModuleFromStage,
  setOwner,
  getOwner,
  setModuleStatus,
  getStageModuleMatrix,
  weeklySummary,
} from "@/lib/db/queries";

const handler = createMcpHandler(
  (server) => {
    // ── Modules ──────────────────────────────────────

    server.registerTool(
      "add_module",
      {
        title: "Add Module",
        description: "Create a new module/product to track tasks for",
        inputSchema: {
          name: z.string().describe("Module name (e.g., NuCodeSense, Tamar)"),
        },
      },
      async ({ name }) => {
        try {
          const mod = await createModule(name);
          return {
            content: [
              { type: "text" as const, text: `Module "${mod.name}" created (id: ${mod.id}).` },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "list_modules",
      {
        title: "List Modules",
        description: "List all modules being tracked. Returns module names and IDs.",
        inputSchema: {},
      },
      async () => {
        const mods = await listModules();
        if (mods.length === 0) {
          return { content: [{ type: "text" as const, text: "No modules found." }] };
        }
        const text = mods.map((m) => `- ${m.name} (id: ${m.id})`).join("\n");
        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.registerTool(
      "delete_module",
      {
        title: "Delete Module",
        description: "Delete a module and all its tasks",
        inputSchema: {
          module: z.string().describe("Module name to delete"),
        },
      },
      async ({ module: moduleName }) => {
        try {
          const mod = await deleteModule(moduleName);
          if (!mod) {
            return { content: [{ type: "text" as const, text: `Module "${moduleName}" not found.` }], isError: true };
          }
          return { content: [{ type: "text" as const, text: `Module "${mod.name}" deleted.` }] };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    // ── Tasks ────────────────────────────────────────

    server.registerTool(
      "add_task",
      {
        title: "Add Task",
        description: "Add a task to a module. Use this when someone says to add a todo, action item, or pending work to a module.",
        inputSchema: {
          module: z.string().describe("Module name (must exist). Use list_modules to find available modules."),
          text: z.string().describe("Task description — what needs to be done"),
          phase: z
            .number()
            .int()
            .min(0)
            .max(3)
            .default(0)
            .describe("Priority: 0=critical, 1=high, 2=medium, 3=low"),
          assignee: z.string().default("Unassigned").describe("Person assigned to this task"),
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Date (YYYY-MM-DD), defaults to today"),
          stage: z.string().optional().describe("Status/stage name: Not Started, In Progress, Completed, Blocked, On Hold"),
        },
      },
      async ({ module: moduleName, text: taskText, phase, assignee, date, stage }) => {
        try {
          const task = await addTask({
            moduleName,
            text: taskText,
            phase,
            assignee,
            date,
            stageName: stage,
          });
          return {
            content: [
              {
                type: "text" as const,
                text: `Task #${task.id} added to "${moduleName}" — "${taskText}" (P${task.phase}, assignee: ${task.assignee}, date: ${task.date}${stage ? `, status: ${stage}` : ""}).`,
              },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "list_tasks",
      {
        title: "List Tasks",
        description: "List tasks with optional filters. Use this to find tasks before editing, completing, or reassigning them. Returns task IDs needed for other operations.",
        inputSchema: {
          module: z.string().optional().describe("Filter by module name"),
          assignee: z.string().optional().describe("Filter by assignee name"),
          phase: z.number().int().min(0).max(3).optional().describe("Filter by priority: 0=critical, 1=high, 2=medium, 3=low"),
          done: z.boolean().optional().describe("Filter by completion: true=completed, false=pending"),
          date: z.string().optional().describe("Filter by specific date (YYYY-MM-DD)"),
        },
      },
      async ({ module: moduleName, assignee, phase, done, date }) => {
        try {
          const tasks = await getAllTasks({
            module: moduleName,
            assignee,
            phase,
            done,
            date,
          });
          if (tasks.length === 0) {
            return { content: [{ type: "text" as const, text: "No tasks found matching filters." }] };
          }
          const phaseLabels = ["P0-Critical", "P1-High", "P2-Medium", "P3-Low"];
          let text = `Found ${tasks.length} task(s):\n\n`;
          for (const t of tasks) {
            const status = t.done ? "[x]" : "[ ]";
            text += `${status} #${t.id} "${t.text}" — ${t.moduleName} | ${phaseLabels[t.phase]} | ${t.assignee} | ${t.date}\n`;
          }
          return { content: [{ type: "text" as const, text }] };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "get_module_tasks",
      {
        title: "Get Module Tasks",
        description: "Get all tasks for a specific module. Returns task IDs, text, assignees, priorities, and completion status.",
        inputSchema: {
          module: z.string().describe("Module name"),
        },
      },
      async ({ module: moduleName }) => {
        try {
          const tasks = await getTasksForModule(moduleName);
          if (tasks.length === 0) {
            return { content: [{ type: "text" as const, text: `No tasks found for "${moduleName}".` }] };
          }
          const phaseLabels = ["P0-Critical", "P1-High", "P2-Medium", "P3-Low"];
          let text = `Tasks for "${moduleName}" (${tasks.length}):\n\n`;
          for (const t of tasks) {
            const status = t.done ? "[x]" : "[ ]";
            text += `${status} #${t.id} "${t.text}" — ${phaseLabels[t.phase]} | ${t.assignee} | ${t.date}\n`;
          }
          return { content: [{ type: "text" as const, text }] };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "edit_task",
      {
        title: "Edit Task",
        description: "Edit/update the text of a task. Use list_tasks or get_module_tasks first to find the task ID.",
        inputSchema: {
          module: z.string().describe("Module name the task belongs to"),
          task_id: z.string().describe("Task ID (number)"),
          text: z.string().describe("New task text/description"),
        },
      },
      async ({ module: moduleName, task_id, text }) => {
        try {
          const task = await updateTaskText(moduleName, parseInt(task_id, 10), text);
          if (!task) {
            return {
              content: [{ type: "text" as const, text: `Task ${task_id} not found in "${moduleName}".` }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text" as const, text: `Task #${task.id} updated to: "${text}"` }],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "complete_task",
      {
        title: "Complete Task",
        description: "Mark a task as done/complete. Use list_tasks or get_module_tasks first to find the task ID.",
        inputSchema: {
          module: z.string().describe("Module name the task belongs to"),
          task_id: z.string().describe("Task ID (number)"),
        },
      },
      async ({ module: moduleName, task_id }) => {
        try {
          const task = await completeTask(moduleName, parseInt(task_id, 10));
          if (!task) {
            return {
              content: [{ type: "text" as const, text: `Task ${task_id} not found in "${moduleName}".` }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text" as const, text: `Task #${task.id} "${task.text}" marked complete.` }],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "assign_task",
      {
        title: "Assign Task",
        description: "Assign or reassign a task to someone. Use list_tasks or get_module_tasks first to find the task ID.",
        inputSchema: {
          module: z.string().describe("Module name the task belongs to"),
          task_id: z.string().describe("Task ID (number)"),
          assignee: z.string().describe("Person to assign the task to"),
        },
      },
      async ({ module: moduleName, task_id, assignee }) => {
        try {
          const task = await assignTask(moduleName, parseInt(task_id, 10), assignee);
          if (!task) {
            return {
              content: [{ type: "text" as const, text: `Task ${task_id} not found in "${moduleName}".` }],
              isError: true,
            };
          }
          return {
            content: [
              { type: "text" as const, text: `Task #${task.id} "${task.text}" assigned to "${assignee}".` },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "remove_task",
      {
        title: "Remove Task",
        description: "Delete a task permanently",
        inputSchema: {
          module: z.string().describe("Module name the task belongs to"),
          task_id: z.string().describe("Task ID (number)"),
        },
      },
      async ({ module: moduleName, task_id }) => {
        try {
          const task = await removeTask(moduleName, parseInt(task_id, 10));
          if (!task) {
            return {
              content: [{ type: "text" as const, text: `Task ${task_id} not found in "${moduleName}".` }],
              isError: true,
            };
          }
          return {
            content: [{ type: "text" as const, text: `Task #${task.id} "${task.text}" removed.` }],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    // ── Module Status & Owner ────────────────────────

    server.registerTool(
      "set_module_status",
      {
        title: "Set Module Status",
        description:
          "Change the status of a module. Valid statuses: Not Started, In Progress, Completed, Blocked, On Hold. Use this when someone says a module is blocked, done, started, on hold, etc.",
        inputSchema: {
          module: z.string().describe("Module name"),
          status: z.enum(["Not Started", "In Progress", "Completed", "Blocked", "On Hold"]).describe("New status"),
        },
      },
      async ({ module: moduleName, status: statusName }) => {
        try {
          await setModuleStatus(moduleName, statusName);
          return {
            content: [
              {
                type: "text" as const,
                text: `"${moduleName}" status changed to "${statusName}".`,
              },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "set_owner",
      {
        title: "Set Module Owner",
        description: "Set or change the owner of a module. The owner is the person responsible for the module overall.",
        inputSchema: {
          module: z.string().describe("Module name"),
          owner: z.string().describe("Owner name (person responsible)"),
        },
      },
      async ({ module: moduleName, owner: ownerName }) => {
        try {
          await setOwner(moduleName, ownerName);
          return {
            content: [
              {
                type: "text" as const,
                text: `"${ownerName}" set as owner of "${moduleName}".`,
              },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "get_owner",
      {
        title: "Get Module Owner",
        description: "Get the current owner of a module",
        inputSchema: {
          module: z.string().describe("Module name"),
        },
      },
      async ({ module: moduleName }) => {
        try {
          const owner = await getOwner(moduleName);
          return {
            content: [
              {
                type: "text" as const,
                text: owner
                  ? `Owner of "${moduleName}": ${owner}`
                  : `No owner set for "${moduleName}".`,
              },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    // ── Tracker & Summaries ──────────────────────────

    server.registerTool(
      "stage_module_matrix",
      {
        title: "GoLive Tracker",
        description: "Full module status tracker — shows every module with its current status (Not Started/In Progress/Completed/Blocked/On Hold) and owner. Use this to get an overview of all modules.",
        inputSchema: {},
      },
      async () => {
        const data = await getStageModuleMatrix();
        let text = `# GoLive Tracker\n\n`;
        text += `| Module | Status | Owner |\n|--------|--------|-------|\n`;
        for (const row of data.rows) {
          text += `| ${row.module} | ${row.status} | ${row.owner || "—"} |\n`;
        }
        text += `\n## Summary\n`;
        for (const [status, count] of Object.entries(data.summary)) {
          if (count > 0) text += `- ${status}: ${count} modules\n`;
        }
        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.registerTool(
      "dashboard",
      {
        title: "Dashboard",
        description: "Get overall dashboard stats: task counts by module, assignee, priority, and status. Use this for a high-level overview.",
        inputSchema: {},
      },
      async () => {
        const d = await dashboard();
        const phaseLabels = ["P0-Critical", "P1-High", "P2-Medium", "P3-Low"];
        let text = `# Dashboard\n\n`;
        text += `Modules: ${Object.keys(d.byModule).length} | Tasks: ${d.total} (${d.completed} done, ${d.pending} open)\n\n`;

        text += `## Tasks by Priority\n`;
        for (const [phase, stats] of Object.entries(d.byPhase)) {
          text += `- ${phaseLabels[parseInt(phase)]}: ${stats.total} (${stats.done} done)\n`;
        }

        text += `\n## Tasks by Assignee\n`;
        for (const [name, stats] of Object.entries(d.byAssignee)) {
          text += `- ${name}: ${stats.total} tasks (${stats.done} done)\n`;
        }

        text += `\n## Tasks by Module\n`;
        for (const [name, stats] of Object.entries(d.byModule)) {
          text += `- ${name}: ${stats.total} tasks (${stats.done} done)\n`;
        }

        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.registerTool(
      "daily_summary",
      {
        title: "Daily Summary",
        description: "Get tasks for a specific date grouped by module",
        inputSchema: {
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Date (YYYY-MM-DD), defaults to today"),
        },
      },
      async ({ date }) => {
        const summary = await dailySummary(date);
        const moduleNames = Object.keys(summary.modules);
        if (moduleNames.length === 0) {
          return {
            content: [{ type: "text" as const, text: `No tasks for ${summary.date}.` }],
          };
        }
        const phaseLabels = ["P0-Critical", "P1-High", "P2-Medium", "P3-Low"];
        let text = `Tasks for ${summary.date}:\n\n`;
        for (const mod of moduleNames) {
          text += `## ${mod}\n`;
          for (const t of summary.modules[mod]) {
            const status = t.done ? "[x]" : "[ ]";
            text += `- ${status} #${t.taskId} ${t.text} (${phaseLabels[t.phase]}, ${t.assignee})\n`;
          }
          text += "\n";
        }
        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.registerTool(
      "weekly_summary",
      {
        title: "Weekly Summary",
        description: "Weekly task summary grouped by module. Defaults to current week (Mon-Fri).",
        inputSchema: {
          week_start: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Monday date (YYYY-MM-DD), defaults to current week"),
        },
      },
      async ({ week_start }) => {
        const summary = await weeklySummary(week_start);
        const moduleNames = Object.keys(summary.modules);
        if (moduleNames.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No tasks for week ${summary.weekStart} to ${summary.weekEnd}.`,
              },
            ],
          };
        }
        let text = `# Weekly Summary (${summary.weekStart} → ${summary.weekEnd})\n`;
        text += `Total: ${summary.total} | Completed: ${summary.completed} | Open: ${summary.total - summary.completed}\n\n`;
        for (const mod of moduleNames) {
          text += `## ${mod}\n`;
          for (const [stageName, taskList] of Object.entries(summary.modules[mod])) {
            text += `### ${stageName}\n`;
            for (const t of taskList) {
              const status = t.done ? "[x]" : "[ ]";
              text += `- ${status} #${t.taskId} ${t.text} (${t.assignee})\n`;
            }
          }
          text += "\n";
        }
        return { content: [{ type: "text" as const, text }] };
      }
    );

    // ── Stages (advanced) ────────────────────────────

    server.registerTool(
      "list_stages",
      {
        title: "List Statuses",
        description: "List all available module statuses: Not Started, In Progress, Completed, Blocked, On Hold",
        inputSchema: {},
      },
      async () => {
        const stagesList = await listStages();
        if (stagesList.length === 0) {
          return { content: [{ type: "text" as const, text: "No statuses found." }] };
        }
        const text = stagesList.map((s) => `- ${s.name}`).join("\n");
        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.registerTool(
      "add_stage",
      {
        title: "Add Status",
        description: "Create a new module status type",
        inputSchema: {
          name: z.string().describe("Status name"),
          order: z.number().int().describe("Display order"),
        },
      },
      async ({ name, order }) => {
        try {
          const stage = await createStage(name, order);
          return {
            content: [
              { type: "text" as const, text: `Status "${stage.name}" created (order: ${stage.order}).` },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "link_module_stage",
      {
        title: "Link Module to Status",
        description: "Link a module to a status (for advanced use — prefer set_module_status)",
        inputSchema: {
          module: z.string().describe("Module name"),
          stage: z.string().describe("Status name"),
        },
      },
      async ({ module: moduleName, stage: stageName }) => {
        try {
          await linkModuleToStage(moduleName, stageName);
          return {
            content: [
              { type: "text" as const, text: `"${moduleName}" linked to "${stageName}".` },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    server.registerTool(
      "unlink_module_stage",
      {
        title: "Unlink Module from Status",
        description: "Remove a module's status link",
        inputSchema: {
          module: z.string().describe("Module name"),
          stage: z.string().describe("Status name"),
        },
      },
      async ({ module: moduleName, stage: stageName }) => {
        try {
          const deleted = await unlinkModuleFromStage(moduleName, stageName);
          if (!deleted) {
            return {
              content: [{ type: "text" as const, text: `Link not found.` }],
              isError: true,
            };
          }
          return {
            content: [
              { type: "text" as const, text: `"${moduleName}" unlinked from "${stageName}".` },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );
  },
  {},
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  }
);

export { handler as GET, handler as POST };
