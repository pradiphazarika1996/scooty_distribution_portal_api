import { NextFunction, Request, Response } from 'express';
import httpError from 'http-errors';
import { Sequelize } from 'sequelize';
import { API_NAME } from '../../helpers/redisKeys';
import Cluster from '../../models/masters/Cluster.model';
import Constituency from '../../models/masters/Constituency.model';
import Course from '../../models/masters/Course.model';
import Designation from '../../models/masters/Designation.model';
import District from '../../models/masters/District.model';
import Document from '../../models/masters/Document.model';

import { getApiCache, getCacheKey, setApiCache } from '../../services/RedisService';

export default {
  getDistricts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cachedDistricts = await getApiCache(API_NAME.DISTRICTS);
      if (cachedDistricts) return res.status(200).send({ status: true, data: cachedDistricts });

      const districts = await District.findAll({
        attributes: ['id', 'name'],
        order: [['id', 'DESC']],
      }).catch((err) => {
        console.log('get districts error', err);
        throw httpError.InternalServerError();
      });

      await setApiCache(API_NAME.DISTRICTS, districts);

      res.status(200).send({ status: true, data: districts });
    } catch (err: any) {
      console.log('get districts catch error', err);
      res.status(err.status || 500).send({ status: false });
    }
  },
  getConstituencies: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { district_id } = req.query;
      if (!district_id) throw httpError.BadRequest();
      const cachedConstituencies = await getApiCache(getCacheKey(API_NAME.CONSTITUENCIES, district_id));

      if (cachedConstituencies) return res.status(200).send({ status: true, data: cachedConstituencies });

      const constituencies = await Constituency.findAll({
        attributes: ['id', 'name', 'district_id', [Sequelize.literal('district.name'), 'district_name']],
        include: [
          {
            model: District,
            attributes: [],
          },
        ],

        where: district_id ? { district_id } : {},
        order: [['id', 'DESC']],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });

      await setApiCache(getCacheKey(API_NAME.CONSTITUENCIES, district_id), constituencies);

      res.status(200).send({ status: true, data: constituencies });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
  getBlocks: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { constituency_id } = req.query;
      if (!constituency_id) throw httpError.BadRequest();

      const cachedBlocks = await getApiCache(getCacheKey(API_NAME.BLOCKS, constituency_id));

      if (cachedBlocks) return res.status(200).send({ status: true, data: cachedBlocks });

      const blocks = await Block.findAll({
        attributes: ['id', 'name', 'district_id', 'constituency_id', [Sequelize.literal('district.name'), 'district_name'], [Sequelize.literal('constituency.name'), 'constituency_name']],
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
        order: [['id', 'DESC']],
      }).catch((err) => {
        console.log('error in fetching blocks', err);
        throw httpError.InternalServerError();
      });

      await setApiCache(getCacheKey(API_NAME.BLOCKS, constituency_id), blocks);

      res.status(200).send({ status: true, data: blocks });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
  getClusters: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { block_id } = req.query;
      if (!block_id) throw httpError.BadRequest();
      const cachedClusters = await getApiCache(getCacheKey(API_NAME.CLUSTERS, block_id));

      if (cachedClusters) return res.status(200).send({ status: true, data: cachedClusters });

      const whereClause: any = {};

      if (block_id) whereClause.block_id = block_id;

      const clusters = await Cluster.findAll({
        attributes: [
          'id',
          'name',
          'block_id',
          'district_id',
          'constituency_id',
          [Sequelize.literal('district.name'), 'district_name'],
          [Sequelize.literal('constituency.name'), 'constituency_name'],
          [Sequelize.literal('block.name'), 'block_name'],
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
          {
            model: Block,
            attributes: [],
          },
        ],
        where: whereClause,
        order: [['id', 'DESC']],
      }).catch((err) => {
        console.log('cluster error', err);
        throw httpError.InternalServerError();
      });

      await setApiCache(getCacheKey(API_NAME.CLUSTERS, block_id), clusters);

      res.status(200).send({ status: true, data: clusters });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
  getCourses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cachedCourses = await getApiCache(API_NAME.COURSES);
      if (cachedCourses) return res.status(200).send({ status: true, data: cachedCourses });
      const { stream_id } = req.query;
      const { is_active } = req.query;

      const whereClause: any = {};

      if (is_active === 'true') {
        whereClause.is_active = true;
      } else if (is_active === 'false') {
        whereClause.is_active = false;
      }

      const courses = await Course.findAll({
        where: whereClause,
        order: [['id', 'DESC']],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });
      await setApiCache(API_NAME.COURSES, courses);

      res.status(200).send({ status: true, data: courses });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
  getDepartments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stream_id } = req.query;
      const cachedDepartments = await getApiCache(API_NAME.DEPARTMENTS);
      if (cachedDepartments) return res.status(200).send({ status: true, data: cachedDepartments });

      const departments = await Department.findAll({
        attributes: ['id', 'name', 'stream_id', 'is_active', [Sequelize.literal('Stream.name'), 'stream_name']],
        include: [
          {
            model: Stream,
            attributes: [],
            as: 'stream',
          },
        ],

        where: stream_id ? { stream_id } : {},
        order: [['id', 'DESC']],
      }).catch((err) => {
        console.log('err', err);
        throw httpError.InternalServerError(err);
      });
      await setApiCache(API_NAME.DEPARTMENTS, departments);

      res.status(200).send({ status: true, data: departments });
    } catch (err: any) {
      console.log('err:', err);
      res.status(err.status || 500).send({ status: false });
    }
  },
  getDesignations: async (req: Request, res: Response, next: NextFunction) => {
    const { employment_type_id } = req.query;

    let whereClause: any = {};
    if (employment_type_id) whereClause.employment_type_id = employment_type_id || null;

    try {
      const cachedDesignations = await getApiCache(API_NAME.DESINATIONS);
      if (cachedDesignations) return res.status(200).send({ status: true, data: cachedDesignations });
      const designation = await Designation.findAll({
        attributes: ['id', 'name', 'employment_type_id', 'category_type_id', 'is_active', [Sequelize.literal('employmentType.name'), 'employment_type']],
        include: [
          {
            model: EmploymentType,
            attributes: [],
            as: 'employmentType',
          },
        ],

        where: { ...whereClause },
        order: [['id', 'ASC']],
      }).catch((err) => {
        throw httpError.InternalServerError(err);
      });
      await setApiCache(API_NAME.DESINATIONS, designation);

      res.status(200).send({ status: true, data: designation });
    } catch (err: any) {
      console.log('getDesignations error', err);
      res.status(err.status || 500).send({ status: false });
    }
  },
  getStreams: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cacheStreams = await getApiCache(API_NAME.STREAMS);
      if (cacheStreams) return res.status(200).send({ status: true, data: cacheStreams });
      const { is_active } = req.query;

      const whereClause: any = {};

      if (is_active === 'true') {
        whereClause.is_active = true;
      } else if (is_active === 'false') {
        whereClause.is_active = false;
      }

      const streams = await Stream.findAll({
        where: whereClause,
        order: [['id', 'DESC']],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });
      await setApiCache(API_NAME.STREAMS, streams);

      res.status(200).send({ status: true, data: streams });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
  getDocuments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documents = await Document.findAll({
        attributes: ['id', 'name', 'code', 'file_type', 'is_mandatory', 'is_active'],
        order: [['id', 'DESC']],
      }).catch((err) => {
        throw httpError.InternalServerError();
      });

      res.status(200).send({ status: true, data: documents });
    } catch (err: any) {
      res.status(err.status || 500).send({ status: false });
    }
  },
};
