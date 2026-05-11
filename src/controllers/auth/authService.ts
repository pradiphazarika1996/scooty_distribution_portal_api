import httpError from "http-errors";
import { generateOtp } from "../../helpers/constants";
import { ChannelType } from "../../helpers/status";
import { sendWhatsappOtp } from "../../services/whatsappService";
// import { getRedis, setRedis } from "../../services/RedisService";
import { RedisKey } from "../../helpers/redisKeys";
import { canVerifyOtp, resetOtpVerifyLimit } from "../../helpers/redisUtils";
import { getAwsRedis, setAwsRedis } from "../../services/AwsRedisService";
import { sendSmsOtp } from "../../services/smsService";

// export const sendOtpMessage = async (phone_number: string, channel_type: number, user_type: number) => {
//   try {
//     const otp_code = generateOtp();
//     const expiresAt = moment().add(5, 'minutes').toDate();
//     const data = await OtpVerification.create({
//       user_type,
//       channel_type,
//       phone_number,
//       otp_code,
//       expires_at: expiresAt,
//     }).catch((err) => {
//       throw httpError.InternalServerError(err);
//     });
//     if (channel_type === ChannelType.WHATSAPP) {
//       await sendWhatsappOtp(phone_number, otp_code);
//     }
//     return data;
//   } catch (error) {
//     console.log('sendOtpMessage', error);
//     return null;
//   }
// };

export const sendOtpMessage = async (
  phone_number: string,
  channel_type: number,
  user_type: number,
) => {
  try {
    const otp_code = generateOtp();
    const expiresInSeconds = 5 * 60;

    const otpData = {
      otp_code,
      channel_type,
      user_type,
      created_at: new Date().toISOString(),
    };
    const key = RedisKey.otpCode(phone_number);
    await setAwsRedis(key, otpData, expiresInSeconds);

    if (channel_type == ChannelType.WHATSAPP) {
      await sendWhatsappOtp(phone_number, otp_code);
    } else if (channel_type == ChannelType.SMS) {
      await sendSmsOtp({ phone: phone_number, otp: otp_code });
    }

    return otpData;
  } catch (error) {
    console.log("sendOtpMessage", error);
    return null;
  }
};

// export const verifyOtpCode = async (verificationId: number, otp: string) => {
//   let verification: any;

//   try {
//     verification = await OtpVerification.findByPk(verificationId);
//   } catch (error) {
//     throw httpError.InternalServerError('OTP lookup failed');
//   }

//   if (!verification) {
//     throw httpError.Unauthorized('Invalid or expired OTP');
//   }

//   if (verification.otp_code !== otp) {
//     throw httpError.Unauthorized('Incorrect OTP');
//   }

//   return verification;
// };

export const verifyOtpCode = async (phone_number: string, otp: string) => {
  const canAttempt = await canVerifyOtp(phone_number);
  if (!canAttempt)
    throw httpError.TooManyRequests(
      "Maximum OTP verification attempts reached",
    );

  const otpCodekey = RedisKey.otpCode(phone_number);
  const otpData: any = await getAwsRedis(otpCodekey);
  if (!otpData) {
    console.log("OTP data not found for phone:", phone_number);
    throw httpError.Unauthorized("Invalid or expired OTP");
  }

  if (otpData.otp_code != otp) {
    throw httpError.Unauthorized("Incorrect OTP");
  }

  await resetOtpVerifyLimit(phone_number);

  return otpData;
};
