import React, { useState } from 'react';
import { Logo, colors, PrimaryButton } from './Shared.jsx';
import { useAuth } from '../AuthContext.jsx';

const inputStyle = {
  padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${colors.border}`,
  fontSize: 14.5, fontFamily: 'inherit', background: '#fff', outline: 'none', color: colors.ink, width: '100%',
};

export default function AuthPage() {
  const { register, login } = useAuth();
  const [mode, setMode] = useState('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 24px 0' }}><Logo /></div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: 380, width: '100%' }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: colors.ink, margin: '0 0 8px', lineHeight: 1.2 }}>
            Learn German or French.<br />Track every step from A1 to C1.
          </h1>
          <p style={{ color: colors.slate, fontSize: 15, margin: '0 0 32px' }}>Free to start. No credit card required.</p>

          <div style={{ display: 'flex', gap: 6, background: colors.border, borderRadius: 12, padding: 4, marginBottom: 24 }}>
            <button type="button" onClick={() => setMode('register')} style={{
              flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: mode === 'register' ? '#fff' : 'transparent', fontWeight: 600, fontSize: 14,
              color: mode === 'register' ? colors.ink : colors.muted,
            }}>Create account</button>
            <button type="button" onClick={() => setMode('login')} style={{
              flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: mode === 'login' ? '#fff' : 'transparent', fontWeight: 600, fontSize: 14,
              color: mode === 'login' ? colors.ink : colors.muted,
            }}>Log in</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
            )}
            <input placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
            <input placeholder="Password (min. 8 characters)" type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required minLength={8} />
          </div>

          {error && (
            <p style={{ color: colors.red, fontSize: 13.5, marginTop: 12, marginBottom: 0 }}>{error}</p>
          )}

          <PrimaryButton type="submit" disabled={submitting} style={{ width: '100%', marginTop: 18 }}>
            {submitting ? 'Please wait…' : mode === 'register' ? 'Create free account' : 'Log in'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
