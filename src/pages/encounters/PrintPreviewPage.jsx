import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import db from '../../lib/store';
import {
  ArrowLeft,
  Printer,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import '../../styles/print.css';

const DEFAULT_PRINT_SETTINGS = {
  header: true,
  patient: true,
  vitals: true,
  complaints: true,
  diagnosis: true,
  investigations: true,
  history: true,
  prescription: true,
  advice: true,
  notes: false,
  footer: true,
};

export default function PrintPreviewPage() {
  const { encounterId } = useParams();
  const navigate = useNavigate();

  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('eclinic_print_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure new keys (history, advice) are included
        return { ...DEFAULT_PRINT_SETTINGS, ...parsed };
      } catch (e) {
        return DEFAULT_PRINT_SETTINGS;
      }
    }
    return DEFAULT_PRINT_SETTINGS;
  });

  const encounter = useMemo(() => {
    if (!encounterId) return null;
    return db.findById('encounters', encounterId);
  }, [encounterId]);

  const patient = useMemo(() => {
    if (!encounter) return null;
    return db.findById('patients', encounter.patient_id);
  }, [encounter]);

  if (!encounterId) {
    navigate('/dashboard/encounters', { replace: true });
    return null;
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

  useEffect(() => {
    let timer;
    if (encounter && patient) {
      // Small delay to ensure styles and fonts are loaded before triggering print dialog
      timer = setTimeout(() => {
        window.print();
      }, 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [encounter, patient]);

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
              Encounter Print Preview
            </h1>
          </div>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print
          </button>
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

        {/* Medical History & Examination */}
        {sections.history && (encounter.past_medical || encounter.past_surgical || encounter.family_history || encounter.drug_allergies || encounter.examination_notes) && (
          <div className="rx-section">
            <div className="rx-section-title">History & Physical Examination</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {encounter.past_medical && <div className="rx-text"><strong>PMH:</strong> {encounter.past_medical}</div>}
              {encounter.past_surgical && <div className="rx-text"><strong>PSH:</strong> {encounter.past_surgical}</div>}
              {encounter.family_history && <div className="rx-text"><strong>FH:</strong> {encounter.family_history}</div>}
              {encounter.drug_allergies && <div className="rx-text" style={{color: '#ef4444'}}><strong>Allergies:</strong> {encounter.drug_allergies}</div>}
            </div>
            {encounter.examination_notes && (
              <div className="rx-text mt-1"><strong>Examination:</strong> {encounter.examination_notes}</div>
            )}
          </div>
        )}

        {/* Investigations */}
        {sections.investigations && (encounter.lab_tests?.length > 0 || encounter.xray_notes || Object.keys(encounter.lab_results || {}).length > 0) && (
          <div className="rx-section">
            <div className="rx-section-title">Investigations</div>
            
            {encounter.lab_results && Object.keys(encounter.lab_results).length > 0 ? (
              <div className="mb-3">
                <div className="rx-text font-semibold mb-1">Laboratory Results:</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {Object.entries(encounter.lab_results).map(([test, result]) => (
                    <div key={test} className="flex justify-between border-b border-(--color-border-subtle) pb-0.5">
                      <span className="text-(--color-text-secondary) text-[10px]">{test}</span>
                      <strong className="text-(--color-text-primary) text-[11px]">{result}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : encounter.lab_tests?.length > 0 ? (
              <div className="rx-text mb-2"><strong>Advised Tests:</strong> {encounter.lab_tests.join(', ')}</div>
            ) : null}

            {encounter.xray_notes && <div className="rx-text"><strong>Imaging / Radiology:</strong> {encounter.xray_notes}</div>}
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
                  <th>Qty/Day</th>
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
                    <td>{rx.quantity || '—'}</td>
                    <td>{rx.duration}</td>
                    <td>{rx.instructions || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Advice & Follow-up */}
        {sections.advice && encounter.advice && (
          <div className="rx-section">
            <div className="rx-section-title">Advice & Follow-up</div>
            <div className="rx-text whitespace-pre-wrap">{encounter.advice}</div>
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

