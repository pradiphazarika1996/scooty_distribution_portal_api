import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { ACCESS_TOKEN_COOKIE_VALIDITY } from "../../helpers/constants";
import { AccountStatus, UserType } from "../../helpers/status";
import jwt from "../../middleware/jwt";
import Student from "../../models/student/Student.model";
import { IStudent } from "../../types/models";
import { sendOtpMessage, verifyOtpCode } from "./authService";

const signAuthToken = jwt.signAuthToken;
const verifyAuthToken = jwt.verifyAuthToken;
const signAccessToken = jwt.signStudentAccessToken;
const signRefreshToken = jwt.signStudentRefreshToken;

export const getStudentAccountKey = (studentId: number | string): string => {
  if (!studentId) {
    throw new Error("Student ID is required");
  }
  return `student:${studentId}:account`;
};

export default {
  getStudent: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.payload.id;
      // const cachedGetStudent = await getRedis(getStudentAccountKey(studentId));
      // if (cachedGetStudent)
      //   return res.status(200).send({ status: true, data: cachedGetStudent });

      const student = await Student.findOne({
        attributes: ["id", "name", "phone", "role_id", "is_active"],
        where: { id: studentId },
      }).catch((err) => {
        console.error("getStudent fetch error:", err);
        throw httpError.InternalServerError();
      });

      if (!student) throw httpError.NotFound();
      const studentData = student.toJSON() as any;

      const data = {
        ...studentData,
        role: UserType.STUDENT,
      };
      // await setRedis(
      //   getStudentAccountKey(studentData.id),
      //   data,
      //   REDIS_TTL.USER_LIMIT,
      // );
      res.status(200).send({
        status: true,
        data,
      });
    } catch (error: any) {
      console.error("getStudent error:", error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message,
      });
    }
  },
  registerSendOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as IStudent;

      if (!payload.phone) throw httpError.BadRequest("Phone is required");

      // const canRequest = await canRequestOtp(payload.phone);
      // if (!canRequest)
      //   throw httpError.TooManyRequests("Maximum OTP sending attempts reached");

      const existing: any = await Student.findOne({
        where: { phone: payload.phone },
      });

      if (existing)
        throw httpError.Forbidden("This number is already been registered");

      // await setRedis(getStudentAccountKey(payload.phone), payload, 3600);

      const verification: any = await sendOtpMessage(
        payload.phone,
        payload.otpChannelId as number,
        UserType.STUDENT,
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

      const studentData: any = verifyAuthToken(token);
      if (!studentData) throw httpError.Forbidden();

      const phone = studentData.phone;
      await verifyOtpCode(phone, otp);
      // const draftUserData = await getRedis<IUser>(getStudentAccountKey(phone));
      // if (!draftUserData) {
      //   throw httpError.BadRequest(
      //     "No registration data found for this phone number",
      //   );
      // }
      const student: any = await Student.create({
        ...studentData,
        role_id: UserType.STUDENT,
        account_status: AccountStatus.ACTIVE,
        is_phone_verified: true,
      }).catch((error) => {
        if (error.name === "SequelizeUniqueConstraintError") {
          throw httpError.Conflict("This phone number is already registered");
        }
        throw httpError.InternalServerError(error);
      });

      const accessToken = await signAccessToken(student.id);

      // res.cookie("access_token", accessToken, {
      //   httpOnly: true,
      //   secure: true,
      //   domain: ".pmsportal.org",
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
          phone: student.phone,
          role: UserType.ADMIN,
        },
      });
    } catch (error: any) {
      console.error("registerVerifyOtp", error);
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
      // const canRequest = await canRequestOtp(phone);
      // if (!canRequest)
      //   throw httpError.TooManyRequests("Maximum OTP sending attempts reached");

      const existing: any = await Student.findOne({
        where: { phone: phone },
      });
      console.log("Existing user for login:", existing);

      if (!existing || existing.account_status !== AccountStatus.ACTIVE)
        throw httpError.Unauthorized();

      const verification: any = await sendOtpMessage(
        phone,
        otpChannelId,
        UserType.STUDENT,
      );
      if (!verification) throw httpError.InternalServerError();

      const token = await signAuthToken({
        phone,
        otp_id: verification.id,
        student_id: existing.id,
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

      const studentData: any = verifyAuthToken(token);

      if (!studentData) throw httpError.Forbidden();

      const phone = studentData.phone;
      const student_id = studentData.student_id;
      await verifyOtpCode(phone, otp);

      const student: any = await Student.findByPk(student_id).catch((error) => {
        console.log("Error fetching student by ID:", error);
        throw httpError.InternalServerError(error);
      });
      console.log(student);

      const accessToken = await signAccessToken(student.id);
      // const refreshToken = await signRefreshToken(student.id);
      // res.cookie("access_token", accessToken, {
      //   httpOnly: true,
      //   secure: true,
      //   domain: ".pmsportal.org",
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
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // res.clearCookie("access_token", { domain: ".pmsportal.org" });
      res.clearCookie("access_token");
      res.status(200).send({ status: true });
    } catch (err) {
      next(err);
    }
  },
};
