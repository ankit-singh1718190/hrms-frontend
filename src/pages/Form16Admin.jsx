import { useEffect, useRef, useState } from 'react';
import { adminAPI, employeeAPI } from '../api/services';
import { FileText, Upload, Loader2, Inbox, Trash2, BarChart2, ChevronDown, X } from 'lucide-react';

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-slate-50/80 border border-dashed border-slate-200">
      <Inbox className="w-10 h-10 text-slate-300 mb-3" />
      <p className="text-sm text-slate-500 text-center">{message}</p>
    </div>
  );
}

// ─── Employee Dropdown (loads ALL active employees once, shows as plain dropdown) ──
function EmployeeDropdown({ value, onChange }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all active employees once on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError('');
      try {
        // GET /api/employee/active → ApiResponse<List<EmployeeResponseDTO>>
        const res = await employeeAPI.getActiveEmployees();
        const list = res?.data?.data ?? res?.data ?? [];
        setEmployees(Array.isArray(list) ? list : []);
      } catch (err) {
        setError('Failed to load employees');
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const selectedId = Number(e.target.value);
    if (!selectedId) {
      onChange(null);
      return;
    }
    const emp = employees.find((em) => em.id === selectedId);
    onChange(emp || null);
  };

  const inputBase =
    'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  if (loading) {
    return (
      <div className={`${inputBase} flex items-center gap-2 text-slate-400`}>
        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        <span>Loading employees…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${inputBase} text-red-500 text-xs`}>{error}</div>
    );
  }

  return (
    <div className="relative">
      <select
        className={`${inputBase} appearance-none pr-8 cursor-pointer`}
        value={value?.id ?? ''}
        onChange={handleChange}
      >
        <option value="">— Select Employee ID —</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.id}
          </option>
        ))}
      </select>
      {/* Chevron icon */}
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Form16Admin() {
  const [fy, setFy] = useState('2024-25');
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [singleFy, setSingleFy] = useState('2024-25');
  const [singleFile, setSingleFile] = useState(null);
  const [singleUploading, setSingleUploading] = useState(false);
  const [singleMessage, setSingleMessage] = useState('');

  const [listLoading, setListLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [status, setStatus] = useState(null);
  const [listError, setListError] = useState('');

  const loadData = async (year) => {
    if (!year) return;
    setListLoading(true);
    setListError('');
    try {
      const [listRes, statusRes] = await Promise.all([
        adminAPI.getForm16List(year),
        adminAPI.getForm16Status(year),
      ]);
      const listData = listRes?.data?.data ?? [];
      const statusData = statusRes?.data?.data ?? statusRes?.data;
      setDocs(Array.isArray(listData) ? listData : []);
      setStatus(statusData || null);
    } catch (e) {
      setListError(e.response?.data?.message || e.message || 'Failed to load Form 16 data');
      setDocs([]);
      setStatus(null);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadData(fy);
  }, [fy]);

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile || !fy) {
      setBulkMessage('Please choose a ZIP file and enter financial year.');
      return;
    }
    setBulkUploading(true);
    setBulkMessage('');
    try {
      const res = await adminAPI.uploadForm16Bulk(fy, bulkFile);
      setBulkMessage(res?.data?.message || 'Bulk upload completed.');
      setBulkFile(null);
      loadData(fy);
    } catch (err) {
      setBulkMessage(err.response?.data?.message || err.message || 'Bulk upload failed.');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleSingleUpload = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !singleFy || !singleFile) {
      setSingleMessage('Please select an employee, enter FY, and choose a PDF file.');
      return;
    }
    setSingleUploading(true);
    setSingleMessage('');
    try {
      const res = await adminAPI.uploadForm16Single(selectedEmployee.id, singleFy, singleFile);
      setSingleMessage(res?.data?.message || 'Form 16 uploaded successfully.');
      setSingleFile(null);
      setSelectedEmployee(null);
      loadData(singleFy);
    } catch (err) {
      setSingleMessage(err.response?.data?.message || err.message || 'Single upload failed.');
    } finally {
      setSingleUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this Form 16 record?')) return;
    try {
      await adminAPI.deleteForm16(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Failed to delete record');
    }
  };

  const inputBase =
    'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">Form 16 Upload</h1>
        <p className="text-slate-500 text-sm">
          Upload Form 16 PDFs downloaded from the government site so employees can download them
          from their portal.
        </p>
      </header>

      {/* Bulk upload */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Bulk Upload (ZIP)</h2>
              <p className="text-xs text-slate-500">
                One ZIP containing multiple Form 16 PDFs. File names must start with employee ID
                (e.g. <code className="font-mono">EMP001_Form16_FY2024-25.pdf</code>).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BarChart2 className="w-4 h-4" />
            {status ? (
              <span>
                Total: <strong>{status.total}</strong> • Downloaded:{' '}
                <strong>{status.downloaded}</strong>
              </span>
            ) : (
              <span>No status for {fy}</span>
            )}
          </div>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={handleBulkUpload} className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
            <div className="md:w-40">
              <label className="block text-xs font-medium text-slate-600 mb-1">Financial Year *</label>
              <input
                type="text"
                value={fy}
                onChange={(e) => setFy(e.target.value)}
                placeholder="2024-25"
                className={inputBase}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">ZIP File *</label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                className={inputBase}
              />
            </div>
            <button
              type="submit"
              disabled={bulkUploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-50"
            >
              {bulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={16} />}
              {bulkUploading ? 'Uploading…' : 'Upload ZIP'}
            </button>
          </form>
          {bulkMessage && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              {bulkMessage}
            </p>
          )}
        </div>
      </section>

      {/* ── Single Upload ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Single Upload</h2>
            <p className="text-xs text-slate-500">
              Upload / replace Form 16 for a specific employee and financial year.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={handleSingleUpload} className="space-y-4">
            {/* Row — Employee ID dropdown + Employee Name (auto-filled) + FY + PDF */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-end">

              {/* Employee DB ID — plain dropdown showing only IDs */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Employee DB ID *
                </label>
                <EmployeeDropdown
                  value={selectedEmployee}
                  onChange={(emp) => {
                    setSelectedEmployee(emp);
                    setSingleMessage('');
                  }}
                />
              </div>

              {/* Employee Name — auto-filled, read-only */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedEmployee?.fullName ?? ''}
                  placeholder="Auto-filled on selection"
                  className={`${inputBase} bg-slate-50 text-indigo-700 font-medium cursor-default`}
                />
              </div>

              {/* Financial Year */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Financial Year *
                </label>
                <input
                  type="text"
                  value={singleFy}
                  onChange={(e) => setSingleFy(e.target.value)}
                  className={inputBase}
                  placeholder="2024-25"
                />
              </div>

              {/* PDF File */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  PDF File *
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSingleFile(e.target.files?.[0] || null)}
                  className={inputBase}
                />
              </div>
            </div>

            {/* Selected employee summary chip */}
            {selectedEmployee && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 w-fit">
                <div className="w-7 h-7 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {selectedEmployee.fullName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-indigo-500 font-medium leading-none mb-0.5">Selected Employee</p>
                  <p className="text-sm font-semibold text-indigo-800 leading-none">
                    {selectedEmployee.fullName}
                    <span className="ml-2 text-xs font-normal text-indigo-400">
                      (DB ID: {selectedEmployee.id})
                    </span>
                  </p>
                </div>
                {/* Clear button */}
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="ml-2 text-indigo-300 hover:text-indigo-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Upload button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={singleUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-50"
              >
                {singleUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={16} />}
                {singleUploading ? 'Uploading…' : 'Upload PDF'}
              </button>
            </div>
          </form>

          {singleMessage && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              {singleMessage}
            </p>
          )}
        </div>
      </section>

      {/* Existing docs list */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Uploaded Form 16 &mdash; FY {fy}
            </h2>
            <p className="text-xs text-slate-500">
              Review and manage all Form 16 records for the selected financial year.
            </p>
          </div>
        </div>
        <div className="p-6">
          {listLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : listError ? (
            <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">
              {listError}
            </div>
          ) : docs.length === 0 ? (
            <EmptyState message={`No Form 16 uploaded yet for FY ${fy}.`} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Employee ID</th>
                    <th className="px-4 py-2 text-left font-semibold">Employee Name</th>
                    <th className="px-4 py-2 text-left font-semibold">File Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Uploaded At</th>
                    <th className="px-4 py-2 text-left font-semibold">Downloaded</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docs.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2 text-slate-800">{d.employeeId || '—'}</td>
                      <td className="px-4 py-2 text-slate-700">{d.employeeName || '—'}</td>
                      <td className="px-4 py-2 text-slate-700">{d.fileName || d.originalFileName}</td>
                      <td className="px-4 py-2 text-slate-700">
                        {d.uploadedAt ? new Date(d.uploadedAt).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{d.downloaded ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
