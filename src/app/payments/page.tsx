"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Payment, Account } from "@/types";

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

const PAGE_SIZE = 20;

export default function PaymentsPage() {
  const [paymentList, setPaymentList] = useState<Payment[] | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refundFilter, setRefundFilter] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (refundFilter === "true") params.set("refunded", "true");
    if (refundFilter === "false") params.set("refunded", "false");
    fetchWithRetry(`/api/payments?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) { setPaymentList(data); } else { setError(true); }
      })
      .finally(() => setLoading(false));
  }, [refundFilter]);

  useEffect(() => {
    load();
    fetch("/api/accounts").then((r) => (r.ok ? r.json() : [])).then(setAccounts);
  }, [load]);

  // Reset page on filter/search change
  useEffect(() => { setPage(1); }, [refundFilter, searchQuery]);

  const filtered = useMemo(() => {
    if (!paymentList) return [];
    if (!searchQuery.trim()) return paymentList;
    const q = searchQuery.toLowerCase();
    return paymentList.filter(
      (p) =>
        (p.accountEmail ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [paymentList, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: fd.get("accountId"),
        amount: fd.get("amount"),
        paymentMethod: fd.get("paymentMethod"),
        description: fd.get("description") || null,
      }),
    });
    setAddOpen(false);
    load();
  }

  async function handleRefund(id: string) {
    const reason = prompt("Refund reason (optional):");
    if (reason === null) return;
    await fetch(`/api/payments/${id}/refund`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason || undefined }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Payments</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Log Payment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Log Payment</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Account</Label>
                <Select name="accountId" required>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input name="amount" type="number" step="0.01" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Method</Label>
                  <Select name="paymentMethod" defaultValue="CARD">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["CARD", "BANK_TRANSFER", "CRYPTO", "OTHER"].map((m) => (
                        <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input name="description" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={refundFilter} onValueChange={setRefundFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="false">Active</SelectItem>
            <SelectItem value="true">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Account</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Method</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground text-sm">Loading...</td>
              </tr>
            ) : error || paymentList === null ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground text-sm">
                  Failed to load.{" "}
                  <button onClick={load} className="text-primary hover:underline">Retry</button>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No payments found.</td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-3 py-2 text-xs">{p.accountEmail ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums font-medium">${p.amount}</td>
                  <td className="px-3 py-2 text-xs">{p.paymentMethod}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[200px]">
                    {p.description ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(p.paidAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    {p.refunded ? (
                      <span className="text-xs text-destructive">Refunded</span>
                    ) : (
                      <span className="text-xs text-[#4ade80]">Paid</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {!p.refunded && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRefund(p.id)} title="Refund">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
