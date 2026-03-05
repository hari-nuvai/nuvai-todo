"use client";

import Link from "next/link";
import { Activity, Users, Laptop, FileDown } from "lucide-react";

const trackers = [
  {
    name: "Task Tracker",
    description: "Status, modules, tasks & dashboard",
    href: "/status",
    icon: Activity,
    accent: "text-blue-400",
    border: "border-blue-500/20 hover:border-blue-500/40",
    bg: "hover:bg-blue-500/5",
  },
  {
    name: "Account Tracker",
    description: "Accounts, cards, payments & audit logs",
    href: "/accounts",
    icon: Users,
    accent: "text-amber-400",
    border: "border-amber-500/20 hover:border-amber-500/40",
    bg: "hover:bg-amber-500/5",
  },
  {
    name: "Laptop Tracker",
    description: "Device assignment & tracking",
    href: "/laptops",
    icon: Laptop,
    accent: "text-emerald-400",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    bg: "hover:bg-emerald-500/5",
  },
];

export default function HubPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">NuvaiTracker</h1>
        <p className="text-sm text-muted-foreground">
          Choose a tracker to get started
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 w-full max-w-3xl">
        {trackers.map((t) => (
          <Link
            key={t.name}
            href={t.href}
            className={`group rounded-xl border ${t.border} ${t.bg} p-6 transition-all`}
          >
            <t.icon className={`h-8 w-8 ${t.accent} mb-4`} />
            <h2 className="font-semibold text-lg mb-1">{t.name}</h2>
            <p className="text-xs text-muted-foreground">{t.description}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/export"
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <FileDown className="h-3.5 w-3.5" />
        Export Data
      </Link>
    </div>
  );
}
