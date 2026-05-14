import { awsRedisClient } from "../services/AwsRedisService";
import {
  OTP_REQUEST_LIMIT,
  OTP_TTL,
  OTP_VERIFY_LIMIT,
  OTP_WINDOW,
  RedisKey,
} from "./redisKeys";

export async function canRequestOtp(phone: string): Promise<boolean> {
  const key = RedisKey.otpLimit(phone);
  try {
    const currentCount = await awsRedisClient.incr(key);
    if (currentCount === 1) {
      await awsRedisClient.expire(key, OTP_WINDOW);
    }
    return currentCount <= OTP_REQUEST_LIMIT;
  } catch (err) {
    console.error("canRequestOtp error", err);
    return true;
  }
}

export async function resetOtpLimit(phone: string) {
  const key = RedisKey.otpLimit(phone);
  try {
    await awsRedisClient.del(key);
  } catch (err) {
    console.error("resetOtpLimit error", err);
  }
}

export async function canVerifyOtp(phone: string): Promise<boolean> {
  const key = RedisKey.otpVerifyLimit(phone);
  try {
    // const count = await awsRedisClient.incr(key);
    // if (count === 1) {
    //   await awsRedisClient.expire(key, OTP_WINDOW);
    // }
    // if (count === 1) await awsRedisClient.expire(key, OTP_TTL);
    // return count <= OTP_VERIFY_LIMIT;
    const count = await awsRedisClient.incr(key);
    if (count === 1) {
      await awsRedisClient.expire(key, OTP_WINDOW);
    }
    return count <= OTP_VERIFY_LIMIT;
  } catch (err) {
    console.error("canVerifyOtp error", err);
    return true;
  }
}

export async function resetOtpVerifyLimit(phone: string) {
  await awsRedisClient.del(RedisKey.otpVerifyLimit(phone));
}

export async function resetOtpCode(phone: string) {
  const key = RedisKey.otpCode(phone);
  try {
    await awsRedisClient.del(key);
  } catch (err) {
    console.error("resetOtpLimit error", err);
  }
}
