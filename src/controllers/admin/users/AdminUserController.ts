import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { UserType } from "../../../helpers/status";
import User from "../../../models/User.model";

export default {
  updateUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const [updatedRows] = await User.update(req.body, {
        where: { id: userId },
      }).catch((err) => {
        throw httpError.InternalServerError();
      });
      if (!updatedRows) throw httpError.InternalServerError();

      res.status(200).send({ status: true });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },

  deleteUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const data = await User.destroy({
        where: { id: userId },
      }).catch((err) => {
        throw httpError.InternalServerError();
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({ status: true });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },

  getUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.payload.id;
      const user = await User.findOne({
        attributes: [],
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

  getUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { is_active } = req.query;

      const whereClause: any = {};

      if (is_active === "true") {
        whereClause.is_active = true;
      } else if (is_active === "false") {
        whereClause.is_active = false;
      }

      const exams = await User.findAll({
        where: whereClause,
        order: [["id", "DESC"]],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });

      res.status(200).send({ status: true, data: exams });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
  addUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await User.create({...req.body, role:UserType.ADMIN}).catch((err) => {
        throw httpError.InternalServerError(err);
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({
        status: true,
      });
    } catch (err: any) {
      console.log("add user error ", err);
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },
};
