"use client";

import { useEffect, useState, useCallback, use } from "react";
import { TaskList } from "@/components/task-list";
import { AddTaskForm } from "@/components/add-task-form";
import type { TaskItem } from "@/components/task-row";

export default function ModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleName: string }>;
}) {
  const { moduleName } = use(params);
  const decodedName = decodeURIComponent(moduleName);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const load = useCallback(() => {
    fetch(`/api/modules/${encodeURIComponent(decodedName)}/tasks`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
      });
  }, [decodedName]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComplete(taskId: number) {
    await fetch(
      `/api/modules/${encodeURIComponent(decodedName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      }
    );
    load();
  }

  async function handleDelete(taskId: number) {
    await fetch(
      `/api/modules/${encodeURIComponent(decodedName)}/tasks/${taskId}`,
      { method: "DELETE" }
    );
    load();
  }

  async function handleAssign(taskId: number, assignee: string) {
    await fetch(
      `/api/modules/${encodeURIComponent(decodedName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", assignee }),
      }
    );
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{decodedName}</h1>
      <AddTaskForm moduleName={decodedName} onAdded={load} />
      <TaskList
        tasks={tasks}
        moduleName={decodedName}
        onComplete={handleComplete}
        onDelete={handleDelete}
        onAssign={handleAssign}
      />
    </div>
  );
}
