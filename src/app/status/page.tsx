"use client";

import { useEffect, useState, useCallback } from "react";
import { StageModuleMatrix } from "@/components/stage-module-matrix";
import { StageBadge } from "@/components/stage-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MatrixRow {
  module: string;
  status: string;
  owner: string;
}

interface MatrixData {
  stages: { id: number; name: string; order: number }[];
  rows: MatrixRow[];
  summary: Record<string, number>;
}

export default function StatusTrackerPage() {
  const [matrix, setMatrix] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/matrix");
      if (r.ok) setMatrix(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Status Tracker</h1>
        <p className="text-muted-foreground text-sm py-8 text-center">Loading...</p>
      </div>
    );
  }

  if (!matrix) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Status Tracker</h1>
        <p className="text-muted-foreground text-sm py-8 text-center">
          Failed to load data.{" "}
          <button onClick={loadData} className="text-primary hover:underline">Retry</button>
        </p>
      </div>
    );
  }

  // Group by status and by module
  const byStage: Record<string, MatrixRow[]> = {};
  const byModule: Record<string, MatrixRow[]> = {};
  for (const row of matrix.rows) {
    if (!byStage[row.status]) byStage[row.status] = [];
    byStage[row.status].push(row);
    if (!byModule[row.module]) byModule[row.module] = [];
    byModule[row.module].push(row);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Status Tracker</h1>

      <Tabs defaultValue="matrix">
        <TabsList className="h-8">
          <TabsTrigger value="matrix" className="text-xs px-3 h-7">Overview</TabsTrigger>
          <TabsTrigger value="by-stage" className="text-xs px-3 h-7">By Status</TabsTrigger>
          <TabsTrigger value="by-module" className="text-xs px-3 h-7">By Module</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="mt-3">
          <StageModuleMatrix initialData={matrix} />
        </TabsContent>

        <TabsContent value="by-stage" className="mt-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {matrix.stages.map((stage) => {
              const rows = byStage[stage.name] ?? [];
              return (
                <div key={stage.id} className="rounded border border-border p-3 space-y-2 hover:bg-secondary transition-colors">
                  <div className="flex items-center justify-between">
                    <StageBadge stage={stage.name} />
                    <span className="text-xs text-muted-foreground">
                      {rows.length} modules
                    </span>
                  </div>
                  {rows.length > 0 ? (
                    <div className="space-y-1">
                      {rows.map((r) => (
                        <div key={r.module} className="flex items-center justify-between text-sm">
                          <a href={`/modules/${encodeURIComponent(r.module)}`} className="cursor-pointer hover:underline">
                            {r.module}
                          </a>
                          <span className="text-xs text-muted-foreground">{r.owner || "--"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No modules</p>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="by-module" className="mt-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(byModule).map(([modName, rows]) => {
              const status = rows[0]?.status ?? "Unknown";
              const owner = rows[0]?.owner ?? "";
              return (
                <div key={modName} className="rounded border border-border p-3 space-y-1.5 cursor-pointer hover:bg-secondary transition-colors">
                  <div className="flex items-center justify-between">
                    <a href={`/modules/${encodeURIComponent(modName)}`} className="font-medium text-sm hover:underline">
                      {modName}
                    </a>
                    <StageBadge stage={status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Owner: {owner || "--"}
                  </div>
                </div>
              );
            })}
            {Object.keys(byModule).length === 0 && (
              <p className="text-muted-foreground text-sm col-span-3 text-center py-6">
                No modules found.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
