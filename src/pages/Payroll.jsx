import { useState, useEffect, useCallback } from 'react';
import { DollarSign, PlayCircle, CheckCircle, CreditCard, RefreshCw, PauseCircle } from 'lucide-react';
import { payrollAPI, dashboardAPI } from '../api/services';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { statusBadge } from '../components/ui/Badge';
import Table from '../components/ui/Table';
import StatCard from '../components/ui/StatCard';
import { useAuth } from '../context/useAuth';

export default function Payroll() {
  const { isAdmin, isHR } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const [payRes, sumRes] = await Promise.all([
        payrollAPI.getByMonth(selectedMonth),
        payrollAPI.getSummary(selectedMonth),
      ]);
      setPayrolls(payRes.data?.content || payRes.data || []);
      setSummary(sumRes.data);
    } catch { setPayrolls([]); } finally { setLoading(false); }
  }, [selectedMonth]);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  const showMsg = (msg, isError = false) => {
    if (isError) setError(msg);
    else setMessage(msg);
    setTimeout(() => { setMessage(''); setError(''); }, 4000);
  };

  const action = async (id, fn, label) => {
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await fn();
      showMsg(`${label} successful!`);
      fetchPayroll();
    } catch (e) {
      showMsg(e.response?.data?.message || `${label} failed`, true);
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const handleGenerate = async () => {
    setActionLoading((p) => ({ ...p, generate: true }));
    try {
      await payrollAPI.generate(selectedMonth);
      showMsg('Payroll generated successfully!');
      fetchPayroll();
    } catch (e) {
      showMsg(e.response?.data?.message || 'Generation failed', true);
    } finally { setActionLoading((p) => ({ ...p, generate: false })); }
  };

  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: (v, r) => (
        <div>
          <p className="font-medium text-slate-800">{r.employeeName || `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim() || '—'}</p>
          <p className="text-xs text-slate-400">{r.employee?.department || r.department || ''}</p>
        </div>
      ),
    },
    { key: 'month', label: 'Month', render: (v) => v || selectedMonth },
    { key: 'grossSalary', label: 'Gross', render: (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'totalDeductions', label: 'Deductions', render: (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'netSalary', label: 'Net Salary', render: (v) => v ? <span className="font-semibold text-green-700">₹{Number(v).toLocaleString('en-IN')}</span> : '—' },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={statusBadge(v)}>{v}</Badge>,
    },
    {
      key: 'paymentDate', label: 'Paid On',
      render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—',
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => isAdmin ? (
        <div className="flex items-center gap-1 flex-wrap">
          {r.status === 'PENDING' && (
            <button
              onClick={() => action(r.id, () => payrollAPI.approve(r.id), 'Approve')}
              disabled={actionLoading[r.id]}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md hover:bg-green-100 disabled:opacity-50"
            >
              <CheckCircle size={12} /> Approve
            </button>
          )}
          {r.status === 'APPROVED' && (
            <button
              onClick={() => action(r.id, () => payrollAPI.processPayment(r.id), 'Payment')}
              disabled={actionLoading[r.id]}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 disabled:opacity-50"
            >
              <CreditCard size={12} /> Pay
            </button>
          )}
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-800">Payroll Management</h2>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {isAdmin && (
            <Button onClick={handleGenerate} loading={actionLoading.generate}>
              <PlayCircle size={16} /> Generate Payroll
            </Button>
          )}
        </div>
      </div>

      {message && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{message}</div>}
      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={summary.totalEmployees ?? 0} icon={DollarSign} color="indigo" />
          <StatCard title="Paid" value={summary.paid ?? 0} icon={CheckCircle} color="green" />
          <StatCard title="Pending" value={summary.pending ?? 0} icon={PauseCircle} color="yellow" />
          <StatCard title="Total Payout" value={summary.totalPayout ? `₹${Number(summary.totalPayout).toLocaleString('en-IN')}` : '₹0'} icon={CreditCard} color="purple" />
        </div>
      )}

      <Card>
        <CardHeader title={`Payroll — ${selectedMonth}`} subtitle="Monthly salary records" />
        <Table columns={columns} data={payrolls} loading={loading} emptyMessage="No payroll records. Click 'Generate Payroll' to create them." />
      </Card>
    </div>
  );
}
