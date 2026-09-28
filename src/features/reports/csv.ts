// CSV building (pure, unit-tested).

/**
 * One CSV cell. Quotes when needed, and neutralises spreadsheet formula injection: a
 * value starting with = + - @ (or tab/CR) would run as a formula when staff open the
 * export in Excel, so it gets a leading apostrophe. Numbers are left alone.
 */
export function csvCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  // BOM so Excel opens UTF-8 (ñ, é, en dashes) correctly; CRLF per RFC 4180.
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
