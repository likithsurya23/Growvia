import { LEAD_STATUSES, DEAL_STAGES } from '../config/env.js';
import { AppError } from './errorHandler.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateCreateLead = (req, res, next) => {
  const { name, email, status } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Lead name is required and must be a non-empty string');
  }

  if (email && (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))) {
    errors.push('Invalid email format');
  }

  if (status && !LEAD_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${LEAD_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }

  next();
};

export const validateUpdateLead = (req, res, next) => {
  const { name, email, status } = req.body || {};
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    errors.push('Lead name must be a non-empty string');
  }

  if (email !== undefined && email !== '' && (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))) {
    errors.push('Invalid email format');
  }

  if (status !== undefined && !LEAD_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${LEAD_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }

  next();
};

export const validateCreateDeal = (req, res, next) => {
  const { title, value, stage, expectedCloseDate, leadId } = req.body || {};
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('Deal title is required and must be a non-empty string');
  }

  if (value !== undefined) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      errors.push('Deal value must be a non-negative number');
    }
  }

  if (stage && !DEAL_STAGES.includes(stage)) {
    errors.push(`Stage must be one of: ${DEAL_STAGES.join(', ')}`);
  }

  if (expectedCloseDate) {
    const parsedDate = new Date(expectedCloseDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Invalid expectedCloseDate format (must be a valid date)');
    }
  }

  if (leadId !== undefined && leadId !== null && typeof leadId !== 'string') {
    errors.push('leadId must be a string ID');
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }

  next();
};

export const validateUpdateDeal = (req, res, next) => {
  const { title, value, stage, expectedCloseDate, leadId } = req.body || {};
  const errors = [];

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    errors.push('Deal title must be a non-empty string');
  }

  if (value !== undefined) {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      errors.push('Deal value must be a non-negative number');
    }
  }

  if (stage !== undefined && !DEAL_STAGES.includes(stage)) {
    errors.push(`Stage must be one of: ${DEAL_STAGES.join(', ')}`);
  }

  if (expectedCloseDate !== undefined && expectedCloseDate !== null && expectedCloseDate !== '') {
    const parsedDate = new Date(expectedCloseDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Invalid expectedCloseDate format (must be a valid date)');
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }

  next();
};

export const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Full name is required');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }

  next();
};
