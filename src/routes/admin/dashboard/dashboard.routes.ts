import { Router } from "express";
import dashboardController from "../../../controllers/admin/dashboard/DashboardController";

const router = Router();

router.get("/stat-cards", dashboardController.getStatCards);
router.get("/trend", dashboardController.getTrend);
router.get("/exam-split", dashboardController.getExamSplit);
router.get("/recent-applications", dashboardController.getRecentApplications);
router.get("/district-chart", dashboardController.getDistrictChart);
export default router;
