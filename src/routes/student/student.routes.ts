import { Router } from "express";
import {
  getApplication,
  reopenApplication,
  submitApplication,
} from "../../controllers/student/StudentController";

const router = Router();

router.get("/", getApplication);
router.put("/submit", submitApplication);
router.put("/reopen", reopenApplication);

export default router;
