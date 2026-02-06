import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeDatabase } from './database.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import memoriesRoutes from './routes/memoriesRoutes.js';
import gratitudeRoutes from './routes/gratitudeRoutes.js';
import goalsRoutes from './routes/goalsRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import journeyRoutes from './routes/journeyRoutes.js';
import myJourneysRoutes from './routes/myJourneysRoutes.js';
import tasksRoutes from './routes/tasksRoutes.js';
import storiesRoutes from './routes/storiesRoutes.js';
import sparcPromptsRoutes from './routes/sparcPromptsRoutes.js';
import systemDesignRoutes from './routes/systemDesignRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDistPath));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/journal-entries', journalRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/gratitude', gratitudeRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/my-journeys', myJourneysRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/sparc-prompts', sparcPromptsRoutes);
app.use('/api/system-design', systemDesignRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Level Up Journal API is running' });
});

// SPA fallback for production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

// Export app for testing
export default app;

// Initialize database and start server (only when run directly)
const isRunDirectly = import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));
if (isRunDirectly) {
  console.log('Starting server initialization...');
  initializeDatabase()
    .then(() => {
      console.log('Database initialized, starting server...');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}
