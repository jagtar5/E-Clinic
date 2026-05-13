import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import db from '../../lib/store';
import {
  ArrowLeft,
  Printer,
  Eye,
  EyeOff,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import '../../styles/print.css';

const SECTION_TOGGLES = [
  { key: 'header', label: 'Clinic Header' },
  { key: 'patient', label: 'Patient Info' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'investigations', label: 'Investigations' },
  { key: 'prescription', label: 'Prescription (Rx)' },
  { key: 'notes', label: 'Clinical Notes' },
  { key: 'footer', label: 'Footer / Signature' },
];

export default function PrescriptionsPage() {
  const { encounterId } = useParams();
  const navigate = useNavigate();

  const [sections, setSections] = useState({
    header: true,
    patient: true,
    vitals: true,
    complaints: true,
    diagnosis: true,
    investigations: false,
    prescription: true,
    notes: false,
    footer: true,
  });

  const encounter = useMemo(() => {
    if (!encounterId) return null;
    return db.findById('encounters', encounterId);
  }, [encounterId]);

  const patient = useMemo(() => {
    if (!encounter) return null;
    return db.findById('patients', encounter.patient_id);
  }, [encounter]);

  // If no encounter ID, show list of recent encounters to pick from
  if (!encounterId) {
    return <PrescriptionsList navigate={navigate} />;
  }

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

  function toggleSection(key) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handlePrint() {
    window.print();
  }

  const date = new Date(encounter.created_at);
  const formattedDate = date.toLocaleDateString('en-PK', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="animate-fade-in">
      {/* Controls (hidden on print) */}
      <div className="no-print mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button className="btn-ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-7 h-7 text-(--color-accent-info)" />
              Prescription Preview
            </h1>
          </div>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        {/* Section Toggles */}
        <div className="card p-4">
          <p className="text-xs text-(--color-text-muted) uppercase tracking-wider font-semibold mb-3">
            Toggle sections to show/hide on print
          </p>
          <div className="flex flex-wrap gap-2">
            {SECTION_TOGGLES.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSection(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sections[s.key]
                    ? 'bg-(--color-accent-primary)/15 text-(--color-accent-primary) border border-(--color-accent-primary)/30'
                    : 'bg-(--color-bg-input) text-(--color-text-muted) border border-(--color-border-subtle)'
                }`}
              >
                {sections[s.key] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Prescription */}
      <div className="rx-page" id="prescription-print">
        {/* Header */}
        {sections.header && (
          <div className="rx-header">
            <div className="rx-header-left">
              <div className="rx-clinic-name">E-Clinic Medical Center</div>
              <div className="rx-clinic-detail">123 Medical Road, Islamabad, Pakistan</div>
              <div className="rx-clinic-detail">Phone: 051-1234567</div>
            </div>
            <div className="rx-header-right">
              <div className="rx-doctor-name">Dr. Ahmed Khan</div>
              <div className="rx-doctor-detail">MBBS, FCPS (Medicine)</div>
              <div className="rx-doctor-detail">PMC Reg: 12345-P</div>
            </div>
          </div>
        )}

        <div className="rx-divider"></div>

        {/* Patient Info */}
        {sections.patient && patient && (
          <div className="rx-patient-row">
            <div className="rx-patient-item">
              <span className="rx-label">Patient:</span> {patient.full_name}
            </div>
            <div className="rx-patient-item">
              <span className="rx-label">Age/Sex:</span> {patient.age}y / {patient.gender}
            </div>
            <div className="rx-patient-item">
              <span className="rx-label">Date:</span> {formattedDate}
            </div>
            {patient.contact && (
              <div className="rx-patient-item">
                <span className="rx-label">Phone:</span> {patient.contact}
              </div>
            )}
          </div>
        )}

        {/* Vitals */}
        {sections.vitals && encounter.vitals && Object.values(encounter.vitals).some(Boolean) && (
          <div className="rx-section">
            <div className="rx-vitals-row">
              {encounter.vitals.bp && <span>BP: <strong>{encounter.vitals.bp}</strong> mmHg</span>}
              {encounter.vitals.pulse && <span>Pulse: <strong>{encounter.vitals.pulse}</strong> bpm</span>}
              {encounter.vitals.temperature && <span>Temp: <strong>{encounter.vitals.temperature}</strong>°F</span>}
              {encounter.vitals.weight && <span>Weight: <strong>{encounter.vitals.weight}</strong> kg</span>}
              {encounter.vitals.spo2 && <span>SpO₂: <strong>{encounter.vitals.spo2}</strong>%</span>}
            </div>
          </div>
        )}

        {/* Complaints */}
        {sections.complaints && (encounter.complaints || encounter.symptoms?.length > 0) && (
          <div className="rx-section">
            <div className="rx-section-title">Complaints</div>
            {encounter.symptoms?.length > 0 && (
              <div className="rx-text">{encounter.symptoms.join(', ')}</div>
            )}
            {encounter.complaints && <div className="rx-text">{encounter.complaints}</div>}
          </div>
        )}

        {/* Diagnosis */}
        {sections.diagnosis && encounter.diagnoses?.length > 0 && (
          <div className="rx-section">
            <div className="rx-section-title">Diagnosis</div>
            {encounter.diagnoses.map((d, i) => (
              <div key={i} className="rx-text">
                <strong>{d.code}</strong> — {d.description}
              </div>
            ))}
          </div>
        )}

        {/* Investigations */}
        {sections.investigations && (encounter.lab_tests?.length > 0 || encounter.xray_notes) && (
          <div className="rx-section">
            <div className="rx-section-title">Investigations Advised</div>
            {encounter.lab_tests?.length > 0 && (
              <div className="rx-text">{encounter.lab_tests.join(', ')}</div>
            )}
            {encounter.xray_notes && <div className="rx-text">{encounter.xray_notes}</div>}
          </div>
        )}

        {/* Prescription */}
        {sections.prescription && encounter.prescriptions?.length > 0 && (
          <div className="rx-section rx-prescription-section">
            <div className="rx-section-title rx-rx-title">℞ Prescription</div>
            <table className="rx-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {encounter.prescriptions.map((rx, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="rx-medicine-name">{rx.medicine_name}</td>
                    <td>{rx.dosage}</td>
                    <td>{rx.frequency}</td>
                    <td>{rx.duration}</td>
                    <td>{rx.instructions || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Clinical Notes */}
        {sections.notes && encounter.clinical_notes && (
          <div className="rx-section">
            <div className="rx-section-title">Notes</div>
            <div className="rx-text">{encounter.clinical_notes}</div>
          </div>
        )}

        {/* Footer */}
        {sections.footer && (
          <div className="rx-footer">
            <div className="rx-footer-left">
              <div className="rx-follow-up">Follow-up: ____________</div>
            </div>
            <div className="rx-footer-right">
              <div className="rx-signature-line"></div>
              <div className="rx-signature-label">Dr. Ahmed Khan</div>
              <div className="rx-signature-sub">Signature & Stamp</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PrescriptionsList({ navigate }) {
  const encounters = useMemo(() => {
    return db.select('encounters', {
      sortBy: 'created_at',
      sortOrder: 'desc',
    }).data.filter((e) => e.prescriptions?.length > 0);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FileText className="w-7 h-7 text-(--color-accent-info)" />
          Prescriptions
        </h1>
        <p className="text-(--color-text-secondary) mt-1">Select an encounter to view/print its prescription</p>
      </div>

      {encounters.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-(--color-text-muted) mb-4" />
          <h3 className="text-lg font-semibold mb-2">No prescriptions yet</h3>
          <p className="text-(--color-text-secondary)">
            Create a clinical encounter with medicines to generate prescriptions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {encounters.map((enc) => (
            <div
              key={enc.id}
              className="card p-5 cursor-pointer group"
              onClick={() => navigate(`/dashboard/prescriptions/${enc.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{enc.patient_name}</div>
                    {enc.status === 'waiting_for_labs' && (
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        Waiting Labs
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-(--color-text-muted) mt-0.5">
                    {new Date(enc.created_at).toLocaleDateString('en-PK', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                    {' · '}
                    {enc.prescriptions.length} medicine{enc.prescriptions.length !== 1 ? 's' : ''}
                  </div>
                  {enc.diagnoses?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {enc.diagnoses.map((d, i) => (
                        <span key={i} className="badge badge-info text-[0.625rem]">{d.code}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Printer className="w-5 h-5 text-(--color-text-muted) group-hover:text-(--color-accent-primary) transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
