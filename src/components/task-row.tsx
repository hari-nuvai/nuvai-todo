"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhaseBadge } from "@/components/phase-badge";
import { StageBadge } from "@/components/stage-badge";
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
  stageName?: string | null;
}

interface TaskRowProps {
  task: TaskItem;
  moduleName: string;
  onComplete?: () => void;
  onDelete?: () => void;
  onAssign?: (assignee: string) => void;
  onEdit?: (text: string) => void;
  onDateChange?: (date: string) => void;
  onPhaseChange?: (phase: number) => void;
  showModule?: boolean;
}

export function TaskRow({
  task,
  moduleName,
  onComplete,
  onDelete,
  onAssign,
  onEdit,
  onDateChange,
  onPhaseChange,
  showModule,
}: TaskRowProps) {
  const [assigning, setAssigning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editDate, setEditDate] = useState(task.date);
  const [pickValue, setPickValue] = useState(task.assignee);
  const [newName, setNewName] = useState("");
  const [existingAssignees, setExistingAssignees] = useState<string[]>([]);

  useEffect(() => {
    if (assigning) {
      fetch("/api/assignees")
        .then((r) => (r.ok ? r.json() : []))
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

  function handleEditSave() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== task.text) {
      onEdit?.(trimmed);
    }
    setEditing(false);
  }

  function handleDateSave() {
    if (editDate && editDate !== task.date) {
      onDateChange?.(editDate);
    }
    setEditingDate(false);
  }

  const isDone = task.done;

  return (
    <div className="flex items-center gap-2 rounded border border-border px-2 py-1.5 text-sm">
      <Checkbox
        checked={isDone}
        disabled={isDone}
        onCheckedChange={() => onComplete?.()}
        className="h-3.5 w-3.5"
      />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              className="h-7 text-sm flex-1"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEditSave();
                if (e.key === "Escape") { setEditing(false); setEditText(task.text); }
              }}
              autoFocus
            />
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleEditSave}>
              OK
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setEditing(false); setEditText(task.text); }}>
              X
            </Button>
          </div>
        ) : (
          <span
            className={`cursor-pointer hover:underline ${isDone ? "line-through text-muted-foreground" : ""}`}
            onClick={() => !isDone && setEditing(true)}
            title={isDone ? undefined : "Click to edit"}
          >
            {task.text}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          {/* Phase — click to change */}
          {!isDone ? (
            <Select
              value={String(task.phase)}
              onValueChange={(v) => onPhaseChange?.(Number(v))}
            >
              <SelectTrigger className="h-5 w-auto border-0 p-0 shadow-none focus:ring-0 [&>svg]:hidden">
                <PhaseBadge phase={task.phase} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">P0 Critical</SelectItem>
                <SelectItem value="1">P1 High</SelectItem>
                <SelectItem value="2">P2 Medium</SelectItem>
                <SelectItem value="3">P3 Low</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <PhaseBadge phase={task.phase} />
          )}

          {/* Assignee */}
          {!assigning ? (
            <Badge
              variant="outline"
              className="text-[11px] h-5 px-1.5 cursor-pointer hover:bg-accent"
              onClick={() => !isDone && setAssigning(true)}
              title={isDone ? undefined : "Click to reassign"}
            >
              {task.assignee}
            </Badge>
          ) : (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Select value={pickValue} onValueChange={setPickValue}>
                <SelectTrigger className="h-6 w-[120px] text-xs">
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
                  className="h-6 w-[90px] text-xs"
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              )}
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={handleAssignConfirm}>
                OK
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => setAssigning(false)}>
                X
              </Button>
            </div>
          )}

          {task.stageName && <StageBadge stage={task.stageName} />}
          {showModule && task.moduleName && (
            <Badge variant="secondary" className="text-[11px] h-5 px-1.5">
              {task.moduleName}
            </Badge>
          )}

          {/* Date — click to change */}
          {editingDate ? (
            <div className="flex items-center gap-1">
              <Input
                type="date"
                className="h-6 w-[130px] text-xs"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDateSave();
                  if (e.key === "Escape") { setEditingDate(false); setEditDate(task.date); }
                }}
                autoFocus
              />
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={handleDateSave}>
                OK
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => { setEditingDate(false); setEditDate(task.date); }}>
                X
              </Button>
            </div>
          ) : (
            <span
              className={`text-[11px] text-muted-foreground ${!isDone ? "cursor-pointer hover:underline" : ""}`}
              onClick={() => !isDone && setEditingDate(true)}
              title={isDone ? undefined : "Click to change date"}
            >
              {task.date}
            </span>
          )}
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground shrink-0">#{task.id}</span>
      {onDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive h-6 px-1.5 text-xs">
          Del
        </Button>
      )}
    </div>
  );
}
