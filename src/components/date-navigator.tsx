"use client";

import { Button } from "@/components/ui/button";

interface DateNavigatorProps {
  date: string;
  onChange: (date: string) => void;
}

export function DateNavigator({ date, onChange }: DateNavigatorProps) {
  function shift(days: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().slice(0, 10));
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => shift(-1)}>
        Prev
      </Button>
      <span className="text-sm font-medium min-w-[110px] text-center">
        {date}
      </span>
      <Button variant="outline" size="sm" onClick={() => shift(1)}>
        Next
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(new Date().toISOString().slice(0, 10))}
      >
        Today
      </Button>
    </div>
  );
}
