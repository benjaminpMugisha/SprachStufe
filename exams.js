import express from 'express';
import { query, queryOne } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { requireValidUuidParam } from '../utils/validation.js';

const router = express.Router();

// List available mock exams, optionally filtered by exam_system or level
router.get('/', requireAuth, async (req, res) => {
  try {
    const { examSystem, level } = req.query;
    let exams = await query('SELECT * FROM mock_exams');
    if (examSystem) exams = exams.filter(e => e.exam_system === examSystem);
    if (level) exams = exams.filter(e => e.level_code === level);

    res.json({
      exams: exams.map(e => ({
        id: e.id,
        examSystem: e.exam_system,
        levelCode: e.level_code,
        title: e.title,
        isFree: !!e.is_free,
        sectionCount: e.sections_json.length,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load exams.' });
  }
});

// Get full exam content (gated by premium unless free)
router.get('/:examId', requireAuth, requireValidUuidParam('examId'), async (req, res) => {
  try {
    const exam = await queryOne('SELECT * FROM mock_exams WHERE id = $1', [req.params.examId]);
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    if (!exam.is_free && !req.user.isPremium) {
      return res.status(403).json({ error: 'This mock exam requires Premium.', requiresPremium: true });
    }

    const sections = exam.sections_json.map((section, sIdx) => ({
      name: section.name,
      questions: section.questions.map((q, qIdx) => ({
        id: `${sIdx}-${qIdx}`,
        prompt: q.prompt,
        options: q.options,
      })),
    }));

    res.json({
      exam: { id: exam.id, examSystem: exam.exam_system, levelCode: exam.level_code, title: exam.title },
      sections,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load exam.' });
  }
});

// Submit a completed exam attempt, get scored, and a certificate is generated if passed
router.post('/:examId/submit', requireAuth, requireValidUuidParam('examId'), async (req, res) => {
  try {
    const { answers } = req.body; // { "sectionIdx-questionIdx": "chosen option" }
    const exam = await queryOne('SELECT * FROM mock_exams WHERE id = $1', [req.params.examId]);
    if (!exam) return res.status(404).json({ error: 'Exam not found.' });
    if (!exam.is_free && !req.user.isPremium) {
      return res.status(403).json({ error: 'This mock exam requires Premium.', requiresPremium: true });
    }

    const sections = exam.sections_json;
    let total = 0, correct = 0;
    sections.forEach((section, sIdx) => {
      section.questions.forEach((q, qIdx) => {
        total++;
        const key = `${sIdx}-${qIdx}`;
        if (answers && answers[key] === q.answer) correct++;
      });
    });

    const scorePercent = total ? Math.round((correct / total) * 100) : 0;
    const passed = scorePercent >= 60;

    const attempt = await queryOne(
      `INSERT INTO exam_attempts (user_id, exam_id, answers_json, score_percent, passed, completed_at)
       VALUES ($1, $2, $3, $4, $5, now()) RETURNING id`,
      [req.user.id, exam.id, JSON.stringify(answers || {}), scorePercent, passed]
    );

    let certificate = null;
    if (passed) {
      const serial = `SPR-${exam.level_code}-${Date.now().toString(36).toUpperCase()}`;
      const cert = await queryOne(
        `INSERT INTO certificates (user_id, exam_attempt_id, certificate_type, level_code, score_percent, serial_number)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [req.user.id, attempt.id, exam.exam_system, exam.level_code, scorePercent, serial]
      );
      certificate = { id: cert.id, serialNumber: serial };
    }

    res.json({ scorePercent, correct, total, passed, attemptId: attempt.id, certificate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit exam.' });
  }
});

export default router;
