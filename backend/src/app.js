import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import leadsRoutes from './routes/leadsRoutes.js';
import dealsRoutes from './routes/dealsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import activitiesRoutes from './routes/activitiesRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Growvia CRM API is running healthy',
    timestamp: new Date().toISOString(),
  });
};
app.get('/health', healthHandler);

// API Routes mounted at /api/*
app.use('/api/auth', authRoutes);

app.use('/api/leads', leadsRoutes);

app.use('/api/deals', dealsRoutes);

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/activities', activitiesRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
