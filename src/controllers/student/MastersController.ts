import { NextFunction, Request, Response } from "express";
import httpError from "http-errors";
import { Sequelize } from "sequelize";
import { API_NAME } from "../../helpers/redisKeys";
import Constituency from "../../models/masters/Constituency.model";
import District from "../../models/masters/District.model";
import Village from "../../models/masters/Village.model";
import {
  getApiCache,
  getCacheKey,
  setApiCache,
} from "../../services/RedisService";

export default {
  getDistricts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cachedDistricts = await getApiCache(API_NAME.DISTRICTS);
      if (cachedDistricts) {
        console.log("Serving districts from cache");
        return res.status(200).send({ status: true, data: cachedDistricts });
      }

      console.log("Fetching districts from database");

      const districts = await District.findAll({
        attributes: ["id", "name"],
        order: [["id", "DESC"]],
      }).catch((err) => {
        throw httpError.InternalServerError(err);
      });

      await setApiCache(API_NAME.DISTRICTS, districts);

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
        throw httpError.InternalServerError(err);
      });

      res.status(200).send({ status: true, data });
    } catch (err: any) {
      console.log("get district catch error", err);
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
      const cachedConstituencies = await getApiCache(
        getCacheKey(API_NAME.CONSTITUENCIES, district_id),
      );
      if (cachedConstituencies) {
        console.log("Serving constituencies from cache");
        return res
          .status(200)
          .send({ status: true, data: cachedConstituencies });
      }

      console.log("Fetching constituencies from database");

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
        throw httpError.InternalServerError(err);
      });

      await setApiCache(
        getCacheKey(API_NAME.CONSTITUENCIES, district_id),
        constituencies,
      );

      res.status(200).send({ status: true, data: constituencies });
    } catch (err: any) {
      console.log("get constituencies error", err);
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
        throw httpError.InternalServerError(err);
      });
      res.status(200).send({ status: true, data });
    } catch (err: any) {
      console.log("get constituency error", err);
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
      const cachedVillages = await getApiCache(
        getCacheKey(API_NAME.VILLAGES, constituency_id),
      );
      if (cachedVillages) {
        console.log("Serving villages from cache");
        return res.status(200).send({ status: true, data: cachedVillages });
      }

      console.log("Fetching villages from database");

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
        throw httpError.InternalServerError(err);
      });

      await setApiCache(
        getCacheKey(API_NAME.VILLAGES, constituency_id),
        villages,
      );

      res.status(200).send({ status: true, data: villages });
    } catch (err: any) {
      console.log("get villages error", err);
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
        throw httpError.InternalServerError(err);
      });
      res.status(200).send({ status: true, data });
    } catch (err: any) {
      console.log("get village error", err);
      res.status(err.status || 500).send({
        status: false,
        message: err.message,
      });
    }
  },
};
