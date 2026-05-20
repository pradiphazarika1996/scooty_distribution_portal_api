import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import Constituency from "../../../models/masters/Constituency.model";
import District from "../../../models/masters/District.model";
import { Sequelize } from "sequelize";

export default {
  addConstituency: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await Constituency.create(req.body).catch((err) => {
        throw httpError.InternalServerError(err);
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({
        status: true,
      });
    } catch (err: any) {
      console.log("add constituency error ", err);
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },

  updateConstituency: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const constituencyId = req.params.id;
      const [updatedRows] = await Constituency.update(req.body, {
        where: { id: constituencyId },
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

  deleteConstituency: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const constituencyId = req.params.id;
      const data = await Constituency.destroy({
        where: { id: constituencyId },
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

  getConstituency: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const constituencyId = req.params.id;
      let data = await Constituency.findOne({
        where: { id: constituencyId },
        attributes: ["id", "name", "code"],
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

  getConstituencies: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { district_id } = req.query;

      const constituencies = await Constituency.findAll({
        attributes: [
          "id",
          "name",
          // "code",
          "district_id",
          [Sequelize.literal("district.name"), "district_name"],
        ],
        include: [
          {
            model: District,
            attributes: [],
          },
        ],

        where: district_id ? { district_id } : {},
        order: [["id", "DESC"]],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });

      res.status(200).send({ status: true, data: constituencies });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
};
