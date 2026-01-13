import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/database';

// Routes
import authRoutes from './routes/auth';
import referenceRoutes from './routes/reference';
import racesRoutes from './routes/races';
import seasonPredictionsRoutes from './routes/seasonPredictions';
import racePredictionsRoutes from './routes/racePredictions';
import crazyPredictionsRoutes from './routes/crazyPredictions';
import adminRoutes from './routes/admin';
import leaderboardRoutes from './routes/leaderboard';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', referenceRoutes);
app.use('/api/races', racesRoutes);
app.use('/api/seasons', seasonPredictionsRoutes);
app.use('/api/races', racePredictionsRoutes);
app.use('/api/crazy-predictions', crazyPredictionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Initialize database and start server
async function start() {
  try {
    // Run migrations and create admin user
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🏎️  F1 Tipping API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
