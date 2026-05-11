import express from "express";
import DocumentController from "../../../controllers/admin/masters/DocumentController";

const router = express.Router();

router.get("/", DocumentController.getDocuments);
router.post("/", DocumentController.addDocument);
router.get("/:id", DocumentController.getDocument);
router.put("/:id", DocumentController.updateDocument);
router.delete("/:id", DocumentController.deleteDocument);

export default router;
