# Growvia CRM Backend API

Serverless REST API for Growvia CRM built with Node.js 24 (ES Modules), Express.js, AWS Lambda, API Gateway, DynamoDB, and AWS SDK v3.

---

## 📁 Architecture & File Structure

```text
backend/
├── .env                  # Local environment configuration
├── .env.example          # Environment variables reference
├── package.json          # Dependencies & scripts
├── template.yaml         # AWS SAM CloudFormation infrastructure template
└── src/
    ├── app.js            # Express application setup, middlewares & route mounting
    ├── local.js          # Local development server entrypoint
    ├── handler.js        # AWS Lambda serverless-http entrypoint
    ├── config/
    │   ├── env.js        # Environment variables & CRM domain constants
    │   └── dynamodb.js   # DynamoDBClient & DynamoDBDocumentClient (AWS SDK v3)
    ├── middlewares/
    │   ├── errorHandler.js # Centralized error handling & custom AppError
    │   └── validation.js   # Input validation for Leads & Deals
    ├── services/
    │   ├── leadsService.js     # DynamoDB operations for Leads (CRUD, search, pagination, soft-delete)
    │   ├── dealsService.js     # DynamoDB operations for Deals (CRUD, pipeline, stages, soft-delete)
    │   └── dashboardService.js # CRM metrics, conversion rates, and pipeline valuation
    ├── controllers/
    │   ├── leadsController.js      # Leads request/response handling
    │   ├── dealsController.js      # Deals request/response handling
    │   ├── dashboardController.js  # Dashboard metrics handling
    │   └── activitiesController.js # Activity feed handler
    └── routes/
        ├── leadsRoutes.js      # /api/leads endpoints
        ├── dealsRoutes.js      # /api/deals endpoints
        ├── dashboardRoutes.js  # /api/dashboard endpoints
        └── activitiesRoutes.js # /api/activities endpoints
```

---

## ⚙️ Prerequisites & Setup

### 1. Environment Configuration

Create or update `.env` in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
AWS_REGION=us-east-1
LEADS_TABLE=Growvia-Leads
DEALS_TABLE=Growvia-Deals

# Optional: If testing locally with DynamoDB Local
# DYNAMODB_ENDPOINT=http://localhost:8000
```

### 2. AWS Credentials

AWS SDK v3 relies on the AWS Default Credential Provider Chain. **Credentials are never hardcoded.**

Ensure your AWS credentials are configured via any of the standard mechanisms:
- AWS CLI: `aws configure`
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optional `AWS_SESSION_TOKEN`
- IAM Role for Amazon EC2 or AWS Lambda execution role

---

## 🚀 Running Locally

```bash
# Start local development server with live reloading
npm run dev

# Or start in standard mode
npm start
```

The server starts on `http://localhost:5000`.

---

## ☁️ AWS SAM Deployment

Deploy the stack (Lambda + API Gateway + DynamoDB Tables + IAM Roles) using AWS SAM CLI:

```bash
# 1. Build the SAM application
sam build

# 2. Deploy guided (first time)
sam deploy --guided

# 3. Subsequent deployments
sam deploy
```

---

## 🧪 API Endpoints & Curl Examples

### Health Check

```bash
curl -X GET http://localhost:5000/health
```

---

### Leads APIs

#### 1. Create a Lead
```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@acme.com",
    "company": "Acme Corp",
    "phone": "+1 555-0199",
    "status": "Qualified",
    "source": "Website",
    "notes": "Interested in enterprise plan"
  }'
```

#### 2. Get All Leads (Filtering, Search, Pagination)
```bash
# Basic list (excludes soft-deleted items)
curl -X GET http://localhost:5000/api/leads

# Filter by status and search keyword
curl -X GET "http://localhost:5000/api/leads?status=Qualified&search=Acme"

# Pagination
curl -X GET "http://localhost:5000/api/leads?limit=10"

# Include soft-deleted leads
curl -X GET "http://localhost:5000/api/leads?includeDeleted=true"
```

#### 3. Get Single Lead by ID
```bash
curl -X GET http://localhost:5000/api/leads/<LEAD_ID>
```

#### 4. Update a Lead
```bash
curl -X PUT http://localhost:5000/api/leads/<LEAD_ID> \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Proposal",
    "notes": "Sent customized enterprise proposal"
  }'
```

#### 5. Soft-Delete a Lead
```bash
# REST route
curl -X DELETE http://localhost:5000/api/leads/<LEAD_ID>

# Query-param route (frontend compatible)
curl -X DELETE "http://localhost:5000/api/leads?id=<LEAD_ID>"
```

---

### Deals APIs

#### 1. Create a Deal
```bash
curl -X POST http://localhost:5000/api/deals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Enterprise Cloud Migration",
    "value": 45000,
    "stage": "Proposal",
    "leadId": "<LEAD_ID>",
    "expectedCloseDate": "2026-12-15T00:00:00.000Z",
    "notes": "Key decision maker is VP of Engineering"
  }'
```

#### 2. Get All Deals (Filtering, Value Ranges, Search)
```bash
# Basic list (excludes soft-deleted items)
curl -X GET http://localhost:5000/api/deals

# Filter by stage and minimum value
curl -X GET "http://localhost:5000/api/deals?stage=Proposal&minValue=10000"

# Filter by associated lead
curl -X GET "http://localhost:5000/api/deals?leadId=<LEAD_ID>"

# Include soft-deleted deals
curl -X GET "http://localhost:5000/api/deals?includeDeleted=true"
```

#### 3. Get Single Deal by ID
```bash
curl -X GET http://localhost:5000/api/deals/<DEAL_ID>
```

#### 4. Update a Deal (e.g., Move Stage or Value)
```bash
curl -X PUT http://localhost:5000/api/deals/<DEAL_ID> \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "Won",
    "value": 48000
  }'
```

#### 5. Soft-Delete a Deal
```bash
# REST route
curl -X DELETE http://localhost:5000/api/deals/<DEAL_ID>

# Query-param route (frontend compatible)
curl -X DELETE "http://localhost:5000/api/deals?id=<DEAL_ID>"
```

---

### Dashboard & Analytics API

```bash
curl -X GET http://localhost:5000/api/dashboard
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalLeads": 12,
      "newLeadsCount": 4,
      "qualifiedLeadsCount": 5,
      "customerLeadsCount": 3,
      "leadConversionRate": 25.0,
      "totalDeals": 8,
      "totalPipelineValue": 125000,
      "wonDealsCount": 2,
      "wonDealsValue": 68000,
      "lostDealsCount": 1,
      "lostDealsValue": 15000,
      "winRate": 66.7,
      "averageDealSize": 34000
    },
    "leadsByStatus": {
      "New": 4,
      "Contacted": 0,
      "Qualified": 5,
      "Proposal": 0,
      "Customer": 3,
      "Lost": 0
    },
    "dealsByStage": {
      "Discovery": 1,
      "Proposal": 3,
      "Negotiation": 1,
      "Won": 2,
      "Lost": 1
    },
    "stageBreakdown": [
      { "stage": "Discovery", "count": 1, "value": 15000 },
      { "stage": "Proposal", "count": 3, "value": 85000 },
      { "stage": "Negotiation", "count": 1, "value": 25000 },
      { "stage": "Won", "count": 2, "value": 68000 },
      { "stage": "Lost", "count": 1, "value": 15000 }
    ],
    "recentLeads": [...],
    "recentDeals": [...]
  }
}
```

---

### CRM Activity Feed API

```bash
curl -X GET http://localhost:5000/api/activities
```
