import crypto from "crypto";
import moment from "moment";
const DATE_FORMAT: Readonly<string> = "DD/MM/YYYY";
const DATE_TIME_FORMAT: Readonly<string> = "DD/MM/YYYY HH:mm";
const ISO_DATE_FORMAT: Readonly<string> = "YYYY-MM-DD";
const ISO_DATE_TIME_FORMAT: Readonly<string> = "YYYY-MM-DD HH:mm:ss";
export const getCurrentDateTime = () => moment().format(ISO_DATE_TIME_FORMAT);

export function generateOtp() {
  return crypto.randomInt(100000, 999999);
}

export function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
export const ACCESS_TOKEN_COOKIE_VALIDITY = 24 * 60 * 60 * 1000;

export { DATE_FORMAT, DATE_TIME_FORMAT, ISO_DATE_FORMAT, ISO_DATE_TIME_FORMAT };

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ADMIN_ACCESS_TOKEN = "admin_access_token";
export const STUDENT_ACCESS_TOKEN = "student_access_token";
