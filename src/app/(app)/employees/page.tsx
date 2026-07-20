"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { EmployeeImportBatch } from "@/lib/types";

const POLL_MS = 2000;

function statusVariant(status: string): "success" | "destructive" | "outline" {
  if (status === "created") return "success";
  if (status === "failed") return "destructive";
  return "outline";
}

export default function EmployeeImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [batch, setBatch] = useState<EmployeeImportBatch | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!batch || batch.status === "completed") return;
    const timer = setInterval(async () => {
      try {
        const updated = await apiFetch<EmployeeImportBatch>(`/employee-imports/${batch.id}/`);
        setBatch((prev) => (prev ? { ...updated, skippedRows: prev.skippedRows } : updated));
      } catch {
        // transient poll failure — the next tick will retry
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [batch]);

  async function upload() {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const created = await apiFetch<EmployeeImportBatch>("/employee-imports/upload/", {
        method: "POST",
        body: formData,
      });
      setBatch(created);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success(`Import started — ${created.totalRows} employee(s) queued`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Employee Import"
        description="Bulk-create employee accounts from a spreadsheet. Each row is created and emailed its account access in the background."
      />

      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Upload sheet (.xlsx or .csv)
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Required column: <span className="font-medium text-foreground">Check No</span>.
              Recognized columns: Personnel No, First Name, Last Name, Check No, Designation,
              Email.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xlsm,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted"
            />
          </div>
          <Button onClick={upload} disabled={!file || uploading}>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Import"}
          </Button>
        </div>
      </Card>

      {batch ? (
        <Card className="mt-5 p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{batch.fileName || "Import"}</span>
              <Badge variant={batch.status === "completed" ? "success" : "outline"}>
                {batch.status === "completed" ? "Completed" : "Processing..."}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {batch.createdRows} created · {batch.failedRows} failed · {batch.totalRows} total
            </div>
          </div>

          {batch.skippedRows && batch.skippedRows.length > 0 ? (
            <div className="border-b border-border bg-warning/10 p-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skipped before upload
              </p>
              <ul className="space-y-1 text-sm text-foreground">
                {batch.skippedRows.map((row) => (
                  <li key={row.rowNumber}>
                    Row {row.rowNumber}: {row.error}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Check No</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Account email</th>
                </tr>
              </thead>
              <tbody>
                {batch.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{row.checkNumber}</td>
                    <td className="px-4 py-2">
                      {row.firstName} {row.lastName}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{row.email || "—"}</td>
                    <td className="px-4 py-2">
                      <Badge variant={statusVariant(row.status)}>
                        {row.status === "pending" ? "Processing..." : row.status}
                      </Badge>
                      {row.status === "failed" && row.errorMessage ? (
                        <p className="mt-1 text-xs text-destructive">{row.errorMessage}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {row.status === "created" ? (row.emailSent ? "Sent" : "Not sent") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
