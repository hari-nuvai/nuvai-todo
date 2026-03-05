"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Pencil, Search } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import type { Laptop } from "@/types";

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

export default function LaptopsPage() {
  const [laptopList, setLaptopList] = useState<Laptop[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [editLaptop, setEditLaptop] = useState<Laptop | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (typeFilter !== "ALL") params.set("type", typeFilter);
    fetchWithRetry(`/api/laptops?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) { setLaptopList(data); } else { setError(true); }
      })
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!laptopList) return [];
    if (!searchQuery.trim()) return laptopList;
    const q = searchQuery.toLowerCase();
    return laptopList.filter(
      (l) =>
        l.assetTag.toLowerCase().includes(q) ||
        l.brand.toLowerCase().includes(q) ||
        l.model.toLowerCase().includes(q) ||
        (l.assignedTo ?? "").toLowerCase().includes(q)
    );
  }, [laptopList, searchQuery]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      assetTag: fd.get("assetTag"),
      type: fd.get("type"),
      brand: fd.get("brand"),
      model: fd.get("model"),
      serialNumber: fd.get("serialNumber") || null,
      specs: fd.get("specs") || null,
      assignedTo: fd.get("assignedTo") || null,
      department: fd.get("department") || null,
      notes: fd.get("notes") || null,
    };

    if (editLaptop) {
      await fetch(`/api/laptops/${editLaptop.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/laptops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setAddOpen(false);
    setEditLaptop(null);
    load();
  }

  const typeBadge = (type: string) => {
    const color = type === "MAC"
      ? "bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/30"
      : "bg-[#60a5fa]/10 text-[#60a5fa] border-[#60a5fa]/30";
    return <Badge variant="outline" className={`text-xs ${color}`}>{type}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Laptops</h1>
        <Dialog open={addOpen || !!editLaptop} onOpenChange={(v) => { if (!v) { setAddOpen(false); setEditLaptop(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditLaptop(null); setAddOpen(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Laptop
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editLaptop ? "Edit Laptop" : "Add Laptop"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Asset Tag</Label>
                  <Input name="assetTag" defaultValue={editLaptop?.assetTag ?? ""} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select name="type" defaultValue={editLaptop?.type ?? "DELL"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DELL">DELL</SelectItem>
                      <SelectItem value="MAC">MAC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Brand</Label><Input name="brand" defaultValue={editLaptop?.brand ?? ""} required /></div>
                <div className="space-y-1.5"><Label>Model</Label><Input name="model" defaultValue={editLaptop?.model ?? ""} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Serial Number</Label><Input name="serialNumber" defaultValue={editLaptop?.serialNumber ?? ""} /></div>
                <div className="space-y-1.5"><Label>Specs</Label><Input name="specs" defaultValue={editLaptop?.specs ?? ""} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Assigned To</Label><Input name="assignedTo" defaultValue={editLaptop?.assignedTo ?? ""} /></div>
                <div className="space-y-1.5"><Label>Department</Label><Input name="department" defaultValue={editLaptop?.department ?? ""} /></div>
              </div>
              <div className="space-y-1.5"><Label>Notes</Label><Input name="notes" defaultValue={editLaptop?.notes ?? ""} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditLaptop(null); }}>Cancel</Button>
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
            placeholder="Search by tag, brand, model, assigned..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="DELL">DELL</SelectItem>
            <SelectItem value="MAC">MAC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Asset Tag</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Brand / Model</th>
              <th className="px-3 py-2">Assigned To</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground text-sm">Loading...</td>
              </tr>
            ) : error || laptopList === null ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground text-sm">
                  Failed to load.{" "}
                  <button onClick={load} className="text-primary hover:underline">Retry</button>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No laptops found.</td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-3 py-2 font-mono text-xs">{l.assetTag}</td>
                  <td className="px-3 py-2">{typeBadge(l.type)}</td>
                  <td className="px-3 py-2 text-xs">{l.brand} {l.model}</td>
                  <td className="px-3 py-2 text-xs">{l.assignedTo || "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{l.department || "—"}</td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditLaptop(l)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
