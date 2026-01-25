import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/database';
import { scheduler } from './scheduler';
import { logger } from './utils/logger';
import { perfMonitor } from './utils/performance';
import passport from './config/passport';

// Routes
import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import referenceRoutes from './routes/reference';
import racesRoutes from './routes/races';
import seasonPredictionsRoutes from './routes/seasonPredictions';
import racePredictionsRoutes from './routes/racePredictions';
import crazyPredictionsRoutes from './routes/crazyPredictions';
import adminRoutes from './routes/admin';
import leaderboardRoutes from './routes/leaderboard';
import leaguesRoutes from './routes/leagues';
import feedbackRoutes from './routes/feedback';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4001', 10);

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4000',
  'http://localhost:4000',
  'http://localhost:5173'
];

logger.log('🌐 CORS Configuration:');
logger.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
logger.log('  Allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.log(`CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Performance monitoring middleware
app.use((req, res, next) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Store requestId on request object for use in controllers
  (req as any).requestId = requestId;

  // Start performance tracking
  perfMonitor.startRequest(requestId);
  logger.log(`→ ${req.method} ${req.path}`);

  // Capture response finish
  const originalSend = res.send;
  res.send = function(data) {
    const metrics = perfMonitor.endRequest(requestId);

    if (metrics) {
      const { totalDuration, breakdown } = metrics;

      // Add performance headers
      res.setHeader('X-Response-Time', `${totalDuration}ms`);
      if (breakdown) {
        res.setHeader('X-Performance-Breakdown', breakdown);
      }

      // Log performance
      const performanceEmoji = totalDuration < 100 ? '⚡' : totalDuration < 500 ? '✓' : '⚠️';
      logger.log(`${performanceEmoji} ${req.method} ${req.path} - ${totalDuration}ms ${breakdown ? `(${breakdown})` : ''}`);
    }

    return originalSend.call(this, data);
  };

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Performance stats endpoint (for monitoring)
app.get('/api/admin/performance-stats', (req, res) => {
  const { f1ApiService } = require('./services/f1ApiService');
  const cacheStats = f1ApiService.getCacheStats();

  res.json({
    cache: cacheStats,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', referenceRoutes);
app.use('/api/races', racesRoutes);
app.use('/api/seasons', seasonPredictionsRoutes);
app.use('/api/races', racePredictionsRoutes);
app.use('/api/crazy-predictions', crazyPredictionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/leagues', leaguesRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Initialize database and start server
async function start() {
  try {
    // Run migrations and create admin user
    await initializeDatabase();

    // Initialize scheduler
    scheduler.init();

    // Start server - Railway will handle routing
    const server = app.listen(PORT, () => {
      const address = server.address();
      logger.log(`🏎️  F1 Tipping API server running on port ${PORT}`);
      logger.log(`🔌 Server address:`, address);
      logger.log(`📊 Health check: http://localhost:${PORT}/health`);
      logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
