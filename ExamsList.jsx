import React, { useState, useEffect } from 'react';
import { Lock, FileText, ChevronRight } from 'lucide-react';
import { colors, Spinner } from './Shared.jsx';
import { api } from '../api.js';

const SYSTEM_COLORS = {
  'Goethe-Institut': colors.green,
  telc: colors.blue,
  DaF: colors.purple,
  DELF: colors.red,
};

export default function ExamsList({ user, onOpenExam, onRequirePremium }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getExams().then(res => setExams(res.exams)).finally(() => setLoading(false));
  }, []);

  const handleOpen = (exam) => {
    if (!exam.isFree && !user.isPremium) {
      onRequirePremium();
      return;
    }
    onOpenExam(exam.id);
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spinner /></div>;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 16px 60px' }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: colors.ink, margin: '0 0 6px' }}>
        Mock Examinations
      </h2>
      <p style={{ color: colors.muted, fontSize: 14, margin: '0 0 24px' }}>
        Practice tests modeled on Goethe-Institut, telc, TestDaF, and DELF formats. These produce Sprachstufe
        practice awards, not official credentials — see your Certificates tab for details after passing.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {exams.map(exam => {
          const locked = !exam.isFree && !user.isPremium;
          const color = SYSTEM_COLORS[exam.examSystem] || colors.ink;
          return (
            <button key={exam.id} onClick={() => handleOpen(exam)} style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%',
              padding: '16px 18px', borderRadius: 14, border: `1px solid ${colors.border}`,
              background: '#fff', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flex: '0 0 auto', background: `${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {locked ? <Lock size={16} color={colors.faint} /> : <FileText size={18} color={color} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: colors.ink, fontSize: 15 }}>{exam.title}</div>
                <div style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>
                  {exam.examSystem} · Level {exam.levelCode} · {exam.sectionCount} sections · {exam.isFree ? 'Free' : 'Premium'}
                </div>
              </div>
              <ChevronRight size={18} color={colors.faint} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
