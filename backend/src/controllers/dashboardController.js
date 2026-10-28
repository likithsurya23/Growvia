import { DashboardService } from '../services/dashboardService.js';

export class DashboardController {
  /**
   * GET /api/dashboard
   */
  static async getMetrics(req, res, next) {
    try {
      const metrics = await DashboardService.getDashboardMetrics();
      return res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}
