import { NextFunction, Request, Response } from "express";
import {
  APPLICATION_STATUS,
  calculatePercentageOfMarks,
  ELIGIBILITY_THRESHOLD,
  generateApplicationNumber,
  isPortalClosed,
  PORTAL_CLOSED_MESSAGE,
  pickAllowed,
  SUBMIT_EDITABLE_FIELDS,
  validateMeritApplication,
} from "../../helpers/students/application";
import { getGenderName } from "../../helpers/students/student";
import Student from "../../models/student/Student.model";

export const getApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.status(200).json({
      status: true,
      application: student,
    });
  } catch (error: any) {
    console.error("getApplication error:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to get application",
    });
  }
};

export const submitApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (isPortalClosed()) {
      return res.status(403).json({
        status: false,
        message: PORTAL_CLOSED_MESSAGE,
      });
    }

    const studentId = req.payload.id;

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const existingNumber = student.getDataValue("application_number");
    const currentStatus = student.getDataValue("application_status");
    const isResubmission = !!existingNumber;
    if (isResubmission && currentStatus !== APPLICATION_STATUS.DRAFT) {
      return res.status(409).json({
        status: false,
        message:
          "This application has already been submitted. Use Edit Application to make changes.",
      });
    }

    const safeUpdates = pickAllowed(req.body, SUBMIT_EDITABLE_FIELDS);
    const percentageOfMarks = calculatePercentageOfMarks(
      safeUpdates.total_marks_obtained,
    );

    if (
      percentageOfMarks === null ||
      percentageOfMarks < ELIGIBILITY_THRESHOLD
    ) {
      return res.status(400).json({
        status: false,
        message: `You must score at least ${ELIGIBILITY_THRESHOLD}% to be eligible for this scheme.`,
        errors: {
          total_marks_obtained:
            percentageOfMarks === null
              ? "Please enter a valid total marks value."
              : "Marks do not meet the eligibility threshold.",
        },
      });
    }

    const mergedUpdate = {
      ...safeUpdates,
      percentage_of_marks: percentageOfMarks,
    };
    const validation = validateMeritApplication({
      ...student.toJSON(),
      ...mergedUpdate,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        status: false,
        message: "Please correct the highlighted fields.",
        errors: validation.errors,
      });
    }

    const applicationNumber = isResubmission
      ? existingNumber
      : generateApplicationNumber(studentId);
    await student.update({
      ...mergedUpdate,
      application_number: applicationNumber,
      application_status: APPLICATION_STATUS.SUBMITTED,
      submitted_at: new Date(),
      ...(isResubmission ? { is_edited: true } : {}),
    });
    return res.json({
      message: isResubmission
        ? "Application updated successfully"
        : "Application submitted successfully",
      application: student,
    });
  } catch (error: any) {
    console.error("submitApplication error:", error);
    const status = error.status ?? 500;
    const message = "Failed to submit application";
    return res.status(status).send({ status: false, message });
  }
};

export const reopenApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // NEW: blocks starting a new edit session once the deadline has
    // passed — reopening an application you could never actually
    // re-save is a dead end, so this is refused up front rather than
    // letting the user edit for nothing and hit the block later at
    // submitApplication.
    if (isPortalClosed()) {
      return res.status(403).json({
        status: false,
        message: PORTAL_CLOSED_MESSAGE,
      });
    }

    const studentId = req.payload.id;

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const applicationNumber = student.getDataValue("application_number");
    const currentStatus = student.getDataValue("application_status");

    if (!applicationNumber || currentStatus !== APPLICATION_STATUS.SUBMITTED) {
      return res.status(400).json({
        status: false,
        message: "Only a submitted application can be reopened for editing.",
      });
    }

    await student.update({
      application_status: APPLICATION_STATUS.DRAFT,
    });

    return res.json({
      status: true,
      message: "Application reopened for editing",
      application: student,
    });
  } catch (error: any) {
    console.error("reopenApplication error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to reopen application",
    });
  }
};

// ── Admin: unaffected by the deadline — must still work regardless of
// whether the portal is open or closed. Status filter (from earlier)
// preserved as-is.
const STATUS_FILTER_MAP: Record<string, number> = {
  submitted: APPLICATION_STATUS.SUBMITTED,
  draft: APPLICATION_STATUS.DRAFT,
};

export const getAllStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rawStatus = req.query.status;

    if (rawStatus !== undefined) {
      if (typeof rawStatus !== "string") {
        return res.status(400).json({
          status: false,
          message: "Invalid status filter.",
        });
      }
      const normalized = rawStatus.trim().toLowerCase();
      if (!(normalized in STATUS_FILTER_MAP)) {
        return res.status(400).json({
          status: false,
          message: `Invalid status filter. Expected one of: ${Object.keys(STATUS_FILTER_MAP).join(", ")}.`,
        });
      }
    }

    const normalizedStatus =
      typeof rawStatus === "string"
        ? rawStatus.trim().toLowerCase()
        : undefined;

    const where = normalizedStatus
      ? { application_status: STATUS_FILTER_MAP[normalizedStatus] }
      : undefined;

    const students = await Student.findAll({
      ...(where ? { where } : {}),
    });

    const studentsWithGenderName = students.map((student) => {
      const plain = student.toJSON() as Record<string, any>;
      return {
        ...plain,
        gender_name: getGenderName(plain.gender_id),
      };
    });

    return res.status(200).json({
      status: true,
      count: studentsWithGenderName.length,
      students: studentsWithGenderName,
    });
  } catch (error: any) {
    console.error("getAllStudents error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch student records",
    });
  }
};

