import { LeadsService } from '../services/leadsService.js';
import { DealsService } from '../services/dealsService.js';

export class ActivitiesController {
  /**
   * GET /api/activities
   * Synthesizes recent activities from CRM records for frontend compatibility
   */
  static async getAll(req, res, next) {
    try {
      const [leadsRes, dealsRes] = await Promise.all([
        LeadsService.getLeads({ limit: 20, includeDeleted: true }),
        DealsService.getDeals({ limit: 20, includeDeleted: true }),
      ]);

      const activities = [];

      for (const lead of leadsRes.items || []) {
        if (lead.createdAt) {
          activities.push({
            id: `act_lead_create_${lead.id}`,
            description: `Added new lead: ${lead.name}`,
            type: 'lead',
            relatedId: lead.id,
            relatedName: lead.name,
            timestamp: lead.createdAt,
          });
        }
        if (lead.isDeleted && lead.deletedAt) {
          activities.push({
            id: `act_lead_del_${lead.id}`,
            description: `Removed lead: ${lead.name}`,
            type: 'lead',
            relatedId: lead.id,
            relatedName: lead.name,
            timestamp: lead.deletedAt,
          });
        }
      }

      for (const deal of dealsRes.items || []) {
        if (deal.createdAt) {
          activities.push({
            id: `act_deal_create_${deal.id}`,
            description: `Created new deal: ${deal.title} ($${Number(deal.value || 0).toLocaleString()})`,
            type: 'deal',
            relatedId: deal.id,
            relatedName: deal.title,
            timestamp: deal.createdAt,
          });
        }
        if (deal.isDeleted && deal.deletedAt) {
          activities.push({
            id: `act_deal_del_${deal.id}`,
            description: `Removed deal: ${deal.title}`,
            type: 'deal',
            relatedId: deal.id,
            relatedName: deal.title,
            timestamp: deal.deletedAt,
          });
        }
      }

      // Sort activities descending by timestamp
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return res.status(200).json({
        success: true,
        data: activities.slice(0, 30),
      });
    } catch (error) {
      next(error);
    }
  }
}
