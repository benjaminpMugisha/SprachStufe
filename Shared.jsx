import React from 'react';

export const colors = {
  ink: '#1A1F2E',
  paper: '#FAF7F2',
  gold: '#C9A227',
  red: '#C1443C',
  slate: '#5B6478',
  green: '#7C9A6E',
  blue: '#6E8FA3',
  purple: '#5B3A8E',
  border: '#EDE8DC',
  muted: '#8B8576',
  faint: '#9B9685',
  lockedBg: '#E9E5DA',
};

export function Logo({ size = 28 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: 8,
        background: `linear-gradient(135deg, ${colors.gold}, ${colors.red})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontWeight: 700, color: colors.paper, fontSize: size * 0.5,
        flexShrink: 0,
      }}>S</div>
      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 20, color: colors.ink, letterSpacing: '-0.02em' }}>
        Sprachstufe
      </span>
    </div>
  );
}

export function PrimaryButton({ children, onClick, style, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '13px 24px', borderRadius: 12, border: 'none',
        background: disabled ? colors.lockedBg : colors.ink, color: disabled ? colors.faint : '#fff',
        fontWeight: 600, fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Spinner({ size = 20, color = colors.ink }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${color}22`, borderTopColor: color,
      animation: 'spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
