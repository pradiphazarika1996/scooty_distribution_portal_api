import express from "express";
import DepartmentController from "../../../controllers/admin/masters/DepartmentController";

const router = express.Router();

router.get("/", DepartmentController.getDepartments);
router.post("/", DepartmentController.addDepartment);
router.get("/:id", DepartmentController.getDepartment);
router.put("/:id", DepartmentController.updateDepartment);
router.delete("/:id", DepartmentController.deleteDepartment);

export default router;
