import { Router } from 'express';
import { ActivitiesController } from '../controllers/activitiesController.js';

const router = Router();

router.get('/', ActivitiesController.getAll);

export default router;
