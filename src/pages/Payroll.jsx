import { useEffect, useState } from 'react';
import { payrollAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import { DollarSign, Play, CheckCircle, CreditCard, FileText } from 'lucide-react';

const unwrap = (res) => res?.data?.data;

const STATUS_STYLES = {
  GENERATED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-600',
};

export default function Payroll() {
  const { isAdmin, isHR, isEmployee, user } = useAuth();
  const canManage = isAdmin || isHR;

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [month, setMonth] = useState(currentMonth);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPayroll = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (isEmployee) {
        res = await payrollAPI.getMyPayslips();
        const data = unwrap(res);
        setPayrolls(Array.isArray(data) ? data : data?.content ?? []);
      } else {
        // Backend expects full date (YYYY-MM-01) as month
        const monthParam = `${month}-01`;
        res = await payrollAPI.getByMonth(monthParam, { page: 0, size: 50 });
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

  const handleGenerate = async () => {
    setActionLoading('generate');
    try {
      const monthParam = `${month}-01`;
      await payrollAPI.generate(monthParam);
      fetchPayroll();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await payrollAPI.approve(id);
      fetchPayroll();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcess = async (id) => {
    setActionLoading(`pay-${id}`);
    try {
      await payrollAPI.processPayment(id);
      fetchPayroll();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalNet = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payroll</h1>
          <p className="text-slate-500 text-sm mt-0.5">{isEmployee ? 'My payslips' : `${payrolls.length} records`}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isEmployee && (
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
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

      {canManage && payrolls.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
          <DollarSign size={20} className="text-indigo-600" />
          <div>
            <p className="text-xs text-indigo-500 font-medium">Total Net Payroll</p>
            <p className="text-xl font-bold text-indigo-700">₹{totalNet.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Employee', 'Month', 'Basic Salary', 'Deductions', 'Net Salary', 'Status', canManage ? 'Actions' : ''].filter(Boolean).map(h => (
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
            ) : payrolls.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-slate-400">No payroll records for this month</td></tr>
            ) : (
              payrolls.map(p => (
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
                  {canManage && (
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {p.status === 'GENERATED' || p.status === 'PENDING' ? (
                          <button
                            onClick={() => handleApprove(p.payrollId || p.id)}
                            disabled={actionLoading === (p.payrollId || p.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> {actionLoading === (p.payrollId || p.id) ? '…' : 'Approve'}
                          </button>
                        ) : null}
                        {p.status === 'APPROVED' && (
                          <button
                            onClick={() => handleProcess(p.payrollId || p.id)}
                            disabled={actionLoading === `pay-${p.payrollId || p.id}`}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <CreditCard size={12} /> {actionLoading === `pay-${p.payrollId || p.id}` ? '…' : 'Pay'}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
