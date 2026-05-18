import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    if (success) navigate('/dashboard');
    setLoading(false);
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@test.com' },
    { role: 'Manager', email: 'manager@test.com' },
    { role: 'Member', email: 'member1@test.com' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brandMark}>
          <div style={styles.logoMark}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="0" y="0" width="12" height="12" rx="3" fill="white" fillOpacity="0.9" />
              <rect x="16" y="0" width="12" height="12" rx="3" fill="white" fillOpacity="0.5" />
              <rect x="0" y="16" width="12" height="12" rx="3" fill="white" fillOpacity="0.5" />
              <rect x="16" y="16" width="12" height="12" rx="3" fill="white" fillOpacity="0.25" />
            </svg>
          </div>
          <span style={styles.brandName}>Taskflow</span>
        </div>
        <div style={styles.heroText}>
          <h1 style={styles.heroHeadline}>Bring order<br />to your work.</h1>
          <p style={styles.heroSub}>Track tasks, collaborate with teams, and ship what matters — all in one place.</p>
        </div>
        <div style={styles.statsRow}>
          {[['98%', 'On-time delivery'], ['3.2×', 'Faster completion'], ['40h', 'Saved per team/mo']].map(([val, label]) => (
            <div key={label} style={styles.statItem}>
              <span style={styles.statVal}>{val}</span>
              <span style={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Sign in</h2>
            <p style={styles.cardSub}>Welcome back — enter your details below</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e0f0'}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e0f0'}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? (
                <span style={styles.loadingInner}>
                  <span style={styles.spinner} />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>demo accounts</span>
            <div style={styles.dividerLine} />
          </div>

          <div style={styles.demoGrid}>
            {demoAccounts.map(({ role, email: demoEmail }) => (
              <button
                key={role}
                type="button"
                onClick={() => { setEmail(demoEmail); setPassword('password123'); }}
                style={styles.demoBtn}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e0f0'}
              >
                <span style={styles.demoRole}>{role}</span>
                <span style={styles.demoEmail}>{demoEmail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  left: {
    flex: '1 1 45%',
    background: 'linear-gradient(145deg, #4f46e5 0%, #7c3aed 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '2.5rem 3rem',
    color: 'white',
    minHeight: '100vh',
  },
  brandMark: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoMark: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '-0.3px',
    color: 'white',
  },
  heroText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingBottom: '3rem',
  },
  heroHeadline: {
    fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
    fontWeight: '700',
    lineHeight: 1.1,
    margin: '0 0 1.25rem',
    letterSpacing: '-1px',
    color: 'white',
  },
  heroSub: {
    fontSize: '1.05rem',
    lineHeight: 1.65,
    color: 'rgba(255,255,255,0.75)',
    maxWidth: '380px',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid rgba(255,255,255,0.15)',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  statVal: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: 'white',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  right: {
    flex: '1 1 55%',
    background: '#fafaf9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    border: '1px solid #eeecf8',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 32px rgba(99,102,241,0.08)',
  },
  cardHeader: {
    marginBottom: '2rem',
  },
  cardTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1a1830',
    margin: '0 0 0.35rem',
    letterSpacing: '-0.5px',
  },
  cardSub: {
    fontSize: '0.9rem',
    color: '#8b8aa0',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginBottom: '1.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#3d3b52',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  input: {
    padding: '0.65rem 0.9rem',
    border: '1.5px solid #e2e0f0',
    borderRadius: '10px',
    fontSize: '0.95rem',
    color: '#1a1830',
    background: 'white',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '0.8rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.25rem',
    transition: 'opacity 0.15s',
    fontFamily: 'inherit',
  },
  loadingInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 0 1rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#eeecf8',
  },
  dividerText: {
    fontSize: '0.72rem',
    color: '#b0aec8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  demoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  demoBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 0.9rem',
    border: '1.5px solid #e2e0f0',
    borderRadius: '10px',
    background: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  demoRole: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#4f46e5',
  },
  demoEmail: {
    fontSize: '0.8rem',
    color: '#8b8aa0',
  },
};

export default Login;
