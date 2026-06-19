// import { GetObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import type { NextFunction, Request, Response } from "express";
// import type { Model } from "sequelize";
// import { DOCUMENT_TYPES } from "../../../helpers/students/application";
// import { BUCKET_NAME } from "../../../middleware/uploadFile";
// import Document from "../../../models/student/Document.model";
// import s3 from "../../../services/AwsS3Client";
// import createHttpError from "http-errors";

// // ── Doc type label resolver ──────────────────────────────────
// // Reverse-looks-up the constant name for whatever numeric doc_type
// // is stored, so this stays correct even if new document types are
// // added later without needing changes here.

// function toTitleCase(s: string): string {
//   return s
//     .toLowerCase()
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (c) => c.toUpperCase());
// }

// function getDocTypeLabel(docType: number): string {
//   const entry = Object.entries(DOCUMENT_TYPES).find(([, v]) => v === docType);
//   return entry ? toTitleCase(entry[0]) : `Document ${docType}`;
// }

// // ── Shared signed-URL generator ───────────────────────────────
// // Used by BOTH getApplicationDocuments (batch list) and
// // getDocumentUrl (single document) below — the S3 signing logic
// // now lives in exactly one place instead of being duplicated.

// async function generateDocumentUrl(doc: Model<any, any>): Promise<string> {
//   const filePath = doc.getDataValue("file_path") as string;
//   const fileName = doc.getDataValue("file_name") as string;

//   const command = new GetObjectCommand({
//     Bucket: BUCKET_NAME,
//     Key: filePath,
//     ResponseContentDisposition: `inline; filename="${fileName}"`,
//   });

//   return getSignedUrl(s3 as any, command, { expiresIn: 300 });
// }

// // ── Controller ────────────────────────────────────────────────
// // Isolated from ApplicationController — handles document concerns
// // only. Reuses the same Document model and S3 signed-URL pattern
// // already established in controllers/student/DocumentController.ts,
// // just scoped to admin-known IDs instead of a student's JWT payload.

// export default {
//   // Batch — all documents for one application, used by the View
//   // Details page's Documents section.
//   getApplicationDocuments: async (
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> => {
//     try {
//       const applicationId = Number(req.params.id);
//       if (!applicationId || isNaN(applicationId)) {
//         res
//           .status(400)
//           .json({ success: false, message: "Invalid application ID" });
//         return;
//       }

//       const documents = await Document.findAll({
//         where: { application_id: applicationId },
//         order: [["doc_type", "ASC"]],
//       });

//       const data = await Promise.all(
//         documents.map(async (doc) => {
//           const docType = doc.getDataValue("doc_type") as number;

//           return {
//             id: doc.getDataValue("id") as number,
//             docType,
//             docTypeName: getDocTypeLabel(docType),
//             fileName: doc.getDataValue("file_name") as string,
//             fileType: doc.getDataValue("file_type") as string,
//             fileSize: doc.getDataValue("file_size") as number,
//             documentsUrl: await generateDocumentUrl(doc),
//           };
//         }),
//       );

//       res.json({ success: true, data });
//     } catch (err) {
//       next(err);
//     }
//   },
//   getDocumentUrl: async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const studentId = req.payload.id;
//     const documentId = Number(req.params.id);
//     if (!documentId || isNaN(documentId)) {
//       res .status(400) .json({ status: false, message: "Invalid document ID" });
//       return;
//     }
//     const { id } = req.params;

//     const document = await Document.findOne({
//       where: { id, student_id: studentId },
//     });

//     if (!document) {
//       throw createHttpError(404, "Document not found");
//     }

//     const command = new GetObjectCommand({
//       Bucket: BUCKET_NAME,
//       Key: document.getDataValue("file_path"),
//       ResponseContentDisposition: `inline; filename="${document.getDataValue("file_name")}"`,
//     });

//     const url = await getSignedUrl(s3 as any, command, { expiresIn: 300 });

//     return res.json({ status: true, url });
//   } catch (error: any) {
//     console.error("getDocumentUrl error:", error);
//     const status = error.status ?? 500;
//     const message = "Failed to get document URL";
//     return res.status(status).send({ status: false, message });
//   }
// }
// };

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextFunction, Request, Response } from "express";
import type { Model } from "sequelize";
import { DOCUMENT_TYPES } from "../../../helpers/students/application";
import { BUCKET_NAME } from "../../../middleware/uploadFile";
import Document from "../../../models/student/Document.model";
import s3 from "../../../services/AwsS3Client";

// ── Doc type label resolver ──────────────────────────────────
// Reverse-looks-up the constant name for whatever numeric doc_type
// is stored, so this stays correct even if new document types are
// added later without needing changes here.

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDocTypeLabel(docType: number): string {
  const entry = Object.entries(DOCUMENT_TYPES).find(([, v]) => v === docType);
  return entry ? toTitleCase(entry[0]) : `Document ${docType}`;
}

// ── Shared signed-URL generator ───────────────────────────────
// Used by BOTH getApplicationDocuments (batch list) and
// getDocumentUrl (single document) below — the S3 signing logic
// lives in exactly one place instead of being duplicated.

async function generateDocumentUrl(doc: Model<any, any>): Promise<string> {
  const filePath = doc.getDataValue("file_path") as string;
  const fileName = doc.getDataValue("file_name") as string;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
    ResponseContentDisposition: `inline; filename="${fileName}"`,
  });

  return getSignedUrl(s3 as any, command, { expiresIn: 300 });
}

export default {
  getApplicationDocuments: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const applicationId = Number(req.params.id);
      if (!applicationId || isNaN(applicationId)) {
        res
          .status(400)
          .json({ success: false, message: "Invalid application ID" });
        return;
      }

      const documents = await Document.findAll({
        where: { application_id: applicationId },
        order: [["doc_type", "ASC"]],
      });

      const data = await Promise.all(
        documents.map(async (doc) => {
          const docType = doc.getDataValue("doc_type") as number;

          return {
            id: doc.getDataValue("id") as number,
            docType,
            docTypeName: getDocTypeLabel(docType),
            fileName: doc.getDataValue("file_name") as string,
            fileType: doc.getDataValue("file_type") as string,
            fileSize: doc.getDataValue("file_size") as number,
            documentsUrl: await generateDocumentUrl(doc),
          };
        }),
      );

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  getDocumentUrl: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const documentId = Number(req.params.id);
      if (!documentId || isNaN(documentId)) {
        res.status(400).json({ status: false, message: "Invalid document ID" });
        return;
      }

      const document = await Document.findOne({ where: { id: documentId } });
      if (!document) {
        res.status(404).json({ status: false, message: "Document not found" });
        return;
      }

      const url = await generateDocumentUrl(document);
      res.json({ status: true, url });
    } catch (err) {
      next(err);
    }
  },
};
