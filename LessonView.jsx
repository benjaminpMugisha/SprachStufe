import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Flame } from 'lucide-react';
import { colors, PrimaryButton, Spinner } from './Shared.jsx';
import { api } from '../api.js';

export default function LessonView({ lessonId, onBack, onComplete, streak }) {
  const [exercises, setExercises] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getLesson(lessonId)
      .then(({ lesson, exercises }) => {
        setTitle(lesson.title);
        setExercises(exercises);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const current = exercises[idx];
  const isLast = idx === exercises.length - 1;

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt);
    setAnswers(prev => ({ ...prev, [current.id]: opt }));
  };

  const handleNext = async () => {
    if (!isLast) {
      setIdx(i => i + 1);
      setSelected(null);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitLesson(lessonId, answers);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}><Spinner /></div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 20 }}>
        <p style={{ color: colors.red }}>{error}</p>
        <PrimaryButton onClick={onBack}>Go back</PrimaryButton>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 20 }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: result.passed ? colors.green : colors.red,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#fff' }}>{result.scorePercent}%</span>
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: colors.ink, margin: '0 0 8px' }}>
          {result.passed ? 'Gut gemacht!' : 'Keep practicing'}
        </h2>
        <p style={{ color: colors.slate, marginBottom: 28 }}>You got {result.correct} of {result.total} correct.</p>
        <PrimaryButton onClick={onComplete}>Continue</PrimaryButton>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 20 }}>
        <p style={{ color: colors.muted }}>This lesson has no exercises yet.</p>
        <PrimaryButton onClick={onBack}>Go back</PrimaryButton>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={onBack} aria-label="Back" data-testid="lesson-back-button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} color={colors.ink} />
        </button>
        <div style={{ flex: 1, height: 8, background: colors.border, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${((idx + (selected ? 1 : 0)) / exercises.length) * 100}%`, height: '100%', background: colors.gold, transition: 'width 0.3s' }} />
        </div>
        {typeof streak === 'number' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: colors.red, fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>
            <Flame size={16} /> {streak}
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, color: colors.muted, fontFamily: 'monospace', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: colors.ink, margin: '0 0 28px', lineHeight: 1.35 }}>
        {current.prompt}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {current.options.map(opt => {
          const isPicked = opt === selected;
          return (
            <button key={opt} onClick={() => handleSelect(opt)} style={{
              padding: '15px 18px', borderRadius: 12,
              border: `2px solid ${isPicked ? colors.ink : colors.border}`,
              background: isPicked ? '#F3F1EC' : '#fff', color: colors.ink, fontSize: 15.5, fontWeight: 500, textAlign: 'left',
              cursor: selected ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              {opt}
              {isPicked && <Check size={18} color={colors.ink} />}
            </button>
          );
        })}
      </div>

      {selected && (
        <PrimaryButton onClick={handleNext} disabled={submitting} style={{ marginTop: 28, width: '100%' }}>
          {submitting ? 'Submitting…' : isLast ? 'See results' : 'Continue'}
        </PrimaryButton>
      )}
    </div>
  );
}
