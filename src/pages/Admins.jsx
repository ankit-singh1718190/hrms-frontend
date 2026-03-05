import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminAPI } from '../api/services';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { statusBadge } from '../components/ui/Badge';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input, { Select } from '../components/ui/Input';

const emptyForm = { name: '', email: '', password: '', phone: '', department: '', designation: '', role: 'ADMIN' };
const DEPARTMENTS = ['HR', 'Admin', 'IT', 'Finance', 'Operations'];

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAll();
      setAdmins(res.data?.content || res.data || []);
    } catch { setAdmins([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const openCreate = () => { setSelected(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (a) => { setSelected(a); setForm({ ...emptyForm, ...a, password: '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (selected?.id) {
        await adminAPI.update(selected.id, form);
      } else {
        await adminAPI.register(form);
      }
      setMessage(selected?.id ? 'Admin updated!' : 'Admin registered!');
      setShowModal(false);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this admin?')) return;
    await adminAPI.delete(id);
    setMessage('Admin deleted.');
    fetchAdmins();
  };

  const handleToggle = async (id) => {
    await adminAPI.toggleActive(id);
    fetchAdmins();
  };

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const columns = [
    {
      key: 'name', label: 'Admin',
      render: (v, r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
            {(v || r.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-800">{v || '—'}</p>
            <p className="text-xs text-slate-400">{r.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (v) => <Badge variant="purple">{v}</Badge> },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'active', label: 'Status',
      render: (v) => <Badge variant={v ? 'success' : 'danger'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleToggle(r.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={r.active ? 'Deactivate' : 'Activate'}>
            {r.active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
          </button>
          <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
            <Edit2 size={15} />
          </button>
          <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Admin Users</h2>
        <Button onClick={openCreate}><Plus size={16} /> Add Admin</Button>
      </div>

      {message && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{message}</div>}

      <Card>
        <Table columns={columns} data={admins} loading={loading} emptyMessage="No admin users found" />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selected?.id ? 'Edit Admin' : 'Register Admin'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <Input label="Full Name" required value={form.name} onChange={(e) => f('name', e.target.value)} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => f('email', e.target.value)} />
          {!selected?.id && (
            <Input label="Password" type="password" required value={form.password} onChange={(e) => f('password', e.target.value)} />
          )}
          <Input label="Phone" value={form.phone} onChange={(e) => f('phone', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" value={form.department} onChange={(e) => f('department', e.target.value)}>
              <option value="">Select</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </Select>
            <Select label="Role" value={form.role} onChange={(e) => f('role', e.target.value)}>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER ADMIN</option>
            </Select>
          </div>
          <Input label="Designation" value={form.designation} onChange={(e) => f('designation', e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{selected?.id ? 'Update' : 'Register'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
