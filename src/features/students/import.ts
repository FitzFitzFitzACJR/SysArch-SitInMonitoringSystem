import ExcelJS from "exceljs";
import Papa from "papaparse";
import { ImportRowSchema, MAX_IMPORT_ROWS, type ImportRow } from "./schemas";

// Pure parsing + validation for bulk student import (no database access), so it can be
// unit-tested and reused for both the preview and the final commit.

export type RawRow = Record<string, string>;

export type ImportRowResult = {
  row: number; // 1-based spreadsheet row, counting the header as row 1
  values: RawRow;
  data?: ImportRow & { courseId: string };
  errors: string[];
};

// Accept the column names people actually use ("ID No.", "Surname", "Year", …).
const COLUMN_ALIASES: Record<string, keyof ImportRow> = {
  idnumber: "idNumber",
  idno: "idNumber",
  id: "idNumber",
  studentid: "idNumber",
  studentnumber: "idNumber",
  firstname: "firstName",
  first: "firstName",
  givenname: "firstName",
  middlename: "middleName",
  middle: "middleName",
  midname: "middleName",
  mi: "middleName",
  lastname: "lastName",
  last: "lastName",
  surname: "lastName",
  familyname: "lastName",
  email: "email",
  emailaddress: "email",
  course: "course",
  coursecode: "course",
  program: "course",
  yearlevel: "yearLevel",
  year: "yearLevel",
  yearlvl: "yearLevel",
  yr: "yearLevel",
};

export function normaliseHeader(header: string): keyof ImportRow | undefined {
  return COLUMN_ALIASES[header.toLowerCase().replace(/[^a-z]/g, "")];
}

export async function parseSpreadsheet(file: { name: string; arrayBuffer(): Promise<ArrayBuffer> }): Promise<RawRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCsv(new TextDecoder().decode(await file.arrayBuffer()));
  if (name.endsWith(".xlsx")) return parseXlsx(await file.arrayBuffer());
  throw new ImportFileError("Upload a .csv or .xlsx file.");
}

export class ImportFileError extends Error {}

export function parseCsv(text: string): RawRow[] {
  const result = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  const [header, ...rows] = result.data;
  return toRecords(header ?? [], rows);
}

async function parseXlsx(buffer: ArrayBuffer): Promise<RawRow[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new ImportFileError("That file couldn't be read as an Excel workbook.");
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    // row.values is 1-indexed; cells can be numbers, dates, rich text or hyperlinks.
    const values = (row.values as unknown[]).slice(1).map(cellText);
    rows.push(values);
  });
  const [header, ...rest] = rows;
  return toRecords(
    header ?? [],
    rest.filter((r) => r.some((v) => v !== "")),
  );
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const v = value as { text?: string; result?: unknown; richText?: { text: string }[]; hyperlink?: string };
    if (v.richText)
      return v.richText
        .map((t) => t.text)
        .join("")
        .trim();
    if (v.text) return String(v.text).trim(); // hyperlink cells (e.g. emails)
    if (v.result != null) return String(v.result).trim(); // formula cells
    if (value instanceof Date) return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

function toRecords(header: string[], rows: string[][]): RawRow[] {
  const keys = header.map((h) => normaliseHeader(String(h)));
  if (!keys.includes("idNumber") || !keys.includes("email")) {
    throw new ImportFileError(
      "Couldn't find the column headers. The first row must include at least id_number, first_name, last_name, email, course and year_level.",
    );
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ImportFileError(`At most ${MAX_IMPORT_ROWS} students per file. Split it and import in parts.`);
  }
  return rows.map((cells) => {
    const record: RawRow = {};
    keys.forEach((key, i) => {
      if (key) record[key] = String(cells[i] ?? "").trim();
    });
    return record;
  });
}

export type ImportContext = {
  courseIdsByCode: Map<string, string>;
  existingIdNumbers: Set<string>;
  existingEmails: Set<string>;
};

/** Validates every row, including duplicates within the file and against existing accounts. */
export function validateRows(rows: RawRow[], ctx: ImportContext): ImportRowResult[] {
  const seenIds = new Map<string, number>();
  const seenEmails = new Map<string, number>();

  // Every check runs on every row, so one upload shows all the problems at once instead of
  // making staff fix a field, re-upload, and discover the next error.
  return rows.map((values, i) => {
    const row = i + 2; // header is row 1
    const parsed = ImportRowSchema.safeParse(values);
    const errors = parsed.success
      ? []
      : parsed.error.issues.map((issue) => `${label(issue.path[0])}: ${issue.message}`);

    // Uniqueness and course checks use the raw values, so they still run when other fields are invalid.
    const idKey = values.idNumber?.trim().toLowerCase();
    if (idKey) {
      if (ctx.existingIdNumbers.has(idKey)) errors.push("ID number: already registered");
      else if (seenIds.has(idKey)) errors.push(`ID number: duplicate of row ${seenIds.get(idKey)}`);
      else seenIds.set(idKey, row);
    }

    const emailKey = values.email?.trim().toLowerCase();
    if (emailKey) {
      if (ctx.existingEmails.has(emailKey)) errors.push("Email: already registered");
      else if (seenEmails.has(emailKey)) errors.push(`Email: duplicate of row ${seenEmails.get(emailKey)}`);
      else seenEmails.set(emailKey, row);
    }

    const courseCode = values.course?.trim().toUpperCase();
    const courseId = courseCode ? ctx.courseIdsByCode.get(courseCode) : undefined;
    if (courseCode && !courseId) errors.push(`Course: unknown course "${courseCode}"`);

    return parsed.success && errors.length === 0 && courseId
      ? { row, values, data: { ...parsed.data, courseId }, errors }
      : { row, values, errors };
  });
}

function label(field: PropertyKey | undefined): string {
  const labels: Record<string, string> = {
    idNumber: "ID number",
    firstName: "First name",
    middleName: "Middle name",
    lastName: "Last name",
    email: "Email",
    course: "Course",
    yearLevel: "Year level",
  };
  return labels[String(field)] ?? String(field);
}
