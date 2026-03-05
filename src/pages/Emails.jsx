import { useState, useEffect } from 'react';
import { Search, Send, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { emailAPI } from '../api/services';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input, { Textarea } from '../components/ui/Input';

export default function Emails() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');
  const [searchEmail, setSearchEmail] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [form, setForm] = useState({ recipients: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchLogs(); }, [tab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'failed') res = await emailAPI.getFailedLogs();
      else res = await emailAPI.getLogs();
      setLogs(res.data || []);
    } catch { setLogs([]); } finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return fetchLogs();
    setLoading(true);
    try {
      const res = await emailAPI.searchLogs(searchEmail);
      setLogs(res.data || []);
    } catch { setLogs([]); } finally { setLoading(false); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setSending(true); setError('');
    try {
      const recipients = form.recipients.split(',').map((r) => r.trim()).filter(Boolean);
      await emailAPI.broadcast({ recipients, subject: form.subject, body: form.body });
      setMessage(`Email sent to ${recipients.length} recipient(s)!`);
      setShowBroadcast(false);
      setForm({ recipients: '', subject: '', body: '' });
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email');
    } finally { setSending(false); }
  };

  const columns = [
    { key: 'recipientEmail', label: 'Recipient' },
    { key: 'subject', label: 'Subject', render: (v) => v ? (v.length > 40 ? v.slice(0, 40) + '...' : v) : '—' },
    { key: 'emailType', label: 'Type', render: (v) => <Badge variant="info">{v || 'GENERAL'}</Badge> },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <div className="flex items-center gap-1.5">
          {v === 'SENT' ? <CheckCircle size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-red-500" />}
          <Badge variant={v === 'SENT' ? 'success' : 'danger'}>{v}</Badge>
        </div>
      ),
    },
    { key: 'errorMessage', label: 'Error', render: (v) => v ? <span className="text-xs text-red-500">{v}</span> : '—' },
    {
      key: 'sentAt', label: 'Sent At',
      render: (v) => v ? new Date(v).toLocaleString('en-IN') : '—',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Email Logs</h2>
        <Button onClick={() => setShowBroadcast(true)}><Send size={16} /> Broadcast Email</Button>
      </div>

      {message && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{message}</div>}

      {/* Tabs & Search */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-3 py-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {['all', 'failed'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t === 'all' ? 'All Emails' : 'Failed Emails'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search by recipient email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button size="sm" variant="secondary" onClick={handleSearch}>Search</Button>
            <Button size="sm" variant="ghost" onClick={fetchLogs}><RefreshCw size={14} /></Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <Table columns={columns} data={logs} loading={loading} emptyMessage="No email logs found" />
      </Card>

      {/* Broadcast Modal */}
      <Modal isOpen={showBroadcast} onClose={() => setShowBroadcast(false)} title="Broadcast Email">
        <form onSubmit={handleBroadcast} className="space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Input
            label="Recipients (comma-separated emails)"
            required
            placeholder="user1@example.com, user2@example.com"
            value={form.recipients}
            onChange={(e) => setForm({ ...form, recipients: e.target.value })}
          />
          <Input
            label="Subject"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <Textarea
            label="Email Body"
            required
            rows={5}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Enter your message..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowBroadcast(false)}>Cancel</Button>
            <Button type="submit" loading={sending}><Send size={15} /> Send Email</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
