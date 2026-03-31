import { useEffect, useState } from 'react';
import { payrollAPI } from '../api/services';
import { Download, FileText, Calendar, TrendingUp, IndianRupee, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown } from 'lucide-react';

const STATUS_CONFIG = {
  PAID:      { label: 'Paid',      icon: CheckCircle2,  bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  APPROVED:  { label: 'Approved',  icon: CheckCircle2,  bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  PENDING:   { label: 'Pending',   icon: Clock,         bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400'   },
  GENERATED: { label: 'Generated', icon: AlertCircle,   bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500'  },
  FAILED:    { label: 'Failed',    icon: XCircle,       bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500'     },
};

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n || 0);

const monthLabel = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

export default function MyPayslips() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchMyPayslips = async () => {
    setLoading(true);
    try {
      const res = await payrollAPI.getMyPayroll(`${month}-01`);
      const data = res?.data?.data;
      setPayrolls(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyPayslips(); }, [month]);

  const handleDownload = async (id, monthStr) => {
    setDownloading(id);
    try {
      const res = await payrollAPI.downloadPayslip(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${monthStr || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const latestPaid = payrolls.find((p) => p.status === 'PAID' || p.status === 'APPROVED');

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">Payroll</p>
          <h1 className="text-2xl font-bold text-slate-900">My Payslips</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and download your monthly salary statements</p>
        </div>

        {/* Month Picker */}
        <div className="relative">
          <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 font-medium"
          />
        </div>
      </div>

      {/* ── Summary Card (shown when there's a paid/approved record) ── */}
      {!loading && latestPaid && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">
                {monthLabel(latestPaid.month)} · Net Take-Home
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">₹{fmt(latestPaid.netSalary)}</span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-indigo-200">
                <span>Gross: ₹{fmt(latestPaid.grossSalary)}</span>
                <span className="w-px h-3 bg-indigo-400" />
                <span>Deductions: ₹{fmt(latestPaid.totalDeductions)}</span>
              </div>
            </div>
            <button
              onClick={() => handleDownload(latestPaid.payrollId, latestPaid.month)}
              disabled={downloading === latestPaid.payrollId}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60 whitespace-nowrap"
            >
              {downloading === latestPaid.payrollId ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={15} />
              )}
              Download Payslip
            </button>
          </div>
        </div>
      )}

      {/* ── Payslips List ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Table Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Payslip History
            {!loading && payrolls.length > 0 && (
              <span className="ml-2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {payrolls.length} record{payrolls.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <TrendingUp size={15} className="text-slate-400" />
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/70">
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Month</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Gross</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Deductions</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Net Salary</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Download</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-4 px-5">
                        <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: j === 0 ? '60%' : j === 5 ? '40%' : '70%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <FileText size={24} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-600">No payslips found</p>
                        <p className="text-xs text-slate-400 mt-0.5">No payroll records for {monthLabel(`${month}-01`)}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = cfg.icon;
                  const id = p.payrollId || p.id;
                  return (
                    <tr key={id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800">{monthLabel(p.month)}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{p.month}</div>
                      </td>
                      <td className="py-4 px-5 text-slate-600">₹{fmt(p.grossSalary)}</td>
                      <td className="py-4 px-5 text-red-500 font-medium">-₹{fmt(p.totalDeductions)}</td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-900 text-base">₹{fmt(p.netSalary)}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleDownload(id, p.month)}
                          disabled={downloading === id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 shadow-sm shadow-indigo-200"
                        >
                          {downloading === id ? (
                            <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Download size={12} />
                          )}
                          {downloading === id ? 'Downloading…' : 'Download'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
              </div>
            ))
          ) : payrolls.length === 0 ? (
            <div className="py-14 text-center">
              <FileText size={28} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium text-sm">No payslips found</p>
              <p className="text-slate-400 text-xs mt-1">No records for {monthLabel(`${month}-01`)}</p>
            </div>
          ) : (
            payrolls.map((p) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
              const id = p.payrollId || p.id;
              const isOpen = expanded === id;
              return (
                <div key={id} className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : id)}
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{monthLabel(p.month)}</p>
                      <p className="text-xs text-slate-400 font-mono">{p.month}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-1">Gross</p>
                          <p className="text-sm font-semibold text-slate-700">₹{fmt(p.grossSalary)}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3">
                          <p className="text-xs text-red-400 mb-1">Deductions</p>
                          <p className="text-sm font-semibold text-red-600">-₹{fmt(p.totalDeductions)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-3">
                          <p className="text-xs text-indigo-400 mb-1">Net Pay</p>
                          <p className="text-sm font-bold text-indigo-700">₹{fmt(p.netSalary)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(id, p.month)}
                        disabled={downloading === id}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
                      >
                        {downloading === id ? (
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Download size={15} />
                        )}
                        {downloading === id ? 'Downloading…' : 'Download Payslip'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Breakdown Detail (for latest record) ── */}
      {!loading && latestPaid && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Salary Breakdown · {monthLabel(latestPaid.month)}</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Earnings */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Earnings</p>
              <div className="space-y-2">
                {[
                  ['Basic Salary',       latestPaid.basicSalary],
                  ['HRA',                latestPaid.hra],
                  ['Special Allowance',  latestPaid.specialAllowance],
                  ['Arrears',            latestPaid.arrears],
                  ['Performance Pay',    latestPaid.perfPay],
                  ['Reimbursement',      latestPaid.reimbursement],
                  ['FBP',                latestPaid.fbp],
                ].filter(([, v]) => v && Number(v) > 0).map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="text-sm font-medium text-slate-800">₹{fmt(value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 mt-1">
                  <span className="text-sm font-bold text-slate-800">Gross Total</span>
                  <span className="text-sm font-bold text-emerald-600">₹{fmt(latestPaid.grossSalary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Deductions</p>
              <div className="space-y-2">
                {[
                  ['PF (Employee)',     latestPaid.pfEmployee],
                  ['Professional Tax',  latestPaid.professionalTax],
                  ['TDS',               latestPaid.tds],
                  ['Salary Advance',    latestPaid.salaryAdvance],
                  ['Other Deductions',  latestPaid.otherDeduction],
                ].filter(([, v]) => v && Number(v) > 0).map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="text-sm font-medium text-red-500">-₹{fmt(value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 mt-1">
                  <span className="text-sm font-bold text-slate-800">Total Deductions</span>
                  <span className="text-sm font-bold text-red-500">-₹{fmt(latestPaid.totalDeductions)}</span>
                </div>
              </div>

              {/* Net Pay highlight */}
              <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Net Take-Home</p>
                  <p className="text-xl font-bold text-indigo-700 mt-0.5">₹{fmt(latestPaid.netSalary)}</p>
                </div>
                <IndianRupee size={28} className="text-indigo-300" />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
