"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { TaskList } from "@/components/task-list";
import { AddTaskForm } from "@/components/add-task-form";
import { StageBadge } from "@/components/stage-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskItem } from "@/components/task-row";

interface Stage {
  id: number;
  name: string;
  order: number;
}

export default function ModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleName: string }>;
}) {
  const { moduleName } = use(params);
  const decodedName = decodeURIComponent(moduleName);
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [moduleStatus, setModuleStatus] = useState<string>("");
  const [moduleOwner, setModuleOwner] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(decodedName);
  const [renameError, setRenameError] = useState("");

  const load = useCallback(() => {
    // Fetch tasks with stage info via /api/tasks
    fetch(`/api/tasks?module=${encodeURIComponent(decodedName)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
      });
  }, [decodedName]);

  const loadStages = useCallback(() => {
    fetch("/api/stages")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAllStages(data);
      });
  }, []);

  const loadModuleStatus = useCallback(() => {
    fetch(`/api/modules/${encodeURIComponent(decodedName)}/stages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModuleStatus(data[0].name);
        }
      });
    fetch(`/api/module-stages/owners?module=${encodeURIComponent(decodedName)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.owner) setModuleOwner(data.owner);
      });
  }, [decodedName]);

  useEffect(() => {
    load();
    loadStages();
    loadModuleStatus();
  }, [load, loadStages, loadModuleStatus]);

  async function handleStatusChange(newStatus: string) {
    await fetch("/api/module-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: decodedName, stage: newStatus }),
    });
    setModuleStatus(newStatus);
  }

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

  async function handleEdit(taskId: number, text: string) {
    await fetch(
      `/api/modules/${encodeURIComponent(decodedName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", text }),
      }
    );
    load();
  }

  async function handleDateChange(taskId: number, date: string) {
    await fetch(
      `/api/modules/${encodeURIComponent(decodedName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "date", date }),
      }
    );
    load();
  }

  async function handlePhaseChange(taskId: number, phase: number) {
    await fetch(
      `/api/modules/${encodeURIComponent(decodedName)}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "phase", phase }),
      }
    );
    load();
  }

  async function handleRename() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === decodedName) {
      setEditingName(false);
      setNameInput(decodedName);
      setRenameError("");
      return;
    }
    const res = await fetch(
      `/api/modules/${encodeURIComponent(decodedName)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      }
    );
    if (!res.ok) {
      const data = await res.json();
      setRenameError(data.error || "Rename failed");
      return;
    }
    setEditingName(false);
    setRenameError("");
    router.replace(`/modules/${encodeURIComponent(trimmed)}`);
  }

  const stageNames = allStages.map((s) => s.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              className="h-9 text-lg font-bold w-[260px]"
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setRenameError(""); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setEditingName(false); setNameInput(decodedName); setRenameError(""); }
              }}
              autoFocus
            />
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRename}>
              Save
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setEditingName(false); setNameInput(decodedName); setRenameError(""); }}>
              Cancel
            </Button>
            {renameError && <span className="text-xs text-destructive">{renameError}</span>}
          </div>
        ) : (
          <h1
            className="text-2xl font-bold cursor-pointer hover:text-muted-foreground transition-colors"
            onClick={() => setEditingName(true)}
            title="Click to rename"
          >
            {decodedName}
          </h1>
        )}
        {moduleStatus && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Module Status:</span>
            <Select value={moduleStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px] h-9">
                <StageBadge stage={moduleStatus} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {allStages.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    <StageBadge stage={s.name} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {moduleOwner && (
          <span className="text-sm text-muted-foreground">
            Owner: {moduleOwner}
          </span>
        )}
      </div>

      <AddTaskForm
        moduleName={decodedName}
        stages={stageNames}
        onAdded={load}
      />

      <TaskList
        tasks={tasks}
        moduleName={decodedName}
        onComplete={handleComplete}
        onDelete={handleDelete}
        onAssign={handleAssign}
        onEdit={handleEdit}
        onDateChange={handleDateChange}
        onPhaseChange={handlePhaseChange}
      />
    </div>
  );
}
