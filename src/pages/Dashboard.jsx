import { useEffect, useState } from 'react';
import { employeeAPI, dashboardAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import { Users, Clock, Calendar, UserCheck } from 'lucide-react';

const unwrap = (res) => res?.data?.data;

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');

  useEffect(() => {
    const loadStatsOnly = async () => {
      try {
        const empRes = await employeeAPI.getDashboard();
        setStats(unwrap(empRes));
      } catch {
        // dashboard endpoint may not exist, fallback gracefully
      } finally {
        setLoading(false);
      }
    };

    const loadAll = async () => {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const [statsRes, attendanceRes, employeesRes] = await Promise.allSettled([
          employeeAPI.getDashboard(),
          dashboardAPI.getAttendance({
            attendanceDate: today,
            page: 0,
            size: 200,
            sortBy: 'createdAt',
            sortDir: 'desc',
          }),
          employeeAPI.getAll({
            page: 0,
            size: 200,
            sortBy: 'id',
            dir: 'asc',
          }),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(unwrap(statsRes.value));
        }

        if (attendanceRes.status === 'fulfilled') {
          const rows = attendanceRes.value?.data?.data || [];
          setTodayAttendance(Array.isArray(rows) ? rows : []);
        } else {
          setTodayAttendance([]);
        }

        if (employeesRes.status === 'fulfilled') {
          const data = unwrap(employeesRes.value);
          const rows = Array.isArray(data) ? data : data?.content ?? [];
          setEmployeesList(rows);
          setAttendanceError('');
        } else {
          setEmployeesList([]);
          setAttendanceError(
            employeesRes.reason?.response?.data?.message ||
            employeesRes.reason?.message ||
            'Could not load employee list'
          );
        }
      } catch {
        // dashboard endpoint may not exist, fallback gracefully
      } finally {
        setLoading(false);
      }
    };
    const shouldLoadAttendance = isAdmin || isHR || isManager;
    if (shouldLoadAttendance) {
      setAttendanceLoading(true);
      loadAll().finally(() => setAttendanceLoading(false));
    } else {
      loadStatsOnly();
    }
  }, [isAdmin, isHR, isManager]);

  const formatDateTime = (val) => {
    if (!val) return '—';
    return new Date(val).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const attendanceByEmployeeKey = todayAttendance.reduce((acc, row) => {
    const keys = [
      row?.employeeId,
      row?.employeeCode,
      row?.employee?.id,
      row?.employee?.employeeId,
    ].filter(Boolean).map(String);
    keys.forEach((k) => {
      if (!acc[k]) acc[k] = row;
    });
    return acc;
  }, {});

  const mergedAttendanceRows = employeesList.map((emp) => {
    const match =
      attendanceByEmployeeKey[String(emp?.id)] ||
      attendanceByEmployeeKey[String(emp?.employeeId)] ||
      null;
    return {
      employeeName: emp?.fullName || [emp?.firstName, emp?.lastName].filter(Boolean).join(' ') || 'Employee',
      employeeCode: emp?.employeeId || '—',
      checkIn: match?.checkIn || null,
      checkOut: match?.checkOut || null,
      status: match?.status || 'ABSENT',
    };
  });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{today}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Employees" value={stats?.totalEmployees} color="bg-indigo-500" />
          <StatCard icon={UserCheck} label="Active Employees" value={stats?.activeEmployees} color="bg-green-500" />
          <StatCard icon={Clock} label="Present Today" value={stats?.presentToday} color="bg-blue-500" />
          <StatCard icon={Calendar} label="Pending Leaves" value={stats?.pendingLeaves} color="bg-orange-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Welcome back, {user?.name}</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span>Role</span>
              <span className="font-medium text-indigo-600">{user?.role}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span>Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            {user?.employeeId && (
              <div className="flex justify-between py-2">
                <span>Employee ID</span>
                <span className="font-medium">{user?.employeeId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Employees', href: '/employees', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
              { label: 'Attendance', href: '/attendance', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label: 'Leave Requests', href: '/leaves', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
              { label: 'Payroll', href: '/payroll', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className={`rounded-lg p-3 text-sm font-medium text-center transition-colors ${action.color}`}
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
