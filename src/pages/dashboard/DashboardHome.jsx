import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import db from '../../lib/store';
import {
  Users,
  Stethoscope,
  CalendarClock,
  TrendingUp,
  Clock,
  UserPlus,
  Activity,
  ArrowUpRight,
  Plus,
} from 'lucide-react';

export default function DashboardHome() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  const greeting = getGreeting();
  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  // Real stats from store
  const stats = useMemo(() => {
    const totalPatients = db.count('patients');
    const totalEncounters = db.count('encounters');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allEncounters = db.select('encounters', { sortBy: 'created_at', sortOrder: 'desc' }).data;
    const todayEncounters = allEncounters.filter(
      (e) => new Date(e.created_at) >= todayStart
    ).length;

    return [
      {
        label: 'Total Patients',
        value: totalPatients.toLocaleString(),
        change: `${totalPatients} registered`,
        icon: Users,
        color: '#3b82f6',
      },
      {
        label: 'Total Encounters',
        value: totalEncounters.toLocaleString(),
        change: `${todayEncounters} today`,
        icon: Stethoscope,
        color: '#10b981',
      },
      {
        label: "Today's Visits",
        value: todayEncounters.toString(),
        change: 'So far today',
        icon: CalendarClock,
        color: '#06b6d4',
      },
      {
        label: 'Revenue (Month)',
        value: 'Rs. —',
        change: 'Coming in Phase 6',
        icon: TrendingUp,
        color: '#8b5cf6',
      },
    ];
  }, []);

  // Recent encounters
  const recentEncounters = useMemo(() => {
    return db.select('encounters', {
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit: 5,
    }).data;
  }, []);

  // Recent patients
  const recentPatients = useMemo(() => {
    return db.select('patients', {
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit: 5,
    }).data;
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="text-(--color-text-secondary) mt-1">
            Here&apos;s what&apos;s happening at your clinic today
          </p>
        </div>
        <div className="flex gap-3">
          {(role === 'super_admin' || role === 'doctor' || role === 'receptionist') && (
            <button className="btn-primary" onClick={() => navigate('/dashboard/patients')}>
              <UserPlus className="w-4 h-4" />
              Patients
            </button>
          )}
          {(role === 'super_admin' || role === 'doctor') && (
            <button className="btn-secondary" onClick={() => navigate('/dashboard/encounters/new')}>
              <Plus className="w-4 h-4" />
              New Encounter
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="card p-5 animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-(--color-text-muted)">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-(--color-text-primary)">{stat.value}</div>
              <div className="text-sm text-(--color-text-muted) mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Encounters */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-(--color-accent-primary)" />
              Recent Encounters
            </h2>
            <button
              className="btn-ghost text-xs"
              onClick={() => navigate('/dashboard/encounters')}
            >
              View All
            </button>
          </div>

          {recentEncounters.length === 0 ? (
            <div className="p-8 text-center text-(--color-text-muted) text-sm">
              No encounters yet. Start a new encounter to see activity here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Patient</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Diagnosis</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Time</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Rx</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEncounters.map((enc, i) => (
                    <tr
                      key={enc.id}
                      className="transition-colors hover:bg-(--color-bg-hover) cursor-pointer"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                      onClick={() => navigate(`/dashboard/encounters/${enc.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-sm">{enc.patient_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {enc.diagnoses?.length > 0 ? (
                          <span className="badge badge-info text-[0.625rem]">
                            {enc.diagnoses[0].code}
                          </span>
                        ) : (
                          <span className="text-xs text-(--color-text-muted)">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-(--color-text-muted)">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {timeAgo(enc.created_at)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {enc.prescriptions?.length > 0 ? (
                          <span className="badge badge-success text-[0.625rem]">
                            {enc.prescriptions.length}
                          </span>
                        ) : (
                          <span className="text-xs text-(--color-text-muted)">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Patients */}
        <div className="card p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-(--color-accent-secondary)" />
            Recent Patients
          </h2>
          <div className="space-y-3">
            {recentPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-(--color-bg-hover) cursor-pointer"
                style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-subtle)' }}
                onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: patient.gender === 'Female' ? 'rgba(236,72,153,0.15)' : 'rgba(59,130,246,0.15)',
                    color: patient.gender === 'Female' ? '#ec4899' : '#3b82f6',
                  }}
                >
                  {patient.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{patient.full_name}</div>
                  <div className="text-xs text-(--color-text-muted)">{patient.age}y / {patient.gender}</div>
                </div>
                <ChevronRightIcon />
              </div>
            ))}
          </div>
          <button
            className="btn-secondary w-full mt-4 justify-center text-xs"
            onClick={() => navigate('/dashboard/patients')}
          >
            View All Patients
          </button>
        </div>
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-(--color-text-muted)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
