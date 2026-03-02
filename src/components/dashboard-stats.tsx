"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StageBadge } from "@/components/stage-badge";
import { Progress } from "@/components/ui/progress";

interface DashboardData {
  total: number;
  completed: number;
  pending: number;
  byModule: Record<string, { total: number; done: number }>;
  byAssignee: Record<string, { total: number; done: number }>;
  byPhase: Record<string, { total: number; done: number }>;
  byStage: Record<string, { total: number; done: number }>;
}

interface MatrixData {
  stages: { id: number; name: string; order: number }[];
  rows: { module: string; status: string; owner: string }[];
  summary: Record<string, number>;
}

const phaseLabels: Record<string, string> = {
  "0": "P0 Critical",
  "1": "P1 High",
  "2": "P2 Medium",
  "3": "P3 Low",
};

const phaseColors: Record<string, string> = {
  "0": "bg-red-500",
  "1": "bg-orange-500",
  "2": "bg-blue-500",
  "3": "bg-zinc-500",
};

export function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [matrix, setMatrix] = useState<MatrixData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
    fetch("/api/matrix")
      .then((r) => r.json())
      .then(setMatrix);
  }, []);

  if (!data || !matrix) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading...</p>;
  }

  const totalModules = matrix.rows.length;
  const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Top stats row */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Modules" value={totalModules} />
        <StatCard label="Tasks" value={data.total} />
        <StatCard label="Open" value={data.pending} accent />
        <StatCard label="Done" value={data.completed} />
      </div>

      {/* Overall progress */}
      <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
        <span className="text-xs text-muted-foreground shrink-0">Progress</span>
        <Progress value={pct} className="h-1.5 flex-1" />
        <span className="text-xs font-medium tabular-nums">{pct}%</span>
      </div>

      {/* Module status chips */}
      <div className="flex flex-wrap gap-1.5">
        {matrix.stages.map((s) => {
          const count = matrix.summary[s.name] ?? 0;
          return (
            <div
              key={s.id}
              className="flex items-center gap-1 rounded border border-border px-2 py-1"
            >
              <StageBadge stage={s.name} />
              <span className="text-xs font-semibold tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Priority + Assignee side by side */}
      <div className="grid gap-2 md:grid-cols-2">
        <Section title="By Priority">
          {Object.entries(data.byPhase).length === 0 && (
            <p className="text-muted-foreground text-xs py-2">No tasks yet.</p>
          )}
          {Object.entries(data.byPhase)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([phase, stats]) => {
              const barPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
              return (
                <Link
                  key={phase}
                  href={`/tasks?phase=${phase}`}
                  className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent transition-colors"
                >
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${phaseColors[phase] ?? "bg-zinc-500"}`}
                  />
                  <span className="text-sm flex-1 truncate">
                    {phaseLabels[phase] ?? `Phase ${phase}`}
                  </span>
                  <MiniBar pct={barPct} className="w-12" />
                  <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">
                    {stats.done}/{stats.total}
                  </span>
                </Link>
              );
            })}
        </Section>

        <Section title="By Assignee">
          {Object.entries(data.byAssignee).length === 0 && (
            <p className="text-muted-foreground text-xs py-2">No tasks yet.</p>
          )}
          {Object.entries(data.byAssignee)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([name, stats]) => {
              const barPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
              return (
                <Link
                  key={name}
                  href={`/tasks?assignee=${encodeURIComponent(name)}`}
                  className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent transition-colors"
                >
                  <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm flex-1 truncate">{name}</span>
                  <MiniBar pct={barPct} className="w-12" />
                  <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">
                    {stats.done}/{stats.total}
                  </span>
                </Link>
              );
            })}
        </Section>
      </div>

      {/* Tasks by module */}
      <Section title="By Module">
        <div className="grid gap-1 sm:grid-cols-2">
          {Object.entries(data.byModule)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([name, stats]) => {
              const modRow = matrix.rows.find((r) => r.module === name);
              return (
                <Link
                  key={name}
                  href={`/modules/${encodeURIComponent(name)}`}
                  className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium truncate">{name}</span>
                    {modRow && <StageBadge stage={modRow.status} />}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">
                    {stats.done}/{stats.total}
                  </span>
                </Link>
              );
            })}
        </div>
      </Section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${accent ? "text-orange-400" : ""}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border">
      <div className="px-3 py-1.5 border-b border-border">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-1">{children}</div>
    </div>
  );
}

function MiniBar({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className={`h-1 rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-emerald-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
