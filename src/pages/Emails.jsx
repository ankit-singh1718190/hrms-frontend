import { useEffect, useState } from 'react';
import { emailAPI } from '../api/services';
import { Send, RefreshCw, Search, AlertCircle, CheckCircle, Mail } from 'lucide-react';

const unwrap = (res) => res?.data?.data;

export default function Emails() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  const [showBroadcast, setShowBroadcast] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '', recipientType: 'ALL' });
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = searchEmail.trim()
        ? await emailAPI.searchLogs(searchEmail.trim())
        : await emailAPI.getLogs();
      const data = unwrap(res);
      setLogs(Array.isArray(data) ? data : data?.content ?? []);
    } catch (e) {
      setError(`Failed to load email logs: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendStatus('');
    try {
      await emailAPI.broadcast(form);
      setSendStatus('success');
      setForm({ subject: '', body: '', recipientType: 'ALL' });
      setTimeout(() => { setShowBroadcast(false); setSendStatus(''); fetchLogs(); }, 1500);
    } catch (ex) {
      setSendStatus(ex.response?.data?.message || ex.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Email Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">{logs.length} records</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchLogs} className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={() => setShowBroadcast(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            <Send size={15} /> Broadcast Email
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            placeholder="Search by email…"
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchLogs()}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Recipient', 'Subject', 'Type', 'Sent At', 'Status'].map(h => (
                <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="py-3 px-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">No email logs found</td></tr>
            ) : (
              logs.map((log, i) => (
                <tr key={log.id || i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-slate-700">{log.recipientEmail}</td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{log.subject}</td>
                  <td className="py-3 px-3">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">{log.emailType || '—'}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-xs font-mono">{log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}</td>
                  <td className="py-3 px-3">
                    {log.success || log.status === 'SENT' ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={12} /> Sent</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><AlertCircle size={12} /> Failed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Mail size={18} /> Send Broadcast Email</h2>
              <button onClick={() => setShowBroadcast(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">✕</button>
            </div>
            <form onSubmit={handleBroadcast} className="p-6 space-y-4">
              {sendStatus && sendStatus !== 'success' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{sendStatus}</div>
              )}
              {sendStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle size={16} /> Email broadcast sent successfully!
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Recipients</label>
                <select value={form.recipientType} onChange={e => setForm(f => ({ ...f, recipientType: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {['ALL', 'EMPLOYEES', 'ADMINS', 'HR', 'MANAGERS'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
                <input required type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Email subject…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Message *</label>
                <textarea required rows={6} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Enter email message…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowBroadcast(false)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={sending} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-60">
                  <Send size={14} /> {sending ? 'Sending…' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
