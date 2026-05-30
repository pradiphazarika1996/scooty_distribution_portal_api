import { Router } from "express";
import applicationController from "../../../controllers/admin/application/ApplicationController";

const router = Router();
router.get("/filter-options", applicationController.getFilterOptions);
router.get("/export/excel", applicationController.exportExcel);
router.get("/export/pdf", applicationController.exportPdf);
router.get("/", applicationController.getApplications);
router.get("/:id", applicationController.getApplicationById);

export default router;
