import serverless from 'serverless-http';
import app from './app.js';

// Serverless HTTP wrapper for AWS Lambda
export const handler = serverless(app);
