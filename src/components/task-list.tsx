"use client";

import { TaskRow, type TaskItem } from "./task-row";

interface TaskListProps {
  tasks: TaskItem[];
  moduleName: string;
  showModule?: boolean;
  onComplete?: (taskId: number) => void;
  onDelete?: (taskId: number) => void;
  onAssign?: (taskId: number, assignee: string) => void;
  onEdit?: (taskId: number, text: string) => void;
  onDateChange?: (taskId: number, date: string) => void;
  onPhaseChange?: (taskId: number, phase: number) => void;
}

export function TaskList({
  tasks,
  moduleName,
  showModule,
  onComplete,
  onDelete,
  onAssign,
  onEdit,
  onDateChange,
  onPhaseChange,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4 text-center">
        No tasks found.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          moduleName={task.moduleName ?? moduleName}
          showModule={showModule}
          onComplete={() => onComplete?.(task.id)}
          onDelete={() => onDelete?.(task.id)}
          onAssign={(assignee) => onAssign?.(task.id, assignee)}
          onEdit={(text) => onEdit?.(task.id, text)}
          onDateChange={(date) => onDateChange?.(task.id, date)}
          onPhaseChange={(phase) => onPhaseChange?.(task.id, phase)}
        />
      ))}
    </div>
  );
}
