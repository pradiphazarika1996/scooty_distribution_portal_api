import express from "express";
import DesignationController from "../../../controllers/admin/masters/DesignationController";

const router = express.Router();

router.get("/", DesignationController.getDesignations);
router.post("/", DesignationController.addDesignation);
router.get("/:id", DesignationController.getDesignation);
router.put("/:id", DesignationController.updateDesignation);
router.delete("/:id", DesignationController.deleteDesignation);

export default router;
