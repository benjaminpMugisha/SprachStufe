import React, { useState, useEffect, useCallback } from 'react';
import { Check, Lock, BookOpen, ChevronRight, Flame } from 'lucide-react';
import { colors } from './Shared.jsx';
import { api } from '../api.js';
import LevelStaircase from './LevelStaircase.jsx';

function LessonRow({ lesson, onOpen }) {
  return (
    <button
      onClick={() => onOpen(lesson)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '16px 18px', borderRadius: 14, border: `1px solid ${colors.border}`,
        background: lesson.completed ? '#F4F9F0' : '#fff', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flex: '0 0 auto',
        background: lesson.completed ? colors.green : !lesson.isFree ? '#F2EFE6' : '#FAF3DD',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {lesson.completed ? <Check size={18} color="#fff" /> : !lesson.isFree ? <Lock size={16} color={colors.faint} /> : <BookOpen size={18} color={colors.gold} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: colors.ink, fontSize: 15 }}>{lesson.title}</div>
        <div style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>
          {lesson.exerciseCount} exercises · {lesson.isFree ? 'Free' : 'Premium'}
          {lesson.score != null ? ` · Best: ${lesson.score}%` : ''}
        </div>
      </div>
      <ChevronRight size={18} color={colors.faint} />
    </button>
  );
}

export default function Dashboard({ user, onOpenLesson, onRequirePremium }) {
  const [tracks, setTracks] = useState([]);
  const [activeTrackId, setActiveTrackId] = useState(null);
  const [activeLevelCode, setActiveLevelCode] = useState(null);
  const [activeLevelId, setActiveLevelId] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progressSummary, setProgressSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getTracks(), api.getProgressSummary()])
      .then(([tracksRes, progressRes]) => {
        setTracks(tracksRes.tracks);
        setProgressSummary(progressRes.summary);
        if (tracksRes.tracks.length > 0) {
          const first = tracksRes.tracks[0];
          setActiveTrackId(first.id);
          setActiveLevelCode(first.levels[0].code);
          setActiveLevelId(first.levels[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadLessons = useCallback((levelId) => {
    api.getLessons(levelId).then(res => setLessons(res.lessons));
  }, []);

  useEffect(() => {
    if (activeLevelId) loadLessons(activeLevelId);
  }, [activeLevelId, loadLessons]);

  const activeTrack = tracks.find(t => t.id === activeTrackId);

  const progressByCode = {};
  if (activeTrack) {
    for (const lvl of activeTrack.levels) {
      const found = progressSummary.find(p => p.levelId === lvl.id);
      progressByCode[lvl.code] = found || { percent: 0 };
    }
  }

  const handleSelectLevel = (code) => {
    const lvl = activeTrack.levels.find(l => l.code === code);
    setActiveLevelCode(code);
    setActiveLevelId(lvl.id);
  };

  const handleOpenLesson = (lesson) => {
    if (!lesson.isFree && !user.isPremium) {
      onRequirePremium();
      return;
    }
    onOpenLesson(lesson, activeLevelId);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: colors.muted }}>Loading your courses…</div>;
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 12px' }}>
      {tracks.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '20px 12px 0' }}>
          {tracks.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTrackId(t.id);
                setActiveLevelCode(t.levels[0].code);
                setActiveLevelId(t.levels[0].id);
              }}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: activeTrackId === t.id ? colors.ink : colors.border,
                color: activeTrackId === t.id ? '#fff' : colors.muted,
                fontWeight: 600, fontSize: 13.5,
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {activeTrack && (
        <LevelStaircase
          levels={activeTrack.levels}
          progressByCode={progressByCode}
          selectedCode={activeLevelCode}
          onSelect={handleSelectLevel}
        />
      )}

      <div style={{ padding: '0 12px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: colors.ink, margin: 0 }}>
            Level {activeLevelCode}
          </h2>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: colors.muted }}>
            {progressByCode[activeLevelCode]?.percent || 0}% complete
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lessons.length === 0 && (
            <p style={{ color: colors.muted, fontSize: 14 }}>No lessons yet at this level — check back soon.</p>
          )}
          {lessons.map(lesson => (
            <LessonRow key={lesson.id} lesson={lesson} onOpen={handleOpenLesson} />
          ))}
        </div>
      </div>
    </div>
  );
}
