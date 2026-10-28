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

export class LeadsService {
  /**
   * Create a new lead
   */
  static async createLead(data) {
    const now = new Date().toISOString();
    const id = `lead_${uuidv4()}`;

    const newLead = {
      id,
      name: data.name.trim(),
      email: data.email ? data.email.trim() : '',
      company: data.company ? data.company.trim() : '',
      phone: data.phone ? data.phone.trim() : '',
      status: data.status || 'New',
      source: data.source || 'Website',
      notes: data.notes || '',
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: ENV.LEADS_TABLE,
      Item: newLead,
    });

    await docClient.send(command);
    return newLead;
  }

  /**
   * Get all leads with search, filtering, pagination, and soft-delete handling
   */
  static async getLeads({
    search = '',
    status = '',
    company = '',
    includeDeleted = false,
    limit = 20,
    nextToken = null,
  } = {}) {
    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Exclude soft-deleted leads unless explicitly requested
    if (!includeDeleted) {
      filterExpressions.push('(#isDeleted = :isDeletedFalse OR attribute_not_exists(#isDeleted))');
      expressionAttributeNames['#isDeleted'] = 'isDeleted';
      expressionAttributeValues[':isDeletedFalse'] = false;
    }

    // Filter by status
    if (status) {
      filterExpressions.push('#status = :statusVal');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':statusVal'] = status;
    }

    // Filter by company
    if (company) {
      filterExpressions.push('contains(#company, :companyVal)');
      expressionAttributeNames['#company'] = 'company';
      expressionAttributeValues[':companyVal'] = company;
    }

    // Search query on name, email, or company
    if (search && search.trim() !== '') {
      filterExpressions.push(
        '(contains(#name, :searchVal) OR contains(#email, :searchVal) OR contains(#company, :searchVal))'
      );
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeNames['#email'] = 'email';
      expressionAttributeNames['#company'] = 'company';
      expressionAttributeValues[':searchVal'] = search.trim();
    }

    const scanParams = {
      TableName: ENV.LEADS_TABLE,
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
   * Get single lead by ID
   */
  static async getLeadById(id, includeDeleted = false) {
    const command = new GetCommand({
      TableName: ENV.LEADS_TABLE,
      Key: { id },
    });

    const result = await docClient.send(command);
    const lead = result.Item;

    if (!lead || (!includeDeleted && lead.isDeleted)) {
      throw new AppError(`Lead with ID '${id}' not found`, 404);
    }

    return lead;
  }

  /**
   * Update lead
   */
  static async updateLead(id, updates) {
    // First verify lead exists and is not soft deleted
    const existing = await this.getLeadById(id);

    const allowedFields = ['name', 'email', 'company', 'phone', 'status', 'source', 'notes'];
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] =
          typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
      }
    }

    if (updateExpressions.length === 0) {
      return existing;
    }

    // Always update updatedAt timestamp
    const now = new Date().toISOString();
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;

    const command = new UpdateCommand({
      TableName: ENV.LEADS_TABLE,
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
   * Soft-delete lead
   */
  static async softDeleteLead(id) {
    // Check if exists
    await this.getLeadById(id);

    const now = new Date().toISOString();
    const command = new UpdateCommand({
      TableName: ENV.LEADS_TABLE,
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
