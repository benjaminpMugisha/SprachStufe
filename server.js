import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSchema } from './db/database.js';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import examRoutes from './routes/exams.js';
import certificateRoutes from './routes/certificates.js';
import chatRoutes from './routes/chat.js';
import billingRoutes from './routes/billing.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/billing', billingRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 4000;

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Sprachstufe backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });
