
import { useState, useEffect, useMemo, useCallback } from 'react';
import { attendanceAPI } from '../api/services';
import {
  Search, X, Download, FileSpreadsheet,
  ChevronLeft, ChevronRight, AlertCircle, Users,
} from 'lucide-react';


const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const EMPLOYEE_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];

function toMonthParam(yyyyMM) {
  return `${yyyyMM}-01`;
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MonthlyAttendance() {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  // ── Data state ────────────────────────────────────────────────────────────
  const [month, setMonth] = useState(currentMonthStr);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [excelLoading, setExcelLoading] = useState(false);   // monthly excel
  const [yearlyLoading, setYearlyLoading] = useState(false); // yearly excel

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  // ── Pagination state ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Derived: unique departments from loaded data ──────────────────────────
  const departments = useMemo(() => {
    const set = new Set(rows.map((r) => r.department).filter(Boolean));
    return ['ALL', ...Array.from(set).sort()];
  }, [rows]);

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const name = searchName.trim().toLowerCase();
    const id   = searchId.trim().toLowerCase();
    return rows.filter((r) => {
      if (name && !(r.employeeName || '').toLowerCase().includes(name)) return false;
      if (id   && !(r.employeeId   || '').toLowerCase().includes(id))   return false;
      if (filterDept !== 'ALL' && r.department !== filterDept)           return false;
      if (filterType !== 'ALL' && r.employeeType !== filterType)         return false;
      return true;
    });
  }, [rows, searchName, searchId, filterDept, filterType]);

  // Reset to page 1 on any filter/size change
  useEffect(() => { setCurrentPage(1); }, [searchName, searchId, filterDept, filterType, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // ── Summary stats (filtered) ──────────────────────────────────────────────
  const stats = useMemo(() => ({
    present:  filtered.reduce((s, r) => s + (r.present  || 0), 0),
    absent:   filtered.reduce((s, r) => s + (r.absent   || 0), 0),
    halfDay:  filtered.reduce((s, r) => s + (r.halfDay  || 0), 0),
    onLeave:  filtered.reduce((s, r) => s + (r.onLeave  || 0), 0),
  }), [filtered]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await attendanceAPI.reportMonthly({ month: toMonthParam(month) });
      const data = res?.data?.data || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load attendance');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  // Auto-fetch on mount and whenever month changes
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Excel downloads ───────────────────────────────────────────────────────
  const handleMonthlyExcel = async () => {
    setExcelLoading(true);
    try {
      const res = await attendanceAPI.exportMonthly(toMonthParam(month));
      downloadBlob(
        new Blob([res.data], { type: res.headers['content-type'] }),
        `attendance_monthly_${month}.xlsx`
      );
    } catch (e) {
      alert(e.response?.data?.message || 'Export failed');
    } finally {
      setExcelLoading(false);
    }
  };

  const handleYearlyExcel = async () => {
    setYearlyLoading(true);
    const year = month.slice(0, 4);
    try {
      const res = await attendanceAPI.exportYearly(year);
      downloadBlob(
        new Blob([res.data], { type: res.headers['content-type'] }),
        `attendance_yearly_${year}.xlsx`
      );
    } catch (e) {
      alert(e.response?.data?.message || 'Export failed');
    } finally {
      setYearlyLoading(false);
    }
  };

  // ── Filter helpers ────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearchName('');
    setSearchId('');
    setFilterDept('ALL');
    setFilterType('ALL');
  };
  const hasActiveFilters =
    searchName || searchId || filterDept !== 'ALL' || filterType !== 'ALL';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 rounded-xl">
            <FileSpreadsheet size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Attendance — Monthly</h1>
            <p className="text-slate-500 text-sm mt-0.5">Summary by employee for the selected month.</p>
          </div>
        </div>

        {/* Month picker + Export buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />

          {/* Download Monthly Excel — green */}
          <button
            onClick={handleMonthlyExcel}
            disabled={excelLoading || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-lg transition-colors"
          >
            <Download size={15} />
            {excelLoading ? 'Downloading…' : 'Download Excel'}
          </button>

          {/* Yearly Excel — green */}
          <button
            onClick={handleYearlyExcel}
            disabled={yearlyLoading || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 disabled:opacity-60 rounded-lg transition-colors"
          >
            <FileSpreadsheet size={15} />
            {yearlyLoading ? 'Downloading…' : 'Yearly Excel'}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Summary Stats ── */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Present',  value: stats.present,  color: 'bg-green-50  border-green-100  text-green-700'  },
            { label: 'Absent',   value: stats.absent,   color: 'bg-red-50    border-red-100    text-red-700'    },
            { label: 'Half Day', value: stats.halfDay,  color: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
            { label: 'On Leave', value: stats.onLeave,  color: 'bg-blue-50   border-blue-100   text-blue-700'   },
          ].map(({ label, value, color }) => (
            <div key={label} className={`border rounded-xl p-3 flex items-center gap-3 ${color}`}>
              <div>
                <p className="text-xs font-medium opacity-70">{label}{hasActiveFilters ? ' (filtered)' : ''}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center">

          {/* Search by Name */}
          <div className="relative min-w-[180px] flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name…"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 placeholder-slate-400"
            />
            {searchName && (
              <button onClick={() => setSearchName('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Search by Employee ID */}
          <div className="relative min-w-[180px] flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by employee ID…"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 placeholder-slate-400"
            />
            {searchId && (
              <button onClick={() => setSearchId('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Department filter — built from live data */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-slate-700 min-w-[140px]"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>
            ))}
          </select>

          {/* Employee Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-slate-700 min-w-[140px]"
          >
            <option value="ALL">All Types</option>
            {EMPLOYEE_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>

          {/* Clear button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <X size={13} /> Clear filters
            </button>
          )}

          {/* Result count badge */}
          {hasActiveFilters && (
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-full whitespace-nowrap">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">

        {/* Table header row */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">
              {hasActiveFilters
                ? `${filtered.length} of ${rows.length} employees`
                : `${rows.length} employees`}
            </span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[
                  'Employee ID', 'Employee Name', 'Department', 'Employee Type',
                  'Month', 'Present', 'Half Day', 'On Leave', 'Absent',
                  'Total Marked', 'Edited',
                ].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(11)].map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search size={28} className="opacity-40" />
                      <p className="font-medium text-slate-500 text-sm">No records found</p>
                      {hasActiveFilters && (
                        <p className="text-xs">
                          Try adjusting filters or{' '}
                          <button onClick={clearFilters} className="text-indigo-500 underline hover:text-indigo-700">
                            clear all
                          </button>
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((r, idx) => (
                  <tr key={`${r.employeeId}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">{r.employeeId}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{r.employeeName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.department || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {(r.employeeType || '—').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{r.month}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-green-600">{r.present ?? 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-yellow-600">{r.halfDay ?? 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-blue-600">{r.onLeave ?? 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-red-500">{r.absent ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.totalMarked ?? 0}</td>
                    <td className="py-3 px-4">
                      {r.totalEdited > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          {r.totalEdited} edit{r.totalEdited > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Rows per page + info */}
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-slate-400">
              {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </span>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page number pills */}
            {(() => {
              const pages = [];
              const range = 2;
              const start = Math.max(1, currentPage - range);
              const end   = Math.min(totalPages, currentPage + range);

              if (start > 1) {
                pages.push(
                  <button key={1} onClick={() => setCurrentPage(1)}
                    className="w-8 h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                    1
                  </button>
                );
                if (start > 2) pages.push(<span key="s" className="px-1 text-slate-400 text-xs">…</span>);
              }
              for (let i = start; i <= end; i++) {
                pages.push(
                  <button key={i} onClick={() => setCurrentPage(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      i === currentPage
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                    {i}
                  </button>
                );
              }
              if (end < totalPages) {
                if (end < totalPages - 1) pages.push(<span key="e" className="px-1 text-slate-400 text-xs">…</span>);
                pages.push(
                  <button key={totalPages} onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                    {totalPages}
                  </button>
                );
              }
              return pages;
            })()}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
