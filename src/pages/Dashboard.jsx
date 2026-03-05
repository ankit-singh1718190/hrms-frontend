import { useState, useEffect } from 'react';
import { Users, Clock, CalendarDays, DollarSign, TrendingUp, UserCheck, AlertCircle } from 'lucide-react';
import { dashboardAPI } from '../api/services';
import StatCard from '../components/ui/StatCard';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge, { statusBadge } from '../components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../context/useAuth';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [ov, dept, att] = await Promise.all([
          dashboardAPI.getOverview(),
          dashboardAPI.getDepartments(),
          dashboardAPI.getAttendance({}),
        ]);
        setOverview(ov.data);
        setDepartments(Array.isArray(dept.data) ? dept.data : []);
        setAttendance(Array.isArray(att.data) ? att.data : []);
      } catch {
        // use empty fallback data
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading dashboard...
        </div>
      </div>
    );
  }

  const stats = overview || {};

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold">Welcome back, {user?.name || user?.email}!</h2>
        <p className="text-indigo-200 text-sm mt-1">Here's what's happening with your organization today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={stats.totalEmployees ?? 0} icon={Users} color="indigo" subtitle="All active employees" />
        <StatCard title="Present Today" value={stats.presentToday ?? 0} icon={UserCheck} color="green" subtitle="Checked in today" />
        <StatCard title="On Leave" value={stats.onLeave ?? 0} icon={CalendarDays} color="yellow" subtitle="Approved leaves today" />
        <StatCard title="Pending Leaves" value={stats.pendingLeaves ?? 0} icon={AlertCircle} color="red" subtitle="Awaiting approval" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department chart */}
        <Card>
          <CardHeader title="Employees by Department" subtitle="Headcount per department" />
          <CardBody>
            {departments.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={departments} dataKey="count" nameKey="department" cx="50%" cy="50%" outerRadius={80} label={({ department, percent }) => `${department} ${(percent * 100).toFixed(0)}%`}>
                    {departments.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No department data available</div>
            )}
          </CardBody>
        </Card>

        {/* Attendance chart */}
        <Card>
          <CardHeader title="Attendance Overview" subtitle="Recent attendance trends" />
          <CardBody>
            {attendance.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={attendance.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="present" fill="#6366f1" radius={[4, 4, 0, 0]} name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No attendance data available</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick stats bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Payroll" value={stats.totalPayroll ? `₹${Number(stats.totalPayroll).toLocaleString('en-IN')}` : '₹0'} icon={DollarSign} color="purple" subtitle="This month" />
        <StatCard title="New Joinings" value={stats.newJoinings ?? 0} icon={TrendingUp} color="blue" subtitle="This month" />
        <StatCard title="Resigned" value={stats.resigned ?? 0} icon={Users} color="red" subtitle="This month" />
      </div>
    </div>
  );
}
