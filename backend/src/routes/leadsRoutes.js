import { Router } from 'express';
import { LeadsController } from '../controllers/leadsController.js';
import {
  validateCreateLead,
  validateUpdateLead,
} from '../middlewares/validation.js';

const router = Router();

// Collection routes
router.get('/', LeadsController.getAll);
router.post('/', validateCreateLead, LeadsController.create);

// Support query parameter-based deletion (used by existing frontend: DELETE /api/leads?id=...)
router.delete('/', LeadsController.delete);

// Individual resource routes
router.get('/:id', LeadsController.getById);
router.put('/:id', validateUpdateLead, LeadsController.update);
router.patch('/:id', validateUpdateLead, LeadsController.update);
router.delete('/:id', LeadsController.delete);

export default router;
