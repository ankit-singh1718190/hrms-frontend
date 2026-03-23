import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Eye, EyeOff, Lock, Mail, Shield, Users, UserCheck, User } from 'lucide-react';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState([]);

  const apiUrl = import.meta.env.VITE_API_URL;
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    setMounted(true);
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'][Math.floor(Math.random() * 6)]
    }));
    setParticles(newParticles);
  }, []);

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

  const roles = [
    { icon: Shield, label: 'Admin', color: '#3B82F6' },
    { icon: Users, label: 'HR', color: '#10B981' },
    { icon: UserCheck, label: 'Manager', color: '#F59E0B' },
    { icon: User, label: 'Employee', color: '#EC4899' }
  ];

  return (
    <div className="login-container">
      {/* Animated Background */}
      <div className="background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
        
        <div className="grid-overlay"></div>
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        {/* Left Panel - Branding */}
        <div className={`brand-panel ${mounted ? 'visible' : ''}`}>
          <div className="brand-content">
            <div className="logo-container">
              <img src="/stripedata-logo.png" alt="STRIPEDATA" className="logo-image" />
            </div>

            <div className="tagline">
              <span className="tagline-line"></span>
              Result Driven · Future Ready
              <span className="tagline-line"></span>
            </div>

            <h1 className="main-heading">Our Mission</h1>

            <p className="description">
              At Stripedata, our mission is to deliver skills and knowledge that significantly increases the value proposition of our clients into their business.
            </p>

            <h2 className="vision-heading">Our Vision</h2>

            <p className="vision-text">
              Stripedata is committed to improving the learning outcomes through customized training solutions to foster development of organizations' greatest assets: their people.
            </p>

            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <div className="feature-title">Employees</div>
                  <div className="feature-desc">Full lifecycle management</div>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                  <UserCheck size={24} />
                </div>
                <div>
                  <div className="feature-title">Attendance</div>
                  <div className="feature-desc">GPS-based check-in/out</div>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div>
                  <div className="feature-title">Payroll</div>
                  <div className="feature-desc">Automated salary processing</div>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <div className="feature-title">Leaves</div>
                  <div className="feature-desc">Request & approval flow</div>
                </div>
              </div>
            </div>

            <div className="copyright">© 2026 STRIPEDATA. All rights reserved.</div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className={`login-panel ${mounted ? 'visible' : ''}`}>
          <div className="login-card">
            <h2 className="welcome-heading">Welcome back</h2>
            <p className="welcome-text">Sign in to your account to continue</p>

            {(err || error) && (
              <div className="error-banner">
                <span className="error-icon">!</span>
                {err || error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={20} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                {/* ── Label row with Forgot Password link ── */}
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    id="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPass(!showPass)}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading || serverStatus === 'offline'}
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>

            <div className="divider">
              <span>WHO CAN LOG IN</span>
            </div>

            <div className="roles-grid">
              {roles.map((role, index) => (
                <div key={index} className="role-badge" style={{ animationDelay: `${index * 0.1}s` }}>
                  <role.icon size={16} style={{ color: role.color }} />
                  <span>{role.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-container {
          min-height: 100vh; width: 100%;
          position: relative; font-family: 'Inter', sans-serif;
          overflow: hidden; background: #0a0a0f;
        }

        .background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 0; }
        .gradient-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; animation: float 20s ease-in-out infinite; }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #3B82F6 0%, transparent 70%); top: -200px; left: -200px; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #EC4899 0%, transparent 70%); bottom: -150px; right: -150px; animation-delay: 7s; }
        .orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, #10B981 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: 14s; }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .particle { position: absolute; border-radius: 50%; opacity: 0.6; animation: particle-float infinite ease-in-out; }
        @keyframes particle-float {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(-50px, -50px); opacity: 0.8; }
        }
        .grid-overlay {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px; opacity: 0.5;
        }

        .content-wrapper {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1fr 1fr;
          min-height: 100vh; max-width: 1600px; margin: 0 auto;
        }

        .brand-panel {
          padding: 60px 80px; display: flex; align-items: center;
          opacity: 0; transform: translateX(-30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .brand-panel.visible { opacity: 1; transform: translateX(0); }
        .brand-content { max-width: 550px; }
        .logo-container { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .logo-image { max-width: 500px; width: 100%; height: auto; animation: logo-fade-in 1s ease-out; filter: drop-shadow(0 0 20px rgba(59,130,246,0.3)); }
        @keyframes logo-fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .tagline { font-size: 13px; color: #64748b; margin-bottom: 40px; letter-spacing: 0.5px; font-weight: 500; display: flex; align-items: center; gap: 12px; }
        .tagline-line { flex: 1; height: 1px; background: linear-gradient(to right, transparent, #64748b, transparent); }
        .main-heading { font-family: 'Space Grotesk', sans-serif; font-size: 48px; font-weight: 700; line-height: 1.2; margin-bottom: 24px; background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .description { font-size: 18px; color: #94a3b8; line-height: 1.6; margin-bottom: 36px; }
        .vision-heading { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; line-height: 1.2; margin-bottom: 20px; background: linear-gradient(135deg, #3B82F6 0%, #EC4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .vision-text { font-size: 17px; color: #94a3b8; line-height: 1.6; margin-bottom: 48px; }
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 60px; }
        .feature-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; display: flex; gap: 16px; align-items: flex-start; transition: all 0.3s ease; backdrop-filter: blur(10px); }
        .feature-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
        .feature-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
        .feature-title { font-weight: 600; color: white; margin-bottom: 4px; font-size: 15px; }
        .feature-desc { font-size: 13px; color: #94a3b8; }
        .copyright { font-size: 12px; color: #475569; }

        .login-panel {
          display: flex; align-items: center; justify-content: center; padding: 60px;
          opacity: 0; transform: translateX(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
        }
        .login-panel.visible { opacity: 1; transform: translateX(0); }

        .login-card {
          width: 100%; max-width: 480px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 48px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.1) inset;
        }

        .welcome-heading { font-family: 'Space Grotesk', sans-serif; font-size: 32px; font-weight: 700; color: white; margin-bottom: 8px; }
        .welcome-text { font-size: 15px; color: #94a3b8; margin-bottom: 32px; }

        .error-banner { display: flex; align-items: start; gap: 10px; padding: 12px 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; color: #fca5a5; font-size: 14px; margin-bottom: 24px; }
        .error-icon { width: 18px; height: 18px; border-radius: 50%; background: #EF4444; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; }

        .login-form { margin-bottom: 32px; }
        .form-group { margin-bottom: 24px; }

        /* ── NEW: label row with forgot password link ── */
        .label-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .label-row label { font-size: 14px; font-weight: 500; color: #e2e8f0; }
        .forgot-link {
          font-size: 13px; color: #3B82F6;
          text-decoration: none; font-weight: 500;
          transition: color 0.2s ease;
        }
        .forgot-link:hover { color: #60a5fa; text-decoration: underline; }

        .form-group label { display: block; font-size: 14px; font-weight: 500; color: #e2e8f0; margin-bottom: 8px; }

        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 16px; color: #64748b; pointer-events: none; }
        .input-wrapper input { width: 100%; padding: 14px 16px 14px 48px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; font-size: 15px; transition: all 0.3s ease; font-family: 'Inter', sans-serif; }
        .input-wrapper input::placeholder { color: #64748b; }
        .input-wrapper input:focus { outline: none; background: rgba(255,255,255,0.08); border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .toggle-password { position: absolute; right: 16px; background: none; border: none; color: #64748b; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.3s ease; }
        .toggle-password:hover { color: #94a3b8; }

        .submit-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border: none; border-radius: 12px; color: white; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease; font-family: 'Inter', sans-serif; box-shadow: 0 4px 16px rgba(59,130,246,0.3); }
        .submit-btn:hover:not(:disabled) { background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,0.4); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider { position: relative; text-align: center; margin: 32px 0; }
        .divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.1); }
        .divider span { position: relative; background: rgba(255,255,255,0.05); padding: 0 16px; font-size: 12px; color: #64748b; font-weight: 500; letter-spacing: 1px; }

        .roles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .role-badge { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; font-size: 14px; color: #e2e8f0; transition: all 0.3s ease; opacity: 0; animation: fade-in 0.5s ease forwards; }
        @keyframes fade-in { to { opacity: 1; } }
        .role-badge:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.15); }

        @media (max-width: 1200px) {
          .content-wrapper { grid-template-columns: 1fr; }
          .brand-panel { display: none; }
          .login-panel { padding: 40px 20px; }
        }
        @media (max-width: 640px) {
          .login-card { padding: 32px 24px; }
          .welcome-heading { font-size: 28px; }
          .roles-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
