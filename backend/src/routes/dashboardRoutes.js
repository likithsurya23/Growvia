import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';

const router = Router();

router.get('/', DashboardController.getMetrics);

export default router;
