import express from 'express';
import constituencyRoutes from './constituency.routes';
import courseRoutes from './course.routes';
import departmentRoutes from './department.routes';
import designationRoutes from './designation.routes';
import districtRoutes from './district.routes';
import documentRoutes from './document.routes';

const router = express.Router();

router.use('/department', departmentRoutes);
router.use('/course', courseRoutes);
router.use('/districts', districtRoutes);
router.use('/constituencies', constituencyRoutes);
router.use('/designation', designationRoutes);
router.use('/document', documentRoutes);

export default router;
