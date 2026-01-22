import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import components
import MainLayout from './components/layout/MainLayout';

// Import pages
import DashboardPage from './pages/dashboard/DashboardPage';
import AssessmentListPage from './pages/assessments/AssessmentListPage';
import AssessmentFormPage from './pages/assessments/AssessmentFormPage';
import AssessmentDetailPage from './pages/assessments/AssessmentDetailPage';
import ThreatModelListPage from './pages/threats/ThreatModelListPage';
import ThreatModelFormPage from './pages/threats/ThreatModelFormPage';
import ThreatModelDetailPage from './pages/threats/ThreatModelDetailPage';
import ReportsPage from './pages/reports/ReportsPage';
import EvidenceList from './pages/evidence/EvidenceList';
import RiskRegisterPage from './pages/RiskRegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* All Routes - No Authentication Required for MVP */}
        <Route
          path="/dashboard"
          element={
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          }
        />
        <Route
          path="/assessments"
          element={
            <MainLayout>
              <AssessmentListPage />
            </MainLayout>
          }
        />
        <Route
          path="/assessments/new"
          element={
            <MainLayout>
              <AssessmentFormPage />
            </MainLayout>
          }
        />
        <Route
          path="/assessments/:id"
          element={
            <MainLayout>
              <AssessmentDetailPage />
            </MainLayout>
          }
        />
        <Route
          path="/assessments/:id/edit"
          element={
            <MainLayout>
              <AssessmentFormPage />
            </MainLayout>
          }
        />
        <Route
          path="/threat-models"
          element={
            <MainLayout>
              <ThreatModelListPage />
            </MainLayout>
          }
        />
        <Route
          path="/threat-models/new"
          element={
            <MainLayout>
              <ThreatModelFormPage />
            </MainLayout>
          }
        />
        <Route
          path="/threat-models/:id"
          element={
            <MainLayout>
              <ThreatModelDetailPage />
            </MainLayout>
          }
        />
        <Route
          path="/threat-models/:id/edit"
          element={
            <MainLayout>
              <ThreatModelFormPage />
            </MainLayout>
          }
        />
        <Route
          path="/evidence"
          element={
            <MainLayout>
              <EvidenceList />
            </MainLayout>
          }
        />
        <Route
          path="/risks"
          element={
            <MainLayout>
              <RiskRegisterPage />
            </MainLayout>
          }
        />
        <Route
          path="/reports"
          element={
            <MainLayout>
              <ReportsPage />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
