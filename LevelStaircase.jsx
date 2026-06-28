import React from 'react';
import { Lock, Star } from 'lucide-react';
import { colors } from './Shared.jsx';

const LEVEL_COLORS = {
  A1: colors.green, A2: colors.blue, B1: colors.gold, B2: colors.red, C1: colors.purple,
};

export default function LevelStaircase({ levels, progressByCode, selectedCode, onSelect }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, padding: '40px 16px 20px', overflowX: 'auto' }}>
      {levels.map((lvl, i) => {
        const pct = progressByCode[lvl.code]?.percent || 0;
        const isUnlocked = i === 0 || (progressByCode[levels[i - 1].code]?.percent || 0) >= 1 || pct >= 1;
        const reallyUnlocked = i === 0 || true; // all levels browsable; lessons themselves gate by free/premium
        const isSelected = selectedCode === lvl.code;
        const color = LEVEL_COLORS[lvl.code] || colors.ink;
        return (
          <div key={lvl.code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: '0 0 auto' }}>
            {i > 0 && (
              <div style={{ position: 'absolute', top: 38, left: -50, width: 50, height: 2, background: colors.gold }} />
            )}
            <button
              onClick={() => onSelect(lvl.code)}
              style={{
                width: 76, height: 76, borderRadius: '50%',
                background: color,
                border: isSelected ? `3px solid ${colors.ink}` : '3px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', cursor: 'pointer',
                marginBottom: 90 - i * 14,
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: isSelected ? '0 6px 20px rgba(0,0,0,0.18)' : '0 2px 6px rgba(0,0,0,0.08)',
                position: 'relative',
              }}
            >
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff', fontSize: 20 }}>{lvl.code}</span>
              {pct >= 100 && (
                <div style={{ position: 'absolute', top: -6, right: -6, background: colors.ink, borderRadius: '50%', padding: 3 }}>
                  <Star size={12} color={colors.gold} fill={colors.gold} />
                </div>
              )}
            </button>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: colors.ink, fontWeight: 600 }}>{lvl.code}</span>
            <span style={{ fontSize: 11, color: colors.muted, maxWidth: 80, textAlign: 'center', marginTop: 2 }}>
              {pct}% complete
            </span>
          </div>
        );
      })}
    </div>
  );
}
