import { NextFunction, Request, Response } from "express";
import { PROFILE_STATUS } from "../../helpers/students/student";
import Student from "../../models/student/Student.model";

// Fields the student can freely edit via PATCH
const EDITABLE_FIELDS = [
  "name",
  "guardian_name",
  "email",
  "gender_id",
  "date_of_birth",
  "caste_id",
  "is_outside_mac_area",
  "state_id",
  "city",
  "address",
  "district_id",
  "constituency_id",
  "constituency_number",
  "panchayat_id",
  "village_id",
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

    return res.json(student);
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

    // S3 URL from multerS3
    const avatarUrl = (req.file as any).location;

    await student.update({ avatar_url: avatarUrl });

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

    await student.update({ avatar_url: null });

    return res.json({ message: "Avatar removed" });
  } catch (error) {
    next(error);
  }
};
