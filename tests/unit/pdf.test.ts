import { describe, expect, it } from "vitest";
import { tablePdf } from "@/features/reports/pdf";

const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;

const make = (rows: number) =>
  tablePdf({
    title: "Test",
    subtitle: "subtitle",
    columns: [
      { header: "A", width: 200 },
      { header: "B", width: 100, align: "right" },
    ],
    rows: Array.from({ length: rows }, (_, i) => [`row ${i}`, String(i)]),
  });

describe("tablePdf", () => {
  it("fits a short table on one page (no blank page for the footer)", async () => {
    const pdf = await make(3);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pageCount(pdf)).toBe(1);
  });

  it("paginates long tables", async () => {
    expect(pageCount(await make(120))).toBeGreaterThan(2);
  });
});
