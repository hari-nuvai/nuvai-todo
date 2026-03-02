"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TaskList } from "@/components/task-list";
import { AddTaskForm } from "@/components/add-task-form";
import { FilterBar } from "@/components/filter-bar";
import { WeekNavigator, getMonday, getFriday } from "@/components/week-navigator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StageTaskGroup } from "@/components/stage-task-group";
import type { TaskItem } from "@/components/task-row";

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function TasksPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground py-8 text-center text-sm">Loading...</p>}>
      <TasksPageContent />
    </Suspense>
  );
}

function TasksPageContent() {
  const searchParams = useSearchParams();

  const [weekStart, setWeekStart] = useState(() => fmt(getMonday(new Date())));
  const weekEnd = fmt(getFriday(new Date(weekStart + "T00:00:00")));

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [module, setModule] = useState(() => searchParams.get("module") || "all");
  const [stage, setStage] = useState(() => searchParams.get("stage") || "all");
  const [phase, setPhase] = useState(() => searchParams.get("phase") || "all");
  const [assignee, setAssignee] = useState(() => searchParams.get("assignee") || "all");
  const [status, setStatus] = useState(() => searchParams.get("status") || "all");
  const [showAddForm, setShowAddForm] = useState(false);

  const loadTasks = useCallback(() => {
    const params = new URLSearchParams();
    params.set("weekStart", weekStart);
    params.set("weekEnd", weekEnd);
    if (module !== "all") params.set("module", module);
    if (stage !== "all") params.set("stage", stage);
    if (phase !== "all") params.set("phase", phase);
    if (assignee !== "all") params.set("assignee", assignee);
    if (status === "pending") params.set("done", "false");
    if (status === "done") params.set("done", "true");

    fetch(`/api/tasks?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
      });
  }, [weekStart, weekEnd, module, stage, phase, assignee, status]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const loadModules = useCallback(() => {
    fetch("/api/modules")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data))
          setModules(data.map((m: { name: string }) => m.name));
      });
  }, []);

  const loadStages = useCallback(() => {
    fetch("/api/stages")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data))
          setStages(data.map((s: { name: string }) => s.name));
      });
  }, []);

  useEffect(() => {
    loadModules();
    loadStages();
  }, [loadModules, loadStages]);

  const assignees = [...new Set(tasks.map((t) => t.assignee))].sort();

  // Group tasks by stage
  const tasksByStage: Record<string, TaskItem[]> = {};
  for (const t of tasks) {
    const key = t.stageName ?? "Unassigned";
    if (!tasksByStage[key]) tasksByStage[key] = [];
    tasksByStage[key].push(t);
  }

  const total = tasks.length;
  const completed = tasks.filter((t) => t.done).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleComplete(taskId: number) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.moduleName) return;
    await fetch(
      `/api/modules/${encodeURIComponent(task.moduleName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      }
    );
    loadTasks();
  }

  async function handleDelete(taskId: number) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.moduleName) return;
    await fetch(
      `/api/modules/${encodeURIComponent(task.moduleName)}/tasks/${taskId}`,
      { method: "DELETE" }
    );
    loadTasks();
  }

  async function handleAssign(taskId: number, newAssignee: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.moduleName) return;
    await fetch(
      `/api/modules/${encodeURIComponent(task.moduleName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", assignee: newAssignee }),
      }
    );
    loadTasks();
  }

  async function handleEdit(taskId: number, text: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.moduleName) return;
    await fetch(
      `/api/modules/${encodeURIComponent(task.moduleName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", text }),
      }
    );
    loadTasks();
  }

  async function handleDateChange(taskId: number, date: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.moduleName) return;
    await fetch(
      `/api/modules/${encodeURIComponent(task.moduleName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "date", date }),
      }
    );
    loadTasks();
  }

  async function handlePhaseChange(taskId: number, phase: number) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.moduleName) return;
    await fetch(
      `/api/modules/${encodeURIComponent(task.moduleName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "phase", phase }),
      }
    );
    loadTasks();
  }

  return (
    <div className="space-y-3">
      {/* Header row: title + week nav + progress */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Tasks</h1>
        <WeekNavigator weekStart={weekStart} onChange={setWeekStart} />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground tabular-nums">
            {completed}/{total}
          </span>
          <Progress value={pct} className="h-1.5 w-20" />
          <span className="text-xs font-medium tabular-nums">{pct}%</span>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        module={module}
        onModuleChange={setModule}
        modules={modules}
        stage={stage}
        onStageChange={setStage}
        stages={stages}
        phase={phase}
        onPhaseChange={setPhase}
        assignee={assignee}
        onAssigneeChange={setAssignee}
        status={status}
        onStatusChange={setStatus}
        assignees={assignees}
      />

      {/* Add task toggle */}
      {showAddForm ? (
        <div className="rounded-md border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Task</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowAddForm(false)}>
              Close
            </Button>
          </div>
          <AddTaskForm
            modules={modules}
            stages={stages}
            date={weekStart}
            onAdded={() => {
              loadTasks();
              loadModules();
            }}
          />
        </div>
      ) : (
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowAddForm(true)}>
          + Add Task
        </Button>
      )}

      {/* Task list grouped by stage */}
      {Object.keys(tasksByStage).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(tasksByStage).map(([sName, stageTasks]) => (
            <StageTaskGroup
              key={sName}
              stageName={sName}
              tasks={stageTasks}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onAssign={handleAssign}
              onEdit={handleEdit}
              onDateChange={handleDateChange}
              onPhaseChange={handlePhaseChange}
            />
          ))}
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          moduleName=""
          showModule
          onComplete={handleComplete}
          onDelete={handleDelete}
          onAssign={handleAssign}
          onEdit={handleEdit}
          onDateChange={handleDateChange}
          onPhaseChange={handlePhaseChange}
        />
      )}
    </div>
  );
}
