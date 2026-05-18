import express from "express";
import applicationRoutes from "./application.routes";
import masterRoutes from "./master.routes";

const router = express.Router();

router.use("/application", applicationRoutes);
router.use("/master", masterRoutes);

export default router;
