import { DISTRICT_OPTIONS } from "../../helpers/students/application";
import { GENDER } from "../../helpers/students/student";
import Student from "../../models/student/Student.model";
import StudentLookup from "../../models/student/StudentLookup.model";

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
  });

  return student;
};

export const registerVerifiedStudent = async (
  input: VerifyEligibilityInput,
  phone: string,
) => {
  const lookupRecord = await verifyStudentEligibility(input);
  await assertNotAlreadyRegistered(input.registration_no);
  return createStudentFromLookup(lookupRecord, phone);
};
