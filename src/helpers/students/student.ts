export const TOTAL_FORM_STEPS = 3;

// GENDER
export const GENDER = Object.freeze({
  MALE: 1,
  FEMALE: 2,
});

export const GENDER_OPTIONS = Object.entries(GENDER).map(([label, value]) => ({
  label,
  value,
}));

export function getGenderName(value: number) {
  const option = GENDER_OPTIONS.find((opt) => opt.value == value);
  return option ? option.label : "";
}

export const PROFILE_STATUS = Object.freeze({
  DRAFT: 0,
  COMPLETED: 1,
});

// EXAM TYPES
export const EXAM_TYPE = Object.freeze({
  HSLC: 1,
  HS: 2,
});

export const EXAM_TYPE_OPTIONS = Object.entries(EXAM_TYPE).map(
  ([label, value]) => ({
    label,
    value,
  }),
);

export function getExamTypeName(value: number) {
  const option = EXAM_TYPE_OPTIONS.find((opt) => opt.value == value);
  return option ? option.label : "";
}

// BOARDS
export const BOARDS = Object.freeze({
  ASSEB: 1,
  CBSE: 2,
  ICSE: 3,
  OTHER: 4,
});

export const BOARD_OPTIONS = Object.entries(BOARDS).map(([label, value]) => ({
  label,
  value,
}));

export function getBoardName(value: number) {
  const option = BOARD_OPTIONS.find((opt) => opt.value == value);
  return option ? option.label : "";
}

// CASTE
export const CASTE = Object.freeze({
  GENERAL: 1,
  OBC: 2,
  MOBC: 3,
  SC: 4,
  ST_P: 5,
  ST_H: 6,
  EWS: 7,
  OTHER: 8,
});

export const CASTE_OPTIONS = [
  { label: "General", value: 1 },
  { label: "OBC", value: 2 },
  { label: "MOBC", value: 3 },
  { label: "SC", value: 4 },
  { label: "ST(P)", value: 5 },
  { label: "ST(H)", value: 6 },
  { label: "EWS", value: 7 },
  { label: "Other", value: 8 },
];

export function getCasteName(value: number) {
  const option = CASTE_OPTIONS.find((opt) => opt.value == value);
  return option ? option.label : "";
}

export const EXAM_HIERARCHY: Record<
  number,
  { label: string; level: number; canApplyAfter: number[]; minGapYears: number }
> = {
  [EXAM_TYPE.HSLC]: {
    label: "HSLC",
    level: 1,
    canApplyAfter: [],
    minGapYears: 0,
  },
  [EXAM_TYPE.HS]: {
    label: "HS",
    level: 2,
    canApplyAfter: [EXAM_TYPE.HSLC],
    minGapYears: 2, // ← must wait 2 years after HSLC
  },
};

export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};
