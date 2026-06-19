import { Router } from "express";
import applicationController from "../../../controllers/admin/application/ApplicationController";
import documentController from "../../../controllers/admin/application/DocumentController";
const router = Router();

router.get("/:id/documents", documentController.getApplicationDocuments);
router.get("/document/:id/url", documentController.getDocumentUrl);
router.get("/filter-options", applicationController.getFilterOptions);
router.get("/export/excel", applicationController.exportExcel);
router.get("/export/pdf", applicationController.exportPdf);
router.get("/", applicationController.getApplications);
router.get("/:id", applicationController.getApplicationById);
router.patch("/:id/approve", applicationController.approveApplication);
router.patch("/:id/reject", applicationController.rejectApplication);
export default router;
