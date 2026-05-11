import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import db from '../../lib/store';
import PatientRegistrationModal from './PatientRegistrationModal';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Droplets,
  Calendar,
  Edit3,
  Trash2,
  Stethoscope,
  Plus,
  Clock,
  AlertTriangle,
  User,
  Heart,
  ShieldAlert,
} from 'lucide-react';

export default function PatientProfilePage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const patient = useMemo(() => {
    return db.findById('patients', patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, refreshKey]);

  const encounters = useMemo(() => {
    if (!patient) return [];
    const result = db.select('encounters', {
      filters: { patient_id: patientId },
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    return result.data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, refreshKey]);

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <button className="btn-ghost mb-4" onClick={() => navigate('/dashboard/patients')}>
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </button>
        <div className="card p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-(--color-accent-warning) mb-4" />
          <h3 className="text-lg font-semibold">Patient not found</h3>
        </div>
      </div>
    );
  }

  function handleDelete() {
    db.delete('patients', patientId);
    navigate('/dashboard/patients');
  }

  function handleEdited() {
    setShowEdit(false);
    setRefreshKey((k) => k + 1);
  }

  const registeredDate = new Date(patient.created_at).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <button className="btn-ghost" onClick={() => navigate('/dashboard/patients')}>
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </button>

      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
            style={{
              background: patient.gender === 'Female'
                ? 'rgba(236, 72, 153, 0.15)'
                : 'rgba(59, 130, 246, 0.15)',
              color: patient.gender === 'Female' ? '#ec4899' : '#3b82f6',
            }}
          >
            {patient.full_name.charAt(0)}
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{patient.full_name}</h1>
              <span className="badge badge-primary">{patient.id.toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <InfoItem icon={User} label="Age / Gender" value={`${patient.age} years / ${patient.gender}`} />
              <InfoItem icon={Phone} label="Phone" value={patient.contact} />
              <InfoItem icon={Droplets} label="Blood Group" value={patient.blood_group || '—'} color="#ef4444" />
              <InfoItem icon={Calendar} label="Registered" value={registeredDate} />
            </div>

            {patient.address && (
              <div className="flex items-start gap-2 mt-3 text-sm text-(--color-text-secondary)">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-(--color-text-muted)" />
                {patient.address}
              </div>
            )}

            {patient.emergency_contact && (
              <div className="flex items-center gap-2 mt-2 text-sm text-(--color-text-secondary)">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-(--color-accent-warning)" />
                Emergency: {patient.emergency_contact}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="btn-secondary" onClick={() => setShowEdit(true)}>
              <Edit3 className="w-4 h-4" /> Edit
            </button>
            <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chronic Conditions */}
        {patient.chronic_conditions?.length > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border-default)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-(--color-accent-danger)" />
              <span className="text-sm font-medium text-(--color-text-secondary)">Chronic Conditions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient.chronic_conditions.map((c) => (
                <span key={c} className="badge badge-warning">{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          className="btn-primary"
          onClick={() => navigate(`/dashboard/encounters/new?patient=${patientId}`)}
        >
          <Plus className="w-4 h-4" /> New Encounter
        </button>
      </div>

      {/* Visit History */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-(--color-accent-success)" />
            Visit History
            <span className="badge badge-primary ml-1">{encounters.length}</span>
          </h2>
        </div>

        {encounters.length === 0 ? (
          <div className="p-8 text-center text-(--color-text-muted)">
            No visits recorded yet
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {encounters.map((enc) => (
              <div
                key={enc.id}
                className="p-4 px-5 hover:bg-(--color-bg-hover) transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/encounters/${enc.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-(--color-text-muted)" />
                      <span className="text-sm font-medium">
                        {new Date(enc.created_at).toLocaleDateString('en-PK', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-(--color-text-muted)">
                        {new Date(enc.created_at).toLocaleTimeString('en-PK', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {enc.complaints && (
                      <p className="text-sm text-(--color-text-secondary) truncate max-w-lg">
                        {enc.complaints}
                      </p>
                    )}
                    {enc.diagnoses?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {enc.diagnoses.map((d, i) => (
                          <span key={i} className="badge badge-info text-[0.625rem]">
                            {d.code} — {d.description}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <PatientRegistrationModal
          editPatient={patient}
          onClose={() => setShowEdit(false)}
          onRegistered={handleEdited}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative glass-strong rounded-2xl p-6 max-w-sm w-full animate-scale-in">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.15)' }}>
                <Trash2 className="w-6 h-6 text-(--color-accent-danger)" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Delete Patient?</h3>
              <p className="text-sm text-(--color-text-secondary) mb-6">
                This will permanently delete <strong>{patient.full_name}</strong> and all their records.
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ background: 'var(--color-bg-input)' }}>
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: color || 'var(--color-text-muted)' }} />
      <div>
        <div className="text-[0.65rem] text-(--color-text-muted) uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
