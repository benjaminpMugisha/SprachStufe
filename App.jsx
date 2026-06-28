import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { colors, Spinner } from './components/Shared.jsx';
import AuthPage from './components/AuthPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import LessonView from './components/LessonView.jsx';
import ExamsList from './components/ExamsList.jsx';
import ExamView from './components/ExamView.jsx';
import ChatPage from './components/ChatPage.jsx';
import CertificatesPage from './components/CertificatesPage.jsx';
import PaywallModal from './components/PaywallModal.jsx';
import { Header, BottomNav } from './components/Nav.jsx';

function MainApp() {
  const { user, logout, refreshUser, applyAuthResponse } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [openLessonId, setOpenLessonId] = useState(null);
  const [openExamId, setOpenExamId] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [streak, setStreak] = useState(user.streakCount || 0);

  const handleOpenLesson = (lesson) => setOpenLessonId(lesson.id);
  const handleLessonComplete = async () => {
    setOpenLessonId(null);
    const refreshed = await refreshUser();
    setStreak(refreshed.streakCount);
  };

  if (openLessonId) {
    return (
      <div style={{ minHeight: '100vh', background: colors.paper }}>
        <LessonView lessonId={openLessonId} onBack={() => setOpenLessonId(null)} onComplete={handleLessonComplete} streak={streak} />
      </div>
    );
  }

  if (openExamId) {
    return (
      <div style={{ minHeight: '100vh', background: colors.paper }}>
        <ExamView examId={openExamId} onBack={() => setOpenExamId(null)} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.paper, display: 'flex', flexDirection: 'column' }}>
      <Header user={user} streak={streak} onUpgradeClick={() => setShowPaywall(true)} onLogout={logout} />

      <div style={{ flex: 1 }}>
        {tab === 'dashboard' && (
          <Dashboard user={user} onOpenLesson={handleOpenLesson} onRequirePremium={() => setShowPaywall(true)} />
        )}
        {tab === 'exams' && (
          <ExamsList user={user} onOpenExam={setOpenExamId} onRequirePremium={() => setShowPaywall(true)} />
        )}
        {tab === 'chat' && <ChatPage />}
        {tab === 'certificates' && <CertificatesPage />}
      </div>

      <BottomNav active={tab} onChange={setTab} />

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          onUpgraded={(token, freshUser) => { applyAuthResponse(token, freshUser); setShowPaywall(false); }}
        />
      )}
    </div>
  );
}

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.paper }}>
        <Spinner />
      </div>
    );
  }

  return user ? <MainApp /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
