import React, { useState } from 'react';
import { X, Award } from 'lucide-react';
import { colors, PrimaryButton } from './Shared.jsx';
import { api } from '../api.js';

export default function PaywallModal({ onClose, onUpgraded }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { token, user } = await api.upgradeToPremium();
      onUpgraded(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,31,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: colors.paper, borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} color={colors.muted} />
        </button>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${colors.gold},${colors.red})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Award size={26} color="#fff" />
        </div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, margin: '0 0 8px', color: colors.ink }}>This is a Premium feature</h3>
        <p style={{ color: colors.slate, fontSize: 14.5, lineHeight: 1.5, margin: '0 0 22px' }}>
          Unlock every lesson from A1 to C1, all mock exams across Goethe, telc, TestDaF, and DELF, and the
          AI tutor chat with Sprachstufe Premium.
        </p>
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: `1px solid ${colors.border}` }}>
          <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: colors.ink }}>
            $6.99<span style={{ fontSize: 13, color: colors.muted, fontWeight: 400 }}>/month</span>
          </div>
          <div style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>Cancel anytime</div>
        </div>
        {error && <p style={{ color: colors.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <PrimaryButton onClick={handleUpgrade} disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Processing…' : 'Upgrade to Premium'}
        </PrimaryButton>
        <p style={{ textAlign: 'center', fontSize: 11.5, color: colors.faint, marginTop: 14 }}>
          MVP demo upgrade — wire up a real payment provider (e.g. Stripe) before launch.
        </p>
      </div>
    </div>
  );
}
