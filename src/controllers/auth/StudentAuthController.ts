import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { ACCESS_TOKEN_COOKIE_VALIDITY } from "../../helpers/constants";
import { canRequestOtp } from "../../helpers/redisUtils";
import { AccountStatus, UserType } from "../../helpers/status";
import jwt from "../../middleware/jwt";
// import { default as Institution } from "../../../models/Institution/Institution.model";
import Student from "../../models/Student.model";
import { getRedis, setRedis } from "../../services/RedisService";
import { IUser } from "../../types/models";
import { sendOtpMessage, verifyOtpCode } from "./authService";

const signAuthToken = jwt.signAuthToken;
const verifyAuthToken = jwt.verifyAuthToken;
const signAccessToken = jwt.signStudentAccessToken;
const signRefreshToken = jwt.signStudentRefreshToken;

export const getUserAccountKey = (userId: number | string): string => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  return `user:${userId}:account`;
};

export const getDraftKey = (phone: string): string => {
  if (!phone) {
    throw new Error("Phone number is required");
  }
  return `user:${phone}:draft`;
};

export default {
  getUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.payload.id;
      const student = await Student.findOne({
        attributes: ["id", "name", "phone", "status"],
        where: { id: userId },
      }).catch((err) => {
        console.error("getUser student fetch error:", err);
        throw httpError.InternalServerError();
      });

      if (!student) throw httpError.NotFound();
      const userData = student.toJSON() as any;

      const data = {
        ...userData,
        role: UserType.STUDENT,
      };
      res.status(200).send({
        status: true,
        data,
      });
    } catch (error: any) {
      console.error("getUser student error:", error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message,
      });
    }
  },
  registerUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as IUser;

      if (!payload.phone) throw httpError.BadRequest("Phone is required");

      // const canRequest = await canRequestOtp(payload.phone);
      // if (!canRequest)
      //   throw httpError.TooManyRequests("Maximum OTP sending attempts reached");

      const existing: any = await Student.findOne({
        where: { phone: payload.phone },
      });

      if (existing)
        throw httpError.Forbidden("This number is already been registered");

      await setRedis(getDraftKey(payload.phone), payload, 3600);

      const verification: any = await sendOtpMessage(
        payload.phone,
        payload.otpChannelId as number,
        UserType.ADMIN,
      );

      if (!verification) throw httpError.InternalServerError();
      const token = await signAuthToken({
        phone: payload.phone,
      });
      res.status(200).send({ status: true, data: { token } });
    } catch (error: any) {
      console.log("error", error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message ?? "Something went wrong",
      });
    }
  },
  registerVerifyOtp: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token, otp } = req.body;
      if (!token || !otp) throw httpError.BadRequest();

      const instituteData: any = verifyAuthToken(token);
      console.log("Decoded token data:", instituteData);
      if (!instituteData) throw httpError.Forbidden();

      const phone = instituteData.phone;
      await verifyOtpCode(phone, otp);
      const draftUserData = await getRedis<IUser>(getDraftKey(phone));
      if (!draftUserData) {
        throw httpError.BadRequest(
          "No registration data found for this phone number",
        );
      }
      console.log("Draft user data from Redis:", draftUserData);
      const student: any = await Student.create({
        phone: instituteData.phone,
        is_active: true,
        status: 1,
      }).catch((error) => {
        if (error.name === "SequelizeUniqueConstraintError") {
          throw httpError.Conflict("This phone number is already registered");
        }
        throw httpError.InternalServerError(error);
      });
      // const institute: any = await Student.create({
      //   phone: draftUserData.phone,
      //   name: draftUserData.name,
      //   status: AccountStatus.ACTIVE,
      //   is_active: true,
      // }).catch((error) => {
      //   if (error.name === "SequelizeUniqueConstraintError") {
      //     const field = error.errors?.[0]?.path ?? "field";
      //     const fieldName = field.replace("students_", "");
      //     throw httpError.Conflict(`This ${fieldName} is already registered`);
      //   }
      //   throw httpError.InternalServerError(error);
      // });

      const accessToken = await signAccessToken(student.id);

      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: true,
        // domain: ".pmsportal.org",
        sameSite: "none",
        maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
      });

      res.status(200).send({
        status: true,
        data: {
          // name: institute.name,
          phone: student.phone,
          role: UserType.ADMIN,
        },
      });
    } catch (error: any) {
      const status = error.status ?? 500;
      const message = error.message ?? "Something went wrong";
      res.status(status).send({ status: false, message });
    }
  },
  loginSendOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, otpChannelId } = req.body;

      if (!phone) throw httpError.BadRequest("Phone number is required");
      if (!otpChannelId) throw httpError.BadRequest("OTP channel is required");
      const canRequest = await canRequestOtp(phone);
      if (!canRequest)
        throw httpError.TooManyRequests("Maximum OTP sending attempts reached");

      const existing: any = await Student.findOne({
        where: { phone: phone },
      });

      if (!existing || existing.status !== AccountStatus.ACTIVE)
        throw httpError.Unauthorized();

      const verification: any = await sendOtpMessage(
        phone,
        otpChannelId,
        UserType.STUDENT,
      );
      if (!verification) throw httpError.InternalServerError();

      const token = await signAuthToken({
        phone,
        user_id: existing.id,
      });

      res.status(200).send({ status: true, data: { token } });
    } catch (error: any) {
      console.error("loginSendOtp", error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message ?? "Something went wrong",
      });
    }
  },
  loginVerifyOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, otp } = req.body;
      if (!token || !otp) throw httpError.BadRequest();
      const userData: any = verifyAuthToken(token);
      if (!userData) throw httpError.Forbidden();
      const phone = userData.phone;
      const user_id = userData.user_id;

      await verifyOtpCode(phone, otp);

      const student: any = await Student.findByPk(user_id).catch((error) => {
        throw httpError.InternalServerError();
      });
      if (!student) throw httpError.NotFound("Student not found");

      const accessToken = await signAccessToken(student.id);
      const refreshToken = await signRefreshToken(student.id);
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: true,
        domain: ".pmsportal.org",
        sameSite: "none",
        maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
      });

      // res.cookie("access_token", accessToken, {
      //   httpOnly: true,
      //   secure: false,
      //   sameSite: "lax",
      //   maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
      // });

      res.status(200).send({
        status: true,
        data: {
          name: student.name,
          phone: student.phone,
          role: UserType.STUDENT,
        },
      });
    } catch (error: any) {
      console.error("loginVerifyOtp", error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message ?? "Something went wrong",
      });
    }
  },
  // logout: async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     res.clearCookie("token");
  //     res.clearCookie("access_token", { domain: ".pmsportal.org" });
  //     // res.clearCookie("access_token");
  //     res.status(200).send({ status: true });
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Match exactly how the cookie was set
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });
      res.status(200).send({ status: true });
    } catch (err) {
      next(err);
    }
  },
};
