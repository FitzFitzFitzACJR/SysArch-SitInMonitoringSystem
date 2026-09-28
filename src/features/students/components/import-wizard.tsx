"use client";

import { CircleAlert, CircleCheck, Download, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { commitImportAction, previewImportAction } from "../actions";
import type { ImportRowResult } from "../import";
import { MAX_IMPORT_ROWS, TEMPLATE_CSV } from "../schemas";

type Step =
  | { kind: "choose" }
  | { kind: "preview"; rows: ImportRowResult[] }
  | { kind: "done"; imported: number; skipped: number };

/**
 * Upload → preview (every row validated server-side, errors shown per row) → import.
 * The file is sent again on import and re-validated, so a stale preview can't sneak bad rows in.
 */
export function ImportWizard({ courseCodes }: { courseCodes: string[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const [error, setError] = useState<string>();
  const [sendInvites, setSendInvites] = useState(true);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [pending, startTransition] = useTransition();

  function preview(selected: File) {
    setFile(selected);
    setError(undefined);
    startTransition(async () => {
      const result = await previewImportAction({ file: selected });
      if (result.ok) setStep({ kind: "preview", rows: result.data.rows });
      else setError(result.error);
    });
  }

  function commit() {
    if (!file) return;
    startTransition(async () => {
      const result = await commitImportAction({ file, sendInvites });
      if (result.ok) {
        setStep({ kind: "done", ...result.data });
        toast.success(`Imported ${result.data.imported} student(s)`);
      } else setError(result.error);
    });
  }

  if (step.kind === "done") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleCheck className="text-emerald-600" /> Import complete
          </CardTitle>
          <CardDescription>
            {step.imported} student(s) added{step.skipped ? `, ${step.skipped} row(s) skipped because of errors` : ""}.
            {sendInvites && " Each new student was emailed a link to set their password."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="gap-2">
          <Button asChild>
            <Link href="/admin/students">Go to students</Link>
          </Button>
          <Button variant="outline" onClick={() => (setStep({ kind: "choose" }), setFile(null))}>
            Import another file
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const rows = step.kind === "preview" ? step.rows : [];
  const valid = rows.filter((r) => r.data).length;
  const invalid = rows.length - valid;
  const shown = onlyErrors ? rows.filter((r) => r.errors.length) : rows;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Choose a file</CardTitle>
          <CardDescription>
            CSV or Excel (.xlsx), one student per row, up to {MAX_IMPORT_ROWS} rows. Columns: ID number, first name,
            middle name (optional), last name, email, course code ({courseCodes.join(", ")}) and year level (1–4).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label htmlFor="import-file" className="sr-only">
              Spreadsheet
            </Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={pending}
              onChange={(e) => e.target.files?.[0] && preview(e.target.files[0])}
              className="sm:max-w-sm"
            />
            <Button variant="link" asChild className="justify-start">
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`}
                download="students-template.csv"
              >
                <Download /> Download template
              </a>
            </Button>
          </div>
          {pending && step.kind === "choose" && <p className="text-muted-foreground text-sm">Checking the file…</p>}
          <FormAlert message={error} />
        </CardContent>
      </Card>

      {step.kind === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet /> 2. Review
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-2">
              <Badge variant="secondary">{valid} ready to import</Badge>
              {invalid > 0 && <Badge variant="destructive">{invalid} with errors (will be skipped)</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-0">
            {invalid > 0 && (
              <label className="flex items-center gap-2 px-6 text-sm">
                <Checkbox checked={onlyErrors} onCheckedChange={(v) => setOnlyErrors(v === true)} /> Show only rows with
                errors
              </label>
            )}
            <div className="max-h-[28rem] overflow-auto">
              <Table>
                <TableHeader className="bg-card sticky top-0">
                  <TableRow>
                    <TableHead className="pl-6">Row</TableHead>
                    <TableHead>ID number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Course</TableHead>
                    <TableHead className="pr-6">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((r) => (
                    <TableRow key={r.row} className={r.errors.length ? "bg-destructive/5" : undefined}>
                      <TableCell className="pl-6 tabular-nums">{r.row}</TableCell>
                      <TableCell>{r.values.idNumber}</TableCell>
                      <TableCell>
                        {r.values.lastName}, {r.values.firstName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{r.values.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {r.values.course} {r.values.yearLevel}
                      </TableCell>
                      <TableCell className="pr-6">
                        {r.errors.length ? (
                          <ul className="text-destructive grid gap-0.5 text-xs">
                            {r.errors.map((e) => (
                              <li key={e} className="flex gap-1">
                                <CircleAlert className="mt-0.5 size-3 shrink-0" /> {e}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-emerald-700 dark:text-emerald-400">OK</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={sendInvites} onCheckedChange={(v) => setSendInvites(v === true)} />
              Email each student a link to set their password
            </label>
            <Button onClick={commit} disabled={pending || valid === 0}>
              {pending ? "Importing…" : `Import ${valid} student${valid === 1 ? "" : "s"}`}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
