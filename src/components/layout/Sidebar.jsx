import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, CalendarDays, Calendar, DollarSign,
  ShieldCheck, Mail, LogOut, Building2, ChevronLeft, ChevronRight,
  BarChart3, FileText, KeyRound, History, CalendarRange, CalendarClock,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },

  // 🔷 Manager Section
  { to: '/employees', icon: Users, label: 'Employees', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER'] },
  { to: '/payroll', icon: DollarSign, label: 'Payroll', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER'] },

  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER'] },
  { to: '/reports/daily', icon: Calendar, label: 'Daily Attendance', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER'], indent: true },
  { to: '/reports/monthly', icon: CalendarRange, label: 'Monthly Attendance', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER'], indent: true },
  { to: '/reports/leave', icon: CalendarClock, label: 'Leave Balance', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER'], indent: true },
  { to: '/reports/payroll', icon: FileSpreadsheet, label: 'Payroll Report', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER'], indent: true },

  { to: '/form16-admin', icon: FileText, label: 'Form 16 Upload', roles: ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER'] },

  // 🔶 My Workspace (Employee-like)
  { to: '/attendance', icon: Clock, label: 'My Attendance', roles: ['EMPLOYEE', 'MANAGER'] },
  { to: '/leaves', icon: CalendarDays, label: 'My Leaves', roles: ['EMPLOYEE', 'MANAGER'] },
  { to: '/calendar', icon: Calendar, label: 'My Calendar', roles: ['EMPLOYEE', 'MANAGER'] },
  { to: '/payslips', icon: FileSpreadsheet, label: 'My Payslips', roles: ['EMPLOYEE', 'MANAGER'] },
  { to: '/form16', icon: FileText, label: 'My Form 16', roles: ['EMPLOYEE', 'MANAGER'] },

  // 🔐 Admin Only
  { to: '/admins', icon: ShieldCheck, label: 'Admin Users', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/leave-policy', icon: CalendarDays, label: 'Leave Policy', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/emails', icon: Mail, label: 'Email Logs', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/leaves', icon: CalendarDays, label: 'Leave Approvals', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER','HR'] },
];
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const [showReports, setShowReports] = useState(false);

  const filtered = navItems.filter((item) =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0 min-h-screen`}>

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">HRMS</p>
              <p className="text-[10px] text-slate-400">HR Management</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto">
            <Building2 size={18} />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {filtered.map(({ to, icon: Icon, label, indent }, index) => {

          // 👉 Reports toggle (NO navigation)
          if (to === '/reports') {
            return (
              <button
                key={to}
                onClick={() => setShowReports(!showReports)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white w-full"
              >
                <Icon size={18} />
                {!collapsed && label}
              </button>
            );
          }

          // 👉 Hide sub items until Reports clicked
          if (to.startsWith('/reports/') && !showReports) return null;

          // 🔥 Detect My Workspace section
          const isMyWorkspaceItem = [
            '/attendance',
            '/leaves',
            '/calendar',
            '/payslips',
            '/form16'
          ].includes(to);

          return (
            <div key={to}>

              {/* 🔶 My Workspace Divider (only once) */}
              {isMyWorkspaceItem &&
                user?.role === 'MANAGER' &&
                !collapsed &&
                index === filtered.findIndex(i =>
                  ['/attendance', '/leaves', '/calendar', '/payslips', '/form16'].includes(i.to)
                ) && (
                  <p className="text-xs text-slate-500 px-3 mt-4 mb-1">
                    My Workspace
                  </p>
                )
              }

              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            ${indent && !collapsed ? 'ml-4 pl-3' : ''}
            ${isActive
                    ? indent
                      ? 'bg-amber-600/20 text-amber-400'
                      : 'bg-indigo-600 text-white'
                    : indent
                      ? 'text-slate-400 hover:bg-amber-600/10 hover:text-amber-300'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={indent ? 15 : 18} />
                {!collapsed && label}
              </NavLink>

            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-700 p-3">
        <button
          onClick={() => navigate('/update-password')}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-400"
        >
          <KeyRound size={18} />
          {!collapsed && 'Change Password'}
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-300 hover:bg-red-600/20 hover:text-red-400"
        >
          <LogOut size={18} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}