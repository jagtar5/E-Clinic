import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import db from '../../lib/store';
import { useMasterData } from '../../hooks/useMasterData';
import SearchableCombobox from '../../components/SearchableCombobox';
import {
  ArrowLeft,
  Save,
  Heart,
  Thermometer,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Pill,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  User,
  Search,
  Printer,
} from 'lucide-react';
import '../../styles/print.css';

const INITIAL_FORM = {
  patient_id: null,
  patient_name: '',
  patient_contact: '',
  patient_gender: '',
  patient_age: '',
  pulse: '',
  bp_systolic: '',
  bp_diastolic: '',
  temperature: '',
  weight: '',
  respiratory_rate: '',
  spo2: '',
  complaints: '',
  selected_symptoms: [],
  past_medical: '',
  past_surgical: '',
  family_history: '',
  drug_allergies: '',
  selected_lab_tests: [],
  xray_notes: '',
  investigation_notes: '',
  selected_diagnoses: [],
  clinical_notes: '',
  prescriptions: [],
};

export default function NewEncounterPage() {
  const navigate = useNavigate();
  const { encounterId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get('patient');

  const { medicines, symptoms, diagnoses, labTests } = useMasterData();

  const [form, setForm] = useState(INITIAL_FORM);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const [patientQuery, setPatientQuery] = useState('');
  const [showPatientSuggest, setShowPatientSuggest] = useState(false);
  const suggestRef = useRef(null);

  const patients = useMemo(() => {
    return db.select('patients', { sortBy: 'full_name' }).data;
  }, []);

  const filteredPatients = useMemo(() => {
    if (!patientQuery) return [];
    const q = patientQuery.toLowerCase();
    // Searches by both name OR contact number
    return patients.filter((p) => 
      p.full_name.toLowerCase().includes(q) || (p.contact && p.contact.toLowerCase().includes(q))
    );
  }, [patientQuery, patients]);

  // Clean up print classes on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('print-mode-rx');
      document.body.classList.remove('print-mode-lab');
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setShowPatientSuggest(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (encounterId) {
      const existing = db.findById('encounters', encounterId);
      if (existing) {
        const p = db.findById('patients', existing.patient_id);
        const [sys, dia] = (existing.vitals?.bp || '').split('/');
        
        setForm({
          patient_id: existing.patient_id,
          patient_name: existing.patient_name || '',
          patient_contact: p?.contact || '',
          patient_gender: p?.gender || '',
          patient_age: p?.age || '',
          pulse: existing.vitals?.pulse || '',
          bp_systolic: sys || '',
          bp_diastolic: dia || '',
          temperature: existing.vitals?.temperature || '',
          weight: existing.vitals?.weight || '',
          respiratory_rate: existing.vitals?.respiratory_rate || '',
          spo2: existing.vitals?.spo2 || '',
          complaints: existing.complaints || '',
          selected_symptoms: existing.symptoms ? existing.symptoms.map(s => symptoms.find(x => x.name === s) || { name: s }) : [],
          past_medical: existing.past_medical || '',
          past_surgical: existing.past_surgical || '',
          family_history: existing.family_history || '',
          drug_allergies: existing.drug_allergies || '',
          selected_lab_tests: existing.lab_tests ? existing.lab_tests.map(l => labTests.find(x => x.name === l) || { name: l }) : [],
          xray_notes: existing.xray_notes || '',
          investigation_notes: existing.investigation_notes || '',
          selected_diagnoses: existing.diagnoses || [],
          clinical_notes: existing.clinical_notes || '',
          prescriptions: existing.prescriptions ? existing.prescriptions.map(p => ({
            medicine: medicines.find(m => m.id === p.medicine_id) || { id: p.medicine_id, name: p.medicine_name },
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration,
            instructions: p.instructions,
          })) : [],
        });
        setPatientQuery(existing.patient_name);
      }
    } else if (preselectedPatient) {
      const p = db.findById('patients', preselectedPatient);
      if (p) {
        handleSelectExistingPatient(p);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId, preselectedPatient]);

  function handleSelectExistingPatient(p) {
    setPatientQuery(p.full_name);
    setForm((prev) => ({
      ...prev,
      patient_id: p.id,
      patient_name: p.full_name,
      patient_contact: p.contact || '',
      patient_gender: p.gender || '',
      patient_age: p.age || '',
    }));
    setShowPatientSuggest(false);
  }

  function handlePatientNameChange(e) {
    const val = e.target.value;
    setPatientQuery(val);
    setForm((prev) => ({ ...prev, patient_name: val, patient_id: null }));
    setShowPatientSuggest(true);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  }

  function addPrescription() {
    setForm((prev) => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { medicine: null, dosage: '', frequency: '', duration: '', instructions: '' }],
    }));
  }

  function updatePrescription(index, key, value) {
    setForm((prev) => {
      const updated = [...prev.prescriptions];
      updated[index] = { ...updated[index], [key]: value };
      if (key === 'medicine' && value) {
        if (!updated[index].dosage) updated[index].dosage = value.default_dosage || '';
        if (!updated[index].frequency) updated[index].frequency = value.default_frequency || '';
        if (!updated[index].duration) updated[index].duration = value.default_duration || '';
      }
      return { ...prev, prescriptions: updated };
    });
  }

  function removePrescription(index) {
    setForm((prev) => ({ ...prev, prescriptions: prev.prescriptions.filter((_, i) => i !== index) }));
  }

  function handleSave(skipRedirect = false) {
    const newErrors = {};
    if (!form.patient_name.trim()) newErrors.patient_name = 'Name is required';
    if (!form.patient_contact.trim()) newErrors.patient_contact = 'Contact is required';
    if (!form.patient_gender) newErrors.patient_gender = 'Gender is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false; // Return false if save failed
    }

    let finalPatientId = form.patient_id;

    if (!finalPatientId) {
      const newPatient = db.insert('patients', {
        full_name: form.patient_name.trim(),
        contact: form.patient_contact.trim(),
        gender: form.patient_gender,
        age: form.patient_age || 0,
      });
      finalPatientId = newPatient.id;
      setForm(prev => ({...prev, patient_id: finalPatientId}));
    } else {
      db.update('patients', finalPatientId, {
        full_name: form.patient_name.trim(),
        contact: form.patient_contact.trim(),
        gender: form.patient_gender,
        age: form.patient_age || 0,
      });
    }

    const encounter = {
      patient_id: finalPatientId,
      patient_name: form.patient_name.trim(),
      doctor_id: 'demo-doctor-001',
      vitals: {
        pulse: form.pulse,
        bp: form.bp_systolic && form.bp_diastolic ? `${form.bp_systolic}/${form.bp_diastolic}` : '',
        temperature: form.temperature,
        weight: form.weight,
        respiratory_rate: form.respiratory_rate,
        spo2: form.spo2,
      },
      complaints: form.complaints,
      symptoms: form.selected_symptoms.map((s) => s.name),
      past_medical: form.past_medical,
      past_surgical: form.past_surgical,
      family_history: form.family_history,
      drug_allergies: form.drug_allergies,
      lab_tests: form.selected_lab_tests.map((t) => t.name),
      xray_notes: form.xray_notes,
      investigation_notes: form.investigation_notes,
      diagnoses: form.selected_diagnoses.map((d) => ({ code: d.code, description: d.description })),
      clinical_notes: form.clinical_notes,
      prescriptions: form.prescriptions
        .filter((p) => p.medicine)
        .map((p) => ({
          medicine_id: p.medicine.id,
          medicine_name: p.medicine.name,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          instructions: p.instructions,
        })),
    };

    let finalEncounterId = encounterId;
    if (encounterId) {
      db.update('encounters', encounterId, encounter);
    } else {
      const savedEncounter = db.insert('encounters', encounter);
      finalEncounterId = savedEncounter.id;
    }
    
    if (!skipRedirect) {
      setSaved(true);
      setTimeout(() => navigate(`/dashboard/patients/${finalPatientId}`), 1000);
    }
    return finalEncounterId;
  }

  function handlePrintRx() {
    const savedId = handleSave(true);
    if (savedId) {
      navigate(`/dashboard/prescriptions/${savedId}`);
    }
  }

  function handlePrintLab() {
    document.body.classList.remove('print-mode-rx');
    document.body.classList.add('print-mode-lab');
    window.print();
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-scale-in">
        <div className="card p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <Check className="w-8 h-8 text-(--color-accent-success)" />
          </div>
          <h2 className="text-xl font-bold mb-2">Encounter Saved!</h2>
          <p className="text-(--color-text-secondary)">Redirecting...</p>
        </div>
      </div>
    );
  }

  const validPrescriptions = form.prescriptions.filter(p => p.medicine);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20 relative">
      {/* Print Layouts (Hidden on screen) */}
      
      {/* Rx Print Layout */}
      <div className="rx-page hidden" id="prescription-print">
        <div className="rx-header">
          <div className="rx-header-left">
            <div className="rx-clinic-name">E-Clinic Medical Center</div>
            <div className="rx-clinic-detail">123 Medical Road, Islamabad | Ph: 051-1234567</div>
          </div>
          <div className="rx-header-right">
            <div className="rx-doctor-name">Dr. Ahmed Khan</div>
            <div className="rx-doctor-detail">MBBS, FCPS (Medicine)</div>
          </div>
        </div>
        <div className="rx-divider"></div>
        <div className="rx-patient-row">
          <div className="rx-patient-item"><span className="rx-label">Patient:</span> {form.patient_name || 'N/A'}</div>
          <div className="rx-patient-item"><span className="rx-label">Age/Sex:</span> {form.patient_age || '-'}y / {form.patient_gender || 'N/A'}</div>
          <div className="rx-patient-item"><span className="rx-label">Date:</span> {new Date().toLocaleDateString('en-PK')}</div>
        </div>

        {form.drug_allergies && (
          <div className="rx-patient-row" style={{ color: '#ef4444', fontWeight: 'bold' }}>
            ALLERGIES: {form.drug_allergies}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', height: '100%' }}>
          {/* Left Column (Vitals & Clinical) */}
          <div style={{ width: '30%', borderRight: '1px solid #ddd', paddingRight: '16px' }}>
            {(form.bp_systolic || form.pulse || form.temperature || form.weight) && (
              <div className="rx-section">
                <div className="rx-section-title">Vitals</div>
                {form.bp_systolic && form.bp_diastolic && <div className="rx-vitals-row">BP: <strong>{form.bp_systolic}/{form.bp_diastolic}</strong> mmHg</div>}
                {form.pulse && <div className="rx-vitals-row">Pulse: <strong>{form.pulse}</strong> bpm</div>}
                {form.temperature && <div className="rx-vitals-row">Temp: <strong>{form.temperature}</strong> °F</div>}
                {form.weight && <div className="rx-vitals-row">Wt: <strong>{form.weight}</strong> kg</div>}
              </div>
            )}
            
            {(form.complaints || form.selected_symptoms.length > 0) && (
              <div className="rx-section">
                <div className="rx-section-title">Complaints</div>
                <div className="rx-text">
                  {form.selected_symptoms.map(s => s.name).join(', ')}
                  {form.complaints && <div style={{marginTop: '4px'}}>{form.complaints}</div>}
                </div>
              </div>
            )}

            {form.selected_diagnoses.length > 0 && (
              <div className="rx-section">
                <div className="rx-section-title">Diagnosis</div>
                <div className="rx-text">
                  {form.selected_diagnoses.map(d => <div key={d.code}>{d.description}</div>)}
                </div>
              </div>
            )}
            
            {form.selected_lab_tests.length > 0 && (
              <div className="rx-section">
                <div className="rx-section-title">Advised Tests</div>
                <div className="rx-text">
                  <ul style={{ paddingLeft: '15px', margin: 0 }}>
                    {form.selected_lab_tests.map((t, i) => <li key={i}>{t.name}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Rx) */}
          <div style={{ width: '70%', paddingLeft: '8px' }}>
            <div className="rx-rx-title" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Rx</div>
            {validPrescriptions.length === 0 ? (
              <div className="rx-text">No medicines prescribed.</div>
            ) : (
              <table className="rx-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Freq</th>
                    <th>Days</th>
                    <th>Inst.</th>
                  </tr>
                </thead>
                <tbody>
                  {validPrescriptions.map((rx, i) => (
                    <tr key={i}>
                      <td className="rx-medicine-name">{rx.medicine.name}</td>
                      <td>{rx.dosage}</td>
                      <td>{rx.frequency}</td>
                      <td>{rx.duration}</td>
                      <td>{rx.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rx-footer">
          <div className="rx-follow-up">Not valid for medico-legal purposes.</div>
          <div className="rx-footer-right">
            <div className="rx-signature-line"></div>
            <div className="rx-signature-label">Dr. Ahmed Khan</div>
            <div className="rx-signature-sub">Signature & Stamp</div>
          </div>
        </div>
      </div>

      {/* Lab Slip Print Layout */}
      <div className="rx-page hidden" id="lab-slip-print">
        <div className="rx-header">
          <div className="rx-header-left">
            <div className="rx-clinic-name">E-Clinic Medical Center</div>
            <div className="rx-clinic-detail">123 Medical Road, Islamabad</div>
          </div>
          <div className="rx-header-right">
            <div className="rx-doctor-name">Dr. Ahmed Khan</div>
            <div className="rx-doctor-detail">MBBS, FCPS</div>
          </div>
        </div>
        <div className="rx-divider"></div>
        <div className="rx-patient-row">
          <div className="rx-patient-item"><span className="rx-label">Patient:</span> {form.patient_name || 'N/A'}</div>
          <div className="rx-patient-item"><span className="rx-label">Age/Sex:</span> {form.patient_age || '-'}y / {form.patient_gender || 'N/A'}</div>
          <div className="rx-patient-item"><span className="rx-label">Date:</span> {new Date().toLocaleDateString('en-PK')}</div>
        </div>
        <div className="rx-section mt-4">
          <div className="rx-rx-title" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Laboratory & Investigations Requisition</div>
          {form.selected_lab_tests.length > 0 && (
            <div className="rx-text" style={{ fontSize: '13px', lineHeight: '1.8' }}>
              <strong>Advised Tests:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                {form.selected_lab_tests.map((t, i) => <li key={i}>{t.name}</li>)}
              </ul>
            </div>
          )}
          {form.xray_notes && (
            <div className="rx-text mt-4" style={{ fontSize: '13px' }}>
              <strong>Radiology / Imaging:</strong>
              <div style={{ marginTop: '5px' }}>{form.xray_notes}</div>
            </div>
          )}
          {form.selected_lab_tests.length === 0 && !form.xray_notes && (
            <div className="rx-text mt-4" style={{ fontSize: '13px' }}>
              No tests advised.
            </div>
          )}
        </div>
        <div className="rx-footer">
          <div className="rx-footer-right">
            <div className="rx-signature-line"></div>
            <div className="rx-signature-label">Dr. Ahmed Khan</div>
            <div className="rx-signature-sub">Signature & Stamp</div>
          </div>
        </div>
      </div>


      {/* Header UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-40 py-4 glass-strong -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:py-0 gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-(--color-accent-success)" />
              {encounterId ? 'Edit Encounter' : 'Fast Encounter'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary" onClick={handlePrintLab}>
            <FlaskConical className="w-4 h-4" /> Print Lab
          </button>
          <button className="btn-secondary" onClick={handlePrintRx}>
            <Printer className="w-4 h-4" /> Print Rx
          </button>
          <button className="btn-primary shadow-lg shadow-blue-500/20" onClick={() => handleSave(false)}>
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Patient Details Section */}
          <Section card={true}>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-(--color-accent-secondary)" /> Patient Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative" ref={suggestRef}>
                <label className="label">Search by Name or Phone *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
                  <input
                    className={`input ${errors.patient_name ? 'border-red-500' : ''}`}
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. John Doe or 0300..."
                    value={patientQuery}
                    onChange={handlePatientNameChange}
                    onFocus={() => setShowPatientSuggest(true)}
                  />
                </div>
                {errors.patient_name && <p className="text-xs text-red-500 mt-1">{errors.patient_name}</p>}
                
                {/* Autocomplete Dropdown */}
                {showPatientSuggest && patientQuery && (
                  <div className="absolute z-50 w-full mt-1 bg-(--color-bg-elevated) border border-(--color-border-default) rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map(p => (
                        <div key={p.id} className="p-3 hover:bg-(--color-bg-hover) cursor-pointer border-b border-(--color-border-subtle) last:border-0" onClick={() => handleSelectExistingPatient(p)}>
                          <div className="font-medium text-sm">{p.full_name}</div>
                          <div className="text-xs text-(--color-text-muted)">{p.contact} · {p.gender}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-(--color-text-muted)">
                        No match. A new patient will be registered.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Contact Number *</label>
                <input
                  className={`input ${errors.patient_contact ? 'border-red-500' : ''}`}
                  placeholder="e.g. 0300-1234567"
                  value={form.patient_contact}
                  onChange={(e) => updateForm('patient_contact', e.target.value)}
                />
                {errors.patient_contact && <p className="text-xs text-red-500 mt-1">{errors.patient_contact}</p>}
              </div>

              <div>
                <label className="label">Gender *</label>
                <select
                  className={`input appearance-none ${errors.patient_gender ? 'border-red-500' : ''}`}
                  value={form.patient_gender}
                  onChange={(e) => updateForm('patient_gender', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.patient_gender && <p className="text-xs text-red-500 mt-1">{errors.patient_gender}</p>}
              </div>

              <div>
                <label className="label">Age</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 35"
                  value={form.patient_age}
                  onChange={(e) => updateForm('patient_age', e.target.value)}
                />
              </div>
            </div>
            {!form.patient_id && patientQuery && (
              <div className="mt-3 text-xs text-(--color-accent-warning) flex items-center gap-1 bg-(--color-accent-warning)/10 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" /> 
                Patient not found in system. They will be auto-registered upon saving.
              </div>
            )}
          </Section>

          {/* Vitals & Complaints */}
          <Section card={true}>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" /> Vitals & Complaints
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <VitalInput label="Pulse" value={form.pulse} onChange={(v) => updateForm('pulse', v)} placeholder="72" />
              <div>
                <label className="label">BP (Sys/Dia)</label>
                <div className="flex items-center gap-1">
                  <input className="input text-center px-1" placeholder="120" value={form.bp_systolic} onChange={(e) => updateForm('bp_systolic', e.target.value)} />
                  <span>/</span>
                  <input className="input text-center px-1" placeholder="80" value={form.bp_diastolic} onChange={(e) => updateForm('bp_diastolic', e.target.value)} />
                </div>
              </div>
              <VitalInput label="Temp (°F)" value={form.temperature} onChange={(v) => updateForm('temperature', v)} placeholder="98.6" />
              <VitalInput label="Weight (kg)" value={form.weight} onChange={(v) => updateForm('weight', v)} placeholder="70" />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">Symptoms</label>
                <SearchableCombobox items={symptoms} value={form.selected_symptoms} onChange={(v) => updateForm('selected_symptoms', v)} placeholder="Search symptoms..." multi />
              </div>
              <div>
                <label className="label">Chief Complaints</label>
                <textarea className="input" style={{ minHeight: '60px' }} placeholder="Describe complaints..." value={form.complaints} onChange={(e) => updateForm('complaints', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Diagnosis */}
          <Section card={true}>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-green-500" /> Diagnosis
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Diagnosis (ICD-10)</label>
                <SearchableCombobox items={diagnoses} value={form.selected_diagnoses} onChange={(v) => updateForm('selected_diagnoses', v)} placeholder="Search diagnosis..." labelKey="description" multi renderItem={(item) => (
                  <div className="flex-1"><div className="font-medium">{item.description}</div><div className="text-xs text-(--color-text-muted)">{item.code}</div></div>
                )} />
              </div>
              <div>
                <label className="label">Clinical Notes</label>
                <textarea className="input" style={{ minHeight: '80px' }} placeholder="Private clinical notes..." value={form.clinical_notes} onChange={(e) => updateForm('clinical_notes', e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Prescription */}
          <Section card={true} id="prescription">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-500" /> Prescription
            </h2>
            <div className="space-y-4">
              {form.prescriptions.map((rx, index) => (
                <div key={index} className="p-4 rounded-xl border border-(--color-border-default) bg-(--color-bg-input)">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm">Medicine #{index + 1}</span>
                    <button className="text-red-500 hover:text-red-600 p-1" onClick={() => removePrescription(index)}><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <SearchableCombobox className="mb-3" items={medicines} value={rx.medicine} onChange={(v) => updatePrescription(index, 'medicine', v)} placeholder="Search medicine..." renderItem={(item) => (
                    <div className="flex-1"><div className="font-medium">{item.name}</div><div className="text-xs text-(--color-text-muted)">{item.formulation}</div></div>
                  )} />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><label className="label text-[10px]">Dosage</label><input className="input text-sm" placeholder="1 tab" value={rx.dosage} onChange={(e) => updatePrescription(index, 'dosage', e.target.value)} /></div>
                    <div>
                      <label className="label text-[10px]">Freq</label>
                      <select className="input text-sm px-1" value={rx.frequency} onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}>
                        <option value="">Select</option><option value="OD">OD</option><option value="BD">BD</option><option value="TDS">TDS</option><option value="QID">QID</option><option value="SOS">SOS</option>
                      </select>
                    </div>
                    <div><label className="label text-[10px]">Duration</label><input className="input text-sm" placeholder="5 days" value={rx.duration} onChange={(e) => updatePrescription(index, 'duration', e.target.value)} /></div>
                    <div><label className="label text-[10px]">Notes</label><input className="input text-sm" placeholder="After meal" value={rx.instructions} onChange={(e) => updatePrescription(index, 'instructions', e.target.value)} /></div>
                  </div>
                </div>
              ))}
              <button className="btn-secondary w-full justify-center border-dashed" onClick={addPrescription}>
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>
          </Section>

        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          
          <Section card={true}>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-500" /> Investigations & Labs
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Advise Lab Tests</label>
                <SearchableCombobox items={labTests} value={form.selected_lab_tests} onChange={(v) => updateForm('selected_lab_tests', v)} placeholder="Search tests..." multi />
              </div>
              <div>
                <label className="label">Lab Results / Notes</label>
                <textarea className="input text-sm" style={{ minHeight: '80px' }} placeholder="Enter results for returning patients..." value={form.investigation_notes} onChange={(e) => updateForm('investigation_notes', e.target.value)} />
              </div>
            </div>
          </Section>

          <Section card={true}>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-500" /> History
            </h2>
            <div className="space-y-4">
              <div><label className="label text-xs">Medical History</label><input className="input text-sm" value={form.past_medical} onChange={(e) => updateForm('past_medical', e.target.value)} /></div>
              <div><label className="label text-xs">Surgical History</label><input className="input text-sm" value={form.past_surgical} onChange={(e) => updateForm('past_surgical', e.target.value)} /></div>
              <div><label className="label text-xs">Drug Allergies</label><input className="input text-sm text-red-500" value={form.drug_allergies} onChange={(e) => updateForm('drug_allergies', e.target.value)} /></div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ card, children, id }) {
  return (
    <div id={id} className={card ? 'card p-5' : ''}>
      {children}
    </div>
  );
}

function VitalInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input text-center" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
