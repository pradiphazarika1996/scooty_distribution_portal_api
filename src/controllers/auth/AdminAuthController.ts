import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import {
  ACCESS_TOKEN,
  ACCESS_TOKEN_COOKIE_VALIDITY,
} from "../../helpers/constants";
import { REDIS_TTL } from "../../helpers/redisKeys";
import { canRequestOtp, canVerifyOtp } from "../../helpers/redisUtils";
import { AccountStatus, UserType } from "../../helpers/status";
import jwt from "../../middleware/jwt";
import User from "../../models/User.model";
import { getRedis, setRedis } from "../../services/RedisService";
import { IUser } from "../../types/models";
import { sendOtpMessage, verifyOtpCode } from "./authService";

const signAuthToken = jwt.signAuthToken;
const verifyAuthToken = jwt.verifyAuthToken;
const signAccessToken = jwt.signAdminAccessToken;
const signRefreshToken = jwt.signAdminRefreshToken;

export const getUserAccountKey = (userId: number | string): string => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  return `user:${userId}:account`;
};

export default {
  getUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.payload.id;

      const cachedUser = await getRedis(getUserAccountKey(userId));
      if (cachedUser)
        return res.status(200).send({ status: true, data: cachedUser });

      const user = await User.findOne({
        attributes: ["id", "name", "phone", "status"],
        where: { id: userId },
      }).catch((err) => {
        console.error("getUser institution fetch error:", err);
        throw httpError.InternalServerError();
      });

      if (!user) throw httpError.NotFound();
      const userData = user.toJSON() as any;

      const data = {
        ...userData,
        role: UserType.ADMIN,
      };

      await setRedis(
        getUserAccountKey(userData.id),
        data,
        REDIS_TTL.USER_LIMIT,
      );

      res.status(200).send({
        status: true,
        data,
      });
    } catch (error: any) {
      console.error("getUser user error:", error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message,
      });
    }
  },
  registerSendOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as IUser;

      if (!payload.phone) throw httpError.BadRequest("Phone is required");

      const canRequest = await canRequestOtp(payload.phone);
      if (!canRequest)
        throw httpError.TooManyRequests("Maximum OTP sending attempts reached");

      const existing: any = await User.findOne({
        where: { phone: payload.phone },
      });

      if (existing)
        throw httpError.Forbidden("This number is already been registered");

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

      const userData: any = verifyAuthToken(token);
      if (!userData) throw httpError.Forbidden();

      const phone = userData.phone;
      await verifyOtpCode(phone, otp);
      const cachedUserData = await getRedis<IUser>(getUserAccountKey(phone));
      if (!cachedUserData) {
        throw httpError.BadRequest(
          "No registration data found for this phone number",
        );
      }

      const user: any = await User.create({
        phone: cachedUserData.phone,
        name: cachedUserData.name,
        status: AccountStatus.ACTIVE,
        is_active: true,
      }).catch((error) => {
        if (error.name === "SequelizeUniqueConstraintError") {
          const field = error.errors?.[0]?.path ?? "field";
          const fieldName = field.replace("users_", "");
          throw httpError.Conflict(`This ${fieldName} is already registered`);
        }
        throw httpError.InternalServerError(error);
      });

      const accessToken = await signAccessToken(user.id);

      // res.cookie("access_token", accessToken, {
      //   httpOnly: true,
      //   secure: true,
      //   domain: ".macasp.org",
      //   sameSite: "none",
      //   maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
      // });

      res.status(200).send({
        status: true,
        data: {
          name: user.name,
          phone: user.phone,
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

      const existing: any = await User.findOne({
        where: { phone: phone },
      });

      if (!existing || existing.status !== AccountStatus.ACTIVE)
        throw httpError.Unauthorized();

      const verification: any = await sendOtpMessage(
        phone,
        otpChannelId,
        UserType.ADMIN,
      );
      if (!verification) throw httpError.InternalServerError();

      const token = await signAuthToken({
        phone,
        otp_id: verification.id,
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

      const canAttempt = await canVerifyOtp(phone);
      if (!canAttempt)
        throw httpError.TooManyRequests(
          "Maximum OTP verification attempts reached",
        );

      await verifyOtpCode(phone, otp);

      const user: any = await User.findByPk(user_id).catch((error) => {
        throw httpError.InternalServerError();
      });
      if (!user) throw httpError.NotFound("User not found");

      const accessToken = await signAccessToken(user.id);
      const refreshToken = await signRefreshToken(user.id);
      // res.cookie("access_token", accessToken, {
      //   httpOnly: true,
      //   secure: true,
      //   domain: ".macasp.org",
      //   sameSite: "none",
      //   maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
      // });

      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
      });

      res.status(200).send({
        status: true,
        data: {
          name: user.name,
          phone: user.phone,
          role: UserType.ADMIN,
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
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // res.clearCookie(ACCESS_TOKEN, { domain: ".macasp.org" });
      res.clearCookie(ACCESS_TOKEN);
      res.status(200).send({ status: true });
    } catch (err) {
      next(err);
    }
  },
};
