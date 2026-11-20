"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  type: string;
}

export default function ImportPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[]; totalErrors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setAccounts(data);
    if (data.length > 0) setAccountId(data[0].id);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return;

    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
        else current += char;
      }
      result.push(current.trim());
      return result;
    };

    const hdrs = parseLine(lines[0]);
    setHeaders(hdrs);
    const rows = lines.slice(1, 6).map(parseLine); // Preview first 5 rows
    setPreview(rows);
    setCsvText(text);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText || !accountId) {
      toast.error("Please select an account and upload a CSV file");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText, accountId }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success(`Successfully imported ${data.imported} transactions!`);
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch {
      toast.error("Import failed");
    }
    setImporting(false);
  };

  const reset = () => {
    setCsvText("");
    setPreview([]);
    setHeaders([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a bank statement CSV to bulk-import transactions</p>
      </div>

      {/* Step 1: Upload */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">1. Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-gray-50/30 transition-all duration-200"
            onClick={() => fileRef.current?.click()}
          >
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            {csvText ? (
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">File loaded</p>
                <p className="text-xs text-muted-foreground mt-1">{preview.length} rows previewed</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">Supports CSV files from most banks</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Supported formats:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground/70">
              <li>Single amount column (positive = income, negative = expense)</li>
              <li>Separate credit/debit columns</li>
              <li>Date, description, and amount columns auto-detected</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Select Account */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">2. Select Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-sm">
            <Label>Import into account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {accounts.length === 0 && (
            <p className="text-sm text-rose-500 mt-2">No accounts found. Create an account first.</p>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {preview.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">3. Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {headers.map((h, i) => (
                      <th key={i} className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {row.map((cell, j) => (
                        <td key={j} className="p-2 text-xs truncate max-w-[200px]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Showing first {preview.length} rows</p>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {csvText && (
        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={importing || !accountId}
            className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm px-8"
          >
            {importing ? "Importing..." : "Import Transactions"}
          </Button>
          <Button variant="outline" onClick={reset} className="rounded-xl">
            Reset
          </Button>
        </div>
      )}

      {/* Results */}
      {result && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">{result.imported} transactions imported</p>
                {result.totalErrors > 0 && (
                  <p className="text-xs text-muted-foreground">{result.totalErrors} rows skipped</p>
                )}
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-amber-700 dark:text-amber-400">{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
