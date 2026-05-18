import express from "express";
import StudentAuthController from "../../controllers/auth/StudentAuthController";
import jwt from "../../middleware/jwt";

const verifyAccessToken = jwt.verifyStudentAccessToken;
const router = express.Router();

router.post("/login/send-otp", StudentAuthController.loginSendOtp);
router.post("/login/verify-otp", StudentAuthController.loginVerifyOtp);
router.post("/register/send-otp", StudentAuthController.registerUser);
router.post("/register/verify-otp", StudentAuthController.registerVerifyOtp);
// router.get('/account', verifyAccessToken, StudentAuthController.getUser);
router.post("/logout", verifyAccessToken, StudentAuthController.logout);

export default router;
