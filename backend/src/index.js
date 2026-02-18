import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import hdbRoutes from './routes/hdb.js';
import areasRoutes from './routes/areas.js';
import userRoutes from './routes/user.js';
import { startCronJobs } from './services/cronJobs.js';
import { initDatabase } from './services/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '../../frontend/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendPath));
}

import { existsSync } from 'fs';

app.get('/api/health', (_req, res) => {
  const geoPath = path.join(__dirname, 'data/planningAreaBoundaries.geojson');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    geoJsonExists: existsSync(geoPath),
    geoJsonPath: geoPath,
    cwd: process.cwd(),
    dirname: __dirname,
  });
});

app.use('/api/hdb', hdbRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/user', userRoutes);

// Serve frontend for all non-API routes in production (SPA fallback)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy: origin not allowed' });
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

async function start() {
  try {
    await initDatabase();
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    console.log('Server will start but database features may not work');
  }

  app.listen(PORT, () => {
    console.log(`SG Property Map backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    startCronJobs();
  });
}

start();

export default app;
