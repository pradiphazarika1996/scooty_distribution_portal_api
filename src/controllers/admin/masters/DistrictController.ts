import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import District from "../../../models/masters/District.model";

export default {
  addDistrict: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await District.create(req.body).catch((err) => {
        console.log("add district error", err);
        throw httpError.InternalServerError();
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({ status: true });
    } catch (err: any) {
      res
        .status(err.status || 500)
        .send({ status: false, message: err.message });
    }
  },

  updateDistrict: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const districtId = req.params.id;
      const [updatedRows] = await District.update(req.body, {
        where: { id: districtId },
      }).catch((err) => {
        console.log("update district error", err);
        throw httpError.InternalServerError();
      });
      if (!updatedRows) throw httpError.InternalServerError();

      res.status(200).send({ status: true });
    } catch (err: any) {
      res
        .status(err.status || 500)
        .send({ status: false, message: err.message });
    }
  },
  deleteDistrict: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const districtId = req.params.id;
      console.log("delete district id", districtId);
      const data = await District.destroy({
        where: { id: districtId },
      }).catch((err) => {
        console.log("delete district error", err);
        throw httpError.InternalServerError();
      });
      if (!data) throw httpError.InternalServerError();

      res.status(200).send({ status: true });
    } catch (err: any) {
      res
        .status(err.status || 500)
        .send({ status: false, message: err.message });
    }
  },

  getDistrict: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const districtId = req.params.id;
      const data = await District.findOne({
        where: { id: districtId },
        attributes: ["id", "name"],
      }).catch((err) => {
        console.log("get district error", err);
        throw httpError.InternalServerError();
      });

      res.status(200).send({ status: true, data });
    } catch (err: any) {
      res
        .status(err.status || 500)
        .send({ status: false, message: err.message });
    }
  },

  getDistricts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const districts = await District.findAll({
        attributes: ["id", "name"],
        order: [["id", "DESC"]],
      }).catch((err) => {
        console.log("get districts error", err);
        throw httpError.InternalServerError();
      });

      res.status(200).send({ status: true, data: districts });
    } catch (err: any) {
      console.log("get districts catch error", err);
      res.status(err.status || 500).send({ status: false });
    }
  },
};
