import { NextFunction, Request, Response } from 'express';
import httpError from 'http-errors';
import { Sequelize } from 'sequelize';
import { ACCESS_TOKEN_COOKIE_VALIDITY } from '../../helpers/constants';
import { canRequestOtp, canVerifyOtp } from '../../helpers/redisUtils';
import { AccountStatus, ChannelType, UserType } from '../../helpers/status';
import jwt from '../../middleware/jwt';
import { getRedis, setRedis } from '../../services/RedisService';
import { sendOtpMessage, verifyOtpCode } from './authService';

const signAuthToken = jwt.signAuthToken;
const verifyAuthToken = jwt.verifyAuthToken;
const signAccessToken = jwt.signAdminAccessToken;
const signRefreshToken = jwt.signAdminRefreshToken;

export const getAdminAccountKey = (employeeId: number | string): string => {
  if (!employeeId) {
    throw new Error('User ID is required');
  }
  return `user:${employeeId}:account`;
};

export default {
  getUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.payload.id;
      const cachedGetUser = await getRedis(getAdminAccountKey(employeeId));
      if (cachedGetUser) return res.status(200).send({ status: true, data: cachedGetUser });
      const employee: any = await Employee.findOne({
        where: { id: employeeId },
        attributes: ['id', 'name', 'phone_number', 'date_of_birth', 'email'],
        include: [
          {
            model: Institution,
            as: 'employee_institution',
            attributes: ['name'],
          },
          {
            model: Designation,
            attributes: ['name'],
          },
        ],
      }).catch((error) => {
        console.log('getUser Employee error:', error);
        throw httpError.InternalServerError(error);
      });
      if (!employee) throw httpError.NotFound();
      const data = {
        name: employee.name,
        phone: employee.phone_number,
        role: UserType.EMPLOYEE,
        date_of_birth: employee.date_of_birth,
        email: employee.email,
        is_phone_verified: employee.is_phone_verified,
        account_status: employee.account_status,
      };
      await setRedis(getAdminAccountKey(employeeId), data);
      res.status(200).send({ status: true, data });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },
  loginSendOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, otpChannelId } = req.body;
      console.log('Login OTP request for phone:', phone);
      if (!phone) throw httpError.BadRequest('Phone is required');

      const canRequest = await canRequestOtp(phone);
      if (!canRequest) throw httpError.TooManyRequests('Maximum OTP sending attempts reached');

      const existing: any = await Employee.findOne({
        where: { phone_number: phone },
      });

      if (!existing || !existing.is_phone_verified || existing.account_status !== AccountStatus.ACTIVE) throw httpError.Unauthorized();
      const verification: any = await sendOtpMessage(phone, otpChannelId, UserType.EMPLOYEE);
      if (!verification) throw httpError.InternalServerError();
      const token = await signAuthToken({
        phone,
        otp_id: verification.id,
        emp_id: existing.id,
      });
      res.status(200).send({ status: true, data: { token } });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false, message: err.message });
    }
  },
  loginVerifyOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, otp } = req.body;
      if (!token || !otp) throw httpError.BadRequest();
      const userData: any = verifyAuthToken(token);
      if (!userData) throw httpError.Forbidden();
      const employee_id = userData.emp_id;
      const phone = userData.phone;

      const canAttempt = await canVerifyOtp(phone);
      if (!canAttempt) throw httpError.TooManyRequests('Maximum OTP verification attempts reached');

      await verifyOtpCode(phone, otp);
      const employee: any = await Employee.findByPk(employee_id).catch((error) => {
        throw httpError.InternalServerError();
      });

      const accessToken = await signAccessToken(employee.id);
      // const refreshToken = await signRefreshToken(employee.id);
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '',
        maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
      });

      // Development
      // res.cookie("access_token", accessToken, {
      //   httpOnly: true,
      //   secure: false,
      //   sameSite: "lax",
      //   maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
      // });

      res.status(200).send({
        status: true,
        data: {
          name: employee.name,
          phone: employee.phone_number,
          role: UserType.ADMIN,
        },
      });
    } catch (error: any) {
      res.status(error.status || 500).send({
        status: false,
        message: error.message ?? 'Something went wrong',
      });
    }
  },
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie('access_token', { domain: '' }).status(200).send({ status: true });
    } catch (err) {
      res.status(500).send({ status: false });
    }
  },
};
