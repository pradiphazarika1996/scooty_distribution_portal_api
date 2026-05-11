import express from "express";
import DistrictController from "../../../controllers/admin/masters/DistrictController";

const router = express.Router();

router.get("/", DistrictController.getDistricts);
router.get("/:id", DistrictController.getDistrict);
router.post("/", DistrictController.addDistrict);
router.put("/:id", DistrictController.updateDistrict);
router.delete("/:id", DistrictController.deleteDistrict);

export default router;
