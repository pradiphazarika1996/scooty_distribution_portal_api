import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { Sequelize } from "sequelize";
import Course from "../../../models/masters/Course.model";
import InstitutionCategory from "../../../models/masters/InstitutionCategory.model";

export default {
  addCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await Course.create(req.body).catch((err) => {
        console.log("add course error", err);
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

  updateCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const [updatedRows] = await Course.update(req.body, {
        where: { id: courseId },
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

  deleteCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const data = await Course.destroy({
        where: { id: courseId },
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

  getCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      let data = await Course.findOne({
        where: { id: courseId },
        // attributes: ["id", "name"],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });
      res.status(200).send({ status: true, data });
    } catch (err: any) {
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },

  getCourses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stream_id } = req.query;
      const { is_active } = req.query;

      const whereClause: any = {};

      if (is_active === "true") {
        whereClause.is_active = true;
      } else if (is_active === "false") {
        whereClause.is_active = false;
      }

      const courses = await Course.findAll({
        attributes: [
          "id",
          "name",
          "category_id",
          "is_active",
          [Sequelize.literal("category.name"), "category_name"],
        ],
        include: [
          {
            model: InstitutionCategory,
            as: "category",
            attributes: [],
          },
        ],
        where: whereClause,
        order: [["id", "DESC"]],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });

      res.status(200).send({ status: true, data: courses });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
};
