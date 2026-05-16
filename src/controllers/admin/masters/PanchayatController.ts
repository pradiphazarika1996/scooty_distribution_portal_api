import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { Sequelize } from "sequelize";
import Panchayat from "../../../models/masters/Panchayat.model";
import Constituency from "../../../models/masters/Constituency.model";
import District from "../../../models/masters/District.model";

export default {
  // creates new panchayat
  addPanchayat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await Panchayat.create(req.body).catch((err) => {
        throw httpError.InternalServerError(err);
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({
        status: true,
      });
    } catch (err: any) {
      console.log("add panchayat error ", err);
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },

  // update existing panchayat
  updatePanchayat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const panchayatId = req.params.id;
      const [updatedRows] = await Panchayat.update(req.body, {
        where: { id: panchayatId },
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

  // delete panchayat
  deletePanchayat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const panchayatId = req.params.id;
      const data = await Panchayat.destroy({
        where: { id: panchayatId },
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

  // fetches single panchayat
  getPanchayat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const panchayatId = req.params.id;
      let data = await Panchayat.findOne({
        where: { id: panchayatId },
        attributes: ["id", "name", "constituency_id", "district_id"],
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

  // returns the list of all panchayats
  getPanchayats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { constituency_id } = req.query;
      console.log("query params", req.query);
      const panchayats = await Panchayat.findAll({
        attributes: [
          "id",
          // "code",
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
        where: {
          // ...(district_id && { district_id }),
          ...(constituency_id && { constituency_id }),
        },
        order: [["id", "DESC"]],
      }).catch((err) => {
        console.log("error in fetching panchayats", err);
        throw httpError.InternalServerError();
      });
      console.log("panchayats", panchayats);

      res.status(200).send({ status: true, data: panchayats });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
};
