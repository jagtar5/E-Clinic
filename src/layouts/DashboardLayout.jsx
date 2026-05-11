import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  Heart,
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  Database,
  CalendarClock,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  Bell,
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'doctor', 'receptionist'],
    end: true,
  },
  {
    label: 'Patients',
    path: '/dashboard/patients',
    icon: Users,
    roles: ['super_admin', 'doctor', 'receptionist'],
  },
  {
    label: 'Encounters',
    path: '/dashboard/encounters',
    icon: Stethoscope,
    roles: ['super_admin', 'doctor'],
  },
  {
    label: 'Prescriptions',
    path: '/dashboard/prescriptions',
    icon: FileText,
    roles: ['super_admin', 'doctor'],
  },
  {
    label: 'Appointments',
    path: '/dashboard/appointments',
    icon: CalendarClock,
    roles: ['super_admin', 'doctor', 'receptionist'],
  },
  {
    label: 'Billing',
    path: '/dashboard/billing',
    icon: Receipt,
    roles: ['super_admin', 'doctor'],
  },
  {
    label: 'Master Data',
    path: '/dashboard/master-data',
    icon: Database,
    roles: ['super_admin', 'doctor'],
  },
  {
    label: 'Analytics',
    path: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['super_admin', 'doctor'],
  },
];

export default function DashboardLayout() {
  const { profile, signOut, isDemoMode, role } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const roleLabel = {
    super_admin: 'Super Admin',
    doctor: 'Doctor',
    receptionist: 'Receptionist',
  };

  const roleColor = {
    super_admin: '#8b5cf6',
    doctor: '#3b82f6',
    receptionist: '#10b981',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-(--color-bg-primary)">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 lg:static inset-y-0 left-0 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'}`}
        style={{
          background: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border-default)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 h-16 px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border-default)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
          >
            <Heart className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in">
              <h1 className="text-base font-bold text-(--color-text-primary) leading-tight">E-Clinic</h1>
              <p className="text-[0.65rem] text-(--color-text-muted) leading-tight">Management System</p>
            </div>
          )}
          <button
            className="ml-auto lg:hidden btn-ghost p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'text-white'
                      : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))', border: '1px solid rgba(59,130,246,0.3)' }
                    : { border: '1px solid transparent' }
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block px-3 py-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="btn-ghost w-full justify-center"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`}
            />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border-default)' }}>
          <div
            className={`flex items-center gap-3 p-2.5 rounded-xl ${sidebarCollapsed ? 'justify-center' : ''}`}
            style={{ background: 'var(--color-bg-card)' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{
                background: `${roleColor[role]}20`,
                color: roleColor[role],
              }}
            >
              {profile?.full_name?.charAt(0) || '?'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <div className="text-sm font-medium text-(--color-text-primary) truncate">
                  {profile?.full_name}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="badge text-[0.625rem]"
                    style={{
                      background: `${roleColor[role]}15`,
                      color: roleColor[role],
                    }}
                  >
                    {roleLabel[role]}
                  </span>
                  {isDemoMode && (
                    <span className="badge badge-warning text-[0.625rem]">Demo</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className={`btn-ghost w-full mt-2 text-xs text-(--color-text-muted) hover:text-(--color-accent-danger) ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header
          className="flex items-center h-16 px-4 lg:px-6 flex-shrink-0 gap-4 z-10 glass-strong relative"
        >
          <button
            className="btn-ghost p-2 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <button className="btn-ghost p-2 relative" title="Notifications">
            <Bell className="w-5 h-5" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: 'var(--color-accent-danger)' }}
            />
          </button>

          <button className="btn-ghost p-2" title="Settings">
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
