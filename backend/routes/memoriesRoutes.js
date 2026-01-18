import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { mkdir } from 'fs/promises';
import db from '../database.js';
import { authenticateToken } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Allowed file types for uploads
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Configure multer for file uploads with file type validation
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = join(__dirname, '..', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = extname(file.originalname).toLowerCase();
  if (ALLOWED_IMAGE_TYPES.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// Get all memories
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM memories WHERE user_id = ? ORDER BY memory_date DESC, created_at DESC',
    [req.user.userId],
    (err, memories) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching memories' });
      }
      res.json(memories);
    }
  );
});

// Create memory with photo upload
router.post('/', authenticateToken, upload.single('photo'), (req, res) => {
  const { title, description, memoryDate } = req.body;
  const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    'INSERT INTO memories (user_id, title, description, photo_path, memory_date) VALUES (?, ?, ?, ?, ?)',
    [req.user.userId, title, description, photoPath, memoryDate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating memory' });
      }
      res.json({
        id: this.lastID,
        title,
        description,
        photoPath,
        memoryDate
      });
    }
  );
});

// Delete memory
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM memories WHERE id = ? AND user_id = ?',
    [id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting memory' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Memory not found' });
      }
      res.json({ message: 'Memory deleted successfully' });
    }
  );
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

export default router;
