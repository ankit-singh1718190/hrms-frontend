import { useEffect, useState } from 'react';
import { adminAPI } from '../api/services';
import { Plus, X, ToggleLeft, ToggleRight, Trash2, Eye } from 'lucide-react';

const unwrap = (res) => res?.data?.data;

const EMPTY = {
  firstName: '', lastName: '', emailId: '', password: '',
  phone: '', department: '', role: 'ADMIN',
};

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getAll({ page: 0, size: 50 });
      const data = unwrap(res);
      setAdmins(Array.isArray(data) ? data : data?.content ?? []);
    } catch (e) {
      setError(`Failed to load admins: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      firstName: (fd.get('firstName') || '').toString().trim(),
      lastName: (fd.get('lastName') || '').toString().trim(),
      emailId: (fd.get('emailId') || '').toString().trim(),
      password: (fd.get('password') || '').toString(),
      phone: (fd.get('phone') || '').toString().trim(),
      department: (fd.get('department') || '').toString().trim(),
      role: (fd.get('role') || 'ADMIN').toString(),
    };

    setSaving(true);
    setFormError('');
    try {
      await adminAPI.register(payload);
      setShowModal(false);
      fetchAdmins();
    } catch (e) {
      setFormError(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminAPI.toggleActive(id);
      fetchAdmins();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const handleDelete = async (admin) => {
    if (!confirm(`Delete admin ${admin.fullName || admin.emailId}?`)) return;
    try {
      await adminAPI.delete(admin.id);
      fetchAdmins();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const Field = ({ label, name, type = 'text', options }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {options ? (
        <select
          name={name}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {options.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">{admins.length} administrators</p>
        </div>
        <button onClick={() => { setFormError(''); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Name', 'Email', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="py-3 px-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : admins.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">No admin users found</td></tr>
            ) : (
              admins.map(admin => (
                <tr key={admin.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">{admin.fullName || `${admin.firstName} ${admin.lastName}`}</td>
                  <td className="py-3 px-4 text-slate-500">{admin.emailId}</td>
                  <td className="py-3 px-4">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">{admin.role}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{admin.department || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${admin.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {admin.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggle(admin.id)} title={admin.active ? 'Deactivate' : 'Activate'}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                        {admin.active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => handleDelete(admin)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add Admin User</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create a new administrator account with the appropriate role and contact details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="First Name *" name="firstName" />
                <Field label="Last Name *" name="lastName" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Email *" name="emailId" type="email" />
                <Field label="Password *" name="password" type="password" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Contact Number" name="phone" />
                <Field label="Department" name="department" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Role" name="role" options={['ADMIN', 'HR', 'MANAGER']} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                <p className="text-xs text-slate-400">
                  Strong password recommended: at least 8 characters with letters and numbers.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-60"
                  >
                    {saving ? 'Creating…' : 'Create Admin'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
