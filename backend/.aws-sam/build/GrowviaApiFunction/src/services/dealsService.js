import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from '../config/dynamodb.js';
import { ENV } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';
import { LeadsService } from './leadsService.js';

export class DealsService {
  /**
   * Create a new deal
   */
  static async createDeal(data) {
    const now = new Date().toISOString();
    const id = `deal_${uuidv4()}`;

    let leadName = data.leadName || '';
    if (data.leadId && !leadName) {
      try {
        const lead = await LeadsService.getLeadById(data.leadId);
        leadName = lead.name;
      } catch (err) {
        // If lead doesn't exist, we don't necessarily block, but note it
        leadName = '';
      }
    }

    const newDeal = {
      id,
      title: data.title.trim(),
      value: Number(data.value) || 0,
      stage: data.stage || 'Discovery',
      leadId: data.leadId || null,
      leadName,
      expectedCloseDate: data.expectedCloseDate || null,
      notes: data.notes || '',
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: ENV.DEALS_TABLE,
      Item: newDeal,
    });

    await docClient.send(command);
    return newDeal;
  }

  /**
   * Get all deals with search, filtering, pagination, and soft deletion
   */
  static async getDeals({
    search = '',
    stage = '',
    leadId = '',
    minValue = null,
    maxValue = null,
    includeDeleted = false,
    limit = 20,
    nextToken = null,
  } = {}) {
    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Exclude soft-deleted deals unless explicitly requested
    if (!includeDeleted) {
      filterExpressions.push('(#isDeleted = :isDeletedFalse OR attribute_not_exists(#isDeleted))');
      expressionAttributeNames['#isDeleted'] = 'isDeleted';
      expressionAttributeValues[':isDeletedFalse'] = false;
    }

    // Filter by stage
    if (stage) {
      filterExpressions.push('#stage = :stageVal');
      expressionAttributeNames['#stage'] = 'stage';
      expressionAttributeValues[':stageVal'] = stage;
    }

    // Filter by leadId
    if (leadId) {
      filterExpressions.push('#leadId = :leadIdVal');
      expressionAttributeNames['#leadId'] = 'leadId';
      expressionAttributeValues[':leadIdVal'] = leadId;
    }

    // Value ranges
    if (minValue !== null && minValue !== undefined && !isNaN(Number(minValue))) {
      filterExpressions.push('#value >= :minVal');
      expressionAttributeNames['#value'] = 'value';
      expressionAttributeValues[':minVal'] = Number(minValue);
    }

    if (maxValue !== null && maxValue !== undefined && !isNaN(Number(maxValue))) {
      filterExpressions.push('#value <= :maxVal');
      expressionAttributeNames['#value'] = 'value';
      expressionAttributeValues[':maxVal'] = Number(maxValue);
    }

    // Search query on title or leadName
    if (search && search.trim() !== '') {
      filterExpressions.push('(contains(#title, :searchVal) OR contains(#leadName, :searchVal))');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeNames['#leadName'] = 'leadName';
      expressionAttributeValues[':searchVal'] = search.trim();
    }

    const scanParams = {
      TableName: ENV.DEALS_TABLE,
      Limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
    };

    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(' AND ');
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (nextToken) {
      try {
        scanParams.ExclusiveStartKey = JSON.parse(
          Buffer.from(nextToken, 'base64').toString('utf8')
        );
      } catch (err) {
        throw new AppError('Invalid pagination nextToken', 400);
      }
    }

    const command = new ScanCommand(scanParams);
    const result = await docClient.send(command);

    let nextTokenOut = null;
    if (result.LastEvaluatedKey) {
      nextTokenOut = Buffer.from(
        JSON.stringify(result.LastEvaluatedKey)
      ).toString('base64');
    }

    // Sort items by createdAt descending
    const items = (result.Items || []).sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    return {
      items,
      count: items.length,
      nextToken: nextTokenOut,
    };
  }

  /**
   * Get single deal by ID
   */
  static async getDealById(id, includeDeleted = false) {
    const command = new GetCommand({
      TableName: ENV.DEALS_TABLE,
      Key: { id },
    });

    const result = await docClient.send(command);
    const deal = result.Item;

    if (!deal || (!includeDeleted && deal.isDeleted)) {
      throw new AppError(`Deal with ID '${id}' not found`, 404);
    }

    return deal;
  }

  /**
   * Update deal
   */
  static async updateDeal(id, updates) {
    const existing = await this.getDealById(id);

    const allowedFields = ['title', 'value', 'stage', 'leadId', 'leadName', 'expectedCloseDate', 'notes'];
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;

        if (field === 'value') {
          expressionAttributeValues[`:${field}`] = Number(updates[field]) || 0;
        } else if (typeof updates[field] === 'string') {
          expressionAttributeValues[`:${field}`] = updates[field].trim();
        } else {
          expressionAttributeValues[`:${field}`] = updates[field];
        }
      }
    }

    // If leadId changed but leadName wasn't provided, refresh leadName
    if (updates.leadId && !updates.leadName) {
      try {
        const lead = await LeadsService.getLeadById(updates.leadId);
        updateExpressions.push('#leadName = :leadName');
        expressionAttributeNames['#leadName'] = 'leadName';
        expressionAttributeValues[':leadName'] = lead.name;
      } catch (err) {
        // ignore
      }
    }

    if (updateExpressions.length === 0) {
      return existing;
    }

    const now = new Date().toISOString();
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;

    const command = new UpdateCommand({
      TableName: ENV.DEALS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes;
  }

  /**
   * Soft-delete deal
   */
  static async softDeleteDeal(id) {
    await this.getDealById(id);

    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: ENV.DEALS_TABLE,
      Key: { id },
      UpdateExpression: 'SET #isDeleted = :isDeleted, #deletedAt = :deletedAt, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#isDeleted': 'isDeleted',
        '#deletedAt': 'deletedAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':deletedAt': now,
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    return result.Attributes;
  }
}
