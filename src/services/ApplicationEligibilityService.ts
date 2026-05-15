import { Op } from "sequelize";
import { APPLICATION_STATUS } from "../helpers/application";
import { EXAM_HIERARCHY } from "../helpers/student";
import Application from "../models/student/Application.model";

interface EligibilityResult {
  canApply: boolean;
  allowedExams: number[];
  reason?: string;
  existingApplications: any[];
  draftApplication?: any;
}

/**
 * Determine which exams a student can apply for.
 *
 * Rules driven by EXAM_HIERARCHY config:
 * - A student cannot apply for the same exam_id twice.
 * - A student cannot apply for an exam with a lower level
 *   than any existing (non-rejected) application.
 * - If a draft exists for an exam, that exam is "in progress",
 *   not available for a new draft.
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
    (app: any) => app.application_status === APPLICATION_STATUS.DRAFT,
  );

  const appliedExamIds = existingApplications.map(
    (app: any) => app.exam_id as number,
  );

  // Highest level the student has applied for
  const highestAppliedLevel = appliedExamIds.reduce((max, examId) => {
    const level = EXAM_HIERARCHY[examId]?.level ?? 0;
    return Math.max(max, level);
  }, 0);

  // Filter allowed exams from hierarchy
  const allExamIds = Object.keys(EXAM_HIERARCHY).map(Number);
  const allowedExams = allExamIds.filter((examId) => {
    const config = EXAM_HIERARCHY[examId];

    // Already applied for this exam
    if (appliedExamIds.includes(examId)) return false;

    // Cannot apply for a lower level than what's already done
    if (config.level < highestAppliedLevel) return false;

    return true;
  });

  const canApply = allowedExams.length > 0;

  let reason: string | undefined;
  if (!canApply) {
    if (appliedExamIds.length >= allExamIds.length) {
      reason = "You have already applied for all available scholarships.";
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
