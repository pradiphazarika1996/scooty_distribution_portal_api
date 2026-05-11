export const REDIS_PREFIX = {
  SESSION: "session",
  OTP: "otp",
  CACHE: "cache",
  RATE_LIMIT: "rate",
};

export const OTP_REQUEST_LIMIT = 5;
export const OTP_VERIFY_LIMIT = 5;
export const OTP_WINDOW = 60 * 60;
export const OTP_TTL = 5 * 60;

export const OTP_TYPE = {
  LOGIN: "login",
  REGISTER: "verify_phone",
};

export const REDIS_TTL = {
  OTP_CODE: 300, // 5 minutes
  OTP_LIMIT: 3600, // 1 hour
  RATE_LIMIT: 60, // 1 minute
  USER_LIMIT: 3600,
  PROFILE_LIMIT: 3600,
};

export const API_NAME = {
  DISTRICTS: "districts",
  DOCUMENTS: "documents",
  EDUCATION_LEVELS: "education_levels",
  EMPLOYMENT_TYPES: "employment_types",
  ENROLLMENTS: "enrollments",
  EXAMS: "exams",
  INSTITUTE_CATEGORY_LEVELS: "institute_category_levels",
  INSTITUTE_CATEGORIES: "institute_categories",
  INSTITUTE_CATEGORY_TYPES: "institute_category_types",
  INSTITUTE_DEPARTMENTS: "institute_departments",
  LEVELUNITS: "level_units",
  LPSUBJECTS: "lp_subjects",
  MEDIUMS: "mediums",
  PERMISSSIONS: "permissions",
  STREAMS: " streams",
  STREAM_DEPARTMENTS: "stream_departments",
  SUBJECT_CATEGORIES: "subject_categories",
  SUBJECTS: "subjects",
  DESINATIONS: "designations",
  DEPARTMENTS: "departments",
  COURSES: "courses",
  CONSTITUENCIES: "constituencies",
  CLUSTERS: "clusters",
  BOARDS: "boards",
  BLOCKS: "blocks",
  MARQUEE: "marquee",
  ACTIVE_MARQUEE: "active_marquee",
  NEWS: "news",
  ACTIVE_NEWS: "active_news",
  AFFILIATIONS: "affiliations",
  ACADEMICYEARS: "academic_years",
  EMPLOYEE_ACCOUNT: "employee_account",
  INSTITUTE_ACCOUNT: "institute_account",
  EMPLOYEE_PROFILE: "employee_profile",
  INSTITUTE_PROFILE: "institute_profile",
  INSTITUTE_EMPLOYEES: "institute_employees",
};

export const RedisKey = {
  session: (sessionId: string) => `${REDIS_PREFIX.SESSION}:${sessionId}`,
  otpCode: (phone: string) => `${REDIS_PREFIX.OTP}:code:${phone}`,
  otpVerifyLimit: (phone: string) => `${REDIS_PREFIX.OTP}:verify:${phone}`,
  otpLimit: (phone: string) => `${REDIS_PREFIX.OTP}:limit:${phone}`,
  apiCache: (name: string) => `${REDIS_PREFIX.CACHE}:api:${name}`,
  rateLimit: (action: string, identifier: string) =>
    `${REDIS_PREFIX.RATE_LIMIT}:${action}:${identifier}`,
};
