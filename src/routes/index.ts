import express from "express";
import jwt from "../middleware/jwt";
import adminRoutes from "./admin";
import authRoutes from "./auth";
import studentRoutes from "./student";

const router = express.Router();

const verifyAdminAccessToken = jwt.verifyAdminAccessToken;
const verifyStudentAccessToken = jwt.verifyStudentAccessToken;

router.use("/auth", authRoutes);
// router.use("/admin", verifyAdminAccessToken, adminRoutes);
router.use("/admin", adminRoutes);
router.use("/student", verifyStudentAccessToken, studentRoutes);

export default router;
