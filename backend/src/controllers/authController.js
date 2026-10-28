import { AuthService } from '../services/authService.js';

export class AuthController {
  /**
   * POST /api/auth/signup
   */
  static async signup(req, res, next) {
    try {
      const { name, email, password, company } = req.body;
      const result = await AuthService.signup({ name, email, password, company });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me (Protected by requireAuth)
   */
  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
