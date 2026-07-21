export const REDIS_PREFIX = {
  SESSION: "session",
  OTP: "otp",
  CACHE: "cache",
  RATE_LIMIT: "rate",
};

export const OTP_REQUEST_LIMIT = 20;
export const OTP_VERIFY_LIMIT = 20;
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
  DOCUMENTS: "documents",
  DISTRICTS: "districts",
  CONSTITUENCIES: "constituencies",
  PANCHAYATS: "panchayats",
  VILLAGES: "villages",
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
