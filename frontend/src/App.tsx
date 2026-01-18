import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import { LeagueProvider } from './contexts/LeagueContext';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SeasonPredictionsPage } from './pages/SeasonPredictionsPage';
import { RaceDetailsPage } from './pages/RaceDetailsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ValidationsPage } from './pages/ValidationsPage';
import { AdminPage } from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { CompareTipsPage } from './pages/CompareTipsPage';
import { FirstTimeLeagueSetup } from './components/leagues/FirstTimeLeagueSetup';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.is_admin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginForm />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterForm />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/season-predictions"
        element={
          <ProtectedRoute>
            <SeasonPredictionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/race/:raceId"
        element={
          <ProtectedRoute>
            <RaceDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/validations"
        element={
          <ProtectedRoute>
            <ValidationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compare-tips"
        element={
          <ProtectedRoute>
            <CompareTipsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route path="*" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <LeagueProvider>
          <BrowserRouter>
            <ToastContainer />
            <FirstTimeLeagueSetup>
              <AppRoutes />
            </FirstTimeLeagueSetup>
          </BrowserRouter>
        </LeagueProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
