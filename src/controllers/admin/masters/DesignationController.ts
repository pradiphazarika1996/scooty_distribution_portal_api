import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { Sequelize } from "sequelize";
import Designation from "../../../models/masters/Designation.model";
import EmploymentType from "../../../models/masters/EmploymentType.model";

export default {
  addDesignation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await Designation.create(req.body).catch((err) => {
        console.log("add Designation error", err);
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

  updateDesignation: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const designationId = req.params.id;
      const [updatedRows] = await Designation.update(req.body, {
        where: { id: designationId },
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

  deleteDesignation: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const designationId = req.params.id;
      const data = await Designation.destroy({
        where: { id: designationId },
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

  getDesignation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const designationId = req.params.id;
      let data = await Designation.findOne({
        where: { id: designationId },
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

  getDesignations: async (req: Request, res: Response, next: NextFunction) => {
    const { employment_type_id } = req.query;

    let whereClause: any = {};
    if (employment_type_id)
      whereClause.employment_type_id = employment_type_id || null;

    try {
      const designation = await Designation.findAll({
        attributes: [
          "id",
          "name",
          "employment_type_id",
          "category_type_id",
          "is_active",
          [Sequelize.literal("employmentType.name"), "employment_type"],
        ],
        include: [
          {
            model: EmploymentType,
            attributes: [],
            as: "employmentType",
          },
        ],

        where: whereClause,
        order: [["id", "DESC"]],
      }).catch((err) => {
        throw httpError.InternalServerError(err);
      });

      res.status(200).send({ status: true, data: designation });
    } catch (err: any) {
      console.log("getDesignations error", err);
      res.status(err.status || 500).send({ status: false });
    }
  },
};
