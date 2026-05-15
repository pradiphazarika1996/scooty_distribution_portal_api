import { Transaction } from "sequelize";
import sequelize from "../config/sequelize";
import Application from "../models/student/Application.model";

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

/**
 * Generate unique application number in format: PMS/AS/YYYY/NNNNN
 * PMS = Provincialisation Management System
 * AS = Assam
 * YYYY = Year
 * NNNNN = Sequential number
 */
export async function generateApplicationNumber(
  transaction: Transaction,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MAC/AS/${year}/`;

  // Get count of applications created this year
  const count = await Application.count({
    where: sequelize.where(
      sequelize.fn("YEAR", sequelize.col("created_at")),
      year,
    ),
    transaction,
  });

  // Sequential number (padded to 5 digits)
  const sequenceNumber = (count + 1).toString().padStart(5, "0");

  return `${prefix}${sequenceNumber}`;
}

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
