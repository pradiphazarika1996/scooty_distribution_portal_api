import express from 'express';
import userAuthRoutes from './admin/auth.routes';
import institutesAuthRoutes from './students.routes';
import teachersAuthRoutes from './teachers.routes';
const router = express.Router();
router.use('/employees', teachersAuthRoutes);
router.use('/institutes', institutesAuthRoutes);
router.use('/admin', userAuthRoutes);

export default router;
