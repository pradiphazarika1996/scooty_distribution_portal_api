import express from "express";
import applicationRoutes from "../student/application.routes";
import masterRoutes from "./../admin/masters";
import dashboardRoutes from "../admin/dashboard/dashboard.routes";
import userRoutes from "../auth/user.routes";
import adminApplication from "../admin/application/application.routes"
const router = express.Router();

router.use("/masters", masterRoutes);
router.use("/applications", applicationRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes)
router.use("/application", adminApplication);
export default router;
