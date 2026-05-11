import express from "express";
import CourseController from "../../../controllers/admin/masters/CourseController";

const router = express.Router();

router.get("/", CourseController.getCourses);
router.post("/", CourseController.addCourse);
router.get("/:id", CourseController.getCourse);
router.put("/:id", CourseController.updateCourse);
router.delete("/:id", CourseController.deleteCourse);

export default router;
