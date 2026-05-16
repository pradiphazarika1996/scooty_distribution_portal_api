import express from "express";
import constituencyRoutes from "./constituency.routes";
import districtRoutes from "./district.routes";
import panchayatRoutes from "./panchayat.routes";
import villageRoutes from "./village.routes";

const router = express.Router();

router.use("/districts", districtRoutes);
router.use("/constituencies", constituencyRoutes);
router.use("/panchayats", panchayatRoutes);
router.use("/villages", villageRoutes);
export default router;
