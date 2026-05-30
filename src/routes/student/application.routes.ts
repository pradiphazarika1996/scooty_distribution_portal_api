import { Router } from "express";
import {
  createDraft,
  getApplication,
  getEligibility,
  reopenApplication,
  saveStep,
  submitApplication,
} from "../../controllers/student/ApplicationController";
import {
  deleteDocument,
  getDocuments,
  getDocumentUrl,
  uploadDocument,
} from "../../controllers/student/DocumentController";
import { downloadApplicationPdf } from "../../controllers/student/PdfController";
import { singleUpload } from "../../middleware/uploadFile";

const router = Router();

router.get("/", getApplication);
router.get("/eligibility", getEligibility);
router.post("/create-draft", createDraft);
router.put("/save-step", saveStep);
router.post("/submit", submitApplication);
router.post("/reopen", reopenApplication);

// Documents
router.get("/documents", getDocuments);
router.post("/documents", singleUpload("file"), uploadDocument);
router.delete("/documents/:docType", deleteDocument);
router.get("/documents/:id/url", getDocumentUrl);

// pdf download
router.get("/:applicationId/pdf", downloadApplicationPdf);

export default router;
