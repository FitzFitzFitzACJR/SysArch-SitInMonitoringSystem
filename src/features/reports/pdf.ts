import "server-only";
import PDFDocument from "pdfkit";

type Column = { header: string; width: number; align?: "left" | "right" };

/**
 * A simple paginated A4-landscape table: title, subtitle (filters), header row repeated on
 * every page, page numbers. Built with pdfkit's standard Helvetica (no font files to ship).
 */
export function tablePdf({
  title,
  subtitle,
  columns,
  rows,
  footnote,
}: {
  title: string;
  subtitle: string;
  columns: Column[];
  rows: string[][];
  footnote?: string;
}): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const left = doc.page.margins.left;
  const bottom = () => doc.page.height - doc.page.margins.bottom;
  const rowHeight = 16;

  const headerRow = () => {
    let x = left;
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#444");
    for (const c of columns) {
      doc.text(c.header, x + 2, y + 4, { width: c.width - 4, align: c.align ?? "left", lineBreak: false });
      x += c.width;
    }
    doc
      .moveTo(left, y + rowHeight)
      .lineTo(x, y + rowHeight)
      .strokeColor("#999")
      .lineWidth(0.5)
      .stroke();
    doc.y = y + rowHeight;
  };

  doc.font("Helvetica-Bold").fontSize(14).fillColor("#000").text(title);
  doc.font("Helvetica").fontSize(9).fillColor("#555").text(subtitle).moveDown(0.8);
  headerRow();

  doc.font("Helvetica").fontSize(8).fillColor("#000");
  rows.forEach((row, i) => {
    if (doc.y + rowHeight > bottom()) {
      doc.addPage();
      headerRow();
      doc.font("Helvetica").fontSize(8).fillColor("#000");
    }
    const y = doc.y;
    if (i % 2 === 1)
      doc
        .rect(
          left,
          y,
          columns.reduce((s, c) => s + c.width, 0),
          rowHeight,
        )
        .fill("#f4f4f4")
        .fillColor("#000");
    let x = left;
    row.forEach((cell, j) => {
      const c = columns[j];
      doc.text(cell, x + 2, y + 4, { width: c.width - 4, align: c.align ?? "left", lineBreak: false, ellipsis: true });
      x += c.width;
    });
    doc.y = y + rowHeight;
  });

  if (footnote) doc.moveDown().font("Helvetica-Oblique").fontSize(8).fillColor("#555").text(footnote, left);

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    // Writing below the bottom margin makes pdfkit start a new page (a blank one, with only
    // the footer on it), so drop the margin while writing the footer.
    const margin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#777")
      .text(`Page ${i + 1} of ${range.count}`, left, doc.page.height - 24, {
        width: doc.page.width - left * 2,
        align: "right",
        lineBreak: false,
      });
    doc.page.margins.bottom = margin;
  }
  doc.end();
  return done;
}
