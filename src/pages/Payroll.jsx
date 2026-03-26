import { useEffect, useState, useMemo } from 'react';
import { payrollAPI, employeeAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import { DollarSign, Play, CheckCircle, CreditCard, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

const unwrap = (res) => res?.data?.data;

const STATUS_STYLES = {
  GENERATED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-600',
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function Payroll() {
  const { user, isAdmin, isHR, isEmployee } = useAuth();
  const canManage = isAdmin || isHR;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [editing, setEditing] = useState(null);

  // ── Filter state ──────────────────────────────────────────────
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // ── Pagination state ──────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Filtered + paginated data ─────────────────────────────────
  const filtered = useMemo(() => {
    return payrolls.filter((p) => {
      const name = (p.employeeName || '').toLowerCase();
      const empId = (p.employeeId || '').toString().toLowerCase();
      const matchName = name.includes(searchName.toLowerCase().trim());
      const matchId = empId.includes(searchId.toLowerCase().trim());
      const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
      return matchName && matchId && matchStatus;
    });
  }, [payrolls, searchName, searchId, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [searchName, searchId, filterStatus, pageSize]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalNet = filtered.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  // ── API helpers ───────────────────────────────────────────────
  const handleDownload = async (id) => {
    try {
      const res = await payrollAPI.downloadPayslip(id);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download failed');
    }
  };

  const fetchPayroll = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (isEmployee) {
        res = await payrollAPI.getByEmployee(user.id);
        const data = unwrap(res);
        setPayrolls(Array.isArray(data) ? data : data?.content ?? []);
      } else {
        const monthParam = `${month}-01`;
        res = await payrollAPI.getByMonth(monthParam, { page: 0, size: 500 });
        const data = unwrap(res);
        setPayrolls(Array.isArray(data) ? data : data?.content ?? []);
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to load payroll';
      setError(`Failed to load payroll: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayroll(); }, [month]);

  useEffect(() => {
    if (!canManage) return;
    const loadEmployees = async () => {
      try {
        const res = await employeeAPI.getAll({ page: 0, size: 500 });
        const data = res?.data?.data ?? res?.data;
        const list = Array.isArray(data) ? data : data?.content ?? [];
        setEmployees(list);
      } catch { /* ignore */ }
    };
    loadEmployees();
  }, [canManage]);

  const handleOpenEditForSelected = () => {
    if (!selectedEmployeeId) return;
    const row = payrolls.find((p) => String(p.employeeId) === String(selectedEmployeeId));
    if (row) setEditing(row);
    else alert('No payroll record for this employee in the selected month.');
  };

  const handleGenerate = async () => {
    // Check if at least one payroll record has been edited/created for the month
    if (payrolls.length === 0) {
      setError('Please edit and save payroll for at least one employee first before generating payroll for the entire month.');
      return;
    }
    setActionLoading('generate');
    setError('');
    try {
      await payrollAPI.generate(`${month}-01`);
      fetchPayroll();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to generate payroll');
    } finally { setActionLoading(null); }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await payrollAPI.approve(id);
      fetchPayroll();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally { setActionLoading(null); }
  };

  const handleProcess = async (id) => {
    setActionLoading(`pay-${id}`);
    try {
      await payrollAPI.processPayment(id);
      fetchPayroll();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally { setActionLoading(null); }
  };

  const clearFilters = () => {
    setSearchName('');
    setSearchId('');
    setFilterStatus('ALL');
  };

  const hasActiveFilters = searchName || searchId || filterStatus !== 'ALL';

  return (
    <div className="p-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payroll</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isEmployee
              ? 'My payslips'
              : `${filtered.length} of ${payrolls.length} records`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {!isEmployee && (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
          {canManage && employees.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.employeeId}>
                    {emp.employeeId} – {emp.firstName} {emp.lastName ?? ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleOpenEditForSelected}
                disabled={!selectedEmployeeId}
                className="px-3 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Edit payroll
              </button>
            </div>
          )}
          {canManage && (
            <button
              onClick={handleGenerate}
              disabled={actionLoading === 'generate'}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <Play size={15} /> {actionLoading === 'generate' ? 'Generating…' : 'Generate'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Total Net ── */}
      {canManage && filtered.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
          <DollarSign size={20} className="text-indigo-600" />
          <div>
            <p className="text-xs text-indigo-500 font-medium">
              Total Net Payroll{hasActiveFilters ? ' (filtered)' : ''}
            </p>
            <p className="text-xl font-bold text-indigo-700">₹{totalNet.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">

          {/* Search by Name */}
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name…"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 placeholder-slate-400"
            />
            {searchName && (
              <button
                onClick={() => setSearchName('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Search by Employee ID */}
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by employee ID…"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 placeholder-slate-400"
            />
            {searchId && (
              <button
                onClick={() => setSearchId('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-slate-700 min-w-[130px]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="GENERATED">Generated</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <X size={13} /> Clear filters
            </button>
          )}

          {/* Results count badge */}
          {hasActiveFilters && (
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-full whitespace-nowrap">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Employee', 'Month', 'Basic Salary', 'Deductions', 'Net Salary', 'Status', 'Download', canManage ? 'Actions' : ''].filter(Boolean).map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(pageSize > 5 ? 5 : pageSize)].map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="py-3 px-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Search size={28} className="opacity-40" />
                    <p className="font-medium text-slate-500">No records found</p>
                    {hasActiveFilters && (
                      <p className="text-xs">
                        Try adjusting your filters or{' '}
                        <button onClick={clearFilters} className="text-indigo-500 underline hover:text-indigo-700">
                          clear all
                        </button>
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.payrollId || p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{p.employeeName || p.employeeId}</div>
                    <div className="text-xs text-slate-400">{p.employeeId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">{p.month}</td>
                  <td className="py-3 px-4 text-slate-700">₹{(p.basicSalary || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-red-500">-₹{(p.totalDeductions || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-semibold text-green-600">₹{(p.netSalary || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDownload(p.payrollId || p.id)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                    >
                      Download
                    </button>
                  </td>
                  {canManage && (
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {(p.status === 'GENERATED' || p.status === 'PENDING') && (
                          <button
                            onClick={() => handleApprove(p.payrollId || p.id)}
                            disabled={actionLoading === (p.payrollId || p.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} />
                            {actionLoading === (p.payrollId || p.id) ? '…' : 'Approve'}
                          </button>
                        )}
                        {p.status === 'APPROVED' && (
                          <button
                            onClick={() => handleProcess(p.payrollId || p.id)}
                            disabled={actionLoading === `pay-${p.payrollId || p.id}`}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <CreditCard size={12} />
                            {actionLoading === `pay-${p.payrollId || p.id}` ? '…' : 'Pay'}
                          </button>
                        )}
                        <button
                          onClick={() => setEditing(p)}
                          className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">

          {/* Left: rows per page + info */}
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

          {/* Right: page controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium px-2"
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
              let start = Math.max(1, currentPage - range);
              let end = Math.min(totalPages, currentPage + range);
              if (start > 1) {
                pages.push(
                  <button key={1} onClick={() => setCurrentPage(1)}
                    className="w-8 h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                    1
                  </button>
                );
                if (start > 2) pages.push(<span key="dots-start" className="px-1 text-slate-400 text-xs">…</span>);
              }
              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      i === currentPage
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              if (end < totalPages) {
                if (end < totalPages - 1) pages.push(<span key="dots-end" className="px-1 text-slate-400 text-xs">…</span>);
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
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium px-2"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editing && (
        <EditPayrollModal
          payroll={editing}
          month={month}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchPayroll(); }}
        />
      )}
    </div>
  );
}

// ── EditPayrollModal ───────────────────────────────────────────────
function EditPayrollModal({ payroll, month, onClose, onSaved }) {
  const [form, setForm] = useState({
    basicSalary: payroll?.basicSalary || 0,
    hra: payroll?.hra || 0,
    specialAllowance: payroll?.specialAllowance || 0,
    arrears: payroll?.arrears || 0,
    perfPay: payroll?.perfPay || 0,
    weekendWorkDays: payroll?.weekendWorkDays || 0,
    reimbursement: payroll?.reimbursement || 0,
    fbp: payroll?.fbp || 0,
    tds: payroll?.tds || 0,
    salaryAdvance: payroll?.salaryAdvance || 0,
    otherDeduction: payroll?.otherDeduction || 0,
    remarks: payroll?.remarks || '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch fresh data from DB when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!payroll?.employeeId) return;
      setLoading(true);
      try {
        // Fetch payroll data for this specific employee in the current month
        const monthParam = `${month}-01`;
        const res = await payrollAPI.getByMonth(monthParam, { 
          page: 0, 
          size: 500,
          employeeId: payroll.employeeId 
        });
        const data = res?.data?.data;
        const list = Array.isArray(data) ? data : data?.content ?? [];
        
        // Find the payroll record for this employee
        const record = list.find((p) => String(p.employeeId) === String(payroll.employeeId));
        if (record) {
          setForm({
            basicSalary: record.basicSalary || 0,
            hra: record.hra || 0,
            specialAllowance: record.specialAllowance || 0,
            arrears: record.arrears || 0,
            perfPay: record.perfPay || 0,
            weekendWorkDays: record.weekendWorkDays || 0,
            reimbursement: record.reimbursement || 0,
            fbp: record.fbp || 0,
            tds: record.tds || 0,
            salaryAdvance: record.salaryAdvance || 0,
            otherDeduction: record.otherDeduction || 0,
            remarks: record.remarks || '',
          });
        }
      } catch (e) {
        // If no data available, leave form empty (will use initial state from payroll prop)
        console.log('No payroll data found, using empty form');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [payroll?.employeeId, month]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: field === 'remarks' ? value : value === '' ? '' : Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        employeeId: payroll.employeeId,
        payrollMonth: `${month}-01`,
        ...form,
      };
      await payrollAPI.save(payload);
      onSaved();
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Failed to save payroll');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Edit Payroll</h2>
            <p className="text-xs text-slate-500">
              {payroll.employeeName} • {payroll.employeeId} • {payroll.month}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm" disabled={saving || loading}>
            Close
          </button>
        </div>

        {loading && (
          <div className="p-5 flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500">Loading payroll data...</p>
            </div>
          </div>
        )}

        {!loading && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberField label="Basic Salary" value={form.basicSalary} onChange={handleChange('basicSalary')} />
              <NumberField label="HRA" value={form.hra} onChange={handleChange('hra')} />
              <NumberField label="Special Allowance" value={form.specialAllowance} onChange={handleChange('specialAllowance')} />
              <NumberField label="Arrears" value={form.arrears} onChange={handleChange('arrears')} />
              <NumberField label="Performance Pay" value={form.perfPay} onChange={handleChange('perfPay')} />
              <NumberField label="Weekend Work Days" value={form.weekendWorkDays} onChange={handleChange('weekendWorkDays')} min={0} />
              <NumberField label="Reimbursement" value={form.reimbursement} onChange={handleChange('reimbursement')} />
              <NumberField label="FBP" value={form.fbp} onChange={handleChange('fbp')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberField label="TDS" value={form.tds} onChange={handleChange('tds')} />
              <NumberField label="Salary Advance" value={form.salaryAdvance} onChange={handleChange('salaryAdvance')} />
              <NumberField label="Other Deduction" value={form.otherDeduction} onChange={handleChange('otherDeduction')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
              <textarea
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={3}
                value={form.remarks}
                onChange={handleChange('remarks')}
                placeholder="Optional notes for this payslip"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" disabled={saving}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Payroll'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={onChange}
        min={min}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );
}
