import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';

import Layout from './components/layout/Layout';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';

import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import AttendanceEditHistory from './pages/AttendanceEditHistory';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Admins from './pages/Admins';
import Emails from './pages/Emails';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Form16 from './pages/Form16';
import Form16Admin from './pages/Form16Admin';
import LeavePolicy from './pages/LeavePolicy';
import MonthlyAttendance from './pages/MonthlyAttendance';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={user ? <Navigate to="/dashboard" replace /> : <ResetPassword />}
      />

      {/* Protected Layout */}
      <Route element={<Layout />}>

        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/update-password"
          element={
            <ProtectedRoute>
              <UpdatePassword />
            </ProtectedRoute>
          }
        />

        <Route path="/attendance" element={<Attendance />} />

        <Route
          path="/attendance/edit-history"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER']}>
              <AttendanceEditHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER']}>
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route path="/leaves" element={<Leaves />} />

        <Route
          path="/payroll"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
              <Payroll />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payslips"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
              <Payroll />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admins"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <Admins />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emails"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR']}>
              <Emails />
            </ProtectedRoute>
          }
        />

        <Route path="/calendar" element={<Calendar />} />
        <Route
          path="/leave-policy"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <LeavePolicy />
            </ProtectedRoute>
          }
        />

        {/* ✅ ONLY sub-routes (NO /reports parent route) */}

        <Route
          path="/reports/daily"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER']}>
              <Reports section="daily" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/monthly"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER']}>
              <MonthlyAttendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/leave"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER']}>
              <Reports section="leave" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/payroll"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER']}>
              <Reports section="payroll" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/form16-admin"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER']}>
              <Form16Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/form16"
          element={
            <ProtectedRoute roles={['EMPLOYEE']}>
              <Form16 />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
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