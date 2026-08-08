import { NextFunction, Request, Response } from "express";
import {
  APPLICATION_STATUS,
  calculatePercentageOfMarks,
  ELIGIBILITY_THRESHOLD,
  generateApplicationNumber,
  pickAllowed,
  SUBMIT_EDITABLE_FIELDS,
  validateMeritApplication,
} from "../../helpers/students/application";
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
