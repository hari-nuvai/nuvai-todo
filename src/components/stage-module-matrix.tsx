"use client";

import { useEffect, useState } from "react";
import { StageBadge } from "@/components/stage-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MatrixRow {
  module: string;
  status: string;
  owner: string;
}

interface MatrixData {
  stages: { id: number; name: string; order: number }[];
  rows: MatrixRow[];
  summary: Record<string, number>;
}

export function StageModuleMatrix({ initialData }: { initialData?: MatrixData }) {
  const [data, setData] = useState<MatrixData | null>(initialData ?? null);
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [ownerMode, setOwnerMode] = useState<"pick" | "new">("pick");
  const [ownerInput, setOwnerInput] = useState("");
  const [existingAssignees, setExistingAssignees] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");

  useEffect(() => {
    if (!initialData) loadMatrix();
    fetch("/api/assignees")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setExistingAssignees(d); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMatrix() {
    const res = await fetch("/api/matrix");
    if (res.ok) setData(await res.json());
  }

  function handleStatusChange(moduleName: string, newStatus: string) {
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const oldStatus = prev.rows.find((r) => r.module === moduleName)?.status;
      const newRows = prev.rows.map((r) =>
        r.module === moduleName ? { ...r, status: newStatus } : r
      );
      const newSummary = { ...prev.summary };
      if (oldStatus && newSummary[oldStatus] !== undefined) newSummary[oldStatus]--;
      if (newSummary[newStatus] !== undefined) newSummary[newStatus]++;
      return { ...prev, rows: newRows, summary: newSummary };
    });

    // Fire and forget, then background sync
    fetch("/api/module-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: moduleName, stage: newStatus }),
    }).then(() => loadMatrix());
  }

  function handleOwnerSave(moduleName: string, owner: string) {
    const trimmed = owner.trim();
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const newRows = prev.rows.map((r) =>
        r.module === moduleName ? { ...r, owner: trimmed } : r
      );
      return { ...prev, rows: newRows };
    });
    setEditingOwner(null);
    setOwnerInput("");
    setOwnerMode("pick");

    fetch("/api/module-stages/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: moduleName, owner: trimmed || null }),
    }).then(() => loadMatrix());
  }

  if (!data) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        Loading tracker...
      </p>
    );
  }

  // Get unique module names for filter
  const moduleNames = [...new Set(data.rows.map((r) => r.module))].sort();

  // Apply filters
  let filteredRows = data.rows;
  if (filterStatus !== "all") {
    filteredRows = filteredRows.filter((r) => r.status === filterStatus);
  }
  if (filterModule !== "all") {
    filteredRows = filteredRows.filter((r) => r.module === filterModule);
  }

  return (
    <div className="space-y-3">
      {/* Summary chips + filters in one row */}
      <div className="flex flex-wrap items-center gap-2">
        {data.stages.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 cursor-pointer hover:bg-accent"
            onClick={() => setFilterStatus(filterStatus === s.name ? "all" : s.name)}
          >
            <StageBadge stage={s.name} />
            <span className="text-xs font-medium">
              {data.summary[s.name] ?? 0}
            </span>
          </div>
        ))}

        <div className="flex items-center gap-1.5 ml-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="all">All Statuses</SelectItem>
              {data.stages.map((s) => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="h-7 w-[150px] text-xs">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="all">All Modules</SelectItem>
              {moduleNames.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterStatus !== "all" || filterModule !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setFilterStatus("all"); setFilterModule("all"); }}
            >
              Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {filteredRows.length}/{data.rows.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded border border-border">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-[180px] py-2">Module</TableHead>
              <TableHead className="w-[150px] py-2">Status</TableHead>
              <TableHead className="w-[160px] py-2">Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.module} className="text-sm">
                <TableCell className="font-medium py-1.5 pr-2">
                  <a href={`/modules/${encodeURIComponent(row.module)}`} className="hover:underline">
                    {row.module}
                  </a>
                </TableCell>
                <TableCell className="py-1.5">
                  <Select
                    value={row.status}
                    onValueChange={(v) => handleStatusChange(row.module, v)}
                  >
                    <SelectTrigger className="h-7 w-[140px] text-xs">
                      <StageBadge stage={row.status} />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {data.stages.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          <StageBadge stage={s.name} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="py-1.5">
                  {editingOwner === row.module ? (
                    <div className="flex items-center gap-1">
                      {ownerMode === "pick" ? (
                        <Select
                          value={ownerInput || "__none__"}
                          onValueChange={(v) => {
                            if (v === "__new__") {
                              setOwnerMode("new");
                              setOwnerInput("");
                            } else if (v === "__none__") {
                              setOwnerInput("");
                            } else {
                              handleOwnerSave(row.module, v);
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs">
                            <SelectValue placeholder="Pick..." />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4}>
                            <SelectItem value="__none__">None</SelectItem>
                            {existingAssignees.map((a) => (
                              <SelectItem key={a} value={a}>{a}</SelectItem>
                            ))}
                            <SelectItem value="__new__">+ New...</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <>
                          <Input
                            className="h-7 w-[100px] text-xs"
                            value={ownerInput}
                            onChange={(e) => setOwnerInput(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleOwnerSave(row.module, ownerInput)
                            }
                            placeholder="Name"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 text-xs"
                            onClick={() => handleOwnerSave(row.module, ownerInput)}
                          >
                            OK
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5 text-xs"
                        onClick={() => { setEditingOwner(null); setOwnerMode("pick"); }}
                      >
                        X
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="text-sm cursor-pointer hover:underline"
                      onClick={() => {
                        setEditingOwner(row.module);
                        setOwnerInput(row.owner);
                        setOwnerMode("pick");
                      }}
                    >
                      {row.owner || (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-4 text-sm">
                  No modules match filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
