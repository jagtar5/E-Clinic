import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../../lib/store';
import PatientRegistrationModal from './PatientRegistrationModal';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  Droplets,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Filter,
} from 'lucide-react';

const PAGE_SIZE = 10;

export default function PatientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [page, setPage] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { patients, total } = useMemo(() => {
    const filters = {};
    if (genderFilter) filters.gender = genderFilter;
    const result = db.select('patients', {
      search,
      filters,
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
    return { patients: result.data, total: result.total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, genderFilter, page, refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleRegistered() {
    setShowRegister(false);
    setRefreshKey((k) => k + 1);
    setPage(0);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-(--color-accent-primary)" />
            Patients
          </h1>
          <p className="text-(--color-text-secondary) mt-1">
            {total} patient{total !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowRegister(true)}>
          <UserPlus className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
            <input
              className="input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by name, phone, ID, or address..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
            <select
              className="input appearance-none cursor-pointer"
              style={{ paddingLeft: '2.5rem', minWidth: '150px' }}
              value={genderFilter}
              onChange={(e) => { setGenderFilter(e.target.value); setPage(0); }}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient List */}
      {patients.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-(--color-text-muted) mb-4" />
          <h3 className="text-lg font-semibold mb-2">No patients found</h3>
          <p className="text-(--color-text-secondary)">
            {search ? 'Try a different search term' : 'Register your first patient to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((patient, i) => (
            <div
              key={patient.id}
              className="card p-5 cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    background: patient.gender === 'Female'
                      ? 'rgba(236, 72, 153, 0.15)'
                      : 'rgba(59, 130, 246, 0.15)',
                    color: patient.gender === 'Female' ? '#ec4899' : '#3b82f6',
                  }}
                >
                  {patient.full_name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-(--color-text-primary) truncate">
                      {patient.full_name}
                    </h3>
                    <span className="badge badge-primary text-[0.65rem] flex-shrink-0">
                      {patient.id.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-(--color-text-secondary)">
                    <span>{patient.age}y / {patient.gender}</span>
                    {patient.blood_group && (
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-(--color-accent-danger)" />
                        {patient.blood_group}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-(--color-text-muted)">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {patient.contact}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {patient.address}
                    </span>
                  </div>

                  {/* Chronic conditions */}
                  {patient.chronic_conditions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {patient.chronic_conditions.map((c) => (
                        <span key={c} className="badge badge-warning text-[0.625rem]">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-(--color-text-muted)">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost p-2"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`btn-ghost px-3 py-1.5 text-sm ${i === page ? 'bg-(--color-bg-hover) text-(--color-text-primary)' : ''}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="btn-ghost p-2"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegister && (
        <PatientRegistrationModal
          onClose={() => setShowRegister(false)}
          onRegistered={handleRegistered}
        />
      )}
    </div>
  );
}
