import { useEffect, useState } from 'react';
import { leaveAPI, employeeAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import { Plus, X, CheckCircle, XCircle, Clock } from 'lucide-react';

const unwrap = (res) => res?.data?.data;

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
};

async function resolveEmployeeDbId(employeeCode) {
  if (employeeCode == null || String(employeeCode).trim() === '') return null;
  const n = Number(employeeCode);
  if (!Number.isNaN(n) && String(n) === String(employeeCode).trim()) return n;
  try {
    const res = await employeeAPI.search(String(employeeCode).trim(), { page: 0, size: 1 });
    const content = unwrap(res)?.content;
    const first = Array.isArray(content) ? content[0] : null;
    return first?.id ?? null;
  } catch {
    return null;
  }
}

export default function Leaves() {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const canManage = isAdmin || isHR || isManager;

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeDbId, setEmployeeDbId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leaveType: '', fromDate: '', toDate: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (canManage) {
        res = await leaveAPI.getPending({ page: 0, size: 50 });
      } else {
        // Employee: load only own leaves via getByEmployee (do not call getPending — returns Access Denied / 400 for employees)
        let numericId = employeeDbId ?? user?.id;
        if (numericId == null) {
          const resolved = await resolveEmployeeDbId(user?.employeeId);
          if (resolved != null) {
            setEmployeeDbId(resolved);
            numericId = resolved;
          }
        }
        // Backend expects integer path; avoid sending float/NaN (causes 400)
        const numId = numericId != null && numericId !== '' ? parseInt(String(numericId), 10) : NaN;
        if (!Number.isNaN(numId) && numId > 0) {
          res = await leaveAPI.getByEmployee(numId, { page: 0, size: 50 });
        } else {
          setLeaves([]);
          setError(user?.id == null && user?.employeeId ? 'Please log out and log in again to view your leaves.' : '');
          setLoading(false);
          return;
        }
      }
      const data = unwrap(res);
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      setLeaves(Array.isArray(list) ? list : []);
    } catch (e) {
      const status = e.response?.status;
      const msg = status === 403
        ? 'You don\'t have permission to view leave requests. Contact your admin.'
        : `Failed to load leaves: ${e.message}`;
      setError(msg);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  // Use numeric id from login when available (avoids 403 on employee search)
  useEffect(() => {
    if (!canManage && user?.id != null) {
      setEmployeeDbId(user.id);
    } else if (!canManage && user?.employeeId && employeeDbId == null) {
      resolveEmployeeDbId(user.employeeId).then((id) => {
        if (id != null) setEmployeeDbId(id);
      });
    }
  }, [canManage, user?.employeeId, user?.id]);

  // Fetch when we have employeeDbId (or for employees, when user.id is available so we use it inside fetchLeaves)
  useEffect(() => {
    fetchLeaves();
  }, [employeeDbId, (!canManage ? user?.id : null)]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    if (form.fromDate && form.toDate && new Date(form.toDate) < new Date(form.fromDate)) {
      setFormError('To Date must be on or after From Date.');
      setSaving(false);
      return;
    }
    try {
      const dbId = employeeDbId ?? user?.id ?? await resolveEmployeeDbId(user?.employeeId);
      if (dbId == null) {
        setFormError('Could not resolve employee. Please try again.');
        setSaving(false);
        return;
      }
      await leaveAPI.apply({
        employeeId: dbId,
        leaveType: form.leaveType,
        startDate: form.fromDate,
        endDate: form.toDate,
        reason: form.reason,
      });
      setShowModal(false);
      setForm({ leaveType: '', fromDate: '', toDate: '', reason: '' });
      fetchLeaves();
    } catch (e) {
      setFormError(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await leaveAPI.approve(id);
      fetchLeaves();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const handleReject = async () => {
    try {
      await leaveAPI.reject(rejectModal, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      fetchLeaves();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{canManage ? 'Pending leave requests' : 'My leave requests'}</p>
        </div>
        {!canManage && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            <Plus size={16} /> Apply Leave
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Employee', 'Leave Type', 'From', 'To', 'Reason', 'Status', canManage ? 'Actions' : ''].filter(Boolean).map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="py-3 px-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : leaves.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">No leave requests found</td></tr>
            ) : (
              leaves.map(leave => (
                <tr key={leave.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{leave.employeeName || leave.employeeId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{leave.leaveType}</td>
                  <td className="py-3 px-4 text-slate-600">{leave.startDate ?? leave.fromDate ?? '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{leave.endDate ?? leave.toDate ?? '—'}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{leave.reason}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[leave.status] || 'bg-slate-100 text-slate-600'}`}>
                      {leave.status === 'PENDING' && <Clock size={10} />}
                      {leave.status === 'APPROVED' && <CheckCircle size={10} />}
                      {leave.status === 'REJECTED' && <XCircle size={10} />}
                      {leave.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="py-3 px-4">
                      {leave.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(leave.id)} className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors">Approve</button>
                          <button onClick={() => { setRejectModal(leave.id); setRejectReason(''); }} className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors">Reject</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold">Apply for Leave</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleApply} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Leave Type *</label>
                <select required value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">Select type…</option>
                  {['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">From Date *</label>
                  <input required type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">To Date *</label>
                  <input required type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reason *</label>
                <textarea required rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-60">
                  {saving ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Reject Leave</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rejection Reason</label>
              <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
