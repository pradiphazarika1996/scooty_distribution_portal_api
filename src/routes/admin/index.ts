import express from "express";
import applicationRoutes from "../student/application.routes";
import masterRoutes from "./../admin/masters";

const router = express.Router();

router.use("/masters", masterRoutes);
router.use("/applications", applicationRoutes);

export default router;
