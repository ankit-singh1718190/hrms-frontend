import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Eye, EyeOff, Lock, Mail, Wifi, WifiOff, Loader2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL;
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const check = async () => {
      try {
        await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: 'ping@test.com', password: 'ping' }),
          signal: AbortSignal.timeout(4000),
        });
        setServerStatus('online');
      } catch (e) {
        setServerStatus(e.name === 'AbortError' ? 'offline' : 'online');
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-white/5" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">HRMS</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Human Resource<br />Management System
            </h1>
            <p className="text-indigo-200 mt-4 text-base leading-relaxed">
              Manage your workforce efficiently — from attendance and leaves to payroll and performance, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Employees', desc: 'Full lifecycle management' },
              { label: 'Attendance', desc: 'GPS-based check-in/out' },
              { label: 'Payroll', desc: 'Automated salary processing' },
              { label: 'Leaves', desc: 'Request & approval flow' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-3.5">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-indigo-300 text-xs">
          © {new Date().getFullYear()} HRMS Portal. All rights reserved.
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 sm:p-10">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 leading-none">HRMS Portal</p>
              <p className="text-xs text-slate-400 mt-0.5">HR Management System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Server status pill */}
          <div className={`mb-5 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-fit
            ${serverStatus === 'online' ? 'bg-green-50 text-green-600 border border-green-200' :
              serverStatus === 'offline' ? 'bg-red-50 text-red-600 border border-red-200' :
              'bg-slate-100 text-slate-500 border border-slate-200'}`}
          >
            {serverStatus === 'online' && <><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Server online</>}
            {serverStatus === 'offline' && <><WifiOff size={12} /> Server offline — check backend IP in <code className="font-mono bg-red-100 px-1 rounded">.env</code></>}
            {serverStatus === 'checking' && <><Loader2 size={12} className="animate-spin" /> Connecting…</>}
          </div>

          {/* Error */}
          {(err || error) && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">!</span>
              {err || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm placeholder:text-slate-300 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-11 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm placeholder:text-slate-300 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || serverStatus === 'offline'}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-200"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center mb-3 font-medium uppercase tracking-wide">Who can log in</p>
            <div className="grid grid-cols-2 gap-2">
              {['Admin', 'HR', 'Manager', 'Employee'].map(role => (
                <div key={role} className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-100 rounded-lg px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  {role}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
