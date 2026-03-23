import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { updatePassword } from '../api/authApi';

export default function UpdatePassword() {
  const { user, token } = useAuth(); // ✅ get token directly from AuthContext
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, newP: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const checks = [
    { label: 'At least 8 characters',  pass: form.newPassword.length >= 8 },
    { label: 'Contains a number',      pass: /\d/.test(form.newPassword) },
    { label: 'Contains uppercase',     pass: /[A-Z]/.test(form.newPassword) },
    { label: 'Passwords match',        pass: form.newPassword === form.confirmPassword && form.confirmPassword !== '' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // ✅ Use token from AuthContext — always fresh, no localStorage mismatch
      await updatePassword(form.currentPassword, form.newPassword, form.confirmPassword, token);
      setSuccess(true);
      setError('');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Update Password</h1>
        <p className="text-sm text-slate-500 mt-1">
          Change the password for{' '}
          <span className="text-indigo-600 font-medium">{user?.email}</span>
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

        {/* ✅ Success Banner */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium mb-6">
            <CheckCircle size={20} className="shrink-0 text-green-500" />
            Password updated successfully!
          </div>
        )}

        {/* ❌ Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium mb-6">
            <XCircle size={20} className="shrink-0 text-red-500" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Current Password
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type={show.current ? 'text' : 'password'}
                placeholder="Enter current password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                required
                className="w-full pl-9 pr-10 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 transition"
              />
              <button type="button" onClick={() => setShow({ ...show, current: !show.current })}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors">
                {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              New Password
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type={show.newP ? 'text' : 'password'}
                placeholder="Enter new password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
                className="w-full pl-9 pr-10 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 transition"
              />
              <button type="button" onClick={() => setShow({ ...show, newP: !show.newP })}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors">
                {show.newP ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type={show.confirm ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="w-full pl-9 pr-10 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 transition"
              />
              <button type="button" onClick={() => setShow({ ...show, confirm: !show.confirm })}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors">
                {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password strength checklist */}
          {form.newPassword && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Password Requirements
              </p>
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  {c.pass
                    ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                    : <XCircle size={14} className="text-slate-300 shrink-0" />}
                  <span className={`text-sm ${c.pass ? 'text-green-600' : 'text-slate-400'}`}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
