export const APPLICATION_STATUS = Object.freeze({
  DRAFT: 1,
  SUBMITTED: 2,
});

export const APPLICATION_STATUS_LABELS = {
  [APPLICATION_STATUS.SUBMITTED]: "Submitted",
};

export const MERIT_AWARD_FORM_STEPS = 3;

export const generateApplicationNumber = (studentId: number): string => {
  return `ARN-2026-27-${studentId}`;
};

export const ALLOWED_PERSONAL_FIELDS = [
  "name",
  "father_name",
  "mother_name",
  "gender_id",
  "district_id",
  "email",
] as const;

export const ALLOWED_APPLICATION_FIELDS = [
  "institution_name",
  "institution_district",
  "roll",
  "number",
  "registration_no",
  "registration_session",
  "percentage_of_marks",
  "remarks",
  "total_marks_obtained",
  "is_enrolled_in_college",
  "present_institution_name",
  "present_institution_district",
  "admission_via_samarth",
  "samarth_registration_no",
  "is_betterment_reappearance",
  "betterment_years",
  "betterment_reason",
  "declaration_guidelines_read",
  "declaration_info_true",
  "declaration_no_other_scheme",
  "declaration_agreed",
] as const;
export const SUBMIT_EDITABLE_FIELDS = [
  "mother_name",
  "email",
  "district_id",
  "total_marks_obtained",
  "remarks",
  "is_enrolled_in_college",
  "present_institution_name",
  "present_institution_district",
  "admission_via_samarth",
  "samarth_registration_no",
  "is_betterment_reappearance",
  "betterment_years",
  "betterment_reason",
  "declaration_guidelines_read",
  "declaration_info_true",
  "declaration_no_other_scheme",
  "declaration_agreed",
] as const;

export const ELIGIBILITY_THRESHOLD = 80;
export const MAX_TOTAL_MARKS = 500;

export const calculatePercentageOfMarks = (
  totalMarks: unknown,
): number | null => {
  const numericTotal =
    typeof totalMarks === "number" ? totalMarks : Number(totalMarks);

  if (
    totalMarks === null ||
    totalMarks === undefined ||
    totalMarks === "" ||
    Number.isNaN(numericTotal)
  ) {
    return null;
  }
  if (numericTotal < 0 || numericTotal > MAX_TOTAL_MARKS) return null;

  return Math.round((numericTotal / MAX_TOTAL_MARKS) * 100 * 100) / 100;
};

export const pickAllowed = <T extends Record<string, any>>(
  data: T,
  allowed: readonly string[],
): Partial<T> => {
  const result: Record<string, any> = {};
  for (const key of allowed) {
    if (key in data) result[key] = data[key];
  }
  return result as Partial<T>;
};

export const validateMeritApplication = (student: Record<string, any>) => {
  const errors: Record<string, string> = {};

  if (student.is_enrolled_in_college) {
    if (!student.present_institution_name) {
      errors.present_institution_name =
        "Required when enrolled in college/university (item 14)";
    }
    if (!student.present_institution_district) {
      errors.present_institution_district =
        "Required when enrolled in college/university (item 15)";
    }
  }

  if (student.admission_via_samarth && !student.samarth_registration_no) {
    errors.samarth_registration_no =
      "Required when admission was through Assam SAMARTH (item 17)";
  }

  if (student.is_betterment_reappearance) {
    if (!student.betterment_years) {
      errors.betterment_years =
        "Year(s) required for betterment/reappearance category (item 20)";
    }
    if (!student.betterment_reason) {
      errors.betterment_reason =
        "Reason required for betterment/reappearance category (item 20)";
    }
  }

  if (
    !student.declaration_guidelines_read ||
    !student.declaration_info_true ||
    !student.declaration_no_other_scheme ||
    !student.declaration_agreed
  ) {
    errors.declaration = "All declaration checkboxes must be accepted";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const DISTRICTS = Object.freeze({
  Bajali: 1,
  Baksa: 2,
  Barpeta: 3,
  Biswanath: 4,
  Bongaigaon: 5,
  Cachar: 6,
  Charaideo: 7,
  Chirang: 8,
  Darrang: 9,
  Dhemaji: 10,
  Dhubri: 11,
  Dibrugarh: 12,
  Goalpara: 13,
  Golaghat: 14,
  Hailakandi: 15,
  Hojai: 16,
  Jorhat: 17,
  Kamrup_Metro: 18,
  Kamrup: 19,
  Karbi_Anglong: 20,
  Kokrajhar: 21,
  Lakhimpur: 22,
  Majuli: 23,
  Morigaon: 24,
  Nagaon: 25,
  Nalbari: 26,
  Sivasagar: 27,
  Sonitpur: 28,
  South_Salmara_Mankachar: 29,
  Sribhumi: 30,
  Tamulpur: 31,
  Tinsukia: 32,
  Udalguri: 33,
  West_Karbi_Anglong: 34,
  Dima_Hasao: 35,
  Others: 36,
});

const DISTRICT_LABEL_OVERRIDES: Partial<
  Record<keyof typeof DISTRICTS, string>
> = {
  Kamrup_Metro: "Kamrup (Metro)",
  South_Salmara_Mankachar: "South Salmara-Mankachar",
};

export const DISTRICT_OPTIONS = Object.entries(DISTRICTS).map(
  ([key, value]) => ({
    label:
      DISTRICT_LABEL_OVERRIDES[key as keyof typeof DISTRICTS] ??
      key.replace(/_/g, " "),
    value,
  }),
);
