"use client";

import { Progress } from "@/components/ui/progress";

interface WeeklyProgressProps {
  weekStart: string;
  weekEnd: string;
  total: number;
  completed: number;
}

export function WeeklyProgress({
  total,
  completed,
}: WeeklyProgressProps) {
  const pending = total - completed;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 rounded border border-border px-3 py-2">
      <span className="text-sm font-medium">
        {completed}/{total} done
      </span>
      <Progress value={pct} className="h-2 flex-1 max-w-[200px]" />
      <span className="text-xs text-muted-foreground">{pending} pending</span>
    </div>
  );
}
