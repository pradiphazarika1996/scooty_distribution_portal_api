import { Router } from "express";
import {
  getApplication,
  submitApplication,
} from "../../controllers/student/StudentController";

const router = Router();

router.get("/", getApplication);
router.put("/submit", submitApplication);

export default router;
