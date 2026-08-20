import express from "express";
import { getAllStudents } from "../controllers/student/StudentController";
import jwt from "../middleware/jwt";
import authRoutes from "./auth";
import studentRoutes from "./student/student.routes";
const router = express.Router();

const verifyAdminAccessToken = jwt.verifyAdminAccessToken;
const verifyStudentAccessToken = jwt.verifyStudentAccessToken;

router.use("/auth", authRoutes);
router.use("/student", verifyStudentAccessToken, studentRoutes);
router.get("/admin/students", getAllStudents);
export default router;
