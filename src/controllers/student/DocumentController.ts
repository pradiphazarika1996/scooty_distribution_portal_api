import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextFunction, Request, Response } from "express";
import { APPLICATION_STATUS } from "../../helpers/students/application";
import Application from "../../models/student/Application.model";
import Document from "../../models/student/Document.model";
import s3 from "../../services/AwsS3Client";

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME ?? "";

/**
 * POST /api/student/application/documents
 * Upload a single document for the draft application.
 */
export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;
    const { docType } = req.body;
    const file = req.file as Express.MulterS3.File;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!docType) {
      return res.status(400).json({ message: "Document type is required" });
    }

    // Find draft application
    const application = await Application.findOne({
      where: {
        student_id: studentId,
        application_status: APPLICATION_STATUS.DRAFT,
      },
    });

    if (!application) {
      return res.status(404).json({ message: "No draft application found" });
    }

    const applicationId = application.getDataValue("id");

    // Check if document of this type already exists — replace it
    const existing = await Document.findOne({
      where: {
        application_id: applicationId,
        doc_type: docType,
      },
    });

    if (existing) {
      // Delete old file from S3
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: existing.getDataValue("file_path"),
          }),
        );
      } catch (err) {
        console.error("Failed to delete old file from S3:", err);
      }
      await existing.destroy();
    }

    // Create new document record
    const document = await Document.create({
      student_id: studentId,
      application_id: applicationId,
      doc_type: docType,
      file_name: file.originalname,
      file_path: file.key,
      file_type: file.originalname.split(".").pop()?.toLowerCase() || "unknown",
      file_size: file.size,
    });

    return res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/application/documents
 * Get all documents for the current draft/latest application.
 */
export const getDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    // Find draft or latest application
    let application = await Application.findOne({
      where: {
        student_id: studentId,
        application_status: APPLICATION_STATUS.DRAFT,
      },
    });

    if (!application) {
      application = await Application.findOne({
        where: { student_id: studentId },
        order: [["created_at", "DESC"]],
      });
    }

    if (!application) {
      return res.json({ documents: [] });
    }

    const documents = await Document.findAll({
      where: { application_id: application.getDataValue("id") },
      order: [["doc_type", "ASC"]],
    });

    return res.json({ documents });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/student/application/documents/:docType
 * Delete a specific document by type from the draft application.
 */
export const deleteDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;
    const { docType } = req.params;

    const application = await Application.findOne({
      where: {
        student_id: studentId,
        application_status: APPLICATION_STATUS.DRAFT,
      },
    });

    if (!application) {
      return res.status(404).json({ message: "No draft application found" });
    }

    const document = await Document.findOne({
      where: {
        application_id: application.getDataValue("id"),
        doc_type: docType,
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete from S3
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: document.getDataValue("file_path"),
        }),
      );
    } catch (err) {
      console.error("Failed to delete file from S3:", err);
    }

    await document.destroy();

    return res.json({ message: "Document deleted successfully" });
  } catch (error) {
    next(error);
  }
};
