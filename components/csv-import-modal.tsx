"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { weddingService } from "@/lib/data-service";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  onImported: (count: number) => void;
}

const FIELD_MAP: { key: string; label: string; required?: boolean }[] = [
  { key: "fullName", label: "name (or fullName)", required: true },
  { key: "email", label: "email" },
  { key: "phone", label: "phoneNumber (or phone)" },
  { key: "plusOne", label: "plusOnes (yes/no, 0/1, or count)" },
  { key: "side", label: "Side (partner1/partner2/both)" },
  { key: "plusOneName", label: "Plus One Name" },
  { key: "dietaryNotes", label: "Dietary Notes" },
  { key: "tableNumber", label: "Table Number" },
  { key: "tableId", label: "Table ID (seating)" },
];

export function CsvImportModal({ open, onOpenChange, weddingId, onImported }: Props) {
  const [csvData, setCsvData] = useState<any[]>([]); // preview only
  const [fullData, setFullData] = useState<any[]>([]); // full parsed rows for import
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFullData([]); // reset previous full data
    setCsvData([]);
    setHeaders([]);
    setMapping({});

    const fileNameLower = file.name.toLowerCase();

    const processRows = (rows: any[]) => {
      if (rows.length === 0) {
        toast.error("File appears empty");
        return;
      }
      const hdrs = Object.keys(rows[0] || {});
      setHeaders(hdrs);
      setCsvData(rows.slice(0, 8)); // preview first 8
      setFullData(rows); // keep full for actual import

      // auto map obvious columns - supports exact attached Excel format: name, email, phoneNumber, plusOnes (+ variants)
      const auto: Record<string, string> = {};
      hdrs.forEach(h => {
        const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (lower === 'name' || lower.includes('name')) auto.fullName = h;
        if (lower.includes('email')) auto.email = h;
        if (lower.includes('phone') || lower.includes('phonenumber')) auto.phone = h;
        if (lower.includes('plus') || lower.includes('plusone') || lower.includes('plusones')) auto.plusOne = h;
        if (lower.includes('side')) auto.side = h;
        if (lower.includes('diet')) auto.dietaryNotes = h;
        if (lower.includes('table')) {
          if (lower.includes('id') || lower.includes('_id')) auto.tableId = h;
          else auto.tableNumber = h;
        }
      });
      setMapping(auto);
    };

    if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
      // Excel: use xlsx to parse binary
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet) as any[]; // uses first row as headers
          processRows(rows);
        } catch (err) {
          console.error(err);
          toast.error("Failed to parse Excel file");
        }
      };
      reader.onerror = () => toast.error("Failed to read file");
      reader.readAsArrayBuffer(file);
    } else {
      // CSV / text: use PapaParse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as any[];
          processRows(rows);
        },
        error: () => toast.error("Could not parse CSV file"),
      });
    }
    e.target.value = "";
  }

  function setMap(fieldKey: string, header: string) {
    setMapping(prev => ({ ...prev, [fieldKey]: header }));
  }

  async function doImport() {
    if (!mapping.fullName) {
      toast.error("Please map at least the Full Name column");
      return;
    }
    setImporting(true);
    try {
      const rows = fullData.map(row => {
        const out: any = {};
        FIELD_MAP.forEach(f => {
          const src = mapping[f.key];
          if (src && row[src] != null) out[f.key] = row[src];
        });
        // Robust support for exact attached format + any variants + missing values (null/''/0/false/undefined ok)
        const nm = row.name ?? row.fullName ?? row.full_name ?? row['Full Name'];
        if (!out.fullName && nm != null && String(nm).trim() !== '') out.fullName = String(nm).trim();

        const ph = row.phoneNumber ?? row.phone ?? row.phonenumber ?? row['Phone Number'];
        if (!out.phone && ph != null && String(ph).trim() !== '') out.phone = String(ph).trim();

        // plusOnes: missing/0/no/false/'' => false; '1', 'yes', 2, '2' => true (has plus one)
        if (out.plusOne == null) {
          const p = row.plusOnes ?? row.plusOne ?? row.plusone ?? row['Plus Ones'] ?? row['plus ones'];
          if (p != null && String(p).trim() !== '') {
            const ps = String(p).toLowerCase().trim();
            if (typeof p === 'number') {
              out.plusOne = p > 0;
            } else if (['no', '0', 'false', '', 'n'].includes(ps)) {
              out.plusOne = false;
            } else {
              out.plusOne = ['yes', 'y', 'true', '1'].includes(ps) || parseInt(ps) > 0;
            }
          } else {
            out.plusOne = false;
          }
        }
        return out;
      });
      const imported = await weddingService.importGuestsFromCSV(weddingId, rows);
      toast.success(`${imported.length} guests imported successfully`);
      onImported(imported.length);
      onOpenChange(false);
      // reset
      setCsvData([]);
      setFullData([]);
      setHeaders([]);
      setMapping({});
    } catch (e) {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Guests from CSV / Excel</DialogTitle>
          <DialogDescription>
            Upload Excel/CSV. Best with columns: <span className="font-medium">name, email, phoneNumber, plusOnes</span>. Missing values and extra columns are handled gracefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="block w-full text-sm" />
            {fileName && <div className="text-xs text-muted-foreground mt-1">Loaded: {fileName} • {csvData.length} preview rows</div>}
            <div className="text-[10px] text-muted-foreground">Tip: name, email, phoneNumber, plusOnes (or variants). Blank cells / missing columns = no problem (plusOnes empty/0/no → no plus one).</div>
          </div>

          {headers.length > 0 && (
            <>
              <div className="text-sm font-medium">Column Mapping</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[240px] overflow-auto pr-2">
                {FIELD_MAP.map(f => (
                  <div key={f.key} className="flex items-center gap-3 text-sm">
                    <div className="w-36 shrink-0 text-muted-foreground">{f.label}{f.required && " *"}</div>
                    <select 
                      className="flex-1 border rounded px-2 py-1 bg-background" 
                      value={mapping[f.key] || ""}
                      onChange={e => setMap(f.key, e.target.value)}
                    >
                      <option value="">-- Select column --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {csvData.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-1">Preview (first rows)</div>
                  <div className="text-xs border rounded p-2 bg-muted/30 overflow-auto max-h-32 font-mono">
                    {csvData.slice(0, 3).map((r, i) => <div key={i}>{JSON.stringify(r)}</div>)}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => {
                  setCsvData([]);
                  setFullData([]);
                  setHeaders([]);
                  setMapping({});
                  onOpenChange(false);
                }}>Cancel</Button>
                <Button variant="elegant" onClick={doImport} disabled={importing || !mapping.fullName}>
                  {importing ? "Importing..." : "Import Guests"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
