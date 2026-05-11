import express from 'express';
import masterRoutes from './../admin/masters';
import reportRoutes from './../admin/reports';
import applicationRoutes from './applicationRoutes/application.routes';
import dashboardRoutes from './dashboardRoutes/dashboard.routes';
import employeeRoutes from './employeeRoutes/employee.routes';
import institutionsRoutes from './instituteRoutes/institute.routes';
import paymentRoutes from './paymentRoutes';

const router = express.Router();

router.use('/reports', reportRoutes);
router.use('/masters', masterRoutes);

export default router;
