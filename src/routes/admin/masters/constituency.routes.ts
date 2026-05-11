import express from "express";
import ConstituencyController from "../../../controllers/admin/masters/ConstituencyController";

const router = express.Router();

router.get("/", ConstituencyController.getConstituencies);
router.get("/:id", ConstituencyController.getConstituency);
router.post("/", ConstituencyController.addConstituency);
router.put("/:id", ConstituencyController.updateConstituency);
router.delete("/:id", ConstituencyController.deleteConstituency);

export default router;
