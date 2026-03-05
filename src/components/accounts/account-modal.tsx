"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account } from "@/types";

interface AccountModalProps {
  account?: Account | null;
  trigger: React.ReactNode;
  onSaved: () => void;
}

export function AccountModal({ account, trigger, onSaved }: AccountModalProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEdit = !!account;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      email: fd.get("email"),
      planType: fd.get("planType"),
      monthlyCost: fd.get("monthlyCost") || "0",
      status: fd.get("status"),
      sharingEnabled: fd.get("sharingEnabled") === "true",
      sharedWith: fd.get("sharedWith") || null,
      notes: fd.get("notes") || null,
    };

    const url = isEdit ? `/api/accounts/${account.id}` : "/api/accounts";
    const method = isEdit ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Account" : "Add Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input name="email" id="email" defaultValue={account?.email ?? ""} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="planType">Plan</Label>
              <Select name="planType" defaultValue={account?.planType ?? "FREE"}>
                <SelectTrigger id="planType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["FREE", "PRO", "TEAM", "ENTERPRISE"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="monthlyCost">Monthly Cost</Label>
              <Input name="monthlyCost" id="monthlyCost" type="number" step="0.01" defaultValue={account?.monthlyCost ?? "0"} />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={account?.status ?? "ACTIVE"}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["ACTIVE", "SUSPENDED", "CANCELLED", "BLOCKED"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sharingEnabled">Sharing</Label>
              <Select name="sharingEnabled" defaultValue={account?.sharingEnabled ? "true" : "false"}>
                <SelectTrigger id="sharingEnabled"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Disabled</SelectItem>
                  <SelectItem value="true">Enabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sharedWith">Shared With</Label>
              <Input name="sharedWith" id="sharedWith" defaultValue={account?.sharedWith ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea name="notes" id="notes" rows={2} defaultValue={account?.notes ?? ""} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
