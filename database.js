import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env. Get a connection string from Supabase or Neon.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// Convenience wrappers used throughout the routes
export async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export async function initSchema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_premium BOOLEAN DEFAULT FALSE,
      premium_until TIMESTAMPTZ,
      streak_count INTEGER DEFAULT 0,
      last_active_date DATE,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      language TEXT NOT NULL,
      name TEXT NOT NULL,
      exam_systems JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS levels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_free BOOLEAN DEFAULT FALSE,
      sort_order INTEGER NOT NULL,
      content_json JSONB DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      options_json JSONB,
      answer TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      completed BOOLEAN DEFAULT FALSE,
      score INTEGER,
      attempts INTEGER DEFAULT 0,
      last_attempt_at TIMESTAMPTZ,
      UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS mock_exams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      exam_system TEXT NOT NULL,
      level_code TEXT NOT NULL,
      title TEXT NOT NULL,
      sections_json JSONB NOT NULL,
      is_free BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS exam_attempts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
      answers_json JSONB,
      score_percent INTEGER,
      passed BOOLEAN,
      started_at TIMESTAMPTZ DEFAULT now(),
      completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exam_attempt_id UUID REFERENCES exam_attempts(id) ON DELETE SET NULL,
      certificate_type TEXT NOT NULL,
      level_code TEXT NOT NULL,
      score_percent INTEGER,
      issued_at TIMESTAMPTZ DEFAULT now(),
      serial_number TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_levels_track ON levels(track_id);
    CREATE INDEX IF NOT EXISTS idx_lessons_level ON lessons(level_id);
    CREATE INDEX IF NOT EXISTS idx_exercises_lesson ON exercises(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON exam_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
  `);
}
