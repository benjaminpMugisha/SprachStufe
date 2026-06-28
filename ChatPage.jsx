import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { colors, Spinner } from './Shared.jsx';
import { api } from '../api.js';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    api.getChatHistory()
      .then(res => setMessages(res.messages))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setSending(true);
    try {
      const { reply } = await api.sendChatMessage(text);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <div style={{ padding: '20px 0 12px' }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: colors.ink, margin: 0 }}>Tutor Chat</h2>
        <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 0' }}>
          Practice conversation, ask grammar questions, get gentle corrections.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
        {loading && <div style={{ textAlign: 'center', padding: 30 }}><Spinner /></div>}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: colors.muted, padding: '40px 20px', fontSize: 14 }}>
            Say "Hallo" to start practicing German, or ask about grammar, vocabulary, or exam tips.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%', padding: '12px 16px', borderRadius: 16, fontSize: 14.5, lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? colors.ink : '#fff',
              color: m.role === 'user' ? '#fff' : colors.ink,
              border: m.role === 'user' ? 'none' : `1px solid ${colors.border}`,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: 16, border: `1px solid ${colors.border}`, background: '#fff' }}>
              <Spinner size={16} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {error && <p style={{ color: colors.red, fontSize: 13, marginBottom: 8 }}>{error}</p>}

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, padding: '12px 0 20px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message in German or English…"
          style={{
            flex: 1, padding: '13px 16px', borderRadius: 14, border: `1.5px solid ${colors.border}`,
            fontSize: 14.5, outline: 'none', background: '#fff', color: colors.ink,
          }}
        />
        <button type="submit" disabled={sending || !input.trim()} style={{
          width: 48, height: 48, borderRadius: 14, border: 'none',
          background: sending || !input.trim() ? colors.lockedBg : colors.ink,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', flexShrink: 0,
        }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
