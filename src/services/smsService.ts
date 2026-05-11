import axios from "axios";

interface SendSmsOtpParams {
  phone: string;
  otp: number | string;
}

export const sendSmsOtp = async ({ phone, otp }: SendSmsOtpParams) => {
  try {
    const url = "https://api.authkey.io/request";

    console.log("SMS_AUTH_KEY loaded:", process.env.SMS_AUTH_KEY);

    const response = await axios.get(url, {
      params: {
        authkey: process.env.SMS_AUTH_KEY,
        country_code: "91",
        mobile: phone,
        sid: "14376",
        otp: String(otp),
        appName: "PMS",
      },
      timeout: 10000,
    });

    console.log("SMS OTP response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      "Error sending SMS OTP:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
