import { EXAM_TYPE } from "./student";

/**
 * Generate unique application number in format: PMS/AS/YYYY/NNNNN
 * PMS = Provincialisation Management System
 * AS = Assam
 * YYYY = Year
 * NNNNN = Sequential number
 */

const EXAM_PREFIX: Record<number, string> = {
  [EXAM_TYPE.HSLC]: "HSLC",
  [EXAM_TYPE.HS]: "HS",
};

export const generateApplicationNumber = async (
  examId: number,
  applicationId: number,
): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = EXAM_PREFIX[examId] || "SCH";

  return `MAC/${prefix}/${year}/${applicationId}`;
  // e.g. MAC/HSLC/2026/1
};

export const ALLOWED_PERSONAL_FIELDS = [
  "name",
  "guardian_name",
  "gender_id",
  "date_of_birth",
  "caste_id",
  "aadhaar_number",
  "mac_constituency_name_id",
  "mac_constituency_no_id",
  "state",
  "district",
  "constituency",
  "panchayat",
  "city",
  "village",
  "address",
  "pin_code",
] as const;

export const ALLOWED_ACADEMIC_FIELDS = [
  "year_of_passing",
  "board_id",
  "roll_no",
  "percentage_of_marks",
  "institution_name",
  "institution_address",
] as const;

export const ALLOWED_BANK_FIELDS = [
  "bank_name",
  "branch_name",
  "account_no",
  "ifsc_code",
] as const;

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

export const DOCUMENT_TYPES = Object.freeze({
  GOVT_ID: 1,
  MARKSHEET: 2,
  AGE_PROOF: 3,
  ADDRESS_PROOF: 4,
  SCHOOL_PASS_CERTIFICATE: 5,
  BANK_PASS_BOOK: 6,
  CASTE_CERTIFICATE: 7,
  PASSPORT: 8,
  INCOME_PROOF: 9,
});

export const DOCUMENT_TYPES_ARRAY = [
  {
    key: DOCUMENT_TYPES.GOVT_ID,
    label: "Government ID",
    description: "Aadhaar Card / PAN Card",
    required: true,
  },
  {
    key: DOCUMENT_TYPES.MARKSHEET,
    label: "HSLC / HS Marksheet",
    description: "Scanned copy of marksheet",
    required: true,
  },
  {
    key: DOCUMENT_TYPES.AGE_PROOF,
    label: "Age Proof",
    description: "Birth Certificate / HSLC Admit Card",
    required: true,
  },
  {
    key: DOCUMENT_TYPES.ADDRESS_PROOF,
    label: "Address Proof",
    description: "Aadhaar Card / Electricity Bill / DL / Any other document",
    required: true,
  },
  {
    key: DOCUMENT_TYPES.SCHOOL_PASS_CERTIFICATE,
    label: "School Pass Certificate",
    description: "Scanned copy of pass certificate",
    required: false,
  },
  {
    key: DOCUMENT_TYPES.BANK_PASS_BOOK,
    label: "Bank Pass Book",
    description: "First page of bank passbook",
    required: true,
  },
  {
    key: DOCUMENT_TYPES.CASTE_CERTIFICATE,
    label: "Caste Certificate",
    description: "Issued by competent authority",
    required: false,
  },
  {
    key: DOCUMENT_TYPES.PASSPORT,
    label: "Passport Photo",
    description: "Scanned copy of passport photograph",
    required: true,
  },
  {
    key: DOCUMENT_TYPES.INCOME_PROOF,
    label: "Income Proof",
    description: "Income Proof (Income Certificate / BPL Card / Ration Card)",
    required: false,
  },
] as const;

export const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png";
export const MAX_FILE_SIZE_MB = 2;

export const APPLICATION_STATUS = Object.freeze({
  DRAFT: 1,
  SUBMITTED: 2,
  PAYMENT_COMPLETED: 3,
  UNDER_REVIEW: 4,
  QUERY_RAISED: 5,
  APPROVED: 6,
  REJECTED: 7,
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 1,
  COMPLETED: 2,
  FAILED: 3,
});

export const APPLICATION_STATUS_LABELS = {
  [APPLICATION_STATUS.SUBMITTED]: "Submitted",
  [APPLICATION_STATUS.PAYMENT_COMPLETED]: "Payment Completed",
  [APPLICATION_STATUS.UNDER_REVIEW]: "Under Review",
  [APPLICATION_STATUS.QUERY_RAISED]: "Query Raised",
  [APPLICATION_STATUS.APPROVED]: "Approved",
  [APPLICATION_STATUS.REJECTED]: "Rejected",
};

export const MARKING_SYSTEM = Object.freeze({
  PERCENTAGE: 1,
  CGPA: 2,
});

// States
export const STATES = Object.freeze({
  Andhra_Pradesh: 1,
  Arunachal_Pradesh: 2,
  Assam: 3,
  Bihar: 4,
  Chhattisgarh: 5,
  Goa: 6,
  Gujarat: 7,
  Haryana: 8,
  Himachal_Pradesh: 9,
  Jharkhand: 10,
  Karnataka: 11,
  Kerala: 12,
  Madhya_Pradesh: 13,
  Maharashtra: 14,
  Manipur: 15,
  Meghalaya: 16,
  Mizoram: 17,
  Nagaland: 18,
  Odisha: 19,
  Punjab: 20,
  Rajasthan: 21,
  Sikkim: 22,
  Tamil_Nadu: 23,
  Telangana: 24,
  Tripura: 25,
  Uttar_Pradesh: 26,
  Uttarakhand: 27,
  West_Bengal: 28,
  Andaman_and_Nicobar_Islands: 29,
  Chandigarh: 30,
  Dadra_and_Nagar_Haveli_and_Daman_and_Diu: 31,
  Delhi: 32,
  Jammu_and_Kashmir: 33,
  Ladakh: 34,
  Lakshadweep: 35,
  Puducherry: 36,
});
// ── Add to existing utils/students/application.ts ────────
// Same file/pattern as GENDER_OPTIONS, EXAM_OPTIONS, LAST_ACTION_OPTIONS.


export const STATE_OPTIONS = Object.entries(STATES).map(([label, value]) => ({
  label: label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()),
  value,
}));

export function getStateName(value: number) {
  const option = STATE_OPTIONS.find((opt) => opt.value == value);
  return option ? option.label : "Unknown State";
}

// Deadline: 25 June 2026, 5:00 PM IST (UTC+5:30 = 11:30 AM UTC)
export const APPLICATION_DEADLINE = new Date("2026-06-25T11:30:00.000Z");

export const isAfterDeadline = (): boolean => {
  return new Date() > APPLICATION_DEADLINE;
};
