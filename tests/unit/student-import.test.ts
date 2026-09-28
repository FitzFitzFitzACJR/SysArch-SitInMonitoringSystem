import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { ImportFileError, normaliseHeader, parseCsv, parseSpreadsheet, validateRows } from "@/features/students/import";

const ctx = {
  courseIdsByCode: new Map([
    ["BSIT", "c-bsit"],
    ["BSCS", "c-bscs"],
  ]),
  existingIdNumbers: new Set(["2024-0001"]),
  existingEmails: new Set(["taken@example.edu"]),
};

describe("student import: parsing", () => {
  it("accepts the column names people actually use", () => {
    expect(normaliseHeader("ID No.")).toBe("idNumber");
    expect(normaliseHeader("Student ID")).toBe("idNumber");
    expect(normaliseHeader("Surname")).toBe("lastName");
    expect(normaliseHeader("Year Level")).toBe("yearLevel");
    expect(normaliseHeader("E-mail Address")).toBe("email");
    expect(normaliseHeader("Favourite colour")).toBeUndefined();
  });

  it("parses CSV with a BOM, quoted fields and blank lines", () => {
    const rows = parseCsv(
      '﻿ID Number,First Name,Last Name,Email,Course,Year\n2025-0001,Juan,"Dela Cruz, Jr.",juan@x.edu,bsit,1\n\n',
    );
    expect(rows).toEqual([
      {
        idNumber: "2025-0001",
        firstName: "Juan",
        lastName: "Dela Cruz, Jr.",
        email: "juan@x.edu",
        course: "bsit",
        yearLevel: "1",
      },
    ]);
  });

  it("rejects a file without recognisable headers", () => {
    expect(() => parseCsv("a,b,c\n1,2,3")).toThrow(ImportFileError);
  });

  it("reads the first sheet of an .xlsx workbook", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Class list");
    sheet.addRow(["id_number", "first_name", "last_name", "email", "course", "year_level"]);
    sheet.addRow(["2025-0002", "Ana", "Reyes", { text: "ana@x.edu", hyperlink: "mailto:ana@x.edu" }, "BSCS", 2]);
    const buffer = await wb.xlsx.writeBuffer();
    const rows = await parseSpreadsheet({ name: "list.xlsx", arrayBuffer: async () => buffer as ArrayBuffer });
    expect(rows[0]).toMatchObject({ idNumber: "2025-0002", email: "ana@x.edu", course: "BSCS", yearLevel: "2" });
  });

  it("rejects other file types", async () => {
    await expect(parseSpreadsheet({ name: "list.pdf", arrayBuffer: async () => new ArrayBuffer(0) })).rejects.toThrow(
      ImportFileError,
    );
  });
});

describe("student import: validation", () => {
  const good = {
    idNumber: "2025-0001",
    firstName: "Juan",
    lastName: "Cruz",
    email: "Juan@X.edu",
    course: "bsit",
    yearLevel: "1",
  };

  it("normalises a valid row and resolves the course code", () => {
    const [r] = validateRows([good], ctx);
    expect(r.errors).toEqual([]);
    expect(r.row).toBe(2); // header is row 1
    expect(r.data).toMatchObject({
      email: "juan@x.edu",
      course: "BSIT",
      courseId: "c-bsit",
      yearLevel: 1,
      middleName: null,
    });
  });

  it("reports every problem on a row, labelled by column", () => {
    const [r] = validateRows([{ ...good, email: "nope", yearLevel: "7" }], ctx);
    expect(r.data).toBeUndefined();
    expect(r.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/^Email:/), expect.stringMatching(/^Year level:/)]),
    );
  });

  it("flags unknown courses and existing accounts", () => {
    const rows = validateRows(
      [
        { ...good, course: "BSN" },
        { ...good, idNumber: "2024-0001", email: "new@x.edu" },
        { ...good, idNumber: "2025-0009", email: "taken@example.edu" },
      ],
      ctx,
    );
    expect(rows[0].errors).toEqual(['Course: unknown course "BSN"']);
    expect(rows[1].errors).toEqual(["ID number: already registered"]);
    expect(rows[2].errors).toEqual(["Email: already registered"]);
  });

  it("catches duplicates within the file and points at the first occurrence", () => {
    const rows = validateRows(
      [good, { ...good, email: "other@x.edu" }, { ...good, idNumber: "2025-0002", email: "JUAN@x.edu" }],
      ctx,
    );
    expect(rows[0].errors).toEqual([]);
    expect(rows[1].errors).toEqual(["ID number: duplicate of row 2"]);
    expect(rows[2].errors).toEqual(["Email: duplicate of row 2"]);
  });
});

describe("student import: complete error reporting", () => {
  it("reports a duplicate even when the row also has an invalid field", () => {
    const base = {
      idNumber: "2025-0001",
      firstName: "A",
      lastName: "B",
      email: "a@x.edu",
      course: "BSIT",
      yearLevel: "1",
    };
    const rows = validateRows([base, { ...base, email: "b@x.edu", yearLevel: "5", course: "BSN" }], ctx);
    expect(rows[1].errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^Year level:/),
        "ID number: duplicate of row 2",
        'Course: unknown course "BSN"',
      ]),
    );
  });
});
