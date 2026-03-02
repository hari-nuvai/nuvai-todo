"use client";

import { useEffect, useState, useCallback } from "react";
import { ModuleCard } from "@/components/module-card";
import { AddModuleDialog } from "@/components/add-module-dialog";

interface Module {
  id: number;
  name: string;
}

interface MatrixRow {
  module: string;
  status: string;
  owner: string;
}

interface MatrixData {
  rows: MatrixRow[];
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([]);

  const load = useCallback(() => {
    fetch("/api/modules")
      .then((r) => r.json())
      .then(setModules);
    fetch("/api/matrix")
      .then((r) => r.json())
      .then((data: MatrixData) => {
        if (data?.rows) setMatrixRows(data.rows);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function getModuleInfo(name: string) {
    return matrixRows.find((r) => r.module === name) ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modules</h1>
        <AddModuleDialog onAdded={load} />
      </div>
      {modules.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No modules yet. Create one to get started.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const info = getModuleInfo(m.name);
            return (
              <ModuleCard
                key={m.id}
                name={m.name}
                status={info?.status}
                owner={info?.owner}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
