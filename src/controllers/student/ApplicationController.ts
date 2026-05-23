import { NextFunction, Request, Response } from "express";
import {
  APPLICATION_STATUS,
  generateApplicationNumber,
} from "../../helpers/students/application";
import {
  getCurrentAcademicYear,
  TOTAL_FORM_STEPS,
} from "../../helpers/students/student";
import Application from "../../models/student/Application.model";
import Student from "../../models/student/Student.model";
import {
  checkEligibility,
  validateExamEligibility,
} from "../../services/ApplicationEligibilityService";

export const getEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;
    const result = await checkEligibility(studentId);

    return res.json({
      canApply: result.canApply,
      allowedExams: result.allowedExams,
      reason: result.reason,
      existingApplications: result.existingApplications,
      draftApplication: result.draftApplication ?? null,
    });
  } catch (error: any) {
    console.error("getEligibility error:", error);
    const status = error.status ?? 500;
    const message = "Failed to get eligibility";
    return res.status(status).send({ status: false, message });
  }
};

export const createDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;
    const { examId } = req.body;

    // Check eligibility
    const validation = await validateExamEligibility(studentId, examId);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    // Check if a draft already exists
    const existingDraft = await Application.findOne({
      where: {
        student_id: studentId,
        application_status: APPLICATION_STATUS.DRAFT,
      },
    });

    if (existingDraft) {
      return res.json({
        message: "Draft already exists",
        application: existingDraft,
      });
    }

    const application = await Application.create({
      student_id: studentId,
      exam_id: examId,
      academic_year: getCurrentAcademicYear(),
      application_status: APPLICATION_STATUS.DRAFT,
      completed_steps: [],
    });

    return res.status(201).json({
      message: "Draft created",
      application,
    });
  } catch (error: any) {
    console.error("createDraft error:", error);
    const status = error.status ?? 500;
    const message = "Failed to create draft application";
    return res.status(status).send({ status: false, message });
  }
};

export const getApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    // Prefer draft, fallback to latest
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

    const student = await Student.findByPk(studentId, {
      attributes: { exclude: ["password"] },
    });

    return res.json({ application, student });
  } catch (error: any) {
    console.error("getApplication error:", error);
    const status = error.status ?? 500;
    const message = "Failed to get application";
    return res.status(status).send({ status: false, message });
  }
};

export const saveStep = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;
    const { step, data } = req.body;

    // Find the draft application
    const application = await Application.findOne({
      where: {
        student_id: studentId,
        application_status: APPLICATION_STATUS.DRAFT,
      },
    });

    if (!application) {
      return res.status(404).json({ message: "No draft application found" });
    }

    if (step < 1 || step > TOTAL_FORM_STEPS) {
      return res.status(400).json({ message: "Invalid step" });
    }

    // Step 1: Personal details → save to Student
    if (data.student) {
      await Student.update(data.student, {
        where: { id: studentId },
      });
    }

    // Step 2: Academic & Bank → save to Application
    if (data.application) {
      await application.update({
        ...data.application,
      });
    }

    // Track highest completed step
    const currentStep = application.getDataValue("completed_step") || 0;
    const newStep = Math.max(currentStep, step);

    if (newStep > currentStep) {
      await application.update({ completed_step: newStep });
    }

    return res.json({
      message: "Step saved",
      completed_step: newStep,
    });
  } catch (error: any) {
    console.error("saveStep error:", error);
    const status = error.status ?? 500;
    const message = "Failed to save step";
    return res.status(status).send({ status: false, message });
  }
};

export const submitApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req.payload.id;

    const application = await Application.findOne({
      where: {
        student_id: studentId,
        application_status: APPLICATION_STATUS.DRAFT,
      },
    });

    if (!application) {
      return res.status(404).json({ message: "No draft application found" });
    }

    const completedStep = application.getDataValue("completed_step") || 0;

    if (completedStep < TOTAL_FORM_STEPS) {
      return res.status(400).json({
        message: "Please complete all steps before submitting.",
        completed_step: completedStep,
        required_steps: TOTAL_FORM_STEPS,
      });
    }

    // Snapshot student profile at submission
    const student = await Student.findByPk(studentId, {
      attributes: { exclude: ["password"] },
    });

    const applicationNumber = await generateApplicationNumber(
      application.getDataValue("exam_id"),
      application.getDataValue("id"),
    );

    await application.update({
      application_number: applicationNumber,
      application_status: APPLICATION_STATUS.SUBMITTED,
      submitted_at: new Date(),
      status_updated_at: new Date(),
      is_locked: true,
      submission_snapshot: student?.toJSON(),
    });

    return res.json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error: any) {
    console.error("submitApplication error:", error);
    const status = error.status ?? 500;
    const message = "Failed to submit application";
    return res.status(status).send({ status: false, message });
  }
};
