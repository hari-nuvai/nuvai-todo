"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, CreditCard, Search, Trash2 } from "lucide-react";
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
import type { Card } from "@/types";

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

export default function CardsPage() {
  const [cardList, setCardList] = useState<Card[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetchWithRetry("/api/cards")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) { setCardList(data); } else { setError(true); }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!cardList) return [];
    if (!searchQuery.trim()) return cardList;
    const q = searchQuery.toLowerCase();
    return cardList.filter(
      (c) => c.cardholderName.toLowerCase().includes(q) || c.last4.includes(q)
    );
  }, [cardList, searchQuery]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardholderName: fd.get("cardholderName"),
        last4: fd.get("last4"),
        cardType: fd.get("cardType"),
        bankName: fd.get("bankName") || null,
        expiryMonth: fd.get("expiryMonth") ? Number(fd.get("expiryMonth")) : null,
        expiryYear: fd.get("expiryYear") ? Number(fd.get("expiryYear")) : null,
      }),
    });
    setAddOpen(false);
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove card ending in ****? (${name})`)) return;
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    load();
  }

  const cardStyle = (type: string) => {
    switch (type) {
      case "CREDIT":
        return "border-[#a78bfa]/30 bg-[#a78bfa]/[0.04]";
      case "DEBIT":
        return "border-[#60a5fa]/30 bg-[#60a5fa]/[0.04]";
      case "PREPAID":
        return "border-[#4ade80]/30 bg-[#4ade80]/[0.04]";
      default:
        return "";
    }
  };

  const cardIcon = (type: string) => {
    switch (type) {
      case "CREDIT":
        return "text-[#a78bfa]";
      case "DEBIT":
        return "text-[#60a5fa]";
      case "PREPAID":
        return "text-[#4ade80]";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cards</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Add Card</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Card</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cardholder Name</Label>
                <Input name="cardholderName" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Last 4 Digits</Label>
                  <Input name="last4" maxLength={4} pattern="\d{4}" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Card Type</Label>
                  <Select name="cardType" defaultValue="CREDIT">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["CREDIT", "DEBIT", "PREPAID"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Bank Name</Label><Input name="bankName" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Expiry Month</Label><Input name="expiryMonth" type="number" min={1} max={12} /></div>
                <div className="space-y-1.5"><Label>Expiry Year</Label><Input name="expiryYear" type="number" min={2024} max={2040} /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or last 4..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Loading...</p>
      ) : error || cardList === null ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Failed to load.{" "}
          <button onClick={load} className="text-primary hover:underline">Retry</button>
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No cards found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className={`rounded-lg border p-4 space-y-3 transition-colors hover:brightness-95 relative group ${cardStyle(c.cardType)}`}>
              <div className="flex items-center justify-between">
                <CreditCard className={`h-5 w-5 ${cardIcon(c.cardType)}`} />
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${cardIcon(c.cardType)}`}>{c.cardType}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(c.id, c.cardholderName)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-lg font-mono tracking-wider">**** **** **** {c.last4}</p>
                <p className="text-sm font-medium mt-1">{c.cardholderName}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{c.bankName || "—"}</span>
                {c.expiryMonth && c.expiryYear && (
                  <span>{String(c.expiryMonth).padStart(2, "0")}/{c.expiryYear}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
