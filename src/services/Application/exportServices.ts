import ExcelJS from "exceljs";
import type { Response } from "express";
import PDFDocument from "pdfkit";
import {
  getApplicationsForExport,
  type GetApplicationsParams,
} from "./applicationService";

// ── Column definitions ─────────────────────────────────────

const COLUMNS = [
  { header: "Reference No.", key: "referenceNo", width: 18 },
  { header: "Name", key: "name", width: 22 },
  { header: "Phone", key: "phone", width: 14 },
  { header: "Exam", key: "exam", width: 8 },
  { header: "Board", key: "board", width: 8 },
  { header: "Year", key: "year", width: 8 },
  { header: "Marks", key: "marks", width: 10 },
  { header: "Location", key: "location", width: 18 },
  { header: "Sub-location", key: "subLocation", width: 18 },
  { header: "Applied Date", key: "appliedDate", width: 14 },
  { header: "Status", key: "status", width: 14 },
] as const;

const PDF_COL_WIDTHS = [80, 100, 78, 38, 40, 35, 45, 90, 80, 65, 70];
const TOTAL_W = PDF_COL_WIDTHS.reduce((a, b) => a + b, 0);
const MARGIN_L = 30;
const ROW_H = 18;
const HEADER_H = 22;
const PAGE_BOTTOM = 595 - 30; // A4 landscape height − margin

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  under_scrutiny: "Under Scrutiny",
  approved: "Approved",
  rejected: "Rejected",
};

function toRow(app: any): string[] {
  return [
    app.referenceNo ?? "—",
    app.applicant?.name ?? "—",
    app.applicant?.phone ?? "—",
    app.exam?.type ?? "—",
    app.exam?.board ?? "—",
    String(app.exam?.year || "—"),
    app.percentage != null ? `${Number(app.percentage).toFixed(2)}%` : "—",
    app.location?.district ?? "—",
    app.location?.subLocation ?? "—",
    app.appliedDate ?? "—",
    STATUS_LABEL[app.status] ?? app.status ?? "—",
  ];
}

// ── Excel export ───────────────────────────────────────────

export async function exportToExcel(
  params: GetApplicationsParams,
  res: Response,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Applications");

  workbook.creator = "MAC Scholarship Portal";
  workbook.created = new Date();

  sheet.columns = COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A56DB" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } };
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Fix 2: collect all data BEFORE writing headers.
  // If the DB query fails, we send a proper 500 error instead
  // of a corrupt/truncated file.
  try {
    let rowIndex = 0;
    for await (const batch of getApplicationsForExport(params)) {
      for (const app of batch) {
        const values = toRow(app);
        const row = sheet.addRow(
          Object.fromEntries(COLUMNS.map((c, i) => [c.key, values[i]])),
        );
        row.height = 18;
        const isEven = rowIndex % 2 === 0;
        row.eachCell((cell, col) => {
          cell.font = { size: 9, color: { argb: "FF1E293B" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isEven ? "FFF8FAFC" : "FFFFFFFF" },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: col === 1 ? "left" : "center",
          };
        });
        rowIndex++;
      }
    }
  } catch (err) {
    // Headers not yet sent — safe to send error response
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "Failed to generate Excel export" });
    }
    return;
  }

  // Only write headers + stream after all data is confirmed ready
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="applications_${today}.xlsx"`,
  );
  await workbook.xlsx.write(res);
  res.end();
}

// ── PDF export ─────────────────────────────────────────────

export async function exportToPdf(
  params: GetApplicationsParams,
  res: Response,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Fix 2: collect all rows before piping the PDF stream.
  // This way, if the DB fails we can still send a proper error.
  const allRows: string[][] = [];
  try {
    for await (const batch of getApplicationsForExport(params)) {
      for (const app of batch) allRows.push(toRow(app));
    }
  } catch (err) {
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "Failed to generate PDF export" });
    }
    return;
  }

  // All data ready — safe to start streaming
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: MARGIN_L,
    info: {
      Title: `Applications — ${today}`,
      Author: "MAC Scholarship Portal",
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="applications_${today}.pdf"`,
  );
  doc.pipe(res);

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#1e293b")
    .text("MAC Scholarship Portal — Applications", MARGIN_L, 30)
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#64748b")
    .text(`Exported on ${today}  ·  ${allRows.length} records`, MARGIN_L, 48);

  let y = 65;
  y = drawTableHeader(doc, y);
  drawTableRows(doc, allRows, y);

  doc.end();
}

// ── PDF table helpers ──────────────────────────────────────

function drawTableHeader(doc: PDFKit.PDFDocument, y: number): number {
  let x = MARGIN_L;
  doc.fillColor("#1a56db").rect(x, y, TOTAL_W, HEADER_H).fill();
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#ffffff");
  COLUMNS.forEach((col, i) => {
    doc.text(col.header, x + 3, y + 6, {
      width: PDF_COL_WIDTHS[i] - 6,
      ellipsis: true,
      lineBreak: false,
    });
    x += PDF_COL_WIDTHS[i];
  });
  return y + HEADER_H;
}

function drawTableRows(
  doc: PDFKit.PDFDocument,
  rows: string[][],
  startY: number,
): void {
  let y = startY;
  rows.forEach((row, idx) => {
    if (y + ROW_H > PAGE_BOTTOM) {
      doc.addPage();
      y = drawTableHeader(doc, 30);
    }
    let x = MARGIN_L;
    if (idx % 2 === 0) {
      doc.fillColor("#f8fafc").rect(x, y, TOTAL_W, ROW_H).fill();
    }
    doc.font("Helvetica").fontSize(7).fillColor("#1e293b");
    row.forEach((cell, i) => {
      doc.text(cell ?? "—", x + 3, y + 5, {
        width: PDF_COL_WIDTHS[i] - 6,
        ellipsis: true,
        lineBreak: false,
      });
      x += PDF_COL_WIDTHS[i];
    });
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(0.4)
      .moveTo(MARGIN_L, y + ROW_H)
      .lineTo(MARGIN_L + TOTAL_W, y + ROW_H)
      .stroke();
    y += ROW_H;
  });
}
