import { Router } from "express";
import {
  createDraft,
  getApplication,
  getEligibility,
  saveStep,
  submitApplication,
} from "../../controllers/student/ApplicationController";
import jwt from "../../middleware/jwt";

const verifyAccessToken = jwt.signStudentAccessToken;

const router = Router();

router.get("/", getApplication);
router.get("/eligibility", getEligibility);
router.post("/create-draft", createDraft);
router.put("/save-step", saveStep);
router.post("/submit", submitApplication);

export default router;
