import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import PatientsPage from './pages/patients/PatientsPage';
import PatientProfilePage from './pages/patients/PatientProfilePage';
import EncountersPage from './pages/encounters/EncountersPage';
import NewEncounterPage from './pages/encounters/NewEncounterPage';
import EncounterDetailPage from './pages/encounters/EncounterDetailPage';
import PrintPreviewPage from './pages/encounters/PrintPreviewPage';
import MasterDataPage from './pages/master/MasterDataPage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-(--color-bg-primary)">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
          <p className="text-(--color-text-muted) text-sm">Loading E-Clinic...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<DashboardHome />} />
        {/* Patients */}
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:patientId" element={<PatientProfilePage />} />
        {/* Encounters */}
        <Route path="encounters" element={<EncountersPage />} />
        <Route path="encounters/new" element={<NewEncounterPage />} />
        <Route path="encounters/edit/:encounterId" element={<NewEncounterPage />} />
        <Route path="encounters/:encounterId" element={<EncounterDetailPage />} />
        {/* Prescriptions Preview */}
        <Route path="prescriptions/:encounterId" element={<PrintPreviewPage />} />
        {/* Other */}
        <Route path="master-data" element={<MasterDataPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
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
