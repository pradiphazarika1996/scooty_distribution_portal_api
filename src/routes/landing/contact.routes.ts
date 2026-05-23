import { Router } from "express";
import contactController from "../../controllers/landing/ContactController";

const router = Router();

router.post("/", contactController.submitContact);
router.get("/query", contactController.getContacts);

export default router;
