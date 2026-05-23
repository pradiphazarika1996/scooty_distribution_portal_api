import { Router } from "express";
import dashboardController from "../../../controllers/admin/dashboard/DashboardController";

const router = Router();

// GET /api/admin/dashboard/stat-cards
router.get("/stat-cards", dashboardController.getStatCards);
router.get("/exam-split", dashboardController.getExamSplit);
router.get("/recent-applications", dashboardController.getRecentApplications);
router.get("/district-chart", dashboardController.getDistrictChart);
export default router;
