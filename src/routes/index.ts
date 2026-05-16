import express from 'express';
import jwt from '../middleware/jwt';
import contactRoutes from '../routes/landing/contact.routes'
// import adminRoutes from './admin';
// import studentRoutes from './student';
// import authRoutes from './auth/admin.routes';
const router = express.Router();

// const verifyAdminAccessToken = jwt.verifyAdminAccessToken;
// const verifyStudentAccessToken = jwt.verifyStudentAccessToken;

// router.use("/auth", authRoutes);
// router.use("/admin", verifyAdminAccessToken, adminRoutes);
// router.use("/student", verifyStudentAccessToken, studentRoutes);
router.use('/landing/contact',contactRoutes)

export default router;
