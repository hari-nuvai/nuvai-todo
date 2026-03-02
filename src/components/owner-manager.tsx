"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OwnerManagerProps {
  moduleName: string;
  stageName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OwnerManager({
  moduleName,
  stageName,
  open,
  onOpenChange,
}: OwnerManagerProps) {
  const [owners, setOwners] = useState<string[]>([]);
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) loadOwners();
  }, [open, moduleName, stageName]);

  async function loadOwners() {
    const params = new URLSearchParams({ module: moduleName, stage: stageName });
    const res = await fetch(`/api/module-stages/owners?${params}`);
    const data = await res.json();
    if (Array.isArray(data)) setOwners(data);
  }

  async function handleAdd() {
    if (!newOwner.trim()) return;
    setLoading(true);
    await fetch("/api/module-stages/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: moduleName,
        stage: stageName,
        owner: newOwner.trim(),
      }),
    });
    setNewOwner("");
    await loadOwners();
    setLoading(false);
  }

  async function handleRemove(ownerName: string) {
    await fetch("/api/module-stages/owners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: moduleName,
        stage: stageName,
        owner: ownerName,
      }),
    });
    await loadOwners();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Owners: {moduleName} / {stageName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {owners.length === 0 && (
              <p className="text-sm text-muted-foreground">No owners assigned.</p>
            )}
            {owners.map((o) => (
              <Badge key={o} variant="secondary" className="gap-1">
                {o}
                <button
                  className="ml-1 text-xs hover:text-destructive"
                  onClick={() => handleRemove(o)}
                >
                  x
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add owner..."
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={loading || !newOwner.trim()}>
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
