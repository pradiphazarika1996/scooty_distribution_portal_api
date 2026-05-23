import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import {
  APPLICATION_STATUS,
  DOCUMENT_TYPES,
} from "../../helpers/students/application";
import { BUCKET_NAME } from "../../middleware/uploadFile";
import Application from "../../models/student/Application.model";
import Document from "../../models/student/Document.model";
import Student from "../../models/student/Student.model";
import s3 from "../../services/AwsS3Client";

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

    // Update student avatar if passport photo
    if (Number(docType) === DOCUMENT_TYPES.PASSPORT) {
      await Student.update(
        { avatar_url: file.key },
        { where: { id: studentId } },
      );
    }

    return res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error: any) {
    console.error("uploadDocument error:", error);
    const status = error.status ?? 500;
    const message = "Failed to upload document";
    return res.status(status).send({ status: false, message });
  }
};

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
  } catch (error: any) {
    console.error("getDocuments error:", error);
    const status = error.status ?? 500;
    const message = "Failed to get documents";
    return res.status(status).send({ status: false, message });
  }
};

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

    // Clear avatar if passport photo was deleted
    if (Number(docType) === DOCUMENT_TYPES.PASSPORT) {
      await Student.update({ avatar_key: null }, { where: { id: studentId } });
    }

    return res.json({ message: "Document deleted successfully" });
  } catch (error: any) {
    console.error("deleteDocument error:", error);
    const status = error.status ?? 500;
    const message = "Failed to delete document";
    return res.status(status).send({ status: false, message });
  }
};

export const getDocumentUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;
    const { id } = req.params;

    const document = await Document.findOne({
      where: { id, student_id: studentId },
    });

    if (!document) {
      throw createHttpError(404, "Document not found");
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: document.getDataValue("file_path"),
      ResponseContentDisposition: `inline; filename="${document.getDataValue("file_name")}"`,
    });

    const url = await getSignedUrl(s3 as any, command, { expiresIn: 300 });

    return res.json({ status: true, url });
  } catch (error: any) {
    console.error("getDocumentUrl error:", error);
    const status = error.status ?? 500;
    const message = "Failed to get document URL";
    return res.status(status).send({ status: false, message });
  }
};
