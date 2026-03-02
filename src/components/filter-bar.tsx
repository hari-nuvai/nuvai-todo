"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  phase: string;
  onPhaseChange: (v: string) => void;
  assignee: string;
  onAssigneeChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  assignees: string[];
}

export function FilterBar({
  phase,
  onPhaseChange,
  assignee,
  onAssigneeChange,
  status,
  onStatusChange,
  assignees,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={phase} onValueChange={onPhaseChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Phase" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Phases</SelectItem>
          <SelectItem value="0">P0 Critical</SelectItem>
          <SelectItem value="1">P1 High</SelectItem>
          <SelectItem value="2">P2 Medium</SelectItem>
          <SelectItem value="3">P3 Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={assignee} onValueChange={onAssigneeChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {assignees.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
