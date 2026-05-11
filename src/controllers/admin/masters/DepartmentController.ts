import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { Sequelize } from "sequelize";
import Department from "../../../models/masters/Department.model";
import Stream from "../../../models/masters/Stream.model";

export default {
  addDepartment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await Department.create(req.body).catch((err) => {
        console.log("data dept added", err);
        throw httpError.InternalServerError();
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({
        status: true,
      });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },

  updateDepartment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = req.params.id;
      const [updatedRows] = await Department.update(req.body, {
        where: { id: departmentId },
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

  deleteDepartment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = req.params.id;
      const data = await Department.destroy({
        where: { id: departmentId },
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

  getDepartment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = req.params.id;
      let data = await Department.findOne({
        where: { id: departmentId },
        // attributes: ["id", "name"],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });
      res.status(200).send({ status: true, data });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },

  getDepartments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stream_id } = req.query;

      const departments = await Department.findAll({
        attributes: [
          "id",
          "name",
          "stream_id",
          "is_active",
          [Sequelize.literal("Stream.name"), "stream_name"],
        ],
        include: [
          {
            model: Stream,
            attributes: [],
            as: "stream",
          },
        ],

        where: stream_id ? { stream_id } : {},
        order: [["id", "DESC"]],
      }).catch((err) => {
        console.log("err", err);
        throw httpError.InternalServerError(err);
      });

      res.status(200).send({ status: true, data: departments });
    } catch (err: any) {
      console.log("err:", err);
      res.status(err.status || 500).send({ status: false });
    }
  },
};
