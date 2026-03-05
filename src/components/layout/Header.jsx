import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Management',
  '/attendance': 'Attendance',
  '/leaves': 'Leave Management',
  '/payroll': 'Payroll',
  '/admins': 'Admin Users',
  '/emails': 'Email Logs',
};

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'HRMS';

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        <p className="text-xs text-slate-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
          {(user?.name || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-slate-700">{user?.name || user?.email}</p>
          <p className="text-xs text-slate-400">{user?.role}</p>
        </div>
      </div>
    </header>
  );
}
