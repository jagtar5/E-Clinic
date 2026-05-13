import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

// Demo users for local development (no Supabase needed)
const DEMO_USERS = {
  'admin@clinic.com': {
    id: 'demo-admin-001',
    email: 'admin@clinic.com',
    full_name: 'Dr. Naizamuddin Utmani',
    role: 'super_admin',
    avatar_url: null,
  },
  'doctor@clinic.com': {
    id: 'demo-doctor-001',
    email: 'doctor@clinic.com',
    full_name: 'Dr. Nizamuddin Utmani',
    role: 'doctor',
    avatar_url: null,
  },
  'reception@clinic.com': {
    id: 'demo-reception-001',
    email: 'reception@clinic.com',
    full_name: 'Fatima Noor',
    role: 'receptionist',
    avatar_url: null,
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if demo session exists in localStorage
    const demoSession = localStorage.getItem('cms_demo_session');
    if (demoSession) {
      try {
        const parsed = JSON.parse(demoSession);
        setUser(parsed);
        setProfile(parsed);
        setIsDemoMode(true);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('cms_demo_session');
      }
    }

    // Try Supabase auth
    checkSupabaseSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  async function checkSupabaseSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    } catch {
      // Supabase not available — demo mode
    }
    setLoading(false);
  }

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    } catch {
      // Profile fetch failed
    }
  }

  async function signIn(email, password) {
    // Check demo users first
    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (demoUser && password === 'demo123') {
      setUser(demoUser);
      setProfile(demoUser);
      setIsDemoMode(true);
      localStorage.setItem('cms_demo_session', JSON.stringify(demoUser));
      return { error: null };
    }

    // Try Supabase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      setUser(data.user);
      await fetchProfile(data.user.id);
      return { error: null };
    } catch {
      // If Supabase is unreachable and not a demo user
      if (demoUser) {
        setUser(demoUser);
        setProfile(demoUser);
        setIsDemoMode(true);
        localStorage.setItem('cms_demo_session', JSON.stringify(demoUser));
        return { error: null };
      }
      return { error: { message: 'Unable to connect to server. Use demo credentials to sign in.' } };
    }
  }

  async function signOut() {
    if (isDemoMode) {
      localStorage.removeItem('cms_demo_session');
      setUser(null);
      setProfile(null);
      setIsDemoMode(false);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    loading,
    isDemoMode,
    signIn,
    signOut,
    isAuthenticated: !!user,
    role: profile?.role || null,
    isAdmin: profile?.role === 'super_admin',
    isDoctor: profile?.role === 'doctor' || profile?.role === 'super_admin',
    isReceptionist: profile?.role === 'receptionist',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route wrapper
export function RequireAuth({ children, allowedRoles }) {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-(--color-bg-primary)">
        <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Will be handled by router redirect
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-(--color-bg-primary)">
        <div className="card p-8 text-center max-w-md animate-fade-in">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-(--color-text-secondary)">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
