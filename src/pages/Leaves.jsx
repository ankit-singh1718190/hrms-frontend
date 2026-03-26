import { useEffect, useState } from 'react';
import { leaveAPI, employeeAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import { Plus, X, CheckCircle, XCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';

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

// ─── Single balance card ───────────────────────────────────────────────────────
function BalanceCard({ label, total, used, remaining, color, light, border }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const r = 26, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${border}`,
      borderRadius: '16px', padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{label}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{pct}% used this FY</div>
        </div>
        <svg width="62" height="62" viewBox="0 0 62 62">
          <circle cx="31" cy="31" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle cx="31" cy="31" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            transform="rotate(-90 31 31)"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
          <text x="31" y="35" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">
            {used}/{total}
          </text>
        </svg>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Total', value: total, bg: '#f8fafc', fg: '#64748b' },
          { label: 'Used', value: used, bg: light, fg: color },
          { label: 'Remaining', value: remaining, bg: '#ecfdf5', fg: '#059669' },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '10px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: s.fg, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>0</span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{total} days</span>
        </div>
      </div>
    </div>
  );
}

// ─── Balance section (fetches from backend) ────────────────────────────────────
function LeaveBalanceSection({ employeeDbId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!employeeDbId) return;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

    fetch(`${base}/api/leaves/my-balance/${employeeDbId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [employeeDbId]);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '12px' }}>
      {[1, 2, 3].map(i => <div key={i} style={{ height: '170px', borderRadius: '16px', background: '#f1f5f9', animation: 'lbp 1.4s ease-in-out infinite' }} />)}
      <style>{`@keyframes lbp{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px' }}>
      <AlertCircle size={15} /> Could not load leave balance ({error})
    </div>
  );

  if (!data) return null;

  const cards = [
    { key: 'planned', label: 'Planned Leave', total: data.plannedTotal ?? 0, used: data.plannedUsed ?? 0, remaining: data.plannedRemaining ?? 0, color: '#6366f1', light: '#eef2ff', border: '#c7d2fe' },
    { key: 'sick', label: 'Sick Leave', total: data.sickTotal ?? 0, used: data.sickUsed ?? 0, remaining: data.sickRemaining ?? 0, color: '#f59e0b', light: '#fffbeb', border: '#fde68a' },
    ...(data.casualUsed > 0 ? [{ key: 'casual', label: 'Casual Leave', total: data.plannedTotal ?? 0, used: data.casualUsed ?? 0, remaining: Math.max((data.plannedTotal ?? 0) - (data.casualUsed ?? 0), 0), color: '#10b981', light: '#ecfdf5', border: '#6ee7b7' }] : []),
  ];

  const grandTotal = (data.plannedTotal ?? 0) + (data.sickTotal ?? 0);
  const grandUsed = (data.plannedUsed ?? 0) + (data.sickUsed ?? 0) + (data.casualUsed ?? 0);
  const grandRemaining = Math.max(grandTotal - grandUsed, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={16} color="#6366f1" />
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>
            Leave Balance — FY {data.fyYear}–{(data.fyYear ?? 0) + 1}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: grandTotal, bg: '#f1f5f9', fg: '#64748b' },
            { label: 'Used', value: grandUsed, bg: '#fef3c7', fg: '#d97706' },
            { label: 'Remaining', value: grandRemaining, bg: '#d1fae5', fg: '#059669' },
          ].map(p => (
            <span key={p.label} style={{ background: p.bg, color: p.fg, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
              {p.label}: {p.value}d
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '12px' }}>
        {cards.map(c => <BalanceCard key={c.key} {...c} />)}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Leaves() {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const canManage = isAdmin || isHR || isManager;

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeDbId, setEmployeeDbId] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState({
    status: '',
    leaveType: '',
    employeeName: ''
  });

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

      const params = {
        page,
        size,
        ...(filters.status && { status: filters.status }),
        ...(filters.leaveType && { leaveType: filters.leaveType }),
        ...(filters.employeeName && { employeeName: filters.employeeName })
      };

      if (canManage) {
        res = await leaveAPI.getAll(params);
      } else {
        let numericId = employeeDbId ?? user?.id;

        if (numericId == null) {
          const resolved = await resolveEmployeeDbId(user?.employeeId);
          if (resolved != null) {
            setEmployeeDbId(resolved);
            numericId = resolved;
          }
        }

        const numId = numericId != null ? parseInt(String(numericId), 10) : NaN;

        if (!Number.isNaN(numId) && numId > 0) {
          res = await leaveAPI.getByEmployee(numId, {
            page,
            size
          });
        } else {
          setLeaves([]);
          setError('Unable to resolve employee.');
          setLoading(false);
          return;
        }
      }

      const data = unwrap(res);
      const list = data?.content ?? data ?? [];

      setLeaves(Array.isArray(list) ? list : []);
      setTotalPages(data?.totalPages || 0);

    } catch (e) {
      setError(
        e.response?.status === 403
          ? "You don't have permission to view leave requests."
          : `Failed to load leaves: ${e.message}`
      );
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage && user?.id != null) setEmployeeDbId(user.id);
    else if (!canManage && user?.employeeId && employeeDbId == null)
      resolveEmployeeDbId(user.employeeId).then(id => { if (id != null) setEmployeeDbId(id); });
  }, [canManage, user?.employeeId, user?.id]);
  useEffect(() => {
    setPage(0);
  }, [filters]);

  useEffect(() => { fetchLeaves(); }, [page, filters, employeeDbId]);
  const handleApply = async (e) => {
    e.preventDefault(); setSaving(true); setFormError('');
    if (form.fromDate && form.toDate && new Date(form.toDate) < new Date(form.fromDate)) {
      setFormError('To Date must be on or after From Date.'); setSaving(false); return;
    }
    try {
      const dbId = employeeDbId ?? user?.id ?? await resolveEmployeeDbId(user?.employeeId);
      if (!dbId) { setFormError('Could not resolve employee.'); setSaving(false); return; }
      await leaveAPI.apply({ employeeId: dbId, leaveType: form.leaveType, startDate: form.fromDate, endDate: form.toDate, reason: form.reason });
      setShowModal(false); setForm({ leaveType: '', fromDate: '', toDate: '', reason: '' }); fetchLeaves();
    } catch (e) { setFormError(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => { try { await leaveAPI.approve(id); fetchLeaves(); } catch (e) { alert(e.response?.data?.message || e.message); } };
  const handleReject = async () => {
    try { await leaveAPI.reject(rejectModal, rejectReason); setRejectModal(null); setRejectReason(''); fetchLeaves(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{canManage ? 'Pending leave requests' : 'My leave requests'}</p>
        </div>
        {!canManage && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            <Plus size={16} /> Apply Leave
          </button>
        )}
      </div>

      {/* ── Leave Balance Cards (employee only) ── */}
      {!canManage && employeeDbId && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <LeaveBalanceSection employeeDbId={employeeDbId} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      {/* 🔽 ADD FILTER UI HERE */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-3 flex-wrap">

        {/* Search */}
        <input
          type="text"
          placeholder="Search employee..."
          value={filters.employeeName}
          onChange={(e) =>
            setFilters(f => ({ ...f, employeeName: e.target.value }))
          }
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-60"
        />

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters(f => ({ ...f, status: e.target.value }))
          }
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        {/* Leave Type */}
        <select
          value={filters.leaveType}
          onChange={(e) =>
            setFilters(f => ({ ...f, leaveType: e.target.value }))
          }
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">All Types</option>
          <option value="CASUAL">Casual</option>
          <option value="SICK">Sick</option>
          <option value="EARNED">Earned</option>
        </select>

      </div>
     

      {/* Leave requests table */}
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
            {loading ? [...Array(4)].map((_, i) => (
              <tr key={i} className="border-b border-slate-50">
                {[...Array(6)].map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}
              </tr>
            )) : leaves.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">No leave requests found</td></tr>
            ) : leaves.map(leave => (
              <tr key={leave.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-medium text-slate-800">{leave.employeeName || leave.employeeId}</td>
                <td className="py-3 px-4 text-slate-600">{leave.leaveType}</td>
                <td className="py-3 px-4 text-slate-600">{leave.startDate ?? leave.fromDate ?? '—'}</td>
                <td className="py-3 px-4 text-slate-600">{leave.endDate ?? leave.toDate ?? '—'}</td>
                <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{leave.reason}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[leave.status] || 'bg-slate-100 text-slate-600'}`}>
                    {leave.status === 'PENDING' && <Clock size={10} />}{leave.status === 'APPROVED' && <CheckCircle size={10} />}{leave.status === 'REJECTED' && <XCircle size={10} />}
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
            ))}
          </tbody>
        </table>
      </div>
       <div className="flex justify-between items-center mt-4">

        <button
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-sm text-slate-600">
          Page {page + 1} of {totalPages}
        </span>

        <button
          disabled={page + 1 === totalPages}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

      {/* Apply Modal */}
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
