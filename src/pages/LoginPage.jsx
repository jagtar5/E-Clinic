import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  Heart,
  Eye,
  EyeOff,
  Stethoscope,
  Shield,
  Activity,
} from 'lucide-react';

export default function LoginPage() {
  const { signIn, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-(--color-bg-primary)">
        <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
    } else {
      navigate('/dashboard');
    }
  }

  const demoAccounts = [
    { email: 'admin@clinic.com', role: 'Super Admin', icon: Shield, color: '#8b5cf6' },
    { email: 'doctor@clinic.com', role: 'Doctor', icon: Stethoscope, color: '#3b82f6' },
    { email: 'reception@clinic.com', role: 'Receptionist', icon: Activity, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen flex bg-(--color-bg-primary) relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #3b82f6, transparent)',
            filter: 'blur(80px)',
            animation: 'pulse-soft 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #06b6d4, transparent)',
            filter: 'blur(80px)',
            animation: 'pulse-soft 4s ease-in-out infinite 1s',
          }}
        />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative">
        <div className="max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              }}
            >
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-(--color-text-primary)">Utmani Clinic</h1>
              <p className="text-sm text-(--color-text-muted)">Management System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            <span className="gradient-text">Streamline</span> your
            <br />clinical practice
          </h2>

          <p className="text-(--color-text-secondary) text-lg leading-relaxed mb-8">
            Complete clinic management — from patient registration to prescription generation. 
            Built for speed and efficiency.
          </p>

          <div className="space-y-4">
            {[
              'Rapid patient encounters with auto-suggest',
              'One-click prescription generation',
              'Real-time analytics dashboard',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                  <svg className="w-3.5 h-3.5 text-(--color-accent-success)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-(--color-text-secondary)">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
            >
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Utmani Clinic</h1>
              <p className="text-xs text-(--color-text-muted)">Management System</p>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Welcome back</h3>
              <p className="text-(--color-text-secondary)">Sign in to access your clinic dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="label">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder="you@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    style={{ paddingRight: '2.75rem' }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="p-3 rounded-lg text-sm animate-scale-in"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--color-accent-danger)',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full justify-center"
                style={{ padding: '0.75rem 1.25rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border-default)' }}>
              <p className="text-xs text-(--color-text-muted) uppercase tracking-wider font-semibold mb-3">
                Demo Accounts <span className="text-(--color-text-muted) font-normal">(password: demo123)</span>
              </p>
              <div className="space-y-2">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  return (
                    <button
                      key={account.email}
                      type="button"
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left"
                      style={{
                        background: 'var(--color-bg-input)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = account.color;
                        e.currentTarget.style.background = 'var(--color-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                        e.currentTarget.style.background = 'var(--color-bg-input)';
                      }}
                      onClick={() => {
                        setEmail(account.email);
                        setPassword('demo123');
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${account.color}20`, color: account.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-(--color-text-primary)">{account.role}</div>
                        <div className="text-xs text-(--color-text-muted)">{account.email}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
