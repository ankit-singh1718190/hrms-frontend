import { useState, useEffect, useMemo } from 'react';
import { calendarAPI, attendanceAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Sun, Briefcase, Plus, Pencil, Trash2, X,
  AlertCircle, CheckCircle, ShieldAlert,
} from 'lucide-react';

const unwrap = (res) => res?.data?.data;

const DAY_STATUS_STYLES = {
  PRESENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ABSENT: 'bg-red-50 text-red-700 border-red-200',
  LEAVE: 'bg-amber-100 text-amber-800 border-amber-200',
  HOLIDAY: 'bg-violet-100 text-violet-800 border-violet-200',
  WEEKEND: 'bg-slate-100 text-slate-600 border-slate-200',
  UPCOMING: 'bg-sky-50 text-sky-700 border-sky-200',
  HALF_DAY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  WORK_FROM_HOME: 'bg-purple-100 text-purple-800 border-purple-200',
};

// Statuses employee can request edit for
const EDITABLE_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'WORK_FROM_HOME'];
const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'WORK_FROM_HOME'];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FINANCIAL_YEARS = ['2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027'];

function getCurrentFinancialYear() {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (month >= 4) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

function formatDate(d) {
  if (!d) return '';
  const x = typeof d === 'string' ? d : `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.dayOfMonth || d.day).padStart(2, '0')}`;
  return new Date(x).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}


function EditAttendanceModal({ day, dateStr, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    status: day?.dayStatus || 'PRESENT',
    checkIn: day?.checkIn ? `${dateStr}T${day.checkIn}` : '',
    checkOut: day?.checkOut ? `${dateStr}T${day.checkOut}` : '',
    reason: '',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.reason.trim()) { setError('Please provide a reason for the edit'); return; }
    if (!day?.attendanceId) { setError('No attendance record found for this day. Only existing records can be edited.'); return; }

    setLoading(true);
    try {
      const payload = {
        employeeId: user?.id,
        status: form.status,
        reason: form.reason,
        remarks: form.remarks || null,
        checkIn: form.checkIn ? form.checkIn + ':00' : null,
        checkOut: form.checkOut ? form.checkOut + ':00' : null,
      };
      const res = await attendanceAPI.editAttendance(day.attendanceId, payload);
      onSaved(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  const displayDate = new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Edit Attendance</h3>
            <p className="text-xs text-slate-500 mt-0.5">{displayDate}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Original status */}
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              <ShieldAlert size={13} />
              Current status:
              <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${DAY_STATUS_STYLES[day?.dayStatus] || 'bg-slate-100 text-slate-600'}`}>
                {day?.dayStatus || 'UNKNOWN'}
              </span>
            </div>

            {/* New Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Check In */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Check In Time</label>
              <input
                type="datetime-local"
                value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            {/* Check Out */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Check Out Time</label>
              <input
                type="datetime-local"
                value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            {/* Reason — required */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Explain why you are requesting this change..."
                rows={3}
                required
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Note */}
            <p className="text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              ⚠️ Your edit request will be recorded with your name and timestamp. Admin can review all edits in the Edit History.
            </p>

          </div>

          {/* Sticky button footer — always visible */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-white rounded-b-2xl">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors">
              {loading ? 'Saving...' : 'Submit Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Calendar Component ───────────────────────────────────────────────────
export default function Calendar() {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const canManage = isAdmin || isHR || isManager;

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [viewType, setViewType] = useState('MONTH');

  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [employeeDays, setEmployeeDays] = useState([]);
  const [adminLeaves, setAdminLeaves] = useState([]);
  const [adminHolidays, setAdminHolidays] = useState([]);
  const [holidaysByYear, setHolidaysByYear] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Holiday modal
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayForm, setHolidayForm] = useState({ name: '', holidayDate: '', description: '', holidayType: 'PUBLIC' });
  const [savingHoliday, setSavingHoliday] = useState(false);

  // Edit attendance modal (employee only)
  const [editDay, setEditDay] = useState(null);   // the day object clicked
  const [editDateStr, setEditDateStr] = useState('');     // "2026-03-15"
  const [editSuccess, setEditSuccess] = useState('');

  const employeeId = user?.id;

  const loadEmployeeCalendar = () => {
    if (!canManage && employeeId) {
      setLoading(true);
      setError('');
      calendarAPI.getEmployeeCalendar(employeeId, year, month)
        .then((res) => {
          const data = unwrap(res);
          setEmployeeDays(Array.isArray(data) ? data : []);
        })
        .catch((e) => {
          setError(e.response?.data?.message || e.message || 'Failed to load calendar');
          setEmployeeDays([]);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { loadEmployeeCalendar(); }, [canManage, employeeId, year, month]);

  useEffect(() => {
    if (canManage) {
      setLoading(true);
      setError('');
      Promise.all([
        calendarAPI.getAdminCalendar(year, month),
        calendarAPI.getHolidays(year),
      ])
        .then(([calRes, holRes]) => {
          const cal = unwrap(calRes);
          setAdminLeaves(Array.isArray(cal?.leaves) ? cal.leaves : []);
          setAdminHolidays(Array.isArray(cal?.holidays) ? cal.holidays : []);
          const allHol = unwrap(holRes);
          setHolidaysByYear(Array.isArray(allHol) ? allHol : []);
        })
        .catch((e) => {
          setError(e.response?.data?.message || e.message || 'Failed to load calendar');
          setAdminLeaves([]); setAdminHolidays([]); setHolidaysByYear([]);
        })
        .finally(() => setLoading(false));
    }
  }, [canManage, year, month]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const monthLabel = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.name?.trim() || !holidayForm.holidayDate) return;
    setSavingHoliday(true);
    try {
      const payload = {
        name: holidayForm.name.trim(),
        holidayDate: holidayForm.holidayDate, // already correct (date input includes year)
        description: holidayForm.description?.trim() || null,
        holidayType: holidayForm.holidayType || 'PUBLIC'
      };
      if (editingHoliday?.id) { await calendarAPI.updateHoliday(editingHoliday.id, payload); }
      else { await calendarAPI.addHoliday(payload); }
      setShowHolidayModal(false); setEditingHoliday(null);
      setHolidayForm({
        name: '',
        holidayDate: `${year}-01-01`,
        description: '',
        holidayType: 'PUBLIC'
      });
      const allHol = await calendarAPI.getHolidays(year);
      setHolidaysByYear(Array.isArray(unwrap(allHol)) ? unwrap(allHol) : []);
      const cal = await calendarAPI.getAdminCalendar(year, month);
      const calData = unwrap(cal);
      setAdminHolidays(Array.isArray(calData?.holidays) ? calData.holidays : []);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to save holiday'); }
    finally { setSavingHoliday(false); }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await calendarAPI.deleteHoliday(id);
      setHolidaysByYear((prev) => prev.filter((h) => h.id !== id));
      setAdminHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to delete'); }
  };

  const openEditHoliday = (h) => {
    setEditingHoliday(h);
    setHolidayForm({ name: h.name || '', holidayDate: h.holidayDate ? (h.holidayDate.slice ? h.holidayDate.slice(0, 10) : h.holidayDate) : '', description: h.description || '', holidayType: h.holidayType || 'PUBLIC' });
    setShowHolidayModal(true);
  };

  const getDayDate = (d) => {
    if (!d) return '';
    if (d.date) {
      const x = d.date;
      const str = typeof x === 'string' ? x : `${x.year}-${String(x.month).padStart(2, '0')}-${String(x.dayOfMonth ?? x.day).padStart(2, '0')}`;
      return str;
    }
    return '';
  };

  // Handle day click — only for editable statuses and past dates
  const handleDayClick = (cell) => {
    if (canManage) return; // admin uses attendance table edit
    const { dayData, dateStr } = cell;
    if (!dayData || !dateStr) return;
    if (!EDITABLE_STATUSES.includes(dayData.dayStatus)) return;
    // Only allow past dates (not future/upcoming)
    const clickedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (clickedDate >= today) return; // can't edit today or future
    setEditDay(dayData);
    setEditDateStr(dateStr);
  };

  const handleEditSaved = (updatedData) => {
    setEditDay(null);
    setEditDateStr('');
    setEditSuccess(`Attendance updated successfully! Edited by ${updatedData?.editedBy || 'you'} · Admin has been notified.`);
    setTimeout(() => setEditSuccess(''), 5000);
    loadEmployeeCalendar(); // refresh calendar
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const startPadding = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const totalRows = Math.ceil((startPadding + daysInMonth) / 7);

  const dayIndexMap = {};
  (employeeDays || []).forEach((day) => {
    const key = getDayDate(day);
    if (key) dayIndexMap[key] = day;
  });

  const filteredAdminLeaves = useMemo(() => {
    let data = adminLeaves || [];
    if (statusFilter !== 'All') {
      data = data.filter((item) => item.status === statusFilter);
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      data = data.filter((item) =>
        (item.employeeName || '').toLowerCase().includes(q) ||
        (item.employeeId || '').toLowerCase().includes(q) ||
        (item.department || '').toLowerCase().includes(q)
      );
    }
    return data;
  }, [adminLeaves, statusFilter, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredAdminLeaves.length / rowsPerPage));
  const paginatedAdminLeaves = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAdminLeaves.slice(start, start + rowsPerPage);
  }, [filteredAdminLeaves, currentPage, rowsPerPage]);

  const calendarGrid = [];
  for (let i = 0; i < totalRows * 7; i++) {
    const dayNum = i - startPadding + 1;
    const isInMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dateStr = isInMonth ? `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : null;
    const dayData = dateStr ? dayIndexMap[dateStr] : null;

    // Is this day editable by employee?
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const clickedDate = dateStr ? new Date(dateStr) : null;
    const isEditable = !canManage && dayData && EDITABLE_STATUSES.includes(dayData.dayStatus) && clickedDate && clickedDate < today;

    calendarGrid.push({ dayNum: isInMonth ? dayNum : null, dateStr, dayData, isInMonth, isEditable });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
          <p className="text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">

          {/* View Type */}
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="MONTH">Monthly</option>
            <option value="YEAR">Yearly</option>
          </select>

          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>

          {/* Month Navigation ONLY if monthly */}
          {viewType === 'MONTH' && (
            <>
              <button onClick={prevMonth} className="p-2 border rounded-lg">
                <ChevronLeft size={18} />
              </button>

              <span className="font-semibold">{monthLabel}</span>

              <button onClick={nextMonth} className="p-2 border rounded-lg">
                <ChevronRight size={18} />
              </button>
            </>
          )}

        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {/* Edit success banner */}
      {editSuccess && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          <CheckCircle size={16} className="shrink-0" />
          {editSuccess}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {/* ── EMPLOYEE CALENDAR VIEW ─ */}
      {!loading && !canManage && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <CalendarIcon size={18} />
              <span className="font-medium">My Calendar</span>
            </div>
            {/* Hint for employee */}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Pencil size={11} />
              Click a past PRESENT/ABSENT day to edit
            </span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
              {DAYS.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((cell, idx) => {
                const { dayNum, dayData, isInMonth, isEditable } = cell;
                const style = dayData ? DAY_STATUS_STYLES[dayData.dayStatus] || 'bg-slate-50 border-slate-100' : 'bg-slate-50 border-slate-100';
                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClick(cell)}
                    className={`min-h-[72px] rounded-lg border p-1.5 text-center transition-all
                      ${isInMonth ? style : 'bg-slate-50/50 border-slate-100'}
                      ${isEditable ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 hover:shadow-md' : ''}
                    `}
                  >
                    {isInMonth && (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-medium text-slate-700">{dayNum}</span>
                        {/* Show pencil icon on editable days */}
                        {isEditable && (
                          <Pencil size={9} className="text-indigo-400" />
                        )}
                      </div>
                    )}
                    {dayData && (
                      <div className="text-[10px] mt-0.5 space-y-0.5">
                        <div className="font-medium truncate">{dayData.dayStatus}</div>
                        {dayData.holidayName && <div className="truncate text-violet-700">{dayData.holidayName}</div>}
                        {dayData.checkIn && <div className="text-slate-600">{dayData.checkIn}</div>}
                        {dayData.checkOut && <div className="text-slate-600">{dayData.checkOut}</div>}
                        {dayData.leaveType && <div className="truncate">{dayData.leaveType} ({dayData.leaveStatus})</div>}
                        {/* Edited badge */}
                        {dayData.isEdited && (
                          <div className="text-[9px] bg-amber-100 text-amber-700 rounded px-1 mt-0.5 truncate">
                            ✏ Edited
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
              {Object.entries(DAY_STATUS_STYLES).map(([k, v]) => (
                <span key={k} className={`text-xs px-2 py-1 rounded border ${v}`}>{k}</span>
              ))}
              <span className="text-xs px-2 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-600 flex items-center gap-1">
                <Pencil size={9} /> Click past days to edit
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN / HR / MANAGER VIEW ──────────────────────────────────────── */}
      {!loading && canManage && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Sun size={18} />
                  {viewType === 'MONTH'
                    ? `Holidays in ${monthLabel}`
                    : `All Holidays in ${year}`}
                </span>
              </div>
              <div className="p-4 max-h-[360px] overflow-y-auto">
                {adminLeaves.length === 0 ? (
                  <p className="text-slate-500 text-sm">No leaves in this month.</p>
                ) : (
                  <ul className="space-y-2">
                    {adminLeaves.map((l) => (
                      <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <span className="font-medium text-slate-800">{l.employeeName || l.employeeId}</span>
                          <span className="text-slate-500 text-sm ml-2">{l.leaveType} • {formatDate(l.startDate)} – {formatDate(l.endDate)}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${l.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {l.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Sun size={18} /> Holidays in {monthLabel}
                </span>
                <button type="button"
                  onClick={() => { setEditingHoliday(null); setHolidayForm({ name: '', holidayDate: '', description: '', holidayType: 'PUBLIC' }); setShowHolidayModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
                  <Plus size={16} /> Add
                </button>
              </div>
              <div className="p-4 max-h-[360px] overflow-y-auto">
                {(viewType === 'MONTH' ? adminHolidays : holidaysByYear).length === 0 ? (
                  <p className="text-slate-500 text-sm">No holidays found.</p>
                ) : (
                  <ul className="space-y-2">
                    {(viewType === 'MONTH' ? adminHolidays : holidaysByYear).map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-violet-50/50 border border-violet-100">
                        <div>
                          <span className="font-medium text-slate-800">{h.name}</span>
                          <span className="text-slate-500 text-sm ml-2">
                            {formatDate(h.holidayDate)}
                          </span>
                          {h.holidayType && (
                            <span className="text-xs text-slate-400 ml-2">
                              ({h.holidayType})
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <span className="font-medium text-slate-700">All holidays in {year}</span>
            </div>
            <div className="p-4 max-h-[240px] overflow-y-auto">
              {holidaysByYear.length === 0 ? (
                <p className="text-slate-500 text-sm">No holidays for this year.</p>
              ) : (
                <ul className="space-y-1.5">
                  {holidaysByYear.map((h) => (
                    <li key={h.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-50">
                      <span>{h.name}</span>
                      <span className="text-slate-500 text-sm">{formatDate(h.holidayDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Holiday Modal (Admin) ─────────────────────────────────────────── */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">{editingHoliday ? 'Edit holiday' : 'Add holiday'}</h2>
              <button type="button" onClick={() => { setShowHolidayModal(false); setEditingHoliday(null); }} className="p-1 rounded hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveHoliday} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" value={holidayForm.name} onChange={(e) => setHolidayForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800" placeholder="e.g. Diwali" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={holidayForm.holidayDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;

                    // FORCE selected year
                    const [_, month, day] = selectedDate.split('-');
                    const fixedDate = `${year}-${month}-${day}`;

                    setHolidayForm((f) => ({
                      ...f,
                      holidayDate: fixedDate
                    }));
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input type="text" value={holidayForm.description} onChange={(e) => setHolidayForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select value={holidayForm.holidayType} onChange={(e) => setHolidayForm((f) => ({ ...f, holidayType: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800">
                  <option value="PUBLIC">Public</option>
                  <option value="OPTIONAL">Optional</option>
                  <option value="RESTRICTED">Restricted</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={savingHoliday} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {savingHoliday ? 'Saving...' : editingHoliday ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={() => setShowHolidayModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Attendance Modal (Employee) ─────────────────────────────── */}
      {editDay && editDateStr && (
        <EditAttendanceModal
          day={editDay}
          dateStr={editDateStr}
          user={user}
          onClose={() => { setEditDay(null); setEditDateStr(''); }}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
