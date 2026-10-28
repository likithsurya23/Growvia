import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ENV } from './env.js';

const clientConfig = {
  region: ENV.AWS_REGION,
};

// If local DynamoDB endpoint is specified (e.g., http://localhost:8000), use it
if (ENV.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = ENV.DYNAMODB_ENDPOINT;
}

// Instantiate low-level DynamoDB client using standard AWS credential provider chain
const rawClient = new DynamoDBClient(clientConfig);

// Create Document Client for simplified JS object handling
export const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export { rawClient };
