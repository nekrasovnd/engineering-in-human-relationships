import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';
import LoadingScreen from './components/LoadingScreen';
import ThemeToggle from './components/ThemeToggle';
import AuthPage from './pages/AuthPage';
import ComparePage from './pages/ComparePage';
import DiscoverPage from './pages/DiscoverPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ProfilePage from './pages/ProfilePage';
import QuestionnairePage from './pages/QuestionnairePage';
import TeamsPage from './pages/TeamsPage';

function AuthOnlyRoute({ requireProfile = false }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="Синхронизируем профиль и маршруты..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireProfile && !profile?.questionnaireCompleted) {
    return <Navigate to="/questionnaire" replace />;
  }

  return <Outlet />;
}

function AuthPageGate() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="Проверяем вход..." />;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!profile?.questionnaireCompleted) {
    return <Navigate to="/questionnaire" replace />;
  }

  return <Navigate to="/profile" replace />;
}

function RootRedirect() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen label="Готовим приложение..." />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return profile?.questionnaireCompleted ? (
    <Navigate to="/profile" replace />
  ) : (
    <Navigate to="/questionnaire" replace />
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/auth" element={<AuthPageGate />} />

        <Route element={<AuthOnlyRoute />}>
          <Route path="/questionnaire" element={<QuestionnairePage />} />
        </Route>

        <Route element={<AuthOnlyRoute requireProfile />}>
          <Route element={<AppShell />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ThemeToggle />
    </>
  );
}
