import { AuthService } from '../services/authService.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware to require a valid JWT token
 */
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }

    if (!token) {
      throw new AppError('Authentication required. Please provide a valid Bearer token.', 401);
    }

    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication: attaches user if token is valid, continues if not
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }

    if (token) {
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
    }
  } catch (error) {
    // If token invalid in optional mode, continue without attaching user
    req.user = null;
  }
  next();
};
