import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../../lib/store';
import {
  Stethoscope,
  Plus,
  Search,
  Clock,
  User,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export default function EncountersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [refreshKey] = useState(0);

  const encounters = useMemo(() => {
    const result = db.select('encounters', {
      search,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    return result.data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, refreshKey]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Stethoscope className="w-7 h-7 text-(--color-accent-success)" />
            Clinical Encounters
          </h1>
          <p className="text-(--color-text-secondary) mt-1">
            {encounters.length} encounter{encounters.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/dashboard/encounters/new')}>
          <Plus className="w-4 h-4" />
          New Encounter
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by patient name, complaint, or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Encounters List */}
      {encounters.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-(--color-text-muted) mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {search ? 'No encounters found' : 'No encounters yet'}
          </h3>
          <p className="text-(--color-text-secondary) mb-4">
            {search ? 'Try a different search term' : 'Start a new clinical encounter with a patient'}
          </p>
          {!search && (
            <button className="btn-primary" onClick={() => navigate('/dashboard/encounters/new')}>
              <Plus className="w-4 h-4" /> Start Encounter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {encounters.map((enc, i) => (
            <div
              key={enc.id}
              className="card p-5 cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => navigate(`/dashboard/encounters/${enc.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-(--color-text-muted)" />
                      <span className="font-semibold">{enc.patient_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
                      <Clock className="w-3 h-3" />
                      {new Date(enc.created_at).toLocaleDateString('en-PK', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                      {' · '}
                      {new Date(enc.created_at).toLocaleTimeString('en-PK', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Vitals summary */}
                  {enc.vitals && (
                    <div className="flex flex-wrap gap-3 text-xs text-(--color-text-secondary) mb-2">
                      {enc.vitals.bp && <span>BP: {enc.vitals.bp}</span>}
                      {enc.vitals.pulse && <span>Pulse: {enc.vitals.pulse}</span>}
                      {enc.vitals.temperature && <span>Temp: {enc.vitals.temperature}°F</span>}
                    </div>
                  )}

                  {/* Complaints */}
                  {enc.complaints && (
                    <p className="text-sm text-(--color-text-secondary) truncate max-w-2xl mb-2">
                      {enc.complaints}
                    </p>
                  )}

                  {/* Diagnoses */}
                  {enc.diagnoses?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {enc.diagnoses.map((d, j) => (
                        <span key={j} className="badge badge-info text-[0.625rem]">
                          {d.code} — {d.description}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Prescriptions count */}
                  {enc.prescriptions?.length > 0 && (
                    <div className="mt-2">
                      <span className="badge badge-success text-[0.625rem]">
                        {enc.prescriptions.length} medicine{enc.prescriptions.length !== 1 ? 's' : ''} prescribed
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-(--color-text-muted) group-hover:text-(--color-text-primary) transition-colors flex-shrink-0 ml-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
