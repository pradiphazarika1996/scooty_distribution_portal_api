import express from "express";
import studentAuthRoutes from "./students.routes";
const router = express.Router();

router.use("/student", studentAuthRoutes);

export default router;
