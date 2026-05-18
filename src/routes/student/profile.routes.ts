import { Router } from "express";
import {
  getProfile,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from "../../controllers/student/ProfileController";
import { singleUpload } from "../../middleware/uploadFile";

const router = Router();

router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/avatar", singleUpload("avatar"), uploadAvatar);
router.delete("/avatar", removeAvatar);

export default router;
