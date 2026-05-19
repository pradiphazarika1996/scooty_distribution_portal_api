import express from "express";
import applicationRoutes from "./application.routes";
import masterRoutes from "./master.routes";
import profileRoutes from "./profile.routes";

const router = express.Router();

router.use("/application", applicationRoutes);
router.use("/master", masterRoutes);
router.use("/profile", profileRoutes);

export default router;
