import dotenv from 'dotenv';

// Load .env variables
dotenv.config();

export const ENV = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  AWS_REGION: process.env.AWS_REGION,
  LEADS_TABLE: process.env.LEADS_TABLE,
  DEALS_TABLE: process.env.DEALS_TABLE,
  USERS_TABLE: process.env.USERS_TABLE,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT,
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
