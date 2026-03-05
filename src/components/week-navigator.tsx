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
  const isThisWeek = fmt(getMonday(new Date())) === weekStart;

  function shift(weeks: number) {
    const d = new Date(monday);
    d.setDate(d.getDate() + weeks * 7);
    onChange(fmt(d));
  }

  function goThisWeek() {
    onChange(fmt(getMonday(new Date())));
  }

  return (
    <div className="inline-flex items-center rounded-md border border-border h-8">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-r-none border-r border-border"
        onClick={() => shift(-1)}
      >
        &larr;
      </Button>
      <button
        className={`px-3 h-8 text-xs font-medium hover:bg-accent transition-colors ${
          isThisWeek ? "text-foreground" : "text-muted-foreground"
        }`}
        onClick={goThisWeek}
        title="Go to this week"
      >
        {fmtShort(monday)} – {fmtShort(friday)}, {monday.getFullYear()}
      </button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-l-none border-l border-border"
        onClick={() => shift(1)}
      >
        &rarr;
      </Button>
    </div>
  );
}

export { getMonday, getFriday };
