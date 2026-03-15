import { useEffect, useState } from 'react';
import { adminAPI } from '../api/services';
import { FileText, Upload, Loader2, Inbox, Trash2, BarChart2 } from 'lucide-react';

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-slate-50/80 border border-dashed border-slate-200">
      <Inbox className="w-10 h-10 text-slate-300 mb-3" />
      <p className="text-sm text-slate-500 text-center">{message}</p>
    </div>
  );
}

export default function Form16Admin() {
  const [fy, setFy] = useState('2024-25');
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

  const [singleEmpId, setSingleEmpId] = useState('');
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
      const msg = res?.data?.message || 'Bulk upload completed.';
      setBulkMessage(msg);
      setBulkFile(null);
      (e.target.reset?.() ?? null);
      loadData(fy);
    } catch (err) {
      setBulkMessage(err.response?.data?.message || err.message || 'Bulk upload failed.');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleSingleUpload = async (e) => {
    e.preventDefault();
    if (!singleEmpId || !singleFy || !singleFile) {
      setSingleMessage('Employee ID, FY, and PDF file are required.');
      return;
    }
    const empIdNum = Number(singleEmpId);
    if (!Number.isFinite(empIdNum) || empIdNum <= 0) {
      setSingleMessage('Employee ID must be a valid numeric database ID.');
      return;
    }
    setSingleUploading(true);
    setSingleMessage('');
    try {
      const res = await adminAPI.uploadForm16Single(empIdNum, singleFy, singleFile);
      const msg = res?.data?.message || 'Form 16 uploaded successfully.';
      setSingleMessage(msg);
      setSingleFile(null);
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

      {/* Bulk upload + status */}
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
          <form
            onSubmit={handleBulkUpload}
            className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4"
          >
            <div className="md:w-40">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Financial Year *
              </label>
              <input
                type="text"
                value={fy}
                onChange={(e) => setFy(e.target.value)}
                placeholder="2024-25"
                className={inputBase}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                ZIP File *
              </label>
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

      {/* Single upload */}
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
          <form
            onSubmit={handleSingleUpload}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Employee DB ID *
              </label>
              <input
                type="number"
                value={singleEmpId}
                onChange={(e) => setSingleEmpId(e.target.value)}
                className={inputBase}
                placeholder="Numeric employee id"
              />
            </div>
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
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={singleUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-50"
              >
                {singleUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
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
                      <td className="px-4 py-2 text-slate-700">
                        {d.downloaded ? 'Yes' : 'No'}
                      </td>
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

