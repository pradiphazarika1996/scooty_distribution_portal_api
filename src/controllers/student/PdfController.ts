import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextFunction, Request, Response } from "express";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import {
  APPLICATION_STATUS,
  DOCUMENT_TYPES,
  getStateName,
} from "../../helpers/students/application";
import {
  BOARDS,
  CASTE,
  getBoardName,
  getCasteName,
  getExamTypeName,
  getGenderName,
} from "../../helpers/students/student";
import { BUCKET_NAME } from "../../middleware/uploadFile";
import Constituency from "../../models/masters/Constituency.model";
import District from "../../models/masters/District.model";
import Village from "../../models/masters/Village.model";
import Application from "../../models/student/Application.model";
import Document from "../../models/student/Document.model";
import Student from "../../models/student/Student.model";
import s3 from "../../services/AwsS3Client";

export const VILLAGE_OTHER = -1;

const COLORS = {
  primary: "#8900d4",
  text: "#201924",
  textLight: "#4e4354",
  border: "#d1c1d7",
  bgLight: "#f7eaf9",
  white: "#ffffff",
};

interface RowItem {
  label: string;
  value: string;
}

function drawSectionHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number,
): number {
  doc
    .rect(
      doc.page.margins.left,
      y,
      doc.page.width - doc.page.margins.left - doc.page.margins.right,
      28,
    )
    .fill(COLORS.bgLight);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.primary)
    .text(title.toUpperCase(), doc.page.margins.left + 12, y + 8, {
      width: 400,
    });

  return y + 36;
}

function drawRow(
  doc: PDFKit.PDFDocument,
  item: RowItem,
  y: number,
  pageWidth: number,
  margins: { left: number; right: number },
): number {
  const contentWidth = pageWidth - margins.left - margins.right;
  const labelWidth = 180;
  const valueWidth = contentWidth - labelWidth;

  // Measure heights for multi-line support
  const labelHeight = doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .heightOfString(item.label.toUpperCase(), { width: labelWidth - 20 });

  const valueHeight = doc
    .font("Helvetica")
    .fontSize(9.5)
    .heightOfString(item.value || "—", { width: valueWidth - 20 });

  const contentHeight = Math.max(labelHeight, valueHeight);
  const rowHeight = Math.max(32, contentHeight + 16);
  const textY = y + (rowHeight - contentHeight) / 2;

  // Label
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.textLight)
    .text(item.label.toUpperCase(), margins.left + 12, textY, {
      width: labelWidth - 20,
    });

  // Value
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(COLORS.text)
    .text(item.value || "—", margins.left + labelWidth + 8, textY, {
      width: valueWidth - 20,
    });

  // Bottom border
  // doc
  //   .moveTo(margins.left, y + rowHeight)
  //   .lineTo(margins.left + contentWidth, y + rowHeight)
  //   .strokeColor(COLORS.border)
  //   .lineWidth(0.5)
  //   .stroke();

  return y + rowHeight;
}

function checkPage(
  doc: PDFKit.PDFDocument,
  y: number,
  needed: number = 40,
): number {
  if (y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    return doc.page.margins.top;
  }
  return y;
}

export const downloadApplicationPdf = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;
    const applicationId = req.params.applicationId;

    const application = await Application.findOne({
      where: {
        id: applicationId,
        student_id: studentId,
        application_status: APPLICATION_STATUS.SUBMITTED,
      },
    });

    if (!application) {
      return res
        .status(404)
        .json({ message: "Submitted application not found" });
    }

    const student = await Student.findByPk(studentId, {
      attributes: { exclude: ["password"] },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const sd = student.toJSON() as any;
    const ad = application.toJSON() as any;

    // Resolve all IDs to names in parallel
    const [district, constituency, village] = await Promise.all([
      sd.district_id ? District.findByPk(sd.district_id) : null,
      sd.constituency_id ? Constituency.findByPk(sd.constituency_id) : null,
      sd.village_id ? Village.findByPk(sd.village_id) : null,
    ]);

    // Fetch passport photo from S3
    let photoBuffer: Buffer | null = null;
    const passportDoc = await Document.findOne({
      where: {
        application_id: application.getDataValue("id"),
        student_id: studentId,
        doc_type: DOCUMENT_TYPES.PASSPORT,
      },
    });

    if (passportDoc) {
      const filePath = passportDoc.getDataValue("file_path");

      try {
        const s3Response = await s3.send(
          new GetObjectCommand({ Bucket: BUCKET_NAME, Key: filePath }),
        );

        if (s3Response.Body) {
          const chunks: Buffer[] = [];
          for await (const chunk of s3Response.Body as any) {
            chunks.push(Buffer.from(chunk));
          }
          const rawBuffer = Buffer.concat(chunks);

          // Normalize to JPEG for PDFKit compatibility
          photoBuffer = await sharp(rawBuffer)
            .resize(360, 440, { fit: "cover" })
            .jpeg({ quality: 90 })
            .toBuffer();
        }
      } catch (err) {
        console.error("S3 fetch error:", err);
        photoBuffer = null;
      }
    }

    const getName = (model: any): string => {
      if (!model) return "—";
      if (typeof model.getDataValue === "function")
        return model.getDataValue("name") || "—";
      return model.name || "—";
    };

    // Build address
    const isResident = sd.is_resident_of_mac_area;
    const address = isResident
      ? [
          sd.village_id === VILLAGE_OTHER
            ? sd.other_village_name
            : getName(village),
          sd.panchayat_name,
          sd.municipal_area ? sd.municipal_area : null,
          getName(constituency),
          getName(district),
          sd.pin_code,
        ]
          .filter(Boolean)
          .join(", ")
      : [
          sd.permanent_address,
          sd.present_address,
          sd.city,
          getStateName(sd.state_id),
          sd.pin_code,
        ]
          .filter((v) => v && v !== "—")
          .join(", ");

    // Format DOB
    const dob = sd.date_of_birth
      ? new Date(sd.date_of_birth).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";

    // Marks
    const marksLabel = ad.marking_system === 2 ? "CGPA" : "Percentage";
    const marksValue =
      ad.marking_system === 2
        ? ad.cgpa
          ? String(ad.cgpa)
          : "—"
        : ad.percentage_of_marks
          ? `${ad.percentage_of_marks}%`
          : "—";

    // ── Build PDF ──
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const filename = `Application_${ad.application_number || ad.id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const margins = {
      left: doc.page.margins.left,
      right: doc.page.margins.right,
    };
    const contentWidth = pageWidth - margins.left - margins.right;

    // ── Header (centered, no logo) ──
    let y = doc.page.margins.top;

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(COLORS.primary)
      .text("Mising Autonomous Council (MAC)", margins.left, y, {
        width: contentWidth,
        align: "center",
      });

    y += 26;

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(COLORS.primary)
      .text("Tabu Taid Shiksha Jyoti Scheme", margins.left, y, {
        width: contentWidth,
        align: "center",
      });

    y += 20;

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.textLight)
      .text("Application Form", margins.left, y, {
        width: contentWidth,
        align: "center",
      });

    y += 20;

    const generatedAt = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.textLight)
      .text(`Generated: ${generatedAt}`, margins.left, y);

    if (ad.application_number) {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.text)
        .text(
          `Application No: ${ad.application_number}`,
          pageWidth - margins.right - 200,
          y,
          { width: 200, align: "right" },
        );
    }

    y += 16;

    // Divider line
    doc
      .moveTo(margins.left, y)
      .lineTo(margins.left + contentWidth, y)
      .strokeColor(COLORS.primary)
      .lineWidth(2)
      .stroke();
    y += 16;

    // ── Personal Details ──
    y = checkPage(doc, y, 250);
    y = drawSectionHeader(doc, "Personal Details", y);

    // Passport photo (top-right of section)
    const photoWidth = 65;
    const photoHeight = 80;

    if (photoBuffer) {
      const photoX = margins.left + contentWidth - photoWidth - 12;
      const photoY = y + 4;

      doc
        .rect(photoX - 1, photoY - 1, photoWidth + 2, photoHeight + 2)
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .stroke();

      doc.image(photoBuffer, photoX, photoY, {
        fit: [photoWidth, photoHeight],
        align: "center",
        valign: "center",
      });
    }

    const personalRows: RowItem[] = [
      { label: "Applicant Name", value: sd.name || "—" },
      { label: "Father / Guardian", value: sd.guardian_name || "—" },
      { label: "Gender", value: getGenderName(sd.gender_id) },
      { label: "Date of Birth", value: dob },
      {
        label: "Caste",
        value:
          sd.caste_id === CASTE.OTHER
            ? sd.other_caste_name || "—"
            : getCasteName(sd.caste_id) || "—",
      },
      {
        label: "Are you a resident of MAC notified village area?",
        value: isResident ? "Yes" : "No",
      },
      { label: "Address", value: address || "—" },
      { label: "Aadhaar Number", value: sd.aadhaar_number || "—" },
      { label: "Phone Number", value: sd.phone || "—" },
      { label: "Email ID", value: sd.email || "Not provided" },
    ];

    for (const row of personalRows) {
      y = checkPage(doc, y);
      y = drawRow(doc, row, y, pageWidth, margins);
    }

    // Ensure y clears the photo
    if (photoBuffer) {
      const photoBottomY = y - personalRows.length * 32 + photoHeight + 12;
      y = Math.max(y, photoBottomY);
    }

    y += 16;

    // ── Academic Details ──
    y = checkPage(doc, y, 200);
    y = drawSectionHeader(doc, "Academic Details", y);

    const academicRows: RowItem[] = [
      { label: "Examination Passed", value: getExamTypeName(ad.exam_id) },
      {
        label: "Year of Passing",
        value: ad.year_of_passing ? String(ad.year_of_passing) : "—",
      },
      {
        label: "Board Name",
        value:
          ad.board_id === BOARDS.OTHER
            ? ad.other_board_name || "—"
            : getBoardName(ad.board_id),
      },
      { label: "Roll No.", value: ad.roll_no || "—" },
      { label: marksLabel, value: marksValue },
      { label: "Institution Name", value: ad.institution_name || "—" },
      { label: "Institution Address", value: ad.institution_address || "—" },
    ];

    for (const row of academicRows) {
      y = checkPage(doc, y);
      y = drawRow(doc, row, y, pageWidth, margins);
    }

    y += 16;

    // ── Bank Details ──
    y = checkPage(doc, y, 140);
    y = drawSectionHeader(doc, "Bank Details", y);

    const bankRows: RowItem[] = [
      { label: "Bank Name", value: ad.bank_name || "—" },
      { label: "Branch", value: ad.branch_name || "—" },
      { label: "Account No.", value: ad.account_no || "—" },
      { label: "IFSC Code", value: ad.ifsc_code || "—" },
    ];

    for (const row of bankRows) {
      y = checkPage(doc, y);
      y = drawRow(doc, row, y, pageWidth, margins);
    }

    y += 24;

    // ── Footer note ──
    y = checkPage(doc, y, 50);
    doc.rect(margins.left, y, contentWidth, 1).fill(COLORS.border);
    y += 12;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.textLight)
      .text(
        "This is a computer-generated document. No signature is required.",
        margins.left,
        y,
        { width: contentWidth, align: "center" },
      );

    doc.end();
  } catch (error) {
    next(error);
  }
};
