import { useState, useMemo, useCallback } from 'react';
import db from '../../lib/store';
import {
  CalendarClock,
  Plus,
  Clock,
  User,
  CheckCircle2,
  PlayCircle,
  XCircle,
  Trash2,
  Search,
} from 'lucide-react';

const STATUS_CONFIG = {
  waiting: { label: 'Waiting', color: '#f59e0b', icon: Clock, bg: 'rgba(245,158,11,0.12)' },
  in_progress: { label: 'In Progress', color: '#3b82f6', icon: PlayCircle, bg: 'rgba(59,130,246,0.12)' },
  completed: { label: 'Completed', color: '#10b981', icon: CheckCircle2, bg: 'rgba(16,185,129,0.12)' },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: XCircle, bg: 'rgba(239,68,68,0.12)' },
};

export default function AppointmentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [appointmentType, setAppointmentType] = useState('Consultation');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [searchPatient, setSearchPatient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const patients = useMemo(() => db.select('patients', { sortBy: 'full_name' }).data, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const appointments = useMemo(() => {
    const all = db.select('appointments', { sortBy: 'created_at', sortOrder: 'desc' }).data;
    let filtered = all;

    if (filterStatus) {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }
    if (searchPatient) {
      const q = searchPatient.toLowerCase();
      filtered = filtered.filter((a) => a.patient_name?.toLowerCase().includes(q));
    }

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, filterStatus, searchPatient]);

  const todayAppointments = useMemo(() => {
    return appointments.filter((a) => a.date === todayStr);
  }, [appointments, todayStr]);

  const queueStats = useMemo(() => {
    const today = todayAppointments;
    return {
      total: today.length,
      waiting: today.filter((a) => a.status === 'waiting').length,
      inProgress: today.filter((a) => a.status === 'in_progress').length,
      completed: today.filter((a) => a.status === 'completed').length,
    };
  }, [todayAppointments]);

  function handleAddAppointment() {
    if (!selectedPatient) return;
    const patient = patients.find((p) => p.id === selectedPatient);
    if (!patient) return;

    db.insert('appointments', {
      patient_id: patient.id,
      patient_name: patient.full_name,
      patient_contact: patient.contact,
      type: appointmentType,
      time: appointmentTime || 'Walk-in',
      date: todayStr,
      status: 'waiting',
      queue_number: queueStats.total + 1,
    });

    setShowAdd(false);
    setSelectedPatient('');
    setAppointmentTime('');
    refresh();
  }

  function updateStatus(id, status) {
    db.update('appointments', id, { status });
    refresh();
  }

  function deleteAppointment(id) {
    db.delete('appointments', id);
    refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <CalendarClock className="w-7 h-7 text-(--color-accent-secondary)" />
            Appointments & Queue
          </h1>
          <p className="text-(--color-text-secondary) mt-1">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add to Queue
        </button>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Today', value: queueStats.total, color: '#64748b' },
          { label: 'Waiting', value: queueStats.waiting, color: '#f59e0b' },
          { label: 'In Progress', value: queueStats.inProgress, color: '#3b82f6' },
          { label: 'Completed', value: queueStats.completed, color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 text-center">
            <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-(--color-text-muted) mt-1 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search patient..."
            value={searchPatient}
            onChange={(e) => setSearchPatient(e.target.value)}
          />
        </div>
        <select
          className="input appearance-none cursor-pointer"
          style={{ maxWidth: '180px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="waiting">Waiting</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Queue List */}
      {appointments.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarClock className="w-12 h-12 mx-auto text-(--color-text-muted) mb-4" />
          <h3 className="text-lg font-semibold mb-2">No appointments</h3>
          <p className="text-(--color-text-secondary)">Add patients to the queue to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, i) => {
            const statusConf = STATUS_CONFIG[apt.status] || STATUS_CONFIG.waiting;
            const StatusIcon = statusConf.icon;
            return (
              <div
                key={apt.id}
                className="card p-4 animate-slide-up"
                style={{ animationDelay: `${i * 0.02}s` }}
              >
                <div className="flex items-center gap-4">
                  {/* Queue Number */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: statusConf.bg, color: statusConf.color }}
                  >
                    #{apt.queue_number || i + 1}
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold truncate">{apt.patient_name}</span>
                      <span
                        className="badge text-[0.625rem]"
                        style={{ background: statusConf.bg, color: statusConf.color }}
                      >
                        <StatusIcon className="w-3 h-3 mr-0.5 inline" />
                        {statusConf.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-(--color-text-muted)">
                      <span>{apt.time}</span>
                      <span>{apt.type}</span>
                      {apt.patient_contact && <span>{apt.patient_contact}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {apt.status === 'waiting' && (
                      <button
                        className="btn-ghost text-xs text-(--color-accent-primary)"
                        onClick={() => updateStatus(apt.id, 'in_progress')}
                        title="Start"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    )}
                    {apt.status === 'in_progress' && (
                      <button
                        className="btn-ghost text-xs text-(--color-accent-success)"
                        onClick={() => updateStatus(apt.id, 'completed')}
                        title="Complete"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {(apt.status === 'waiting' || apt.status === 'in_progress') && (
                      <button
                        className="btn-ghost text-xs text-(--color-accent-warning)"
                        onClick={() => updateStatus(apt.id, 'cancelled')}
                        title="Cancel"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      className="btn-ghost text-xs text-(--color-text-muted) hover:text-(--color-accent-danger)"
                      onClick={() => deleteAppointment(apt.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Appointment Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowAdd(false)}
          />
          <div className="relative w-full max-w-md glass-strong rounded-2xl p-6 animate-scale-in">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-(--color-accent-secondary)" />
              Add to Queue
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Patient *</label>
                <select
                  className="input appearance-none cursor-pointer"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} — {p.contact}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    className="input appearance-none cursor-pointer"
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="New Patient">New Patient</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="label">Time</label>
                  <input
                    type="time"
                    className="input"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddAppointment} disabled={!selectedPatient}>
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
