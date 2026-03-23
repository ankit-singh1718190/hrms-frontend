import { useState, useEffect } from 'react';
import { attendanceAPI } from '../api/services';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, Pencil, Search, Download } from 'lucide-react';

const STATUS_COLORS = {
  PRESENT:        'bg-green-100 text-green-700',
  ABSENT:         'bg-red-100 text-red-700',
  HALF_DAY:       'bg-yellow-100 text-yellow-700',
  ON_LEAVE:       'bg-blue-100 text-blue-700',
  WORK_FROM_HOME: 'bg-purple-100 text-purple-700',
  HOLIDAY:        'bg-orange-100 text-orange-700',
  NOT_MARKED:     'bg-slate-100 text-slate-500',
};

const ROLE_COLORS = {
  ADMIN:      'bg-indigo-100 text-indigo-700',
  SUPER_ADMIN:'bg-purple-100 text-purple-700',
  HR:         'bg-teal-100 text-teal-700',
  MANAGER:    'bg-blue-100 text-blue-700',
  EMPLOYEE:   'bg-slate-100 text-slate-600',
};

export default function AttendanceEditHistory() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo]     = useState(today);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await attendanceAPI.getEditHistory(from, to);
      setRows(res.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load edit history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.employeeName?.toLowerCase().includes(q) ||
      r.employeeId?.toLowerCase().includes(q) ||
      r.editedByName?.toLowerCase().includes(q) ||
      r.editedByRole?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const headers = ['Date', 'Employee ID', 'Employee Name', 'Department', 'Original Status', 'New Status', 'Edited By', 'Role', 'Edited At', 'Reason', 'Edit Count'];
    const csvRows = filtered.map((r) => [
      r.date, r.employeeId, r.employeeName, r.department,
      r.originalStatus, r.currentStatus,
      r.editedByName, r.editedByRole,
      r.editedAt ? new Date(r.editedAt).toLocaleString('en-IN') : '',
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      r.editCount,
    ]);
    const csv = [headers, ...csvRows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_edit_history_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/attendance')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Attendance
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <History size={18} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Attendance Edit History</h1>
              <p className="text-slate-500 text-sm mt-0.5">Track all attendance modifications — who edited, when, and why</p>
            </div>
          </div>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : 'Apply'}
        </button>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Search</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee, editor, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{filtered.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Edits</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {new Set(filtered.map((r) => r.editedBy)).size}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Unique Editors</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {new Set(filtered.map((r) => r.employeeId)).size}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Employees Affected</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Pencil size={15} className="text-amber-500" />
          <h2 className="font-semibold text-slate-800 text-sm">
            Edit Records ({filtered.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading edit history...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <History size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No edit records found for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Dept</th>
                  <th className="px-5 py-3">Original → New</th>
                  <th className="px-5 py-3">Check In</th>
                  <th className="px-5 py-3">Check Out</th>
                  <th className="px-5 py-3">Edited By</th>
                  <th className="px-5 py-3">Edited At</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3 text-center">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((r, idx) => (
                  <tr key={`${r.attendanceId}-${idx}`} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-700 font-medium whitespace-nowrap">{r.date}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{r.employeeName}</p>
                      <p className="text-xs text-slate-400">{r.employeeId}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{r.department || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.originalStatus] || STATUS_COLORS.NOT_MARKED}`}>
                          {r.originalStatus || 'N/A'}
                        </span>
                        <span className="text-slate-300 text-xs">→</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.currentStatus] || STATUS_COLORS.NOT_MARKED}`}>
                          {r.currentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800 text-xs">{r.editedByName}</p>
                      <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[r.editedByRole] || ROLE_COLORS.EMPLOYEE}`}>
                        {r.editedByRole}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{r.editedBy}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {r.editedAt ? new Date(r.editedAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      }) : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs max-w-[200px]">
                      <p className="truncate" title={r.reason}>{r.reason || '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        r.editCount > 2 ? 'bg-red-100 text-red-600' : r.editCount > 1 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {r.editCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
