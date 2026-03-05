"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export type TrackerType = "task" | "account" | "laptop";

const config: Record<
  TrackerType,
  { label: string; tabs: { href: string; label: string }[] }
> = {
  task: {
    label: "Task Tracker",
    tabs: [
      { href: "/status", label: "Status" },
      { href: "/modules", label: "Modules" },
      { href: "/tasks", label: "Tasks" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  account: {
    label: "Account Tracker",
    tabs: [
      { href: "/accounts", label: "Accounts" },
      { href: "/cards", label: "Cards" },
      { href: "/payments", label: "Payments" },
      { href: "/audit-logs", label: "Audit Logs" },
    ],
  },
  laptop: {
    label: "Laptop Tracker",
    tabs: [],
  },
};

export function TrackerNav({ tracker }: { tracker: TrackerType }) {
  const pathname = usePathname();
  const { label, tabs } = config[tracker];

  return (
    <div className="flex shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6 h-10">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Hub
      </Link>
      <span className="text-border">/</span>
      <span className="text-xs font-medium">{label}</span>

      {tabs.length > 0 && (
        <nav className="flex items-center gap-1 ml-2">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
