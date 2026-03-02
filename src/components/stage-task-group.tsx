"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/stage-badge";
import { TaskList } from "@/components/task-list";
import type { TaskItem } from "@/components/task-row";

interface StageTaskGroupProps {
  stageName: string;
  tasks: TaskItem[];
  onComplete?: (taskId: number) => void;
  onDelete?: (taskId: number) => void;
  onAssign?: (taskId: number, assignee: string) => void;
  onEdit?: (taskId: number, text: string) => void;
  onDateChange?: (taskId: number, date: string) => void;
  onPhaseChange?: (taskId: number, phase: number) => void;
}

export function StageTaskGroup({
  stageName,
  tasks,
  onComplete,
  onDelete,
  onAssign,
  onEdit,
  onDateChange,
  onPhaseChange,
}: StageTaskGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-1.5">
      <Button
        variant="ghost"
        className="flex w-full items-center justify-between px-2 py-1 h-8"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {collapsed ? "+" : "-"}
          </span>
          <StageBadge stage={stageName} />
          <span className="text-sm font-medium">{stageName}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {done}/{tasks.length}
        </span>
      </Button>
      {!collapsed && (
        <div className="ml-4">
          <TaskList
            tasks={tasks}
            moduleName=""
            showModule
            onComplete={onComplete}
            onDelete={onDelete}
            onAssign={onAssign}
            onEdit={onEdit}
            onDateChange={onDateChange}
            onPhaseChange={onPhaseChange}
          />
        </div>
      )}
    </div>
  );
}
