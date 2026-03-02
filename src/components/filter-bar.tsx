"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const phaseLabels: Record<string, string> = {
  "0": "P0 Critical",
  "1": "P1 High",
  "2": "P2 Medium",
  "3": "P3 Low",
};

interface FilterBarProps {
  phase: string;
  onPhaseChange: (v: string) => void;
  assignee: string;
  onAssigneeChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  assignees: string[];
  module: string;
  onModuleChange: (v: string) => void;
  modules: string[];
  stage?: string;
  onStageChange?: (v: string) => void;
  stages?: string[];
}

const base = "h-7 text-xs";
const active = `${base} ring-1 ring-primary bg-primary/10 text-foreground font-medium`;
const inactive = `${base}`;

export function FilterBar({
  phase,
  onPhaseChange,
  assignee,
  onAssigneeChange,
  status,
  onStatusChange,
  assignees,
  module,
  onModuleChange,
  modules,
  stage,
  onStageChange,
  stages,
}: FilterBarProps) {
  const activeFilters: { key: string; label: string; onClear: () => void }[] = [];
  if (module !== "all") activeFilters.push({ key: "module", label: `Module: ${module}`, onClear: () => onModuleChange("all") });
  if (stage && stage !== "all") activeFilters.push({ key: "stage", label: `Stage: ${stage}`, onClear: () => onStageChange?.("all") });
  if (phase !== "all") activeFilters.push({ key: "phase", label: phaseLabels[phase] ?? `Phase ${phase}`, onClear: () => onPhaseChange("all") });
  if (assignee !== "all") activeFilters.push({ key: "assignee", label: `Assignee: ${assignee}`, onClear: () => onAssigneeChange("all") });
  if (status !== "all") activeFilters.push({ key: "status", label: status === "done" ? "Done" : "Pending", onClear: () => onStatusChange("all") });

  const hasFilters = activeFilters.length > 0;

  return (
    <div className="space-y-2">
      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Filtered:</span>
          {activeFilters.map((f) => (
            <Badge
              key={f.key}
              variant="secondary"
              className="text-xs h-6 px-2 gap-1 cursor-pointer hover:bg-destructive/20 bg-primary/15 text-foreground ring-1 ring-primary/30"
              onClick={f.onClear}
            >
              {f.label}
              <span className="text-muted-foreground ml-0.5">&times;</span>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => {
              onModuleChange("all");
              onStageChange?.("all");
              onPhaseChange("all");
              onAssigneeChange("all");
              onStatusChange("all");
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Compact filter selects — active ones are highlighted */}
      <div className="flex flex-wrap gap-1.5">
        <Select value={module} onValueChange={onModuleChange}>
          <SelectTrigger className={`w-[140px] ${module !== "all" ? active : inactive}`}>
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {stages && onStageChange && (
          <Select value={stage ?? "all"} onValueChange={onStageChange}>
            <SelectTrigger className={`w-[130px] ${stage && stage !== "all" ? active : inactive}`}>
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={phase} onValueChange={onPhaseChange}>
          <SelectTrigger className={`w-[120px] ${phase !== "all" ? active : inactive}`}>
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
          <SelectTrigger className={`w-[130px] ${assignee !== "all" ? active : inactive}`}>
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className={`w-[100px] ${status !== "all" ? active : inactive}`}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
