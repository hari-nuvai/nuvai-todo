"use client";

import { useEffect, useState, useCallback } from "react";
import { TaskList } from "@/components/task-list";
import { AddTaskForm } from "@/components/add-task-form";
import { FilterBar } from "@/components/filter-bar";
import { DateNavigator } from "@/components/date-navigator";
import type { TaskItem } from "@/components/task-row";

export default function TasksPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [phase, setPhase] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [status, setStatus] = useState("all");

  const loadTasks = useCallback(() => {
    const params = new URLSearchParams();
    params.set("date", date);
    if (phase !== "all") params.set("phase", phase);
    if (assignee !== "all") params.set("assignee", assignee);
    if (status === "pending") params.set("done", "false");
    if (status === "done") params.set("done", "true");

    fetch(`/api/tasks?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
      });
  }, [date, phase, assignee, status]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const loadModules = useCallback(() => {
    fetch("/api/modules")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setModules(data.map((m: { name: string }) => m.name));
      });
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const assignees = [...new Set(tasks.map((t) => t.assignee))].sort();

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>

      {/* Add task — pick module, date is pre-filled */}
      <AddTaskForm modules={modules} date={date} onAdded={() => { loadTasks(); loadModules(); }} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateNavigator date={date} onChange={setDate} />
        <FilterBar
          phase={phase}
          onPhaseChange={setPhase}
          assignee={assignee}
          onAssigneeChange={setAssignee}
          status={status}
          onStatusChange={setStatus}
          assignees={assignees}
        />
      </div>
      <TaskList
        tasks={tasks}
        moduleName=""
        showModule
        onComplete={handleComplete}
        onDelete={handleDelete}
        onAssign={handleAssign}
      />
    </div>
  );
}
