import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, CalendarDays, Calendar, DollarSign,
  ShieldCheck, Mail, LogOut, Building2, ChevronLeft, ChevronRight,
  BarChart3, FileText,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/employees', icon: Users, label: 'Employees', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER'] },
  { to: '/attendance', icon: Clock, label: 'Attendance', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/leaves', icon: CalendarDays, label: 'Leave Management', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/calendar', icon: Calendar, label: 'Calendar', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { to: '/payroll', icon: DollarSign, label: 'Payroll', roles: ['ADMIN', 'SUPER_ADMIN', 'HR'] },
  { to: '/admins', icon: ShieldCheck, label: 'Admin Users', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/emails', icon: Mail, label: 'Email Logs', roles: ['ADMIN', 'SUPER_ADMIN', 'HR'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['ADMIN', 'SUPER_ADMIN', 'HR'] },
  { to: '/form16-admin', icon: FileText, label: 'Form 16 Upload', roles: ['ADMIN', 'SUPER_ADMIN', 'HR'] },
  { to: '/my-documents', icon: FileText, label: 'My Documents', roles: ['EMPLOYEE'] },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filtered = navItems.filter((item) =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0 min-h-screen`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">HRMS</p>
              <p className="text-[10px] text-slate-400 leading-tight">HR Management</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto">
            <Building2 size={18} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {filtered.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed && (
          <div className="px-2 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
