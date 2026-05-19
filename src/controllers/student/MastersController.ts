import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { Sequelize } from "sequelize";
import Constituency from "../../models/masters/Constituency.model";
import District from "../../models/masters/District.model";
import Panchayat from "../../models/masters/Panchayat.model";
import Village from "../../models/masters/Village.model";

export default {
  getDistricts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const cachedDistricts = await getApiCache(API_NAME.DISTRICTS);
      // if (cachedDistricts)
      //   return res.status(200).send({ status: true, data: cachedDistricts });

      const districts = await District.findAll({
        attributes: ["id", "name"],
        order: [["id", "DESC"]],
      }).catch((err) => {
        console.log("get districts error", err);
        throw httpError.InternalServerError();
      });

      // await setApiCache(API_NAME.DISTRICTS, districts);

      res.status(200).send({ status: true, data: districts });
    } catch (err: any) {
      console.log("get districts catch error", err);
      res.status(err.status || 500).send({ status: false });
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
  getConstituencies: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { district_id } = req.query;
      if (!district_id) throw httpError.BadRequest();
      // const cachedConstituencies = await getApiCache(
      //   getCacheKey(API_NAME.CONSTITUENCIES, district_id),
      // );

      // if (cachedConstituencies)
      //   return res
      //     .status(200)
      //     .send({ status: true, data: cachedConstituencies });

      const constituencies = await Constituency.findAll({
        attributes: [
          "id",
          "name",
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

      // await setApiCache(
      //   getCacheKey(API_NAME.CONSTITUENCIES, district_id),
      //   constituencies,
      // );

      res.status(200).send({ status: true, data: constituencies });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
  getConstituency: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const constituencyId = req.params.id;
      let data = await Constituency.findOne({
        where: { id: constituencyId },
        attributes: ["id", "name"],
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
  getPanchayats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { constituency_id } = req.query;
      if (!constituency_id) throw httpError.BadRequest();

      // const cachedPanchayats = await getApiCache(
      //   getCacheKey(API_NAME.PANCHAYATS, constituency_id),
      // );

      // if (cachedPanchayats)
      //   return res.status(200).send({ status: true, data: cachedPanchayats });

      const panchayats = await Panchayat.findAll({
        attributes: [
          "id",
          "name",
          "district_id",
          "constituency_id",
          [Sequelize.literal("district.name"), "district_name"],
          [Sequelize.literal("constituency.name"), "constituency_name"],
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
          ...(constituency_id && { constituency_id }),
        },
        order: [["id", "DESC"]],
      }).catch((err) => {
        console.log("error in fetching panchayats", err);
        throw httpError.InternalServerError();
      });

      // await setApiCache(
      //   getCacheKey(API_NAME.PANCHAYATS, constituency_id),
      //   panchayats,
      // );

      res.status(200).send({ status: true, data: panchayats });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
  getPanchayat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const panchayatId = req.params.id;
      let data = await Panchayat.findOne({
        where: { id: panchayatId },
        attributes: ["id", "name"],
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
  getVillages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { constituency_id } = req.query;
      if (!constituency_id) throw httpError.BadRequest();
      // const cachedVillages = await getApiCache(
      //   getCacheKey(API_NAME.VILLAGES, constituency_id),
      // );

      // if (cachedVillages)
      //   return res.status(200).send({ status: true, data: cachedVillages });

      const whereClause: any = {};

      if (constituency_id) whereClause.constituency_id = constituency_id;

      const villages = await Village.findAll({
        attributes: [
          "id",
          "name",
          "district_id",
          "constituency_id",
          [Sequelize.literal("district.name"), "district_name"],
          [Sequelize.literal("constituency.name"), "constituency_name"],
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
        console.log("error in fetching villages", err);
        throw httpError.InternalServerError();
      });

      // await setApiCache(getCacheKey(API_NAME.VILLAGES, panchayat_id), villages);

      res.status(200).send({ status: true, data: villages });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
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
};
