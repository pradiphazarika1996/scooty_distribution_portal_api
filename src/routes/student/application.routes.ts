import { Router } from "express";
import {
  createDraft,
  getApplication,
  getEligibility,
  saveStep,
  submitApplication,
} from "../../controllers/student/ApplicationController";
import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "../../controllers/student/DocumentController";
import { downloadApplicationPdf } from "../../controllers/student/PdfController";
import jwt from "../../middleware/jwt";
import { singleUpload } from "../../middleware/uploadFile";

const verifyAccessToken = jwt.signStudentAccessToken;

const router = Router();

router.get("/", getApplication);
router.get("/eligibility", getEligibility);
router.post("/create-draft", createDraft);
router.put("/save-step", saveStep);
router.post("/submit", submitApplication);

// Documents
router.get("/documents", getDocuments);
router.post("/documents", singleUpload("file"), uploadDocument);
router.delete("/documents/:docType", deleteDocument);

// pdf download
router.get("/:applicationId/pdf", downloadApplicationPdf);

export default router;
