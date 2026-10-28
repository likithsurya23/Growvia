import dotenv from 'dotenv';

// Load .env variables
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  LEADS_TABLE: process.env.LEADS_TABLE || 'Growvia-Leads',
  DEALS_TABLE: process.env.DEALS_TABLE || 'Growvia-Deals',
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT || undefined,
};

// Lead Statuses
export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Customer',
  'Lost'
];

// Deal Stages
export const DEAL_STAGES = [
  'Discovery',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost'
];
