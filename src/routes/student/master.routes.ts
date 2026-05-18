import express from "express";
import getMastersController from "../../controllers/student/MastersController";

const router = express.Router();

router.get("/districts", getMastersController.getDistricts);
router.get("/constituencies", getMastersController.getConstituencies);
router.get("/panchayats", getMastersController.getPanchayats);
router.get("/villages", getMastersController.getVillages);
router.get("/districts/:id", getMastersController.getDistrict);
router.get("/constituencies/:id", getMastersController.getConstituency);
router.get("/panchayats/:id", getMastersController.getPanchayat);
router.get("/villages/:id", getMastersController.getVillage);

export default router;
