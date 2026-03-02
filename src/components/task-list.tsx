"use client";

import { TaskRow, type TaskItem } from "./task-row";

interface TaskListProps {
  tasks: TaskItem[];
  moduleName: string;
  showModule?: boolean;
  onComplete?: (taskId: number) => void;
  onDelete?: (taskId: number) => void;
  onAssign?: (taskId: number, assignee: string) => void;
}

export function TaskList({
  tasks,
  moduleName,
  showModule,
  onComplete,
  onDelete,
  onAssign,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4 text-center">
        No tasks found.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          moduleName={task.moduleName ?? moduleName}
          showModule={showModule}
          onComplete={() => onComplete?.(task.id)}
          onDelete={() => onDelete?.(task.id)}
          onAssign={(assignee) => onAssign?.(task.id, assignee)}
        />
      ))}
    </div>
  );
}
