import type { NextFunction, Request, Response } from "express";
import {
  getApplicationById,
  getApplications,
  getFilterOptions,
  type GetApplicationsParams,
} from "../../../services/Application/applicationService";
import {
  exportToExcel,
  exportToPdf,
} from "../../../services/Application/exportServices";

// ── Shared param parser ────────────────────────────────────

function parseParams(query: Record<string, string>): GetApplicationsParams {
  const {
    search,
    remarksSearch,
    applicantType,
    district,
    exam,
    gender,
    lastAction,
    activeTab,
    page,
    limit,
  } = query;
  return {
    search,
    remarksSearch,
    applicantType,
    district,
    exam,
    gender,
    lastAction,
    activeTab,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 15,
  };
}

export default {
  getApplications: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await getApplications(
        parseParams(req.query as Record<string, string>),
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getFilterOptions: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await getFilterOptions();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  exportExcel: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await exportToExcel(
        parseParams(req.query as Record<string, string>),
        res,
      );
    } catch (err) {
      next(err);
    }
  },

  exportPdf: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await exportToPdf(parseParams(req.query as Record<string, string>), res);
    } catch (err) {
      next(err);
    }
  },
  getApplicationById: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res
          .status(400)
          .json({ success: false, message: "Invalid application ID" });
        return;
      }

      const data = await getApplicationById(id);
      if (!data) {
        res
          .status(404)
          .json({ success: false, message: "Application not found" });
        return;
      }

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};