import express from "express";
import masterRoutes from "./../admin/masters";

const router = express.Router();
router.use("/masters", masterRoutes);
export default router;
