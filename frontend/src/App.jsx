import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Login from './pages/Login';
import FirstRunSetup from './pages/FirstRunSetup';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CompanySettings from './pages/admin/CompanySettings';
import OrgSetup from './pages/admin/OrgSetup';
import UserManagement from './pages/admin/UserManagement';
import AuditLogViewer from './pages/admin/AuditLogViewer';

// HR Pages
import HrDashboard from './pages/hr/HrDashboard';
import EmployeeDirectory from './pages/hr/EmployeeDirectory';
import DailyAttendanceBoard from './pages/hr/DailyAttendanceBoard';
import AttendanceCorrectionsInbox from './pages/hr/AttendanceCorrectionsInbox';
import LeaveApprovalInbox from './pages/hr/LeaveApprovalInbox';
import PayrollManagement from './pages/hr/PayrollManagement';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AttendanceCalendar from './pages/employee/AttendanceCalendar';
import MyLeave from './pages/employee/MyLeave';
import MyPayslips from './pages/employee/MyPayslips';
import MyProfile from './pages/employee/MyProfile';

// Common Pages
import AnnouncementsPage from './pages/common/AnnouncementsPage';

// Protected Route Guard
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Authenticating session..." />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'hr') return <Navigate to="/hr" replace />;
    return <Navigate to="/employee" replace />;
  }

  return children;
};

// Root index redirect based on user role
const RootRedirect = () => {
  const { user, token, systemStatus, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading HCM Lite..." />
      </div>
    );
  }

  if (systemStatus?.firstRunRequired) {
    return <Navigate to="/setup" replace />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'hr') return <Navigate to="/hr" replace />;
  return <Navigate to="/employee" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<FirstRunSetup />} />

            {/* Protected Routes inside Main Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<RootRedirect />} />

              {/* Admin Routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CompanySettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/org"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <OrgSetup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/payroll"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PayrollManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogViewer />
                  </ProtectedRoute>
                }
              />

              {/* HR Routes */}
              <Route
                path="hr"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <HrDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/employees"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <EmployeeDirectory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/attendance"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <DailyAttendanceBoard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/corrections"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <AttendanceCorrectionsInbox />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/leaves"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <LeaveApprovalInbox />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/payroll"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <PayrollManagement />
                  </ProtectedRoute>
                }
              />

              {/* Employee Routes */}
              <Route
                path="employee"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employee/attendance"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <AttendanceCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employee/leaves"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <MyLeave />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employee/payslips"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <MyPayslips />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employee/profile"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <MyProfile />
                  </ProtectedRoute>
                }
              />

              {/* Common Announcements */}
              <Route
                path="announcements"
                element={
                  <ProtectedRoute>
                    <AnnouncementsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
