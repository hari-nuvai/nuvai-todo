import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  listModules,
  createModule,
  addTask,
  completeTask,
  assignTask,
  removeTask,
  dailySummary,
  dashboard,
} from "@/lib/db/queries";

const handler = createMcpHandler(
  (server) => {
    // 1. add_module
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

    // 2. list_modules
    server.registerTool(
      "list_modules",
      {
        title: "List Modules",
        description: "List all modules being tracked",
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

    // 3. add_task
    server.registerTool(
      "add_task",
      {
        title: "Add Task",
        description: "Add a task to a module",
        inputSchema: {
          module: z.string().describe("Module name"),
          text: z.string().describe("Task description"),
          phase: z
            .number()
            .int()
            .min(0)
            .max(3)
            .default(0)
            .describe("Priority phase (0=critical, 1=high, 2=medium, 3=low)"),
          assignee: z.string().default("Unassigned").describe("Person assigned to task"),
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Date (YYYY-MM-DD), defaults to today"),
        },
      },
      async ({ module: moduleName, text: taskText, phase, assignee, date }) => {
        try {
          const task = await addTask({
            moduleName,
            text: taskText,
            phase,
            assignee,
            date,
          });
          return {
            content: [
              {
                type: "text" as const,
                text: `Task #${task.id} added to "${moduleName}" (phase ${task.phase}, assignee: ${task.assignee}, date: ${task.date}).`,
              },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    // 4. complete_task
    server.registerTool(
      "complete_task",
      {
        title: "Complete Task",
        description: "Mark a task as complete",
        inputSchema: {
          module: z.string().describe("Module name"),
          task_id: z.string().describe("Task ID"),
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
            content: [{ type: "text" as const, text: `Task #${task.id} marked complete.` }],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    // 5. assign_task
    server.registerTool(
      "assign_task",
      {
        title: "Assign Task",
        description: "Assign a task to someone",
        inputSchema: {
          module: z.string().describe("Module name"),
          task_id: z.string().describe("Task ID"),
          assignee: z.string().describe("Person to assign"),
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
              { type: "text" as const, text: `Task #${task.id} assigned to "${assignee}".` },
            ],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    // 6. remove_task
    server.registerTool(
      "remove_task",
      {
        title: "Remove Task",
        description: "Delete a task",
        inputSchema: {
          module: z.string().describe("Module name"),
          task_id: z.string().describe("Task ID"),
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
            content: [{ type: "text" as const, text: `Task #${task.id} removed.` }],
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
        }
      }
    );

    // 7. daily_summary
    server.registerTool(
      "daily_summary",
      {
        title: "Daily Summary",
        description: "Get today's tasks grouped by module",
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
        let text = `Tasks for ${summary.date}:\n\n`;
        for (const mod of moduleNames) {
          text += `## ${mod}\n`;
          for (const t of summary.modules[mod]) {
            const status = t.done ? "[x]" : "[ ]";
            const phaseLabel = ["P0-Critical", "P1-High", "P2-Medium", "P3-Low"][t.phase];
            text += `- ${status} #${t.taskId} ${t.text} (${phaseLabel}, ${t.assignee})\n`;
          }
          text += "\n";
        }
        return { content: [{ type: "text" as const, text }] };
      }
    );

    // 8. dashboard
    server.registerTool(
      "dashboard",
      {
        title: "Dashboard",
        description: "Get dashboard overview with stats by module, assignee, and phase",
        inputSchema: {},
      },
      async () => {
        const d = await dashboard();
        let text = `# Dashboard\n\n`;
        text += `Total: ${d.total} | Completed: ${d.completed} | Pending: ${d.pending}\n\n`;

        text += `## By Module\n`;
        for (const [name, stats] of Object.entries(d.byModule)) {
          text += `- ${name}: ${stats.done}/${stats.total} done\n`;
        }

        text += `\n## By Assignee\n`;
        for (const [name, stats] of Object.entries(d.byAssignee)) {
          text += `- ${name}: ${stats.done}/${stats.total} done\n`;
        }

        text += `\n## By Phase\n`;
        const phaseLabels = ["P0-Critical", "P1-High", "P2-Medium", "P3-Low"];
        for (const [phase, stats] of Object.entries(d.byPhase)) {
          text += `- ${phaseLabels[parseInt(phase)]}: ${stats.done}/${stats.total} done\n`;
        }

        return { content: [{ type: "text" as const, text }] };
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
