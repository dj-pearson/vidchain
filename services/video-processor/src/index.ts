import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { startWorker, stopWorker } from './queue/processor.js';
import processRoutes from './routes/process.routes.js';
import healthRoutes from './routes/health.routes.js';
import { apiKeyAuth, requestLogger } from './middleware/auth.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));
app.use(requestLogger);

// API key authentication
app.use(apiKeyAuth);

// Routes
app.use('/health', healthRoutes);
app.use('/process', processRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Graceful shutdown
let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  try {
    await stopWorker();
    console.log('Worker stopped');
  } catch (error) {
    console.error('Error stopping worker:', error);
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    // Start the worker
    startWorker();

    // Start the HTTP server
    app.listen(PORT, HOST, () => {
      console.log(`\n🎬 VidChain Video Processor Service`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Server running on http://${HOST}:${PORT}`);
      console.log(`\n   Endpoints:`);
      console.log(`   - POST /process - Queue a video for processing`);
      console.log(`   - GET  /process/:jobId - Get job status`);
      console.log(`   - POST /process/batch - Process multiple videos`);
      console.log(`   - POST /process/pending - Process all pending videos`);
      console.log(`   - GET  /health - Health check`);
      console.log(`   - GET  /health/ready - Readiness check`);
      console.log(`   - GET  /health/queue - Queue statistics\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
