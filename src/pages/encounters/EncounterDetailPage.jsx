import { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import db from '../../lib/store';
import {
  ArrowLeft,
  Heart,
  Thermometer,
  Activity,
  ClipboardList,
  FlaskConical,
  Stethoscope,
  Pill,
  Clock,
  User,
  AlertTriangle,
  AlertCircle,
  FileText,
  Printer,
  Edit,
} from 'lucide-react';
import '../../styles/print.css';

export default function EncounterDetailPage() {
  const { encounterId } = useParams();
  const navigate = useNavigate();

  const encounter = useMemo(() => {
    return db.findById('encounters', encounterId);
  }, [encounterId]);

  const patient = useMemo(() => {
    if (!encounter) return null;
    return db.findById('patients', encounter.patient_id);
  }, [encounter]);

  // Clean up print classes
  useEffect(() => {
    return () => {
      document.body.classList.remove('print-mode-rx');
    };
  }, []);

  if (!encounter) {
    return (
      <div className="animate-fade-in">
        <button className="btn-ghost mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="card p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-(--color-accent-warning) mb-4" />
          <h3 className="text-lg font-semibold">Encounter not found</h3>
        </div>
      </div>
    );
  }

  const date = new Date(encounter.created_at);
  const formattedDate = date.toLocaleDateString('en-PK', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  function handlePrintRx() {
    navigate(`/dashboard/prescriptions/${encounterId}`);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-(--color-accent-success)" />
              Encounter Details
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-(--color-text-secondary)">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {encounter.patient_name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formattedDate}
                {' at '}
                {date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => navigate(`/dashboard/encounters/edit/${encounterId}`)}>
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button className="btn-primary" onClick={handlePrintRx}>
            <Printer className="w-4 h-4" /> Print Encounter
          </button>
        </div>
      </div>



      {/* Screen Layout */}
      {encounter.vitals && Object.values(encounter.vitals).some(Boolean) && (
        <Section title="Vitals" icon={Heart} color="#ef4444">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <VitalCard label="Blood Pressure" value={encounter.vitals.bp} unit="mmHg" />
            <VitalCard label="Pulse" value={encounter.vitals.pulse} unit="bpm" />
            <VitalCard label="Temperature" value={encounter.vitals.temperature} unit="°F" />
            <VitalCard label="Weight" value={encounter.vitals.weight} unit="kg" />
            <VitalCard label="Resp Rate" value={encounter.vitals.respiratory_rate} unit="/min" />
            <VitalCard label="SpO₂" value={encounter.vitals.spo2} unit="%" />
          </div>
        </Section>
      )}

      {(encounter.complaints || encounter.symptoms?.length > 0) && (
        <Section title="Complaints & Symptoms" icon={Activity} color="#f59e0b">
          {encounter.symptoms?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {encounter.symptoms.map((s, i) => <span key={i} className="badge badge-warning">{s}</span>)}
            </div>
          )}
          {encounter.complaints && <p className="text-sm text-(--color-text-secondary) whitespace-pre-wrap">{encounter.complaints}</p>}
        </Section>
      )}

      {(encounter.past_medical || encounter.past_surgical || encounter.family_history || encounter.drug_allergies) && (
        <Section title="Medical History" icon={ClipboardList} color="#06b6d4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {encounter.past_medical && <HistoryItem label="Past Medical" text={encounter.past_medical} />}
            {encounter.past_surgical && <HistoryItem label="Past Surgical" text={encounter.past_surgical} />}
            {encounter.family_history && <HistoryItem label="Family History" text={encounter.family_history} />}
            {encounter.drug_allergies && (
              <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="text-xs font-semibold text-(--color-accent-danger) flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3 h-3" /> Drug Allergies
                </div>
                <p className="text-sm text-(--color-text-secondary)">{encounter.drug_allergies}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {(encounter.lab_tests?.length > 0 || encounter.xray_notes || encounter.investigation_notes) && (
        <Section title="Investigations" icon={FlaskConical} color="#8b5cf6">
          {encounter.lab_tests?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {encounter.lab_tests.map((t, i) => <span key={i} className="badge badge-info">{t}</span>)}
            </div>
          )}
          {encounter.xray_notes && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-(--color-text-muted)">X-Ray / Imaging Advised:</span>
              <p className="text-sm text-(--color-text-secondary) mt-1">{encounter.xray_notes}</p>
            </div>
          )}
          {encounter.investigation_notes && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border-l-4 border-green-500">
              <span className="text-xs font-semibold text-green-700">Lab Results / Notes:</span>
              <p className="text-sm text-(--color-text-secondary) mt-1">{encounter.investigation_notes}</p>
            </div>
          )}
        </Section>
      )}

      {encounter.diagnoses?.length > 0 && (
        <Section title="Diagnosis" icon={Stethoscope} color="#10b981">
          <div className="space-y-2">
            {encounter.diagnoses.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-bg-input)' }}>
                <span className="badge badge-success font-mono">{d.code}</span>
                <span className="text-sm">{d.description}</span>
              </div>
            ))}
          </div>
          {encounter.clinical_notes && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--color-bg-input)', borderLeft: '3px solid var(--color-accent-info)' }}>
              <div className="text-xs font-semibold text-(--color-text-muted) flex items-center gap-1 mb-1">
                <FileText className="w-3 h-3" /> Clinical Notes (Private)
              </div>
              <p className="text-sm text-(--color-text-secondary) whitespace-pre-wrap">{encounter.clinical_notes}</p>
            </div>
          )}
        </Section>
      )}

      {encounter.prescriptions?.length > 0 && (
        <Section title="Prescription" icon={Pill} color="#3b82f6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-(--color-text-muted) uppercase">#</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-(--color-text-muted) uppercase">Medicine</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-(--color-text-muted) uppercase">Dosage</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-(--color-text-muted) uppercase">Frequency</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-(--color-text-muted) uppercase">Duration</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-(--color-text-muted) uppercase">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {encounter.prescriptions.map((rx, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td className="px-3 py-3 text-sm text-(--color-text-muted)">{i + 1}</td>
                    <td className="px-3 py-3 text-sm font-medium">{rx.medicine_name}</td>
                    <td className="px-3 py-3 text-sm text-(--color-text-secondary)">{rx.dosage}</td>
                    <td className="px-3 py-3 text-sm text-(--color-text-secondary)">{rx.frequency}</td>
                    <td className="px-3 py-3 text-sm text-(--color-text-secondary)">{rx.duration}</td>
                    <td className="px-3 py-3 text-sm text-(--color-text-secondary)">{rx.instructions || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, color, children }) {
  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" style={{ color }} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function VitalCard({ label, value, unit }) {
  if (!value) return null;
  return (
    <div className="p-3 rounded-lg text-center" style={{ background: 'var(--color-bg-input)' }}>
      <div className="text-lg font-bold text-(--color-text-primary)">
        {value}
        <span className="text-xs font-normal text-(--color-text-muted) ml-1">{unit}</span>
      </div>
      <div className="text-[0.65rem] text-(--color-text-muted) uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function HistoryItem({ label, text }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-input)' }}>
      <div className="text-xs font-semibold text-(--color-text-muted) mb-1">{label}</div>
      <p className="text-sm text-(--color-text-secondary)">{text}</p>
    </div>
  );
}
