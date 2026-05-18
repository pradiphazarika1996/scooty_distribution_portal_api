import { Op } from "sequelize";
import { APPLICATION_STATUS } from "../helpers/students/application";
import { EXAM_HIERARCHY } from "../helpers/students/student";
import Application from "../models/student/Application.model";

interface EligibilityResult {
  canApply: boolean;
  allowedExams: number[];
  reason?: string;
  existingApplications: any[];
  draftApplication?: any;
  eligibleAfter?: string; // ISO date when next exam becomes available
}

/**
 * Determine which exams a student can apply for.
 *
 * Rules driven by EXAM_HIERARCHY config:
 * - A student cannot apply for the same exam_id twice.
 * - A student cannot apply for an exam with a lower level
 *   than any existing (non-rejected) application.
 * - If minGapYears > 0, the student must wait that many years
 *   after the prerequisite exam's submission date.
 */
export const checkEligibility = async (
  studentId: number,
): Promise<EligibilityResult> => {
  const existingApplications = await Application.findAll({
    where: {
      student_id: studentId,
      application_status: { [Op.ne]: APPLICATION_STATUS.REJECTED },
    },
    order: [["created_at", "DESC"]],
  });

  // Find any in-progress draft
  const draftApplication = existingApplications.find(
    (app) =>
      app.getDataValue("application_status") === APPLICATION_STATUS.DRAFT,
  );

  const appliedExamIds = existingApplications.map(
    (app) => app.getDataValue("exam_id") as number,
  );

  // Highest level the student has applied for
  const highestAppliedLevel = appliedExamIds.reduce((max, examId) => {
    const level = EXAM_HIERARCHY[examId]?.level ?? 0;
    return Math.max(max, level);
  }, 0);

  // Filter allowed exams from hierarchy
  const allExamIds = Object.keys(EXAM_HIERARCHY).map(Number);
  let eligibleAfter: string | undefined;

  const allowedExams = allExamIds.filter((examId) => {
    const config = EXAM_HIERARCHY[examId];

    // Already applied for this exam
    if (appliedExamIds.includes(examId)) return false;

    // Cannot apply for a lower level than what's already done
    if (config.level < highestAppliedLevel) return false;

    // Check minimum gap from prerequisite exams
    if (config.minGapYears > 0 && config.canApplyAfter.length > 0) {
      const prerequisiteApp = existingApplications.find(
        (app) =>
          config.canApplyAfter.includes(app.getDataValue("exam_id")) &&
          app.getDataValue("submitted_at"),
      );

      if (prerequisiteApp) {
        const submittedAt = new Date(
          prerequisiteApp.getDataValue("submitted_at"),
        );
        const earliestDate = new Date(submittedAt);
        earliestDate.setFullYear(
          earliestDate.getFullYear() + config.minGapYears,
        );

        if (new Date() < earliestDate) {
          eligibleAfter = earliestDate.toISOString();
          return false;
        }
      }
    }

    return true;
  });

  const canApply = allowedExams.length > 0;

  let reason: string | undefined;
  if (!canApply) {
    if (appliedExamIds.length >= allExamIds.length) {
      reason = "You have already applied for all available scholarships.";
    } else if (eligibleAfter) {
      const date = new Date(eligibleAfter).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      reason = `You can apply for the next scholarship after ${date}.`;
    } else {
      reason =
        "You are not eligible to apply for any remaining scholarships based on your application history.";
    }
  }

  return {
    canApply,
    allowedExams,
    reason,
    existingApplications,
    draftApplication,
    eligibleAfter,
  };
};

/**
 * Validate a specific exam before creating draft or submitting.
 */
export const validateExamEligibility = async (
  studentId: number,
  examId: number,
): Promise<{ valid: boolean; reason?: string }> => {
  const eligibility = await checkEligibility(studentId);

  if (!eligibility.allowedExams.includes(examId)) {
    return {
      valid: false,
      reason:
        eligibility.reason ??
        `You are not eligible for ${EXAM_HIERARCHY[examId]?.label ?? "this"} scholarship.`,
    };
  }

  return { valid: true };
};
