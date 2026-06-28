import React from 'react';
import { Home, FileText, MessageCircle, Award, Flame } from 'lucide-react';
import { Logo, colors } from './Shared.jsx';

export function Header({ user, streak, onUpgradeClick, onLogout }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${colors.border}` }}>
      <Logo size={26} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: colors.red, fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>
          <Flame size={17} /> {streak}
        </div>
        {!user.isPremium && (
          <button onClick={onUpgradeClick} style={{
            fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
            background: `linear-gradient(135deg,${colors.gold},${colors.red})`, color: '#fff', border: 'none',
          }}>Go Premium</button>
        )}
        <button onClick={onLogout} title="Log out" style={{
          width: 34, height: 34, borderRadius: '50%', background: colors.ink, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
          border: 'none', cursor: 'pointer',
        }}>
          {user.name[0]?.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'dashboard', label: 'Learn', icon: Home },
  { key: 'exams', label: 'Exams', icon: FileText },
  { key: 'chat', label: 'Tutor', icon: MessageCircle },
  { key: 'certificates', label: 'Certificates', icon: Award },
];

export function BottomNav({ active, onChange }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, display: 'flex', borderTop: `1px solid ${colors.border}`,
      background: '#fff', padding: '8px 0', zIndex: 10,
    }}>
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            aria-label={`Go to ${tab.label}`}
            data-testid={`nav-${tab.key}`}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? colors.ink : colors.faint,
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
