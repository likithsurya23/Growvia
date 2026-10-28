import { LeadsService } from '../services/leadsService.js';
import { AppError } from '../middlewares/errorHandler.js';

export class LeadsController {
  /**
   * POST /api/leads
   */
  static async create(req, res, next) {
    try {
      const lead = await LeadsService.createLead(req.body);
      return res.status(201).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/leads
   */
  static async getAll(req, res, next) {
    try {
      const { search, status, company, includeDeleted, limit, nextToken } = req.query;

      const result = await LeadsService.getLeads({
        search,
        status,
        company,
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
   * GET /api/leads/:id
   */
  static async getById(req, res, next) {
    try {
      const id = req.params.id || req.query.id;
      if (!id) {
        throw new AppError('Lead ID is required', 400);
      }

      const includeDeleted =
        req.query.includeDeleted === 'true' || req.query.includeDeleted === true;

      const lead = await LeadsService.getLeadById(id, includeDeleted);
      return res.status(200).json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/leads/:id or PATCH /api/leads/:id
   */
  static async update(req, res, next) {
    try {
      const id = req.params.id || req.query.id;
      if (!id) {
        throw new AppError('Lead ID is required', 400);
      }

      const updatedLead = await LeadsService.updateLead(id, req.body);
      return res.status(200).json({
        success: true,
        data: updatedLead,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/leads/:id or DELETE /api/leads?id=:id
   */
  static async delete(req, res, next) {
    try {
      const id = req.params.id || req.query.id;
      if (!id) {
        throw new AppError('Lead ID is required', 400);
      }

      await LeadsService.softDeleteLead(id);
      return res.status(200).json({
        success: true,
        message: 'Lead soft-deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
