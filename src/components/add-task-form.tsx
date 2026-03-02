"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTaskFormProps {
  moduleName?: string;
  modules?: string[];
  date?: string;
  onAdded?: () => void;
  stages?: string[];
}

export function AddTaskForm({ moduleName, modules, date, onAdded, stages }: AddTaskFormProps) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("0");
  const [assignee, setAssignee] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [selectedModule, setSelectedModule] = useState(moduleName ?? "");
  const [newModule, setNewModule] = useState("");
  const [taskDate, setTaskDate] = useState(date ?? new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [existingAssignees, setExistingAssignees] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState("");
  const [fetchedStages, setFetchedStages] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/assignees")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setExistingAssignees(data); });
    if (!stages) {
      fetch("/api/stages")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setFetchedStages(data.map((s: { name: string }) => s.name));
        });
    }
  }, [stages]);

  // Sync external date prop
  useEffect(() => {
    if (date) setTaskDate(date);
  }, [date]);

  const targetModule = moduleName ?? (selectedModule === "__new__" ? newModule.trim() : selectedModule);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !targetModule) return;
    setLoading(true);
    const finalAssignee = assignee === "__new__" ? newAssignee.trim() : assignee;
    try {
      // Create module first if it's new
      if (selectedModule === "__new__" && newModule.trim()) {
        await fetch("/api/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newModule.trim() }),
        });
      }
      await fetch(`/api/modules/${encodeURIComponent(targetModule)}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          phase: parseInt(phase, 10),
          assignee: finalAssignee || undefined,
          date: taskDate,
          stageName: selectedStage && selectedStage !== "none" ? selectedStage : undefined,
        }),
      });
      setText("");
      setAssignee("");
      setNewAssignee("");
      if (selectedModule === "__new__") {
        setSelectedModule(newModule.trim());
        setNewModule("");
      }
      onAdded?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        {/* Module selector — only show when no fixed module */}
        {!moduleName && (
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              {modules?.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
              <SelectItem value="__new__">+ New module...</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Task text */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Task description..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Phase */}
        <Select value={phase} onValueChange={setPhase}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">P0 Critical</SelectItem>
            <SelectItem value="1">P1 High</SelectItem>
            <SelectItem value="2">P2 Medium</SelectItem>
            <SelectItem value="3">P3 Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Stage */}
        <Select value={selectedStage} onValueChange={setSelectedStage}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Stage</SelectItem>
            {(stages ?? fetchedStages).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignee — pick existing or type new */}
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Unassigned">Unassigned</SelectItem>
            {existingAssignees.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
            <SelectItem value="__new__">+ New person...</SelectItem>
          </SelectContent>
        </Select>

        {/* Date */}
        <Input
          type="date"
          value={taskDate}
          onChange={(e) => setTaskDate(e.target.value)}
          className="w-[150px]"
        />

        <Button type="submit" disabled={loading || !text.trim() || !targetModule}>
          {loading ? "Adding..." : "Add Task"}
        </Button>
      </div>

      {/* Inline inputs for new module / new assignee */}
      {(selectedModule === "__new__" || assignee === "__new__") && (
        <div className="flex flex-wrap gap-2">
          {selectedModule === "__new__" && (
            <Input
              placeholder="New module name..."
              value={newModule}
              onChange={(e) => setNewModule(e.target.value)}
              className="w-[240px]"
              autoFocus
            />
          )}
          {assignee === "__new__" && (
            <Input
              placeholder="New assignee name..."
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="w-[240px]"
              autoFocus={selectedModule !== "__new__"}
            />
          )}
        </div>
      )}
    </form>
  );
}
