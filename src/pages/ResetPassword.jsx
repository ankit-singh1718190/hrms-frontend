import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { resetPassword } from '../api/authApi';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setMounted(true);
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'][Math.floor(Math.random() * 6)],
    }));
    setParticles(newParticles);
  }, []);

  // Password strength checks
  const checks = [
    { label: 'At least 8 characters', pass: form.newPassword.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(form.newPassword) },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(form.newPassword) },
    { label: 'Passwords match', pass: form.newPassword === form.confirmPassword && form.confirmPassword !== '' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, form.newPassword, form.confirmPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // No token in URL
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '48px', maxWidth: '440px', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
          <XCircle size={56} color="#EF4444" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', marginBottom: '12px' }}>Invalid Link</h2>
          <p style={{ color: '#94a3b8', marginBottom: '28px' }}>This password reset link is invalid or has expired. Please request a new one.</p>
          <button onClick={() => navigate('/forgot-password')} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rp-container">
      <div className="background">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
        {particles.map(p => (
          <div key={p.id} className="particle" style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }} />
        ))}
        <div className="grid-overlay" />
      </div>

      <div className={`card-wrapper ${mounted ? 'visible' : ''}`}>
        <div className="rp-card">

          <div className="logo-wrap">
            <img src="/stripedata-logo.png" alt="STRIPEDATA" className="logo" />
          </div>

          {!success ? (
            <>
              <h2 className="heading">Reset Password</h2>
              <p className="subtext">Choose a strong new password for your account.</p>

              {error && (
                <div className="error-banner">
                  <span className="error-icon">!</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* New Password */}
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowNew(!showNew)}>
                      {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock size={20} className="input-icon" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Password strength checklist */}
                {form.newPassword && (
                  <div className="checks-box">
                    {checks.map((c, i) => (
                      <div key={i} className={`check-item ${c.pass ? 'pass' : 'fail'}`}>
                        {c.pass
                          ? <CheckCircle size={14} color="#10B981" />
                          : <XCircle size={14} color="#64748b" />}
                        <span>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button type="submit" className="submit-btn" disabled={loading}>
                  <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                  {!loading && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="success-state">
              <div className="success-icon-wrap">
                <CheckCircle size={56} color="#10B981" />
              </div>
              <h2 className="heading">Password Reset!</h2>
              <p className="subtext">Your password has been reset successfully. You can now sign in with your new password.</p>
              <button className="submit-btn" onClick={() => navigate('/login')}>
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .rp-container {
          min-height: 100vh; width: 100%;
          position: relative; font-family: 'Inter', sans-serif;
          overflow: hidden; background: #0a0a0f;
          display: flex; align-items: center; justify-content: center;
        }

        .background { position: fixed; inset: 0; overflow: hidden; z-index: 0; }
        .gradient-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; animation: float 20s ease-in-out infinite; }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #3B82F6 0%, transparent 70%); top: -200px; left: -200px; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #EC4899 0%, transparent 70%); bottom: -150px; right: -150px; animation-delay: 7s; }
        .orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, #10B981 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: 14s; }
        @keyframes float {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-30px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.9); }
        }
        .particle { position: absolute; border-radius: 50%; opacity: 0.6; animation: particle-float infinite ease-in-out; }
        @keyframes particle-float {
          0%, 100% { transform: translate(0,0); opacity: 0.3; }
          50% { transform: translate(-50px,-50px); opacity: 0.8; }
        }
        .grid-overlay {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px; opacity: 0.5;
        }

        .card-wrapper {
          position: relative; z-index: 1;
          opacity: 0; transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16,1,0.3,1);
          width: 100%; max-width: 480px; padding: 20px;
        }
        .card-wrapper.visible { opacity: 1; transform: translateY(0); }

        .rp-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 48px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.1) inset;
        }

        .logo-wrap { display: flex; justify-content: center; margin-bottom: 28px; }
        .logo { max-width: 200px; width: 100%; height: auto; filter: drop-shadow(0 0 20px rgba(59,130,246,0.3)); }

        .heading { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; color: white; margin-bottom: 12px; }
        .subtext { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }

        .error-banner {
          display: flex; align-items: start; gap: 10px;
          padding: 12px 16px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          border-radius: 12px; color: #fca5a5; font-size: 14px; margin-bottom: 24px;
        }
        .error-icon {
          width: 18px; height: 18px; border-radius: 50%;
          background: #EF4444; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: bold; flex-shrink: 0;
        }

        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 14px; font-weight: 500; color: #e2e8f0; margin-bottom: 8px; }

        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 16px; color: #64748b; pointer-events: none; }
        .input-wrapper input {
          width: 100%; padding: 14px 48px 14px 48px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; color: white; font-size: 15px;
          transition: all 0.3s ease; font-family: 'Inter', sans-serif;
        }
        .input-wrapper input::placeholder { color: #64748b; }
        .input-wrapper input:focus {
          outline: none; background: rgba(255,255,255,0.08);
          border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .toggle-password {
          position: absolute; right: 16px;
          background: none; border: none; color: #64748b;
          cursor: pointer; padding: 4px;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.3s ease;
        }
        .toggle-password:hover { color: #94a3b8; }

        .checks-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 16px;
          margin-bottom: 24px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .check-item {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px;
        }
        .check-item.pass span { color: #10B981; }
        .check-item.fail span { color: #64748b; }

        .submit-btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          border: none; border-radius: 12px;
          color: white; font-size: 16px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.3s ease; font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 16px rgba(59,130,246,0.3); margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
          transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,0.4);
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .success-state { text-align: center; }
        .success-icon-wrap { display: flex; justify-content: center; margin-bottom: 24px; }

        @media (max-width: 640px) {
          .rp-card { padding: 32px 24px; }
          .heading { font-size: 24px; }
        }
      `}</style>
    </div>
  );
}
