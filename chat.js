import express from 'express';
import { query } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const SYSTEM_PROMPT = `You are a friendly, encouraging language tutor on the Sprachstufe app, helping people learn German (and sometimes French) from A1 to C1.
Rules:
- Reply primarily in German (or French if the user is in the French track), but include brief English explanations in parentheses for beginners (A1/A2).
- Keep responses short and conversational, like a real tutor chatting, not a lecture.
- Correct mistakes gently: show the corrected sentence, then a one-line explanation of the grammar rule.
- If asked about exam formats (Goethe, telc, TestDaF, DELF), explain honestly that you can give practice and tips but the user should verify exact current exam rules on the official institution's site.
- Never claim to be able to issue official certificates yourself.`;

router.get('/history', requireAuth, async (req, res) => {
  try {
    const messages = await query(
      'SELECT role, content, created_at FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100',
      [req.user.id]
    );
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load chat history.' });
  }
});

router.post('/message', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Add it to your .env file.' });
    }

    await query(`INSERT INTO chat_messages (user_id, role, content) VALUES ($1, 'user', $2)`, [req.user.id, message]);

    const history = await query(
      'SELECT role, content FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 20',
      [req.user.id]
    );

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', errBody);
      return res.status(502).json({ error: 'The chat tutor is temporarily unavailable.' });
    }

    const data = await response.json();
    const reply = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');

    await query(`INSERT INTO chat_messages (user_id, role, content) VALUES ($1, 'assistant', $2)`, [req.user.id, reply]);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'The chat tutor is temporarily unavailable.' });
  }
});

export default router;
