import { Router } from 'express';
import { DealsController } from '../controllers/dealsController.js';
import {
  validateCreateDeal,
  validateUpdateDeal,
} from '../middlewares/validation.js';

const router = Router();

// Collection routes
router.get('/', DealsController.getAll);
router.post('/', validateCreateDeal, DealsController.create);

// Support query parameter-based deletion (used by existing frontend: DELETE /api/deals?id=...)
router.delete('/', DealsController.delete);

// Individual resource routes
router.get('/:id', DealsController.getById);
router.put('/:id', validateUpdateDeal, DealsController.update);
router.patch('/:id', validateUpdateDeal, DealsController.update);
router.delete('/:id', DealsController.delete);

export default router;
