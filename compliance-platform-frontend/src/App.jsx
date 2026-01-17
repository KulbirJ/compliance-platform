import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import stores
import useAuthStore from './store/authStore';

// Import components
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Import pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AssessmentListPage from './pages/assessments/AssessmentListPage';
import AssessmentFormPage from './pages/assessments/AssessmentFormPage';
import AssessmentDetailPage from './pages/assessments/AssessmentDetailPage';
import ThreatModelListPage from './pages/threats/ThreatModelListPage';
import ThreatModelFormPage from './pages/threats/ThreatModelFormPage';
import ThreatModelDetailPage from './pages/threats/ThreatModelDetailPage';
import ReportsPage from './pages/reports/ReportsPage';
import EvidenceList from './pages/evidence/EvidenceList';

function App() {
  const { initAuth } = useAuthStore();

  // Initialize auth on app start
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AssessmentListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/new"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AssessmentFormPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AssessmentDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:id/edit"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AssessmentFormPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/threat-models"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ThreatModelListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/threat-models/new"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ThreatModelFormPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/threat-models/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ThreatModelDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/threat-models/:id/edit"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ThreatModelFormPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <EvidenceList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ReportsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Route - Redirect to Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
