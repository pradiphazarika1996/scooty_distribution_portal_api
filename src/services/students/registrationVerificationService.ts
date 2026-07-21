import Student from "../../models/student/Student.model";
import StudentLookup from "../../models/student/StudentLookup.model";
import { DISTRICT_OPTIONS } from "../../helpers/students/application";
import { GENDER } from "../../helpers/students/student";

// Maps StudentLookup's raw single-letter gender codes ("M"/"F", as they
// appear in the source exam-result data) to the app's GENDER enum values.
// Deliberately NOT using GENDER_OPTIONS here — that's an array of
// { label, value } built for populating <Select>/<Radio.Group> options,
// not for keyed lookups, and its labels ("MALE"/"FEMALE") don't match
// StudentLookup's single-letter codes anyway.
const GENDER_CODE_TO_ID: Record<string, number> = {
  M: GENDER.MALE,
  F: GENDER.FEMALE,
};

export class EligibilityError extends Error {
  status: number;
  constructor(message: string, status = 404) {
    super(message);
    this.status = status;
  }
}

export class DuplicateRegistrationError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

interface VerifyEligibilityInput {
  registration_no: string;
  roll: string;
  number: string;
  // institution_code: string;
}

export const verifyStudentEligibility = async ({
  registration_no,
  roll,
  number,
  // institution_code,
}: VerifyEligibilityInput) => {
  const lookupRecord = await StudentLookup.findOne({
    where: {
      registration_no,
      roll,
      number,
      // institution_code,
    },
  });

  if (!lookupRecord) {
    throw new EligibilityError(
      "You are not eligible to register. Student record not found or the provided details are incorrect.",
    );
  }

  return lookupRecord;
};

export const assertNotAlreadyRegistered = async (registration_no: string) => {
  const existing = await Student.findOne({ where: { registration_no } });

  if (existing) {
    throw new DuplicateRegistrationError(
      "This student record has already been registered.",
    );
  }
};

const resolveDistrictId = (
  districtName?: string | null,
): number | undefined => {
  if (!districtName) return undefined;
  const normalized = districtName.trim().toUpperCase();
  const match = DISTRICT_OPTIONS.find(
    (opt) => opt.label.trim().toUpperCase() === normalized,
  );
  return match?.value;
};

export const createStudentFromLookup = async (
  lookupRecord: InstanceType<typeof StudentLookup>,
  phone: string,
) => {
  const lookup = lookupRecord.get({ plain: true }) as any;

  // FIXED: was `GENDER_OPTIONS[lookup.gender.trim().toUpperCase()]`, which
  // always returned undefined (indexing an array by string key isn't a
  // lookup) and would have mismatched on labels even if it were. This maps
  // the actual "M"/"F" letter code to the correct gender_id.
  const genderId = lookup.gender
    ? GENDER_CODE_TO_ID[lookup.gender.trim().toUpperCase()]
    : undefined;

  const student = await Student.create({
    phone,
    name: lookup.candidate_name,
    father_name: lookup.father_name,
    gender_id: genderId,
    institution_name: lookup.institution_name,
    institution_district: resolveDistrictId(lookup.district_name),
    roll: lookup.roll,
    number: lookup.number,
    registration_no: lookup.registration_no,
    registration_session: lookup.registration_session,
    total_marks_obtained: lookup.total_marks,
    percentage_of_marks: lookup.percentage,
  });

  return student;
};

/**
 * Full flow, for convenience — call this from your register/verify-otp
 * handler once the OTP itself has already been verified and you have a
 * confirmed phone number.
 */
export const registerVerifiedStudent = async (
  input: VerifyEligibilityInput,
  phone: string,
) => {
  const lookupRecord = await verifyStudentEligibility(input);
  await assertNotAlreadyRegistered(input.registration_no);
  return createStudentFromLookup(lookupRecord, phone);
};
