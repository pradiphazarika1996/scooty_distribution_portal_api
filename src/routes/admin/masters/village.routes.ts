import express from "express";
import VillageController from "../../../controllers/admin/masters/VillageController";

const router = express.Router();

router.get("/", VillageController.getVillages);
router.post("/", VillageController.addVillage);
router.get("/:id", VillageController.getVillage);
router.put("/:id", VillageController.updateVillage);
router.delete("/:id", VillageController.deleteVillage);

export default router;
