// // import { NextFunction, Request, Response } from 'express';
// // import httpError from 'http-errors';
// // import { Sequelize } from 'sequelize';
// // import { ACCESS_TOKEN_COOKIE_VALIDITY } from '../../helpers/constants';
// // import { canRequestOtp, canVerifyOtp } from '../../helpers/redisUtils';
// // import { AccountStatus, ChannelType, UserType } from '../../helpers/status';
// // import jwt from '../../middleware/jwt';
// // import { getRedis, setRedis } from '../../services/RedisService';
// // import { sendOtpMessage, verifyOtpCode } from './authService';
// // import User from '../../models/User.model';

// // const signAuthToken = jwt.signAuthToken;
// // const verifyAuthToken = jwt.verifyAuthToken;
// // const signAccessToken = jwt.signAdminAccessToken;
// // const signRefreshToken = jwt.signAdminRefreshToken;

// // export const getAdminAccountKey = (employeeId: number | string): string => {
// //   if (!employeeId) {
// //     throw new Error('User ID is required');
// //   }
// //   return `user:${employeeId}:account`;
// // };

// // export default {
// //   getUser: async (req: Request, res: Response, next: NextFunction) => {
// //     try {
// //       const employeeId = req.payload.id;
// //       const cachedGetUser = await getRedis(getAdminAccountKey(employeeId));
// //       if (cachedGetUser) return res.status(200).send({ status: true, data: cachedGetUser });
// //       const employee: any = await User.findOne({
// //         where: { id: employeeId },
// //         attributes: ['id', 'name', 'phone_number', 'date_of_birth', 'email'],
// //         include: [
// //           {
// //             model: Institution,
// //             as: 'employee_institution',
// //             attributes: ['name'],
// //           },
// //           {
// //             model: Designation,
// //             attributes: ['name'],
// //           },
// //         ],
// //       }).catch((error) => {
// //         console.log('getUser Employee error:', error);
// //         throw httpError.InternalServerError(error);
// //       });
// //       if (!employee) throw httpError.NotFound();
// //       const data = {
// //         name: employee.name,
// //         phone: employee.phone_number,
// //         role: UserType.EMPLOYEE,
// //         date_of_birth: employee.date_of_birth,
// //         email: employee.email,
// //         is_phone_verified: employee.is_phone_verified,
// //         account_status: employee.account_status,
// //       };
// //       await setRedis(getAdminAccountKey(employeeId), data);
// //       res.status(200).send({ status: true, data });
// //     } catch (err: any) {
// //       res.status(err.status || 500).send({
// //         status: false,
// //         message: err.message,
// //       });
// //     }
// //   },
// //   loginSendOtp: async (req: Request, res: Response, next: NextFunction) => {
// //     try {
// //       const { phone, otpChannelId } = req.body;
// //       console.log('Login OTP request for phone:', phone);
// //       if (!phone) throw httpError.BadRequest('Phone is required');

// //       const canRequest = await canRequestOtp(phone);
// //       if (!canRequest) throw httpError.TooManyRequests('Maximum OTP sending attempts reached');

// //       const existing: any = await Employee.findOne({
// //         where: { phone_number: phone },
// //       });

// //       if (!existing || !existing.is_phone_verified || existing.account_status !== AccountStatus.ACTIVE) throw httpError.Unauthorized();
// //       const verification: any = await sendOtpMessage(phone, otpChannelId, UserType.EMPLOYEE);
// //       if (!verification) throw httpError.InternalServerError();
// //       const token = await signAuthToken({
// //         phone,
// //         otp_id: verification.id,
// //         emp_id: existing.id,
// //       });
// //       res.status(200).send({ status: true, data: { token } });
// //     } catch (err: any) {
// //       res.status(err.status || 500).send({ status: false, message: err.message });
// //     }
// //   },
// //   loginVerifyOtp: async (req: Request, res: Response, next: NextFunction) => {
// //     try {
// //       const { token, otp } = req.body;
// //       if (!token || !otp) throw httpError.BadRequest();
// //       const userData: any = verifyAuthToken(token);
// //       if (!userData) throw httpError.Forbidden();
// //       const employee_id = userData.emp_id;
// //       const phone = userData.phone;

// //       const canAttempt = await canVerifyOtp(phone);
// //       if (!canAttempt) throw httpError.TooManyRequests('Maximum OTP verification attempts reached');

// //       await verifyOtpCode(phone, otp);
// //       const employee: any = await Employee.findByPk(employee_id).catch((error) => {
// //         throw httpError.InternalServerError();
// //       });

// //       const accessToken = await signAccessToken(employee.id);
// //       // const refreshToken = await signRefreshToken(employee.id);
// //       res.cookie('access_token', accessToken, {
// //         httpOnly: true,
// //         secure: true,
// //         sameSite: 'none',
// //         domain: '',
// //         maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
// //       });

// //       // Development
// //       // res.cookie("access_token", accessToken, {
// //       //   httpOnly: true,
// //       //   secure: false,
// //       //   sameSite: "lax",
// //       //   maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
// //       // });

// //       res.status(200).send({
// //         status: true,
// //         data: {
// //           name: employee.name,
// //           phone: employee.phone_number,
// //           role: UserType.ADMIN,
// //         },
// //       });
// //     } catch (error: any) {
// //       res.status(error.status || 500).send({
// //         status: false,
// //         message: error.message ?? 'Something went wrong',
// //       });
// //     }
// //   },
// //   logout: async (req: Request, res: Response, next: NextFunction) => {
// //     try {
// //       res.clearCookie('access_token', { domain: '' }).status(200).send({ status: true });
// //     } catch (err) {
// //       res.status(500).send({ status: false });
// //     }
// //   },
// // };

// import { NextFunction, Request, Response } from "express";
// import httpError from "http-errors";
// import { ACCESS_TOKEN_COOKIE_VALIDITY } from "../../helpers/constants";
// import { canRequestOtp } from "../../../helpers/redisUtils";
// import { AccountStatus, UserType } from "../../../helpers/status";
// import jwt from "../../../middleware/jwt";
// import { default as Institution } from "../../../models/Institution/Institution.model";
// import User from "../../../models/User.model";
// import { IUser } from "../../../types/models";
// import { sendOtpMessage, verifyOtpCode } from "./authService";

// const signAuthToken = jwt.signAuthToken;
// const verifyAuthToken = jwt.verifyAuthToken;
// const signAccessToken = jwt.signUserAccessToken;
// const signRefreshToken = jwt.signSchoolRefreshToken;

// export const getUserAccountKey = (userId: number | string): string => {
//   if (!userId) {
//     throw new Error("User ID is required");
//   }
//   return `user:${userId}:account`;
// };

// export default {
//   getUser: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const userId = req.payload.id;
//       const user = await User.findOne({
//         attributes: ["id", "name", "phone", "status"],
//         where: { id: userId },
//       }).catch((err) => {
//         console.error("getUser institution fetch error:", err);
//         throw httpError.InternalServerError();
//       });

//       if (!user) throw httpError.NotFound();
//       const userData = user.toJSON() as any;

//       const data = {
//         ...userData,
//         role: UserType.ADMIN,
//       };
//       res.status(200).send({
//         status: true,
//         data,
//       });
//     } catch (error: any) {
//       console.error("getUser user error:", error);
//       res.status(error.status || 500).send({
//         status: false,
//         message: error.message,
//       });
//     }
//   },
//   registerUser: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const payload = req.body as IUser;

//       if (!payload.phone) throw httpError.BadRequest("Phone is required");

//       // const canRequest = await canRequestOtp(payload.phone);
//       // if (!canRequest)
//       //   throw httpError.TooManyRequests("Maximum OTP sending attempts reached");

//       const existing: any = await User.findOne({
//         where: { phone: payload.phone },
//       });

//       if (existing)
//         throw httpError.Forbidden("This number is already been registered");

//       // const verification: any = await sendOtpMessage(
//       //   payload.phone_number,
//       //   payload.otpChannelId as number,
//       //   UserType.INSTITUTION,
//       // );

//       // if (!verification) throw httpError.InternalServerError();
//       // const token = await signAuthToken({
//       //   ...payload,
//       //   // otp_id: verification.id,
//       // });

//       const user: any = await User.create({
//         phone: payload.phone,
//         name: payload.name,
//         status: AccountStatus.ACTIVE,
//         is_active: true,
//         // is_phone_verified: true,
//       }).catch((error) => {
//         throw httpError.InternalServerError(error);
//       });

//       res.status(200).send({ status: true, data: { user } });
//     } catch (error: any) {
//       console.log("error", error);
//       res.status(error.status || 500).send({
//         status: false,
//         message: error.message ?? "Something went wrong",
//       });
//     }
//   },
//   registerVerifyOtp: async (
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ) => {
//     try {
//       const { token, otp } = req.body;
//       if (!token || !otp) throw httpError.BadRequest();

//       const instituteData: any = verifyAuthToken(token);
//       if (!instituteData) throw httpError.Forbidden();

//       const phone = instituteData.phone_number;
//       await verifyOtpCode(phone, otp);

//       const institute: any = await Institution.create({
//         ...instituteData,
//         account_status: AccountStatus.ACTIVE,
//         is_phone_verified: true,
//       }).catch((error) => {
//         if (error.name === "SequelizeUniqueConstraintError") {
//           const field = error.errors?.[0]?.path ?? "field";
//           const fieldName = field.replace("institutions_", "");
//           throw httpError.Conflict(`This ${fieldName} is already registered`);
//         }
//         throw httpError.InternalServerError(error);
//       });

//       const accessToken = await signAccessToken(institute.id);

//       res.cookie("access_token", accessToken, {
//         httpOnly: true,
//         secure: true,
//         domain: ".pmsportal.org",
//         sameSite: "none",
//         maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
//       });

//       res.status(200).send({
//         status: true,
//         data: {
//           name: institute.name,
//           phone: institute.phone_number,
//           role: UserType.INSTITUTION,
//         },
//       });
//     } catch (error: any) {
//       const status = error.status ?? 500;
//       const message = error.message ?? "Something went wrong";
//       res.status(status).send({ status: false, message });
//     }
//   },
//   loginSendOtp: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { phone, otpChannelId } = req.body;

//       if (!phone) throw httpError.BadRequest("Phone number is required");
//       const canRequest = await canRequestOtp(phone);
//       if (!canRequest)
//         throw httpError.TooManyRequests("Maximum OTP sending attempts reached");

//       const existing: any = await User.findOne({
//         where: { phone: phone },
//       });

//       if (!existing || existing.status !== AccountStatus.ACTIVE)
//         throw httpError.Unauthorized();

//       const verification: any = await sendOtpMessage(
//         phone,
//         otpChannelId,
//         UserType.ADMIN,
//       );
//       if (!verification) throw httpError.InternalServerError();

//       const token = await signAuthToken({
//         phone,
//         otp_id: verification.id,
//         user_id: existing.id,
//       });

//       res.status(200).send({ status: true, data: { token } });
//     } catch (error: any) {
//       console.error("loginSendOtp", error);
//       res.status(error.status || 500).send({
//         status: false,
//         message: error.message ?? "Something went wrong",
//       });
//     }
//   },
//   loginVerifyOtp: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { token, otp } = req.body;
//       if (!token || !otp) throw httpError.BadRequest();
//       const userData: any = verifyAuthToken(token);
//       if (!userData) throw httpError.Forbidden();
//       const phone = userData.phone;
//       const user_id = userData.user_id;

//       await verifyOtpCode(phone, otp);

//       const user: any = await User.findByPk(user_id).catch((error) => {
//         throw httpError.InternalServerError();
//       });

//       const accessToken = await signAccessToken(user.id);
//       // const refreshToken = await signRefreshToken(institute.id);
//       // res.cookie("access_token", accessToken, {
//       //   httpOnly: true,
//       //   secure: true,
//       //   domain: ".pmsportal.org",
//       //   sameSite: "none",
//       //   maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
//       // });

//       res.cookie("access_token", accessToken, {
//         httpOnly: true,
//         secure: false,
//         sameSite: "lax",
//         maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
//       });

//       res.status(200).send({
//         status: true,
//         data: {
//           name: user.name,
//           phone: user.phone,
//           role: UserType.ADMIN,
//         },
//       });
//     } catch (error: any) {
//       console.error("loginVerifyOtp", error);
//       res.status(error.status || 500).send({
//         status: false,
//         message: error.message ?? "Something went wrong",
//       });
//     }
//   },
//   logout: async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       res.clearCookie("token");
//       res.clearCookie("access_token", { domain: ".pmsportal.org" });
//       // res.clearCookie("access_token");
//       res.status(200).send({ status: true });
//     } catch (err) {
//       next(err);
//     }
//   },
// };

import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { ACCESS_TOKEN_COOKIE_VALIDITY } from "../../helpers/constants";
import { canRequestOtp } from "../../helpers/redisUtils";
import { AccountStatus, UserType } from "../../helpers/status";
import jwt from "../../middleware/jwt";
// import { default as Institution } from "../../../models/Institution/Institution.model";
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
  registerUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as IUser;

      if (!payload.phone) throw httpError.BadRequest("Phone is required");

      // const canRequest = await canRequestOtp(payload.phone);
      // if (!canRequest)
      //   throw httpError.TooManyRequests("Maximum OTP sending attempts reached");

      const existing: any = await User.findOne({
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
      const institute: any = await User.create({
        phone: draftUserData.phone,
        name: draftUserData.name,
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

      const accessToken = await signAccessToken(institute.id);

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
          name: institute.name,
          phone: institute.phone,
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

      const user: any = await User.findByPk(user_id).catch((error) => {
        throw httpError.InternalServerError();
      });
      if (!user) throw httpError.NotFound("User not found");

      const accessToken = await signAccessToken(user.id);
      const refreshToken = await signRefreshToken(user.id);
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
