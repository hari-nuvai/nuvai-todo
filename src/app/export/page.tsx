"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EXPORT_TYPES = [
  { value: "accounts", label: "Accounts" },
  { value: "payments", label: "Payments" },
  { value: "laptops", label: "Laptops" },
  { value: "audit-logs", label: "Audit Logs" },
];

const FORMATS = [
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
  { value: "pdf", label: "PDF" },
];

export default function ExportPage() {
  const [dataType, setDataType] = useState("accounts");
  const [format, setFormat] = useState("csv");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/export?type=${dataType}`);
      const data = await res.json();
      if (!data.length) {
        alert("No data to export");
        return;
      }

      const filename = `nuvai-${dataType}-${new Date().toISOString().slice(0, 10)}`;

      if (format === "csv") {
        const { exportCSV } = await import("@/lib/export/csv");
        exportCSV(data, filename);
      } else if (format === "excel") {
        const { exportExcel } = await import("@/lib/export/excel");
        exportExcel(data, filename);
      } else {
        const { exportPDF } = await import("@/lib/export/pdf");
        exportPDF(data, filename, `NuvaiTracker - ${dataType}`);
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Export Data</h1>

      <div className="rounded-lg border border-border p-6 max-w-md space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Data Type</p>
          <Select value={dataType} onValueChange={setDataType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPORT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Format</p>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExport} disabled={exporting} className="w-full">
          <FileDown className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Download"}
        </Button>
      </div>
    </div>
  );
}
