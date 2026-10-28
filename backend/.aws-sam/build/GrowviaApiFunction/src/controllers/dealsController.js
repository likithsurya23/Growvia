import { DealsService } from '../services/dealsService.js';
import { AppError } from '../middlewares/errorHandler.js';

export class DealsController {
  /**
   * POST /api/deals
   */
  static async create(req, res, next) {
    try {
      const deal = await DealsService.createDeal(req.body);
      return res.status(201).json({
        success: true,
        data: deal,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/deals
   */
  static async getAll(req, res, next) {
    try {
      const {
        search,
        stage,
        leadId,
        minValue,
        maxValue,
        includeDeleted,
        limit,
        nextToken,
      } = req.query;

      const result = await DealsService.getDeals({
        search,
        stage,
        leadId,
        minValue,
        maxValue,
        includeDeleted: includeDeleted === 'true' || includeDeleted === true,
        limit: limit ? parseInt(limit, 10) : 20,
        nextToken,
      });

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          count: result.count,
          nextToken: result.nextToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/deals/:id
   */
  static async getById(req, res, next) {
    try {
      const id = req.params.id || req.query.id;
      if (!id) {
        throw new AppError('Deal ID is required', 400);
      }

      const includeDeleted =
        req.query.includeDeleted === 'true' || req.query.includeDeleted === true;

      const deal = await DealsService.getDealById(id, includeDeleted);
      return res.status(200).json({
        success: true,
        data: deal,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/deals/:id or PATCH /api/deals/:id
   */
  static async update(req, res, next) {
    try {
      const id = req.params.id || req.query.id;
      if (!id) {
        throw new AppError('Deal ID is required', 400);
      }

      const updatedDeal = await DealsService.updateDeal(id, req.body);
      return res.status(200).json({
        success: true,
        data: updatedDeal,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/deals/:id or DELETE /api/deals?id=:id
   */
  static async delete(req, res, next) {
    try {
      const id = req.params.id || req.query.id;
      if (!id) {
        throw new AppError('Deal ID is required', 400);
      }

      await DealsService.softDeleteDeal(id);
      return res.status(200).json({
        success: true,
        message: 'Deal soft-deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
