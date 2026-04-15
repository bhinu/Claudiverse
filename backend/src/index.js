import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb, closeDb } from './db/connection.js';
import { errorHandler } from './middleware/errorHandler.js';
import studentsRouter from './routes/students.js';
import suggestionsRouter from './routes/suggestions.js';
import anchorsRouter from './routes/anchors.js';
import interactionsRouter from './routes/interactions.js';
import dashboardRouter from './routes/dashboard.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from project root
import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Initialize database
getDb();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', product: 'Anchor OS', version: '1.0.0' });
});

// Routes
app.use('/api/students', studentsRouter);
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/anchors', anchorsRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/dashboard', dashboardRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Anchor OS backend running on http://localhost:${PORT}`);
  console.log(`Azure OpenAI endpoint: ${process.env.AZURE_OPENAI_ENDPOINT || 'NOT SET'}`);
  console.log(`Deployment: ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'NOT SET'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});
