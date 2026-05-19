import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextFunction, Request, Response } from "express";
import { DOCUMENT_TYPES } from "../../helpers/students/application";
import { PROFILE_STATUS } from "../../helpers/students/student";
import { BUCKET_NAME } from "../../middleware/uploadFile";
import Application, {
  APPLICATION_STATUS,
} from "../../models/student/Application.model";
import Document from "../../models/student/Document.model";
import Student from "../../models/student/Student.model";
import s3 from "../../services/AwsS3Client";

// Fields the student can freely edit via PATCH
const EDITABLE_FIELDS = [
  "name",
  "guardian_name",
  "email",
  "gender_id",
  "date_of_birth",
  "caste_id",
  "other_caste_name",
  "is_outside_mac_area",
  "state_id",
  "city",
  "permanent_address",
  "present_address",
  "district_id",
  "constituency_id",
  "village_id",
  "other_village_name",
  "panchayat_name",
  "municipal_area",
  "pin_code",
];

// Fields required for profile to be considered complete
const REQUIRED_FIELDS = [
  "name",
  "guardian_name",
  "gender_id",
  "date_of_birth",
  "caste_id",
  "aadhaar_number",
  "district_id",
  "pin_code",
];

const checkProfileCompletion = (student: any): boolean => {
  return REQUIRED_FIELDS.every((field) => {
    const val = student[field];
    return val !== null && val !== undefined && val !== "";
  });
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    const student = await Student.findByPk(studentId, {
      attributes: { exclude: ["password"] },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentData = student.toJSON() as any;
    const avatarKey = studentData.avatar_url;

    if (avatarKey) {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: avatarKey,
      });
      studentData.avatar_url = await getSignedUrl(s3 as any, command, {
        expiresIn: 3600,
      });
    }

    return res.json(studentData);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.getDataValue("is_profile_locked")) {
      return res.status(403).json({
        message:
          "Profile is locked. You cannot edit while an application is under review.",
      });
    }

    // Pick only allowed fields from request body
    const updates: Record<string, any> = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    await student.update(updates);

    // Re-check profile completion
    const refreshed = await Student.findByPk(studentId, {
      attributes: { exclude: ["password"] },
    });

    const isComplete = checkProfileCompletion(refreshed?.toJSON());

    if (isComplete && !refreshed?.getDataValue("is_profile_completed")) {
      await refreshed?.update({
        is_profile_completed: true,
        profile_status: PROFILE_STATUS.COMPLETED,
        profile_completed_at: new Date(),
      });
    } else if (!isComplete && refreshed?.getDataValue("is_profile_completed")) {
      await refreshed?.update({
        is_profile_completed: false,
        profile_status: PROFILE_STATUS.DRAFT,
        profile_completed_at: null,
      });
    }

    const updated = await Student.findByPk(studentId, {
      attributes: { exclude: ["password"] },
    });

    return res.json({
      message: "Profile updated successfully",
      student: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find draft application
    const application = await Application.findOne({
      where: {
        student_id: studentId,
        application_status: APPLICATION_STATUS.SUBMITTED,
      },
    });

    if (!application) {
      return res
        .status(404)
        .json({ message: "No submitted application found" });
    }

    const applicationId = application.getDataValue("id");
    const file = req.file as Express.MulterS3.File;

    // Replace existing passport photo document if any
    const existing = await Document.findOne({
      where: {
        application_id: applicationId,
        doc_type: DOCUMENT_TYPES.PASSPORT,
      },
    });

    if (existing) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: existing.getDataValue("file_path"),
          }),
        );
      } catch (err) {
        console.error("Failed to delete old passport photo from S3:", err);
      }
      await existing.destroy();
    }

    // Create document record
    await Document.create({
      student_id: studentId,
      application_id: applicationId,
      doc_type: DOCUMENT_TYPES.PASSPORT,
      file_name: file.originalname,
      file_path: file.key,
      file_type: file.originalname.split(".").pop()?.toLowerCase() || "unknown",
      file_size: file.size,
    });

    // Update student avatar
    await student.update({ avatar_url: file.key });

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.key,
    });
    const avatarUrl = await getSignedUrl(s3 as any, command, {
      expiresIn: 300,
    });

    return res.json({
      message: "Avatar updated",
      avatar_url: avatarUrl,
    });
  } catch (error) {
    next(error);
  }
};

export const removeAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const application = await Application.findOne({
      where: {
        student_id: studentId,
        application_status: APPLICATION_STATUS.SUBMITTED,
      },
    });

    if (application) {
      const document = await Document.findOne({
        where: {
          application_id: application.getDataValue("id"),
          doc_type: DOCUMENT_TYPES.PASSPORT,
        },
      });

      if (document) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: document.getDataValue("file_path"),
            }),
          );
        } catch (err) {
          console.error("Failed to delete passport photo from S3:", err);
        }
        await document.destroy();
      }
    }

    await student.update({ avatar_url: null });

    return res.json({ message: "Avatar removed" });
  } catch (error) {
    next(error);
  }
};
