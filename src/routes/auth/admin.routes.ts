import express from "express";
import AdminAuthController from "../../controllers/auth/AdminAuthController";
import jwt from "../../middleware/jwt";

const verifyAccessToken = jwt.verifyAdminAccessToken;
const router = express.Router();

router.post("/login/send-otp", AdminAuthController.loginSendOtp);
router.post("/login/verify-otp", AdminAuthController.loginVerifyOtp);
router.post("/register/send-otp", AdminAuthController.registerUser);
router.post("/register/verify-otp", AdminAuthController.registerVerifyOtp);
router.get("/account", verifyAccessToken, AdminAuthController.getUser);
router.post("/logout", verifyAccessToken, AdminAuthController.logout);

export default router;
