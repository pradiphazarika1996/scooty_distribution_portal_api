import type { NextFunction, Request, Response } from "express";
import {
  getDistrictChartData,
  getExamSplitData,
  getRecentApplications,
  getStatCardData,
} from "../../../services/Dashboard/dashboardService";

export default {
  getStatCards: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await getStatCardData();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getExamSplit: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await getExamSplitData();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  getRecentApplications: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await getRecentApplications();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
  getDistrictChart: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await getDistrictChartData();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
