import { Router } from "express";
import contactController from "../../controllers/landing/ContactController";

const router = Router();

router.post("/", contactController.submitContact);

export default router;