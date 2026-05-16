import express from "express";
import adminAuthRoutes from "./admin.routes";
import studentAuthRoutes from "./students.routes";
const router = express.Router();

router.use("/admin", adminAuthRoutes);
router.use("/student", studentAuthRoutes);

export default router;
