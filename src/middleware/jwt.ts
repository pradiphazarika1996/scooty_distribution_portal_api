import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import JWT, { SignOptions } from 'jsonwebtoken';

export default {
  signStudentAccessToken: (id: string) => {
    return new Promise((resolve, reject) => {
      const payload = {
        id: id,
      };
      const ACCESS_TOKEN = process.env.STUDENT_ACCESS_TOKEN_SECRET!;
      const options: SignOptions = {
        expiresIn: '7d',
        issuer: '',
        audience: '',
      };
      JWT.sign(payload, ACCESS_TOKEN, options, (err, token) => {
        if (err) {
          reject(createHttpError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  signStudentRefreshToken: (id: string) => {
    return new Promise((resolve, reject) => {
      const payload = { id: id };
      const REFRESH_TOKEN = process.env.STUDENT_REFRESH_TOKEN_SECRET!;
      const options: SignOptions = {
        expiresIn: '7d',
        issuer: '',
        audience: '',
      };
      JWT.sign(payload, REFRESH_TOKEN, options, (err, token) => {
        if (err) {
          reject(createHttpError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  signAdminAccessToken: (id: string) => {
    return new Promise((resolve, reject) => {
      const payload = {
        id: id,
      };
      const ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN_SECRET!;
      const options: SignOptions = {
        expiresIn: '7d',
        issuer: '',
        audience: '',
      };
      JWT.sign(payload, ACCESS_TOKEN, options, (err, token) => {
        if (err) {
          reject(createHttpError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  signAdminRefreshToken: (id: number) => {
    return new Promise((resolve, reject) => {
      const payload = { id: id };
      const REFRESH_TOKEN = process.env.ADMIN_REFRESH_TOKEN_SECRET!;
      const options: SignOptions = {
        expiresIn: '7d',
        issuer: '',
        audience: '',
      };
      JWT.sign(payload, REFRESH_TOKEN, options, (err, token) => {
        if (err) {
          reject(createHttpError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  verifyStudentAccessToken: (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers['authorization']) {
      const authHeader = req.headers['authorization'];
      const bearerToken = authHeader.split(' ');
      token = bearerToken[1];
    } else if (req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    if (!token) {
      return next(createHttpError.Unauthorized());
    }
    const ACCESS_TOKEN = process.env.STUDENT_ACCESS_TOKEN_SECRET!;
    JWT.verify(token, ACCESS_TOKEN, (err: any, payload: any) => {
      if (err) {
        const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
        return next(createHttpError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },
  verifyAdminAccessToken: (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (req.headers['authorization']) {
      const authHeader = req.headers['authorization'];
      const bearerToken = authHeader.split(' ');
      token = bearerToken[1];
    } else if (req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    if (!token) {
      return next(createHttpError.Unauthorized());
    }
    const ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN_SECRET!;
    JWT.verify(token, ACCESS_TOKEN, (err: any, payload: any) => {
      if (err) {
        const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
        return next(createHttpError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },
  signAuthToken: (payload: any) => {
    return new Promise((resolve, reject) => {
      const AUTH_TOKEN = process.env.AUTH_TOKEN!;
      const options: SignOptions = {
        expiresIn: '5Minute',
        issuer: '',
        audience: '',
      };
      JWT.sign(payload, AUTH_TOKEN, options, (err, token) => {
        if (err) {
          reject(createHttpError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  verifyAuthToken: (token: string) => {
    const AUTH_TOKEN = process.env.AUTH_TOKEN!;
    try {
      const payload = JWT.verify(token, AUTH_TOKEN);
      return payload;
    } catch (error: any) {
      const message = error.name === 'JsonWebTokenError' ? 'Unauthorized' : error.message;
      console.log('verifyAuthToken error', message);
      return null;
    }
  },
};
