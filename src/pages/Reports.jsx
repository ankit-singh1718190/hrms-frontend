import { useState } from 'react';
import { attendanceAPI, leaveAPI, payrollAPI } from '../api/services';
import {
  FileSpreadsheet, Calendar, CalendarRange, CalendarClock, DollarSign,
  Download, Loader2, Inbox, RefreshCw,
} from 'lucide-react';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function thisMonthDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function formatColumnName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\bId\b/gi, 'ID')
    .trim();
}

function SimpleTable({ rows, emptyMessage = 'No records for the selected period.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-slate-50/80 border border-dashed border-slate-200">
        <Inbox className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500 text-center">{emptyMessage}</p>
      </div>
    );
  }
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {cols.map((c) => (
              <th
                key={c}
                className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider"
              >
                {formatColumnName(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, idx) => (
            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
              {cols.map((c) => (
                <td key={c} className="px-4 py-3 text-slate-700">
                  {String(r[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportCard({
  icon: Icon,
  title,
  description,
  children,
  table,
  loading,
  emptyMessage,
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {children}
          </div>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <SimpleTable rows={table} emptyMessage={emptyMessage} />
        )}
      </div>
    </section>
  );
}

function Btn({ onClick, disabled, primary, children, icon: Icon }) {
  const base =
    'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed';
  const styles = primary
    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300';
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}

export default function Reports() {
  const [error, setError] = useState('');

  const [dailyDate, setDailyDate] = useState(todayStr);
  const [dailyRows, setDailyRows] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [month, setMonth] = useState(thisMonthDate);
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const [leaveRows, setLeaveRows] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const [payrollMonth, setPayrollMonth] = useState(thisMonthDate);
  const [payrollRows, setPayrollRows] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadCsv = (rows, filename) => {
    if (!rows || rows.length === 0) return;
    const cols = Object.keys(rows[0]);
    const header = cols.join(',');
    const body = rows
      .map((r) =>
        cols
          .map((c) => {
            const raw = r[c] ?? '';
            const val = String(raw).replace(/"/g, '""');
            return /[",\n]/.test(val) ? `"${val}"` : val;
          })
          .join(',')
      )
      .join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
  };

  const handleDaily = async () => {
    setError('');
    setDailyLoading(true);
    try {
      const res = await attendanceAPI.reportDaily(dailyDate ? { date: dailyDate } : {});
      const data = res?.data?.data ?? [];
      setDailyRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load daily report');
      setDailyRows([]);
    } finally {
      setDailyLoading(false);
    }
  };

  const handleMonthly = async () => {
    if (!month) return;
    setError('');
    setMonthlyLoading(true);
    try {
      const res = await attendanceAPI.reportMonthly({ month });
      const data = res?.data?.data ?? [];
      setMonthlyRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load monthly report');
      setMonthlyRows([]);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const handleDailyExcel = async () => {
    setError('');
    try {
      const res = await attendanceAPI.exportDaily(dailyDate || undefined);
      downloadBlob(res.data, `attendance_daily_${dailyDate || todayStr()}.xlsx`);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to download Excel');
    }
  };

  const handleMonthlyExcel = async () => {
    if (!month) return;
    setError('');
    try {
      const res = await attendanceAPI.exportMonthly(month);
      downloadBlob(res.data, `attendance_monthly_${month.slice(0, 7)}.xlsx`);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to download Excel');
    }
  };

  const handleYearlyExcel = async () => {
    const y = new Date(month || thisMonthDate()).getFullYear();
    setError('');
    try {
      const res = await attendanceAPI.exportYearly(y);
      downloadBlob(res.data, `attendance_yearly_${y}.xlsx`);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to download Excel');
    }
  };

  const handleLeaveBalance = async () => {
    setError('');
    setLeaveLoading(true);
    try {
      const res = await leaveAPI.getReportBalance();
      const data = res?.data?.data ?? [];
      setLeaveRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load leave balance report');
      setLeaveRows([]);
    } finally {
      setLeaveLoading(false);
    }
  };

  const handlePayrollReport = async () => {
    if (!payrollMonth) return;
    setError('');
    setPayrollLoading(true);
    try {
      const res = await payrollAPI.getReport(payrollMonth);
      const data = res?.data?.data ?? [];
      setPayrollRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load payroll report');
      setPayrollRows([]);
    } finally {
      setPayrollLoading(false);
    }
  };

  const inputBase =
    'rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-slate-500 mt-1">
          View and download attendance, leave balance, and payroll reports.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm flex items-center gap-2"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <ReportCard
          icon={Calendar}
          title="Attendance — Daily"
          description="Who was present on a specific day."
          table={dailyRows}
          loading={dailyLoading}
          emptyMessage="No attendance records for this date."
        >
          <input
            type="date"
            value={dailyDate}
            onChange={(e) => setDailyDate(e.target.value)}
            className={inputBase}
          />
          <Btn onClick={handleDaily} disabled={dailyLoading} primary icon={RefreshCw}>
            {dailyLoading ? 'Loading…' : 'Load'}
          </Btn>
          <Btn onClick={handleDailyExcel} icon={Download}>
            Download Excel
          </Btn>
        </ReportCard>

        <ReportCard
          icon={CalendarRange}
          title="Attendance — Monthly"
          description="Summary by employee for the selected month."
          table={monthlyRows}
          loading={monthlyLoading}
          emptyMessage="No attendance records for this month."
        >
          <input
            type="month"
            value={month.slice(0, 7)}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              setMonth(`${y}-${m}-01`);
            }}
            className={inputBase}
          />
          <Btn onClick={handleMonthly} disabled={monthlyLoading} primary icon={RefreshCw}>
            {monthlyLoading ? 'Loading…' : 'Load'}
          </Btn>
          <Btn onClick={handleMonthlyExcel} icon={Download}>
            Download Excel
          </Btn>
          <Btn onClick={handleYearlyExcel} icon={FileSpreadsheet}>
            Yearly Excel
          </Btn>
        </ReportCard>

        <ReportCard
          icon={CalendarClock}
          title="Leave Balance"
          description="Planned and sick leave balances by employee."
          table={leaveRows}
          loading={leaveLoading}
          emptyMessage="No leave balance data available."
        >
          <Btn onClick={handleLeaveBalance} disabled={leaveLoading} primary icon={RefreshCw}>
            {leaveLoading ? 'Loading…' : 'Load'}
          </Btn>
          <Btn
            onClick={() => downloadCsv(leaveRows, 'leave_balance_report.csv')}
            icon={Download}
          >
            Download CSV
          </Btn>
        </ReportCard>

        <ReportCard
          icon={DollarSign}
          title="Payroll — Monthly"
          description="Payroll report for the selected month."
          table={payrollRows}
          loading={payrollLoading}
          emptyMessage="No payroll data for this month."
        >
          <input
            type="month"
            value={payrollMonth.slice(0, 7)}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              setPayrollMonth(`${y}-${m}-01`);
            }}
            className={inputBase}
          />
          <Btn onClick={handlePayrollReport} disabled={payrollLoading} primary icon={RefreshCw}>
            {payrollLoading ? 'Loading…' : 'Load'}
          </Btn>
          <Btn
            onClick={() =>
              downloadCsv(
                payrollRows,
                `payroll_report_${payrollMonth.slice(0, 7) || 'month'}.csv`
              )
            }
            icon={Download}
          >
            Download CSV
          </Btn>
        </ReportCard>
      </div>
    </div>
  );
}
