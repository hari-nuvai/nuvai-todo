"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhaseBadge } from "@/components/phase-badge";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TaskItem {
  id: number;
  text: string;
  phase: number;
  assignee: string;
  date: string;
  done: boolean;
  moduleName?: string;
}

interface TaskRowProps {
  task: TaskItem;
  moduleName: string;
  onComplete?: () => void;
  onDelete?: () => void;
  onAssign?: (assignee: string) => void;
  showModule?: boolean;
}

export function TaskRow({
  task,
  moduleName,
  onComplete,
  onDelete,
  onAssign,
  showModule,
}: TaskRowProps) {
  const [assigning, setAssigning] = useState(false);
  const [pickValue, setPickValue] = useState(task.assignee);
  const [newName, setNewName] = useState("");
  const [existingAssignees, setExistingAssignees] = useState<string[]>([]);

  useEffect(() => {
    if (assigning) {
      fetch("/api/assignees")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setExistingAssignees(data); });
    }
  }, [assigning]);

  function handleAssignConfirm() {
    const finalName = pickValue === "__new__" ? newName.trim() : pickValue;
    if (finalName && finalName !== task.assignee) {
      onAssign?.(finalName);
    }
    setAssigning(false);
    setNewName("");
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
      <Checkbox
        checked={task.done}
        disabled={task.done}
        onCheckedChange={() => onComplete?.()}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${task.done ? "line-through text-muted-foreground" : ""}`}
        >
          {task.text}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <PhaseBadge phase={task.phase} />

          {/* Assignee — click to reassign */}
          {!assigning ? (
            <Badge
              variant="outline"
              className="text-xs cursor-pointer hover:bg-accent"
              onClick={() => !task.done && setAssigning(true)}
              title={task.done ? undefined : "Click to reassign"}
            >
              {task.assignee}
            </Badge>
          ) : (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Select value={pickValue} onValueChange={setPickValue}>
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  {existingAssignees.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                  <SelectItem value="__new__">+ New...</SelectItem>
                </SelectContent>
              </Select>
              {pickValue === "__new__" && (
                <Input
                  className="h-7 w-[100px] text-xs"
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              )}
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleAssignConfirm}>
                OK
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAssigning(false)}>
                X
              </Button>
            </div>
          )}

          {showModule && task.moduleName && (
            <Badge variant="secondary" className="text-xs">
              {task.moduleName}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{task.date}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">#{task.id}</span>
      {onDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive h-7 px-2">
          Delete
        </Button>
      )}
    </div>
  );
}
