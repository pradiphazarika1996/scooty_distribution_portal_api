import { NextFunction, Request, Response } from "express";
import {
  APPLICATION_STATUS,
  generateApplicationNumber,
} from "../../helpers/students/application";
import { getCurrentAcademicYear } from "../../helpers/students/student";
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
  } catch (error) {
    next(error);
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
  } catch (error) {
    next(error);
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
  } catch (error) {
    next(error);
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

    // Step 3: Documents → handled by separate upload endpoint

    // Track completed steps
    let completedSteps: any = application.getDataValue("completed_steps") || [];
    while (typeof completedSteps === "string") {
      try {
        completedSteps = JSON.parse(completedSteps);
      } catch {
        completedSteps = [];
        break;
      }
    }
    if (!Array.isArray(completedSteps)) completedSteps = [];

    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
      await application.update({
        completed_steps: completedSteps,
      });
    }

    return res.json({
      message: "Step saved",
      completedSteps,
    });
  } catch (error) {
    next(error);
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

    // Validate all steps are completed
    const rawSteps = application.getDataValue("completed_steps");
    const completedSteps: number[] =
      typeof rawSteps === "string" ? JSON.parse(rawSteps) : rawSteps || [];
    const requiredSteps = [1, 2, 3];
    const missingSteps = requiredSteps.filter(
      (s) => !completedSteps.includes(s),
    );

    // if (missingSteps.length > 0) {
    //   return res.status(400).json({
    //     message: "Please complete all steps before submitting.",
    //     missingSteps,
    //   });
    // }

    // Snapshot student profile at submission
    const student = await Student.findByPk(studentId, {
      attributes: { exclude: ["password"] },
    });

    const applicationNumber = await generateApplicationNumber(
      application.getDataValue("exam_id"),
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
  } catch (error) {
    next(error);
  }
};
