import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ReviewPage from './pages/ReviewPage';
import AddCardPage from './pages/AddCardPage';
import CardsListPage from './pages/CardsListPage';
import ImportPage from './pages/ImportPage';
import ExtractPage from './pages/ExtractPage';
import SettingsPage from './pages/SettingsPage';
import Navigation from './components/Navigation';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 70 }}>{children}</div>
      <Navigation />
    </>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
      <Route path="/add" element={<ProtectedRoute><AddCardPage /></ProtectedRoute>} />
      <Route path="/cards" element={<ProtectedRoute><CardsListPage /></ProtectedRoute>} />
      <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
      <Route path="/extract" element={<ProtectedRoute><ExtractPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
