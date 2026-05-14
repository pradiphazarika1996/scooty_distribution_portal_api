import express from "express";
import PanchayatController from "../../../controllers/admin/masters/PanchayatController";

const router = express.Router();

router.get("/", PanchayatController.getPanchayats);
router.post("/", PanchayatController.addPanchayat);
router.get("/:id", PanchayatController.getPanchayat);
router.put("/:id", PanchayatController.updatePanchayat);
router.delete("/:id", PanchayatController.deletePanchayat);

export default router;
