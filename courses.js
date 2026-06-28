import express from 'express';
import { query, queryOne } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { requireValidUuidParam } from '../utils/validation.js';

const router = express.Router();

// List all tracks (e.g. German, French) with their levels
router.get('/tracks', async (req, res) => {
  try {
    const tracks = await query('SELECT * FROM tracks');
    const result = [];
    for (const t of tracks) {
      const levels = await query(
        'SELECT id, code, name, sort_order FROM levels WHERE track_id = $1 ORDER BY sort_order',
        [t.id]
      );
      result.push({
        id: t.id,
        language: t.language,
        name: t.name,
        examSystems: t.exam_systems, // jsonb comes back already parsed
        levels,
      });
    }
    res.json({ tracks: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load tracks.' });
  }
});

// List lessons for a level, including this user's progress on each
router.get('/levels/:levelId/lessons', requireAuth, requireValidUuidParam('levelId'), async (req, res) => {
  try {
    const lessons = await query('SELECT * FROM lessons WHERE level_id = $1 ORDER BY sort_order', [req.params.levelId]);
    const result = [];
    for (const l of lessons) {
      const progress = await queryOne(
        'SELECT completed, score FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
        [req.user.id, l.id]
      );
      const countRow = await queryOne('SELECT COUNT(*) as c FROM exercises WHERE lesson_id = $1', [l.id]);
      result.push({
        id: l.id,
        title: l.title,
        isFree: !!l.is_free,
        exerciseCount: Number(countRow.c),
        completed: !!progress?.completed,
        score: progress?.score ?? null,
      });
    }
    res.json({ lessons: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load lessons.' });
  }
});

// Get full exercises for a lesson (gated: premium lessons require subscription)
router.get('/lessons/:lessonId', requireAuth, requireValidUuidParam('lessonId'), async (req, res) => {
  try {
    const lesson = await queryOne('SELECT * FROM lessons WHERE id = $1', [req.params.lessonId]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    if (!lesson.is_free && !req.user.isPremium) {
      return res.status(403).json({ error: 'This lesson requires Premium.', requiresPremium: true });
    }

    const exercises = await query(
      'SELECT id, type, prompt, options_json FROM exercises WHERE lesson_id = $1 ORDER BY sort_order',
      [lesson.id]
    );
    res.json({
      lesson: { id: lesson.id, title: lesson.title, isFree: !!lesson.is_free },
      exercises: exercises.map(e => ({ id: e.id, type: e.type, prompt: e.prompt, options: e.options_json })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load lesson.' });
  }
});

async function updateStreak(userId) {
  const user = await queryOne('SELECT streak_count, last_active_date FROM users WHERE id = $1', [userId]);
  const today = new Date().toISOString().slice(0, 10);
  const lastActive = user.last_active_date ? new Date(user.last_active_date).toISOString().slice(0, 10) : null;
  if (lastActive === today) return; // already counted today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = lastActive === yesterday ? user.streak_count + 1 : 1;
  await query('UPDATE users SET streak_count = $1, last_active_date = $2 WHERE id = $3', [newStreak, today, userId]);
}

// Submit answers for a lesson, get score, save progress + update streak
router.post('/lessons/:lessonId/submit', requireAuth, requireValidUuidParam('lessonId'), async (req, res) => {
  try {
    const { answers } = req.body; // { exerciseId: chosenAnswer }
    const lesson = await queryOne('SELECT * FROM lessons WHERE id = $1', [req.params.lessonId]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });
    if (!lesson.is_free && !req.user.isPremium) {
      return res.status(403).json({ error: 'This lesson requires Premium.', requiresPremium: true });
    }

    const exercises = await query('SELECT id, answer FROM exercises WHERE lesson_id = $1', [lesson.id]);
    let correct = 0;
    for (const ex of exercises) {
      if (answers && answers[ex.id] === ex.answer) correct++;
    }
    const scorePercent = exercises.length ? Math.round((correct / exercises.length) * 100) : 0;
    const passed = scorePercent >= 70;

    const existing = await queryOne(
      'SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
      [req.user.id, lesson.id]
    );
    if (existing) {
      await query(
        `UPDATE user_progress SET completed = $1, score = GREATEST(score, $2), attempts = attempts + 1, last_attempt_at = now() WHERE id = $3`,
        [passed || existing.completed, scorePercent, existing.id]
      );
    } else {
      await query(
        `INSERT INTO user_progress (user_id, lesson_id, completed, score, attempts, last_attempt_at) VALUES ($1, $2, $3, $4, 1, now())`,
        [req.user.id, lesson.id, passed, scorePercent]
      );
    }

    await updateStreak(req.user.id);

    res.json({ scorePercent, correct, total: exercises.length, passed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit lesson.' });
  }
});

// Overall progress summary across all levels (for dashboard)
router.get('/progress/summary', requireAuth, async (req, res) => {
  try {
    const levels = await query('SELECT id, code, track_id FROM levels');
    const summary = [];
    for (const lvl of levels) {
      const totalRow = await queryOne('SELECT COUNT(*) as c FROM lessons WHERE level_id = $1', [lvl.id]);
      const completedRow = await queryOne(
        `SELECT COUNT(*) as c FROM user_progress up
         JOIN lessons l ON up.lesson_id = l.id
         WHERE l.level_id = $1 AND up.user_id = $2 AND up.completed = true`,
        [lvl.id, req.user.id]
      );
      const total = Number(totalRow.c);
      const completed = Number(completedRow.c);
      summary.push({
        levelId: lvl.id,
        code: lvl.code,
        totalLessons: total,
        completedLessons: completed,
        percent: total ? Math.round((completed / total) * 100) : 0,
      });
    }
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load progress summary.' });
  }
});

export default router;
