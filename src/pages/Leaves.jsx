import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, X, Clock } from 'lucide-react';
import { leaveAPI } from '../api/services';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { statusBadge } from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input, { Select, Textarea } from '../components/ui/Input';
import { useAuth } from '../context/useAuth';

const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID', 'COMPENSATORY'];

export default function Leaves() {
  const { user, isAdmin, isHR, isEmployee } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');
  const [showApply, setShowApply] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'pending') {
        const res = await leaveAPI.getPending();
        setPendingLeaves(res.data?.content || res.data || []);
      } else if (user?.employeeId) {
        const res = await leaveAPI.getByEmployee(user.employeeId);
        setLeaves(res.data?.content || res.data || []);
      } else {
        const res = await leaveAPI.getPending();
        setLeaves(res.data?.content || res.data || []);
      }
    } catch { setLeaves([]); setPendingLeaves([]); } finally { setLoading(false); }
  }, [tab, user]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await leaveAPI.apply(form);
      setMessage('Leave applied successfully!');
      setShowApply(false);
      setForm({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply leave');
    } finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    await leaveAPI.approve(id);
    setMessage('Leave approved!');
    fetchLeaves();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setSaving(true);
    await leaveAPI.reject(selectedLeave.id, rejectReason);
    setShowReject(false);
    setMessage('Leave rejected.');
    fetchLeaves();
    setSaving(false);
  };

  const data = tab === 'pending' ? pendingLeaves : leaves;

  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: (v, r) => (
        <div>
          <p className="font-medium text-slate-800">{r.employeeName || `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim() || '—'}</p>
          <p className="text-xs text-slate-400">{r.employee?.department || ''}</p>
        </div>
      ),
    },
    { key: 'leaveType', label: 'Type', render: (v) => <Badge variant="info">{v}</Badge> },
    { key: 'startDate', label: 'Start Date', render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'endDate', label: 'End Date', render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
    { key: 'leaveDays', label: 'Days', render: (v, r) => v || r.totalDays || '—' },
    { key: 'reason', label: 'Reason', render: (v) => v ? (v.length > 40 ? v.slice(0, 40) + '...' : v) : '—' },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={statusBadge(v)}>{v}</Badge>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => r.status === 'PENDING' && (isAdmin || isHR) ? (
        <div className="flex items-center gap-1">
          <button onClick={() => handleApprove(r.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
            <Check size={15} />
          </button>
          <button onClick={() => { setSelectedLeave(r); setRejectReason(''); setShowReject(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
            <X size={15} />
          </button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Leave Management</h2>
        <Button onClick={() => setShowApply(true)}><Plus size={16} /> Apply Leave</Button>
      </div>

      {message && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{message}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {['all', 'pending'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'all' ? 'All Leaves' : 'Pending Approval'}
            {t === 'pending' && pendingLeaves.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingLeaves.length}</span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <Table columns={columns} data={data} loading={loading} emptyMessage="No leave records found" />
      </Card>

      {/* Apply Leave Modal */}
      <Modal isOpen={showApply} onClose={() => setShowApply(false)} title="Apply for Leave">
        <form onSubmit={handleApply} className="space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Select label="Leave Type" required value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
            {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End Date" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <Textarea label="Reason" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for leave..." />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowApply(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit Application</Button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showReject} onClose={() => setShowReject(false)} title="Reject Leave" size="sm">
        <div className="space-y-4">
          <Textarea label="Rejection Reason" required value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a reason for rejection..." />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowReject(false)}>Cancel</Button>
            <Button variant="danger" loading={saving} onClick={handleReject}>Reject Leave</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
