import { NextFunction, Request, Response } from 'express';
import httpError from 'http-errors';
import { ACCESS_TOKEN_COOKIE_VALIDITY } from '../../helpers/constants';
import { REDIS_TTL } from '../../helpers/redisKeys';
import { canRequestOtp } from '../../helpers/redisUtils';
import { AccountStatus, ChannelType, UserType } from '../../helpers/status';
import jwt from '../../middleware/jwt';
import { default as Institution } from '../../models/Institution/Institution.model';
import { getRedis, setRedis } from '../../services/RedisService';
import { IInstitution } from '../../types/models';
import { sendOtpMessage, verifyOtpCode } from './authService';

const signAuthToken = jwt.signAuthToken;
const verifyAuthToken = jwt.verifyAuthToken;
const signAccessToken = jwt.signSchoolAccessToken;
const signRefreshToken = jwt.signSchoolRefreshToken;

export const getInstituteAccountKey = (instituteId: number | string): string => {
  if (!instituteId) {
    throw new Error('Institute ID is required');
  }
  return `institute:${instituteId}:account`;
};

export default {
  getUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instituteId = req.payload.id;
      const cachedGetUser = await getRedis(getInstituteAccountKey(instituteId));
      if (cachedGetUser) return res.status(200).send({ status: true, data: cachedGetUser });
      const institution = await Institution.findOne({
        attributes: ['id', 'name', 'email', 'phone_number', 'profile_status', 'application_id'],
        where: { id: instituteId },
      }).catch((err) => {
        console.error('getUser institution fetch error:', err);
        throw httpError.InternalServerError();
      });

      if (!institution) throw httpError.NotFound();
      const institutionData = institution.toJSON() as any;

      const data = {
        ...institutionData,
        role: UserType.INSTITUTION,
      };
      await setRedis(getInstituteAccountKey(instituteId), data, REDIS_TTL.USER_LIMIT);
      res.status(200).send({
        status: true,
        data,
      });
    } catch (error: any) {
      console.error('getUser institute error:', error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message,
      });
    }
  },
  registerSendOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as IInstitution;

      if (!payload.phone_number) throw httpError.BadRequest('Phone is required');

      const canRequest = await canRequestOtp(payload.phone_number);
      if (!canRequest) throw httpError.TooManyRequests('Maximum OTP sending attempts reached');

      const existing: any = await Institution.findOne({
        where: { phone_number: payload.phone_number },
      });

      if (existing) throw httpError.Forbidden('This number is already been registered');

      const verification: any = await sendOtpMessage(payload.phone_number, payload.otpChannelId as number, UserType.INSTITUTION);

      if (!verification) throw httpError.InternalServerError();
      const token = await signAuthToken({
        ...payload,
        otp_id: verification.id,
      });

      res.status(200).send({ status: true, data: { token } });
    } catch (error: any) {
      console.log('error', error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message ?? 'Something went wrong',
      });
    }
  },
  registerVerifyOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, otp } = req.body;
      if (!token || !otp) throw httpError.BadRequest();

      const instituteData: any = verifyAuthToken(token);
      if (!instituteData) throw httpError.Forbidden();

      const phone = instituteData.phone_number;
      await verifyOtpCode(phone, otp);

      const institute: any = await Institution.create({
        ...instituteData,
        account_status: AccountStatus.ACTIVE,
        is_phone_verified: true,
      }).catch((error) => {
        if (error.name === 'SequelizeUniqueConstraintError') {
          const field = error.errors?.[0]?.path ?? 'field';
          const fieldName = field.replace('institutions_', '');
          throw httpError.Conflict(`This ${fieldName} is already registered`);
        }
        throw httpError.InternalServerError(error);
      });

      const accessToken = await signAccessToken(institute.id);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: true,
        domain: '.pmsportal.org',
        sameSite: 'none',
        maxAge: ACCESS_TOKEN_COOKIE_VALIDITY,
      });

      res.status(200).send({
        status: true,
        data: {
          name: institute.name,
          phone: institute.phone_number,
          role: UserType.INSTITUTION,
        },
      });
    } catch (error: any) {
      const status = error.status ?? 500;
      const message = error.message ?? 'Something went wrong';
      res.status(status).send({ status: false, message });
    }
  },
  loginSendOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, otpChannelId } = req.body;

      if (!phone) throw httpError.BadRequest('Phone number is required');
      const canRequest = await canRequestOtp(phone);
      if (!canRequest) throw httpError.TooManyRequests('Maximum OTP sending attempts reached');

      const existing: any = await Institution.findOne({
        where: { phone_number: phone },
      });

      if (!existing || !existing.is_phone_verified || existing.account_status !== AccountStatus.ACTIVE) throw httpError.Unauthorized();

      const verification: any = await sendOtpMessage(phone, otpChannelId, UserType.INSTITUTION);
      if (!verification) throw httpError.InternalServerError();

      const token = await signAuthToken({
        phone,
        otp_id: verification.id,
        inst_id: existing.id,
      });

      res.status(200).send({ status: true, data: { token } });
    } catch (error: any) {
      console.error('loginSendOtp', error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message ?? 'Something went wrong',
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
      const institute_id = userData.inst_id;

      await verifyOtpCode(phone, otp);

      const institute: any = await Institution.findByPk(institute_id).catch((error) => {
        throw httpError.InternalServerError();
      });

      const accessToken = await signAccessToken(institute.id);
      // const refreshToken = await signRefreshToken(institute.id);
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: true,
        domain: '',
        sameSite: 'none',
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
          name: institute.name,
          phone: institute.phone_number,
          role: UserType.INSTITUTION,
        },
      });
    } catch (error: any) {
      console.error('loginVerifyOtp', error);
      res.status(error.status || 500).send({
        status: false,
        message: error.message ?? 'Something went wrong',
      });
    }
  },
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie('token');
      res.clearCookie('access_token', { domain: '.pmsportal.org' });
      // res.clearCookie("access_token");
      res.status(200).send({ status: true });
    } catch (err) {
      next(err);
    }
  },
};
