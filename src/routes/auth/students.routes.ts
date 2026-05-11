import express from 'express';
import InstitutionAuthController from '../../controllers/auth/StudentAuthController';
import jwt from '../../middleware/jwt';

const verifyAccessToken = jwt.verifyInstituteAccessToken;
const router = express.Router();

router.post('/login/send-otp', InstitutionAuthController.loginSendOtp);
router.post('/login/verify-otp', InstitutionAuthController.loginVerifyOtp);
router.post('/register/send-otp', InstitutionAuthController.registerSendOtp);
router.post('/register/verify-otp', InstitutionAuthController.registerVerifyOtp);
router.get('/account', verifyAccessToken, InstitutionAuthController.getUser);
router.post('/logout', verifyAccessToken, InstitutionAuthController.logout);

export default router;
