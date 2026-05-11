import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
declare module "express-serve-static-core" {
    interface Request {
        payload?: JwtPayload | any;
    }
}

declare namespace Express {
    export interface Request {
        payload?: any;
    }
}