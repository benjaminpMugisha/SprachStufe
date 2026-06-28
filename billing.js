import express from 'express';
import { query, queryOne } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { signToken, publicUser } from '../utils/tokens.js';

const router = express.Router();

// MVP placeholder: instantly grants Premium. Replace this with a real Stripe
// webhook handler before taking real payments — see README for notes.
router.post('/upgrade', requireAuth, async (req, res) => {
  try {
    const until = new Date(Date.now() + 30 * 86400000).toISOString();
    await query('UPDATE users SET is_premium = true, premium_until = $1 WHERE id = $2', [until, req.user.id]);
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not upgrade account.' });
  }
});

router.post('/cancel', requireAuth, async (req, res) => {
  try {
    await query('UPDATE users SET is_premium = false, premium_until = NULL WHERE id = $1', [req.user.id]);
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not cancel premium.' });
  }
});

export default router;
