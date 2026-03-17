import { useEffect, useState } from 'react';
import { employeeAPI, payrollAPI } from '../api/services';
import { useAuth } from '../context/useAuth';
import {
  FileText, FileSpreadsheet, Download, Loader2, Inbox, Calendar as CalendarIcon,
} from 'lucide-react';

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-slate-50/80 border border-dashed border-slate-200">
      <Inbox className="w-10 h-10 text-slate-300 mb-3" />
      <p className="text-sm text-slate-500 text-center">{message}</p>
    </div>
  );
}

export default function MyDocuments() {
  const { user } = useAuth();

  const [form16List, setForm16List] = useState([]);
  const [form16Loading, setForm16Loading] = useState(false);
  const [form16Error, setForm16Error] = useState('');

  const [payrollRows, setPayrollRows] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState('');

  useEffect(() => {
    const fetchForm16 = async () => {
      setForm16Loading(true);
      setForm16Error('');
      try {
        const res = await employeeAPI.getMyForm16List();
        const data = res?.data?.data ?? [];
        setForm16List(Array.isArray(data) ? data : []);
      } catch (e) {
        setForm16Error(e.response?.data?.message || e.message || 'Failed to load Form 16 list');
        setForm16List([]);
      } finally {
        setForm16Loading(false);
      }
    };
    fetchForm16();
  }, []);

  useEffect(() => {
    const fetchPayroll = async () => {
      // employeeId is numeric DB id from login
      const empId = user?.id;
      if (!empId) return;
      setPayrollLoading(true);
      setPayrollError('');
      try {
        const res = await payrollAPI.getByEmployee(empId);
        const data = res?.data?.data ?? res?.data?.data?.data ?? [];
        setPayrollRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setPayrollError(e.response?.data?.message || e.message || 'Failed to load payroll history');
        setPayrollRows([]);
      } finally {
        setPayrollLoading(false);
      }
    };
    fetchPayroll();
  }, [user?.id]);

  const handleDownloadForm16 = async (fy) => {
    try {
      const res = await employeeAPI.downloadMyForm16(fy);
      downloadBlob(res.data, `Form16_FY${fy}.pdf`);
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Failed to download Form 16');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">My Documents</h1>
        <p className="text-slate-500 mt-1">
          Download your Form 16 documents and payroll history.
        </p>
      </header>

      {/* Form 16 */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Form 16</h2>
            <p className="text-xs text-slate-500">
              Annual tax certificates uploaded by HR. One document per financial year.
            </p>
          </div>
        </div>
        <div className="p-6">
          {form16Loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : form16Error ? (
            <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">
              {form16Error}
            </div>
          ) : form16List.length === 0 ? (
            <EmptyState message="No Form 16 is available yet. Please check back after HR uploads your tax documents." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Financial Year</th>
                    <th className="px-4 py-2 text-left font-semibold">Uploaded On</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form16List.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2 font-medium text-slate-800">{d.financialYear}</td>
                      <td className="px-4 py-2 text-slate-700">{formatDate(d.uploadedAt)}</td>
                      <td className="px-4 py-2 text-slate-700">
                        {d.downloaded ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Downloaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                            New
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadForm16(d.financialYear)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
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

      {/* Payroll history */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Payroll History</h2>
            <p className="text-xs text-slate-500">
              Net salary and payment details for each processed month.
            </p>
          </div>
        </div>
        <div className="p-6">
          {payrollLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : payrollError ? (
            <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">
              {payrollError}
            </div>
          ) : payrollRows.length === 0 ? (
            <EmptyState message="No payroll records found yet." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Month</th>
                    <th className="px-4 py-2 text-left font-semibold">Net Salary</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Payment Date</th>
                    <th className="px-4 py-2 text-left font-semibold">Reference</th>
                    <th className="px-4 py-2 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollRows.map((p) => (
                    <tr key={p.payrollId} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2 text-slate-800 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        {p.month}
                      </td>
                      <td className="px-4 py-2 text-slate-800 font-medium">
                        ₹{p.netSalary?.toLocaleString('en-IN') ?? '0'}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{p.status}</td>
                      <td className="px-4 py-2 text-slate-700">{p.paymentDate}</td>
                      <td className="px-4 py-2 text-slate-700">{p.paymentRef}</td>
                      <td className="px-4 py-2 text-right">
                        {p.payslipUrl ? (
                          <a
                            href={p.payslipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">No file</span>
                        )}
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
