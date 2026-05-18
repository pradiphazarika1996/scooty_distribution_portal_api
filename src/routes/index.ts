import express from "express";
import jwt from "../middleware/jwt";
import contactRoutes from "../routes/landing/contact.routes";
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
router.use("/landing/contact", contactRoutes);

export default router;
