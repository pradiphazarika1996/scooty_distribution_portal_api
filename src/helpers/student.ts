export const Gender = Object.freeze({
  MALE: 1,
  FEMALE: 2,
});

export const PROFILE_STATUS = Object.freeze({
  DRAFT: 0,
  COMPLETED: 1,
});

export const EXAM_TYPE = Object.freeze({
  HSLC: 1,
  HS: 2,
});

export const Boards = Object.freeze({
  SEBA: 1,
  CBSE: 2,
  ICSE: 3,
  OTHER: 4,
});

export const Caste = Object.freeze({
  GENERAL: 1,
  OBC: 2,
  SC: 3,
  ST: 4,
});

/**
 * Exam hierarchy config — drives eligibility logic.
 * `level`: lower number = lower class. A student can only apply
 *          for same or higher level after an existing application.
 * `canApplyAfter`: exam IDs that unlock this exam.
 *                  Empty array = available to all first-time applicants.
 */
export const EXAM_HIERARCHY: Record<
  number,
  { label: string; level: number; canApplyAfter: number[] }
> = {
  [EXAM_TYPE.HSLC]: {
    label: "HSLC (Class 10)",
    level: 1,
    canApplyAfter: [],
  },
  [EXAM_TYPE.HS]: {
    label: "HS (Class 12)",
    level: 2,
    canApplyAfter: [EXAM_TYPE.HSLC],
  },
};

/**
 * Returns current academic year string (e.g., "2025-2026").
 * Academic year starts in April in India.
 */
export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // April (3) onwards = current year - next year
  // Jan-Mar = previous year - current year
  if (month >= 3) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};
