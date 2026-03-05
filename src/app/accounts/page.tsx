"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { AccountModal } from "@/components/accounts/account-modal";
import type { Account } from "@/types";

const PAGE_SIZE = 20;

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
    } catch {}
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500));
  }
  return new Response(null, { status: 500 });
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (planFilter !== "ALL") params.set("planType", planFilter);
    fetchWithRetry(`/api/accounts?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) { setAccounts(data); } else { setError(true); }
      })
      .finally(() => setLoading(false));
  }, [statusFilter, planFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filters or search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, planFilter, searchQuery]);

  const filtered = useMemo(() => {
    if (!accounts) return [];
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter((a) => a.email.toLowerCase().includes(q));
  }, [accounts, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Accounts</h1>
        <AccountModal
          trigger={
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add Account
            </Button>
          }
          onSaved={load}
        />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {["ACTIVE", "SUSPENDED", "CANCELLED", "BLOCKED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Plans</SelectItem>
            {["FREE", "PRO", "TEAM", "ENTERPRISE"].map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Cost/mo</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Sharing</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground text-sm">
                  Loading...
                </td>
              </tr>
            ) : error || accounts === null ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground text-sm">
                  Failed to load.{" "}
                  <button onClick={load} className="text-primary hover:underline">Retry</button>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No accounts found.
                </td>
              </tr>
            ) : (
              paginated.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2">
                    <Link href={`/accounts/${a.id}`} className="text-primary hover:underline font-medium">
                      {a.email}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">{a.planType}</td>
                  <td className="px-3 py-2 tabular-nums">${a.monthlyCost}</td>
                  <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {a.sharingEnabled ? a.sharedWith || "Yes" : "No"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
