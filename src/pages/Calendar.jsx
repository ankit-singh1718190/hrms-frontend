import { useState, useEffect } from 'react';
import { calendarAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Sun, Briefcase, Plus, Pencil, Trash2, X,
} from 'lucide-react';

const unwrap = (res) => res?.data?.data;

const DAY_STATUS_STYLES = {
  PRESENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ABSENT: 'bg-red-50 text-red-700 border-red-200',
  LEAVE: 'bg-amber-100 text-amber-800 border-amber-200',
  HOLIDAY: 'bg-violet-100 text-violet-800 border-violet-200',
  WEEKEND: 'bg-slate-100 text-slate-600 border-slate-200',
  UPCOMING: 'bg-sky-50 text-sky-700 border-sky-200',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(d) {
  if (!d) return '';
  const x = typeof d === 'string' ? d : `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.dayOfMonth || d.day).padStart(2, '0')}`;
  return new Date(x).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Calendar() {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const canManage = isAdmin || isHR || isManager;

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);

  const [employeeDays, setEmployeeDays] = useState([]);
  const [adminLeaves, setAdminLeaves] = useState([]);
  const [adminHolidays, setAdminHolidays] = useState([]);
  const [holidaysByYear, setHolidaysByYear] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayForm, setHolidayForm] = useState({ name: '', holidayDate: '', description: '', holidayType: 'PUBLIC' });
  const [savingHoliday, setSavingHoliday] = useState(false);

  const employeeId = user?.id;

  useEffect(() => {
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
  }, [canManage, employeeId, year, month]);

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
          const leaves = cal?.leaves ?? [];
          const holidays = cal?.holidays ?? [];
          setAdminLeaves(Array.isArray(leaves) ? leaves : []);
          setAdminHolidays(Array.isArray(holidays) ? holidays : []);
          const allHol = unwrap(holRes);
          setHolidaysByYear(Array.isArray(allHol) ? allHol : []);
        })
        .catch((e) => {
          setError(e.response?.data?.message || e.message || 'Failed to load calendar');
          setAdminLeaves([]);
          setAdminHolidays([]);
          setHolidaysByYear([]);
        })
        .finally(() => setLoading(false));
    }
  }, [canManage, year, month]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.name?.trim() || !holidayForm.holidayDate) return;
    setSavingHoliday(true);
    try {
      const payload = {
        name: holidayForm.name.trim(),
        holidayDate: holidayForm.holidayDate,
        description: holidayForm.description?.trim() || null,
        holidayType: holidayForm.holidayType || 'PUBLIC',
      };
      if (editingHoliday?.id) {
        await calendarAPI.updateHoliday(editingHoliday.id, payload);
      } else {
        await calendarAPI.addHoliday(payload);
      }
      setShowHolidayModal(false);
      setEditingHoliday(null);
      setHolidayForm({ name: '', holidayDate: '', description: '', holidayType: 'PUBLIC' });
      const allHol = await calendarAPI.getHolidays(year);
      setHolidaysByYear(Array.isArray(unwrap(allHol)) ? unwrap(allHol) : []);
      const cal = await calendarAPI.getAdminCalendar(year, month);
      const calData = unwrap(cal);
      setAdminHolidays(Array.isArray(calData?.holidays) ? calData.holidays : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save holiday');
    } finally {
      setSavingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await calendarAPI.deleteHoliday(id);
      setHolidaysByYear((prev) => prev.filter((h) => h.id !== id));
      setAdminHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete');
    }
  };

  const openEditHoliday = (h) => {
    setEditingHoliday(h);
    setHolidayForm({
      name: h.name || '',
      holidayDate: h.holidayDate ? (h.holidayDate.slice ? h.holidayDate.slice(0, 10) : h.holidayDate) : '',
      description: h.description || '',
      holidayType: h.holidayType || 'PUBLIC',
    });
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

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const startPadding = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const totalSlots = startPadding + daysInMonth;
  const totalRows = Math.ceil(totalSlots / 7);

  const dayIndexMap = {};
  (employeeDays || []).forEach((day) => {
    const key = getDayDate(day);
    if (key) dayIndexMap[key] = day;
  });

  const calendarGrid = [];
  for (let i = 0; i < totalRows * 7; i++) {
    const dayNum = i - startPadding + 1;
    const isInMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dateStr = isInMonth ? `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : null;
    const dayData = dateStr ? dayIndexMap[dateStr] : null;
    calendarGrid.push({ dayNum: isInMonth ? dayNum : null, dateStr, dayData, isInMonth });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
          <p className="text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-[180px] text-center font-semibold text-slate-800">{monthLabel}</span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}

      {!loading && !canManage && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 text-slate-700">
            <CalendarIcon size={18} />
            <span className="font-medium">My calendar</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
              {DAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((cell, idx) => {
                const { dayNum, dateStr, dayData, isInMonth } = cell;
                const style = dayData ? DAY_STATUS_STYLES[dayData.dayStatus] || 'bg-slate-50' : 'bg-slate-50';
                return (
                  <div
                    key={idx}
                    className={`min-h-[72px] rounded-lg border p-1.5 text-center ${isInMonth ? style : 'bg-slate-50/50 border-slate-100'}`}
                  >
                    {isInMonth && <div className="text-sm font-medium text-slate-700">{dayNum}</div>}
                    {dayData && (
                      <div className="text-[10px] mt-0.5 space-y-0.5">
                        <div className="font-medium truncate">{dayData.dayStatus}</div>
                        {dayData.holidayName && <div className="truncate text-violet-700">{dayData.holidayName}</div>}
                        {dayData.checkIn && <div className="text-slate-600">{dayData.checkIn}</div>}
                        {dayData.checkOut && <div className="text-slate-600">{dayData.checkOut}</div>}
                        {dayData.leaveType && <div className="truncate">{dayData.leaveType} ({dayData.leaveStatus})</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
              {Object.entries(DAY_STATUS_STYLES).map(([k, v]) => (
                <span key={k} className={`text-xs px-2 py-1 rounded border ${v}`}>
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && canManage && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Briefcase size={18} />
                  Leaves in {monthLabel}
                </span>
              </div>
              <div className="p-4 max-h-[360px] overflow-y-auto">
                {adminLeaves.length === 0 ? (
                  <p className="text-slate-500 text-sm">No leaves in this month.</p>
                ) : (
                  <ul className="space-y-2">
                    {adminLeaves.map((l) => (
                      <li
                        key={l.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div>
                          <span className="font-medium text-slate-800">{l.employeeName || l.employeeId}</span>
                          <span className="text-slate-500 text-sm ml-2">
                            {l.leaveType} • {formatDate(l.startDate)} – {formatDate(l.endDate)}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            l.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
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
                  <Sun size={18} />
                  Holidays in {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingHoliday(null);
                    setHolidayForm({ name: '', holidayDate: '', description: '', holidayType: 'PUBLIC' });
                    setShowHolidayModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              <div className="p-4 max-h-[360px] overflow-y-auto">
                {adminHolidays.length === 0 ? (
                  <p className="text-slate-500 text-sm">No holidays in this month.</p>
                ) : (
                  <ul className="space-y-2">
                    {adminHolidays.map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-violet-50/50 border border-violet-100"
                      >
                        <div>
                          <span className="font-medium text-slate-800">{h.name}</span>
                          <span className="text-slate-500 text-sm ml-2">{formatDate(h.holidayDate)}</span>
                          {h.holidayType && (
                            <span className="text-xs text-slate-400 ml-2">({h.holidayType})</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEditHoliday(h)}
                            className="p-1.5 rounded text-slate-500 hover:bg-slate-200"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(h.id)}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingHoliday ? 'Edit holiday' : 'Add holiday'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowHolidayModal(false);
                  setEditingHoliday(null);
                }}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveHoliday} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  placeholder="e.g. Diwali"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={holidayForm.holidayDate}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, holidayDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={holidayForm.holidayType}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, holidayType: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="OPTIONAL">Optional</option>
                  <option value="RESTRICTED">Restricted</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingHoliday}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingHoliday ? 'Saving...' : editingHoliday ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
