import { useEffect, useState } from 'react';
import { payrollAPI, employeeAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import { DollarSign, Play, CheckCircle, CreditCard } from 'lucide-react';

const unwrap = (res) => res?.data?.data;

const STATUS_STYLES = {
  GENERATED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-600',
};

export default function Payroll() {
  const { isAdmin, isHR, isEmployee } = useAuth();
  const canManage = isAdmin || isHR;

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [month, setMonth] = useState(currentMonth);
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [editing, setEditing] = useState(null);

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

  // Load employees once for admin/HR so we can select by employee id
  useEffect(() => {
    if (!canManage) return;
    const loadEmployees = async () => {
      try {
        const res = await employeeAPI.getAll({ page: 0, size: 500 });
        const data = res?.data?.data ?? res?.data;
        const list = Array.isArray(data) ? data : data?.content ?? [];
        setEmployees(list);
      } catch {
        // ignore; selector will just be hidden if it fails
      }
    };
    loadEmployees();
  }, [canManage]);

  const handleOpenEditForSelected = () => {
    if (!selectedEmployeeId) return;
    const row = payrolls.find(
      (p) => String(p.employeeId) === String(selectedEmployeeId)
    );
    if (row) {
      setEditing(row);
    } else {
      alert('No payroll record for this employee in the selected month.');
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {!isEmployee && (
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
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
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
      {editing && (
        <EditPayrollModal
          payroll={editing}
          month={month}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchPayroll();
          }}
        />
      )}
    </div>
  );
}

function EditPayrollModal({ payroll, month, onClose, onSaved }) {
  const [form, setForm] = useState({
    basicSalary: payroll.basicSalary || 0,
    hra: payroll.hra || 0,
    specialAllowance: payroll.specialAllowance || 0,
    arrears: payroll.arrears || 0,
    perfPay: payroll.perfPay || 0,
    weekendWorkDays: payroll.weekendWorkDays || 0,
    reimbursement: payroll.reimbursement || 0,
    fbp: payroll.fbp || 0,
    tds: payroll.tds || 0,
    salaryAdvance: payroll.salaryAdvance || 0,
    otherDeduction: payroll.otherDeduction || 0,
    remarks: payroll.remarks || '',
  });
  const [saving, setSaving] = useState(false);

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
        basicSalary: form.basicSalary,
        hra: form.hra,
        specialAllowance: form.specialAllowance,
        arrears: form.arrears,
        perfPay: form.perfPay,
        weekendWorkDays: form.weekendWorkDays,
        reimbursement: form.reimbursement,
        fbp: form.fbp,
        tds: form.tds,
        salaryAdvance: form.salaryAdvance,
        otherDeduction: form.otherDeduction,
        remarks: form.remarks,
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
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm"
            disabled={saving}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberField label="Basic Salary" value={form.basicSalary} onChange={handleChange('basicSalary')} />
            <NumberField label="HRA" value={form.hra} onChange={handleChange('hra')} />
            <NumberField label="Special Allowance" value={form.specialAllowance} onChange={handleChange('specialAllowance')} />
            <NumberField label="Arrears" value={form.arrears} onChange={handleChange('arrears')} />
            <NumberField label="Performance Pay" value={form.perfPay} onChange={handleChange('perfPay')} />
            <NumberField
              label="Weekend Work Days"
              value={form.weekendWorkDays}
              onChange={handleChange('weekendWorkDays')}
              min={0}
            />
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Payroll'}
            </button>
          </div>
        </form>
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
