import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../api/authApi';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-container">
      {/* Animated Background */}
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

      {/* Card */}
      <div className={`card-wrapper ${mounted ? 'visible' : ''}`}>
        <div className="fp-card">

          {/* Back to Login */}
          <button className="back-btn" onClick={() => navigate('/login')}>
            <ArrowLeft size={16} />
            Back to Login
          </button>

          {/* Logo */}
          <div className="logo-wrap">
            <img src="/stripedata-logo.png" alt="STRIPEDATA" className="logo" />
          </div>

          {!success ? (
            <>
              <h2 className="heading">Forgot Password?</h2>
              <p className="subtext">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="error-banner">
                  <span className="error-icon">!</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="fp-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={20} className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                  {!loading && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="success-state">
              <div className="success-icon-wrap">
                <CheckCircle size={56} color="#10B981" />
              </div>
              <h2 className="heading">Check your inbox</h2>
              <p className="subtext">
                If <strong style={{ color: '#e2e8f0' }}>{email}</strong> is registered in our system,
                you'll receive a password reset link shortly. The link expires in <strong style={{ color: '#e2e8f0' }}>15 minutes</strong>.
              </p>
              <p className="subtext" style={{ fontSize: '13px', marginTop: '8px' }}>
                Didn't receive it? Check your spam folder or&nbsp;
                <button className="resend-btn" onClick={() => setSuccess(false)}>
                  try again
                </button>.
              </p>
              <button className="submit-btn" style={{ marginTop: '32px' }} onClick={() => navigate('/login')}>
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .fp-container {
          min-height: 100vh;
          width: 100%;
          position: relative;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .background { position: fixed; inset: 0; overflow: hidden; z-index: 0; }

        .gradient-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.3;
          animation: float 20s ease-in-out infinite;
        }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #3B82F6 0%, transparent 70%); top: -200px; left: -200px; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #EC4899 0%, transparent 70%); bottom: -150px; right: -150px; animation-delay: 7s; }
        .orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, #10B981 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: 14s; }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .particle {
          position: absolute; border-radius: 50%; opacity: 0.6;
          animation: particle-float infinite ease-in-out;
        }
        @keyframes particle-float {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(-50px, -50px); opacity: 0.8; }
        }

        .grid-overlay {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.5;
        }

        .card-wrapper {
          position: relative; z-index: 1;
          opacity: 0; transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%; max-width: 480px;
          padding: 20px;
        }
        .card-wrapper.visible { opacity: 1; transform: translateY(0); }

        .fp-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.1) inset;
        }

        .back-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          color: #64748b; font-size: 14px; font-family: 'Inter', sans-serif;
          margin-bottom: 28px; padding: 0;
          transition: color 0.2s ease;
        }
        .back-btn:hover { color: #94a3b8; }

        .logo-wrap { display: flex; justify-content: center; margin-bottom: 28px; }
        .logo { max-width: 200px; width: 100%; height: auto; filter: drop-shadow(0 0 20px rgba(59,130,246,0.3)); }

        .heading {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px; font-weight: 700;
          color: white; margin-bottom: 12px;
        }

        .subtext { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }

        .error-banner {
          display: flex; align-items: start; gap: 10px;
          padding: 12px 16px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 12px;
          color: #fca5a5; font-size: 14px;
          margin-bottom: 24px;
        }
        .error-icon {
          width: 18px; height: 18px; border-radius: 50%;
          background: #EF4444; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: bold; flex-shrink: 0;
        }

        .fp-form { margin-bottom: 0; }

        .form-group { margin-bottom: 24px; }
        .form-group label {
          display: block; font-size: 14px; font-weight: 500;
          color: #e2e8f0; margin-bottom: 8px;
        }

        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 16px; color: #64748b; pointer-events: none; }
        .input-wrapper input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white; font-size: 15px;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }
        .input-wrapper input::placeholder { color: #64748b; }
        .input-wrapper input:focus {
          outline: none;
          background: rgba(255,255,255,0.08);
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }

        .submit-btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          border: none; border-radius: 12px;
          color: white; font-size: 16px; font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 16px rgba(59,130,246,0.3);
        }
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59,130,246,0.4);
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .success-state { text-align: center; }
        .success-icon-wrap { display: flex; justify-content: center; margin-bottom: 24px; }

        .resend-btn {
          background: none; border: none; cursor: pointer;
          color: #3B82F6; font-size: 13px; font-family: 'Inter', sans-serif;
          text-decoration: underline; padding: 0;
        }
        .resend-btn:hover { color: #60a5fa; }

        @media (max-width: 640px) {
          .fp-card { padding: 32px 24px; }
          .heading { font-size: 24px; }
        }
      `}</style>
    </div>
  );
}
