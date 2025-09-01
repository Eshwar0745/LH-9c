import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Import routes
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Local Hands API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

// Import and export triggers
export * from './triggers';
