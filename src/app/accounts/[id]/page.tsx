"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { AccountModal } from "@/components/accounts/account-modal";
import type { Account, AccountUser, Payment } from "@/types";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [account, setAccount] = useState<Account | null>(null);
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [accountPayments, setPayments] = useState<Payment[]>([]);
  const [newUser, setNewUser] = useState("");
  const [newDept, setNewDept] = useState("");

  const load = useCallback(() => {
    fetch(`/api/accounts/${id}`).then((r) => (r.ok ? r.json() : null)).then(setAccount);
    fetch(`/api/accounts/${id}/users`).then((r) => (r.ok ? r.json() : [])).then(setUsers);
    fetch(`/api/payments?accountId=${id}`).then((r) => (r.ok ? r.json() : [])).then(setPayments);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addUser() {
    if (!newUser.trim()) return;
    await fetch(`/api/accounts/${id}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: newUser, department: newDept || undefined }),
    });
    setNewUser("");
    setNewDept("");
    load();
  }

  async function removeUserById(userId: string) {
    await fetch(`/api/accounts/${id}/users?userId=${userId}`, { method: "DELETE" });
    load();
  }

  async function handleDelete() {
    if (!confirm("Delete this account and all related data?")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    window.location.href = "/accounts";
  }

  if (!account) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/accounts">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-xl font-bold flex-1">{account.email}</h1>
        <AccountModal
          account={account}
          trigger={<Button variant="outline" size="sm">Edit</Button>}
          onSaved={load}
        />
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Account details */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Plan" value={account.planType} />
        <InfoCard label="Monthly Cost" value={`$${account.monthlyCost}`} />
        <div className="rounded-md border border-border px-3 py-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Status</p>
          <div className="mt-1"><StatusBadge status={account.status} /></div>
        </div>
        <InfoCard
          label="Sharing"
          value={account.sharingEnabled ? account.sharedWith || "Enabled" : "Disabled"}
        />
      </div>
      {account.notes && (
        <div className="rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm">{account.notes}</p>
        </div>
      )}

      {/* Users */}
      <div className="rounded-md border border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold">Assigned Users ({users.length})</h2>
        </div>
        <div className="p-3 space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{u.userName}</span>
                {u.department && (
                  <span className="text-muted-foreground ml-2 text-xs">{u.department}</span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeUserById(u.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="User name"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Department"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="w-32"
            />
            <Button size="sm" onClick={addUser} disabled={!newUser.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-md border border-border">
        <div className="border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold">Payment History ({accountPayments.length})</h2>
        </div>
        <div className="p-1">
          {accountPayments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground text-left">
                  <th className="px-3 py-1.5">Amount</th>
                  <th className="px-3 py-1.5">Method</th>
                  <th className="px-3 py-1.5">Date</th>
                  <th className="px-3 py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {accountPayments.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3 py-1.5 tabular-nums">${p.amount}</td>
                    <td className="px-3 py-1.5 text-xs">{p.paymentMethod}</td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">
                      {new Date(p.paidAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-1.5">
                      {p.refunded ? (
                        <span className="text-xs text-destructive">Refunded</span>
                      ) : (
                        <span className="text-xs text-[#4ade80]">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium mt-1">{value}</p>
    </div>
  );
}
