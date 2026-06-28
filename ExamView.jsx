import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Award, Download } from 'lucide-react';
import { colors, PrimaryButton, Spinner } from './Shared.jsx';
import { api } from '../api.js';

export default function ExamView({ examId, onBack }) {
  const [examMeta, setExamMeta] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getExam(examId)
      .then(({ exam, sections }) => { setExamMeta(exam); setSections(sections); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [examId]);

  const flatQuestions = sections.flatMap(s => s.questions.map(q => ({ ...q, sectionName: s.name })));
  const totalQuestions = flatQuestions.length;
  const currentFlatIdx = sections.slice(0, sectionIdx).reduce((sum, s) => sum + s.questions.length, 0) + questionIdx;
  const current = sections[sectionIdx]?.questions[questionIdx];
  const currentSectionName = sections[sectionIdx]?.name;
  const isVeryLast = sectionIdx === sections.length - 1 && questionIdx === (sections[sectionIdx]?.questions.length || 0) - 1;

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt);
    setAnswers(prev => ({ ...prev, [current.id]: opt }));
  };

  const handleNext = async () => {
    if (!isVeryLast) {
      if (questionIdx < sections[sectionIdx].questions.length - 1) {
        setQuestionIdx(i => i + 1);
      } else {
        setSectionIdx(i => i + 1);
        setQuestionIdx(0);
      }
      setSelected(null);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitExam(examId, answers);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spinner /></div>;

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
          {result.passed ? 'You passed!' : 'Not quite — try again'}
        </h2>
        <p style={{ color: colors.slate, marginBottom: 28 }}>You got {result.correct} of {result.total} correct.</p>

        {result.certificate && (
          <div style={{
            background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 14,
            padding: '18px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${colors.gold},${colors.red})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Award size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5, color: colors.ink }}>Certificate earned</div>
              <div style={{ fontSize: 12.5, color: colors.muted }}>Serial: {result.certificate.serialNumber}</div>
            </div>
            <a
              href={api.certificateDownloadUrl(result.certificate.id)}
              target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
                background: colors.ink, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}
            >
              <Download size={14} /> PDF
            </a>
          </div>
        )}

        <PrimaryButton onClick={onBack}>Back to exams</PrimaryButton>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 20 }}>
        <p style={{ color: colors.muted }}>This exam has no questions yet.</p>
        <PrimaryButton onClick={onBack}>Go back</PrimaryButton>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={onBack} aria-label="Back" data-testid="exam-back-button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} color={colors.ink} />
        </button>
        <div style={{ flex: 1, height: 8, background: colors.border, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${((currentFlatIdx + (selected ? 1 : 0)) / totalQuestions) * 100}%`,
            height: '100%', background: colors.gold, transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <div style={{ fontSize: 13, color: colors.muted, fontFamily: 'monospace', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {examMeta.examSystem} · {examMeta.levelCode}
      </div>
      <div style={{ fontSize: 12.5, color: colors.gold, fontWeight: 700, marginBottom: 10 }}>
        {currentSectionName}
      </div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: colors.ink, margin: '0 0 28px', lineHeight: 1.35 }}>
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
          {submitting ? 'Submitting…' : isVeryLast ? 'Finish exam' : 'Next question'}
        </PrimaryButton>
      )}
    </div>
  );
}
