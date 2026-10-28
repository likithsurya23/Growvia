import { LeadsService } from './leadsService.js';
import { DealsService } from './dealsService.js';
import { DEAL_STAGES, LEAD_STATUSES } from '../config/env.js';

export class DashboardService {
  /**
   * Calculate CRM metrics, lead statistics, deal pipeline value, and breakdowns
   */
  static async getDashboardMetrics() {
    // Fetch all active (non-deleted) leads and deals
    const [leadsResponse, dealsResponse] = await Promise.all([
      LeadsService.getLeads({ limit: 100, includeDeleted: false }),
      DealsService.getDeals({ limit: 100, includeDeleted: false }),
    ]);

    const leads = leadsResponse.items || [];
    const deals = dealsResponse.items || [];

    // Lead metrics
    const totalLeads = leads.length;
    const leadsByStatus = {};
    for (const status of LEAD_STATUSES) {
      leadsByStatus[status] = 0;
    }
    leads.forEach((l) => {
      const status = l.status || 'New';
      leadsByStatus[status] = (leadsByStatus[status] || 0) + 1;
    });

    const newLeadsCount = leadsByStatus['New'] || 0;
    const qualifiedLeadsCount = leadsByStatus['Qualified'] || 0;
    const customerLeadsCount = leadsByStatus['Customer'] || 0;
    const leadConversionRate =
      totalLeads > 0
        ? Number(((customerLeadsCount / totalLeads) * 100).toFixed(1))
        : 0;

    // Deal metrics
    const totalDeals = deals.length;
    const dealsByStage = {};
    const dealValueByStage = {};

    for (const stage of DEAL_STAGES) {
      dealsByStage[stage] = 0;
      dealValueByStage[stage] = 0;
    }

    let totalPipelineValue = 0; // Value of all open (non-closed) deals
    let totalDealValue = 0;     // Value of all deals
    let wonDealsCount = 0;
    let wonDealsValue = 0;
    let lostDealsCount = 0;
    let lostDealsValue = 0;

    deals.forEach((deal) => {
      const val = Number(deal.value) || 0;
      const stage = deal.stage || 'Discovery';

      totalDealValue += val;
      dealsByStage[stage] = (dealsByStage[stage] || 0) + 1;
      dealValueByStage[stage] = (dealValueByStage[stage] || 0) + val;

      if (stage === 'Won') {
        wonDealsCount++;
        wonDealsValue += val;
      } else if (stage === 'Lost') {
        lostDealsCount++;
        lostDealsValue += val;
      } else {
        // Open deal in active pipeline
        totalPipelineValue += val;
      }
    });

    const closedDealsCount = wonDealsCount + lostDealsCount;
    const winRate =
      closedDealsCount > 0
        ? Number(((wonDealsCount / closedDealsCount) * 100).toFixed(1))
        : totalDeals > 0
        ? Number(((wonDealsCount / totalDeals) * 100).toFixed(1))
        : 0;

    const averageDealSize =
      wonDealsCount > 0
        ? Math.round(wonDealsValue / wonDealsCount)
        : totalDeals > 0
        ? Math.round(totalDealValue / totalDeals)
        : 0;

    const stageBreakdown = DEAL_STAGES.map((stage) => ({
      stage,
      count: dealsByStage[stage] || 0,
      value: dealValueByStage[stage] || 0,
    }));

    // Recent items
    const recentLeads = leads.slice(0, 5).map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      status: l.status,
      createdAt: l.createdAt,
    }));

    const recentDeals = deals.slice(0, 5).map((d) => ({
      id: d.id,
      title: d.title,
      value: d.value,
      stage: d.stage,
      leadName: d.leadName,
      createdAt: d.createdAt,
    }));

    return {
      summary: {
        totalLeads,
        newLeadsCount,
        qualifiedLeadsCount,
        customerLeadsCount,
        leadConversionRate,
        totalDeals,
        totalPipelineValue,
        wonDealsCount,
        wonDealsValue,
        lostDealsCount,
        lostDealsValue,
        winRate,
        averageDealSize,
      },
      leadsByStatus,
      dealsByStage,
      stageBreakdown,
      recentLeads,
      recentDeals,
    };
  }
}
