"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DashboardData {
  total: number;
  completed: number;
  pending: number;
  byModule: Record<string, { total: number; done: number }>;
  byAssignee: Record<string, { total: number; done: number }>;
  byPhase: Record<string, { total: number; done: number }>;
}

const phaseLabels: Record<string, string> = {
  "0": "P0 Critical",
  "1": "P1 High",
  "2": "P2 Medium",
  "3": "P3 Low",
};

export function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <p className="text-muted-foreground py-8 text-center">Loading...</p>;
  }

  const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tasks" value={data.total} />
        <StatCard title="Completed" value={data.completed} />
        <StatCard title="Pending" value={data.pending} />
        <StatCard title="Completion" value={`${pct}%`} />
      </div>

      {/* Progress by module */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Module</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(data.byModule).length === 0 && (
            <p className="text-muted-foreground text-sm">No modules yet.</p>
          )}
          {Object.entries(data.byModule).map(([name, stats]) => (
            <ProgressRow
              key={name}
              label={name}
              done={stats.done}
              total={stats.total}
            />
          ))}
        </CardContent>
      </Card>

      {/* Progress by assignee */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Assignee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.byAssignee).length === 0 && (
              <p className="text-muted-foreground text-sm">No tasks yet.</p>
            )}
            {Object.entries(data.byAssignee).map(([name, stats]) => (
              <ProgressRow
                key={name}
                label={name}
                done={stats.done}
                total={stats.total}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Phase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.byPhase).length === 0 && (
              <p className="text-muted-foreground text-sm">No tasks yet.</p>
            )}
            {Object.entries(data.byPhase).map(([phase, stats]) => (
              <ProgressRow
                key={phase}
                label={phaseLabels[phase] ?? `Phase ${phase}`}
                done={stats.done}
                total={stats.total}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ProgressRow({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {done}/{total}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
