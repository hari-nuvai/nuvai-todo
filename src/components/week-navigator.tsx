"use client";

import { Button } from "@/components/ui/button";

interface WeekNavigatorProps {
  weekStart: string; // YYYY-MM-DD (Monday)
  onChange: (weekStart: string) => void;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function getFriday(monday: Date): Date {
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WeekNavigator({ weekStart, onChange }: WeekNavigatorProps) {
  const monday = new Date(weekStart + "T00:00:00");
  const friday = getFriday(monday);

  function shift(weeks: number) {
    const d = new Date(monday);
    d.setDate(d.getDate() + weeks * 7);
    onChange(fmt(d));
  }

  function goThisWeek() {
    onChange(fmt(getMonday(new Date())));
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => shift(-1)}>
        Prev
      </Button>
      <span className="text-sm font-medium min-w-[180px] text-center">
        {fmtShort(monday)} — {fmtShort(friday)}, {monday.getFullYear()}
      </span>
      <Button variant="outline" size="sm" onClick={() => shift(1)}>
        Next
      </Button>
      <Button variant="ghost" size="sm" onClick={goThisWeek}>
        This Week
      </Button>
    </div>
  );
}

export { getMonday, getFriday };
