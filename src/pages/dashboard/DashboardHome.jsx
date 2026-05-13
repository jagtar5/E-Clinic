import { useMemo, useState } from 'react';
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
  Printer,
  Trash2,
} from 'lucide-react';

export default function DashboardHome() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeleteEncounter = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this encounter?')) {
      db.delete('encounters', id);
      setRefreshKey(k => k + 1);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  const greeting = getGreeting();
  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  const [encounterFilter, setEncounterFilter] = useState('all');

  // Real data from store with refresh support
  const { stats, recentEncounters, recentPatients } = useMemo(() => {
    const totalPatients = db.count('patients');
    const allEncounters = db.select('encounters', { sortBy: 'created_at', sortOrder: 'desc' }).data;
    const totalEncounters = allEncounters.length;
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEncounters = allEncounters.filter(
      (e) => new Date(e.created_at) >= todayStart
    ).length;

    const filteredEncs = encounterFilter === 'all' 
      ? allEncounters 
      : allEncounters.filter(e => e.status === encounterFilter);

    return {
      stats: [
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
      ],
      recentEncounters: filteredEncs.slice(0, 10),
      recentPatients: db.select('patients', { sortBy: 'created_at', sortOrder: 'desc', limit: 10 }).data
    };
  }, [refreshKey, encounterFilter]);

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

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-min">

        {/* Featured Stat - Today's Visits (Bento Tile) */}
        <div className="card p-6 lg:col-span-2 bg-gradient-to-br from-blue-500 to-sky-400 text-black border-none shadow-blue-500/20 flex flex-col justify-between hover:shadow-blue-500/30">
          <div className="flex items-start justify-between mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <CalendarClock className="w-6 h-6 text-black" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">So far today</span>
          </div>
          <div>
            <div className="text-4xl font-black mb-1">{stats[2].value}</div>
            <div className="text-lg font-medium text-white/90">Today's Visits</div>
          </div>
        </div>

        {/* Small Stats */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-500">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">{stats[0].change}</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-(--color-text-primary)">{stats[0].value}</div>
            <div className="text-sm font-medium text-(--color-text-secondary)">Total Patients</div>
          </div>
        </div>

        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-500">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">{stats[1].change}</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-(--color-text-primary)">{stats[1].value}</div>
            <div className="text-sm font-medium text-(--color-text-secondary)">Total Encounters</div>
          </div>
        </div>

        {/* Recent Encounters - Spans 3 columns */}
        <div className="lg:col-span-3 card p-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 pb-3 border-b border-(--color-border-subtle) bg-(--color-bg-primary)/50">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-(--color-accent-primary)" />
                Recent Encounters
              </h2>
              <select 
                className="input-inline text-xs font-semibold bg-white border border-(--color-border-default) rounded-md px-2 py-1 ml-2"
                value={encounterFilter}
                onChange={(e) => setEncounterFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="waiting_for_labs">Waiting for Labs</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button className="btn-ghost text-xs" onClick={() => navigate('/dashboard/encounters')}>
              View All
            </button>
          </div>

          {recentEncounters.length === 0 ? (
            <div className="p-8 flex-1 flex items-center justify-center text-center text-(--color-text-muted) text-sm bg-(--color-bg-card)">
              No encounters yet. Start a new encounter to see activity here.
            </div>
          ) : (
            <div className="overflow-x-auto bg-(--color-bg-card)">
              <table className="w-full">
                <thead>
                  <tr className="bg-(--color-bg-primary)/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider">Patient</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider">Diagnosis</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider">Time</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider">Rx</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border-subtle)">
                  {recentEncounters.map((enc, i) => (
                    <tr
                      key={enc.id}
                      className="transition-colors hover:bg-(--color-bg-hover) cursor-pointer"
                      onClick={() => navigate(`/dashboard/encounters/${enc.id}`)}
                    >
                      <td className="px-5 py-3">
                        <span className="font-semibold text-sm text-(--color-text-primary)">{enc.patient_name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {enc.diagnoses?.length > 0 ? (
                            <span className="badge badge-info">{enc.diagnoses[0].code}</span>
                          ) : (
                            <span className="text-xs text-(--color-text-muted)">—</span>
                          )}
                          {enc.status === 'waiting_for_labs' && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              Waiting Labs
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-(--color-text-muted) font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {timeAgo(enc.created_at)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {enc.prescriptions?.length > 0 ? (
                          <span className="badge badge-success">{enc.prescriptions.length}</span>
                        ) : (
                          <span className="text-xs text-(--color-text-muted)">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn-ghost p-1.5 text-(--color-text-muted) hover:text-(--color-accent-danger)"
                            title="Delete Encounter"
                            onClick={(e) => handleDeleteEncounter(e, enc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Patients */}
        <div className="card p-5 lg:col-span-1 flex flex-col">
          <h2 className="text-base font-bold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-pink-500" />
            Recent Patients
          </h2>
          <div className="space-y-3 flex-1">
            {recentPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-(--color-bg-hover) hover:scale-[1.02] cursor-pointer border border-transparent hover:border-(--color-border-default)"
                onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: patient.gender === 'Female' ? '#fce7f3' : '#e0f2fe',
                    color: patient.gender === 'Female' ? '#db2777' : '#0284c7',
                  }}
                >
                  {patient.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-(--color-text-primary)">{patient.full_name}</div>
                  <div className="text-xs font-medium text-(--color-text-secondary)">{patient.age}y / {patient.gender}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="btn-secondary w-full mt-4 justify-center"
            onClick={() => navigate('/dashboard/patients')}
          >
            All Patients
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
