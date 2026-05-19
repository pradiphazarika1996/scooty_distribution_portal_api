import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { Sequelize } from "sequelize";
import Constituency from "../../../models/masters/Constituency.model";
import District from "../../../models/masters/District.model";
import Village from "../../../models/masters/Village.model";

export default {
  // creates new village
  addVillage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await Village.create(req.body).catch((err) => {
        throw httpError.InternalServerError(err);
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({
        status: true,
      });
    } catch (err: any) {
      console.log("village error", err);
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },

  // update existing village
  updateVillage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const villageId = req.params.id;
      const [updatedRows] = await Village.update(req.body, {
        where: { id: villageId },
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

  // delete village
  deleteVillage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const villageId = req.params.id;
      const data = await Village.destroy({
        where: { id: villageId },
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

  // fetches single village
  getVillage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const villageId = req.params.id;
      let data = await Village.findOne({
        where: { id: villageId },
        attributes: ["id", "name", "district_id", "constituency_id"],
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

  // fetches single villages
  getVillages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { constituency_id } = req.query;
      const whereClause: any = {};

      if (constituency_id) whereClause.constituency_id = constituency_id;

      const villages = await Village.findAll({
        attributes: [
          "id",
          "name",
          "district_id",
          "constituency_id",
          [Sequelize.literal("District.name"), "district_name"],
          [Sequelize.literal("Constituency.name"), "constituency_name"],
        ],

        include: [
          {
            model: District,
            attributes: [],
          },
          {
            model: Constituency,
            attributes: [],
          },
        ],
        where: whereClause,
        order: [["id", "DESC"]],
      }).catch((err) => {
        console.log("village error", err);
        throw httpError.InternalServerError();
      });

      res.status(200).send({ status: true, data: villages });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
};
