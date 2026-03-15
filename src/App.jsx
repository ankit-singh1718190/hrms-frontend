import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Admins from './pages/Admins';
import Emails from './pages/Emails';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import MyDocuments from './pages/MyDocuments';
import Form16Admin from './pages/Form16Admin';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER']}><Employees /></ProtectedRoute>} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/payroll" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR']}><Payroll /></ProtectedRoute>} />
        <Route path="/admins" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><Admins /></ProtectedRoute>} />
        <Route path="/emails" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR']}><Emails /></ProtectedRoute>} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/reports" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR']}><Reports /></ProtectedRoute>} />
        <Route path="/form16-admin" element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'HR']}><Form16Admin /></ProtectedRoute>} />
        <Route path="/my-documents" element={<ProtectedRoute roles={['EMPLOYEE']}><MyDocuments /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
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
