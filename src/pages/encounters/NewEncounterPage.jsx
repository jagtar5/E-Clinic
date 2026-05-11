import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import db from '../../lib/store';
import { useMasterData } from '../../hooks/useMasterData';
import { useAutoSave } from '../../hooks/useAutoSave';
import SearchableCombobox from '../../components/SearchableCombobox';
import {
  ArrowLeft,
  ArrowRight,
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
  RotateCcw,
} from 'lucide-react';

const STEPS = [
  { id: 'vitals', label: 'Vitals & Complaints', icon: Heart },
  { id: 'history', label: 'Medical History', icon: ClipboardList },
  { id: 'investigations', label: 'Investigations', icon: FlaskConical },
  { id: 'diagnosis', label: 'Diagnosis', icon: Stethoscope },
  { id: 'prescription', label: 'Prescription (Rx)', icon: Pill },
];

const INITIAL_FORM = {
  // Vitals
  pulse: '',
  bp_systolic: '',
  bp_diastolic: '',
  temperature: '',
  weight: '',
  respiratory_rate: '',
  spo2: '',
  complaints: '',
  selected_symptoms: [],
  // History
  past_medical: '',
  past_surgical: '',
  family_history: '',
  drug_allergies: '',
  // Investigations
  selected_lab_tests: [],
  xray_notes: '',
  investigation_notes: '',
  // Diagnosis
  selected_diagnoses: [],
  clinical_notes: '',
  // Prescription
  prescriptions: [],
};

export default function NewEncounterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get('patient');

  const { medicines, symptoms, diagnoses, labTests } = useMasterData();

  const [step, setStep] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saved, setSaved] = useState(false);
  const [showRestore, setShowRestore] = useState(false);

  // Auto-save
  const autoSaveKey = selectedPatient ? `encounter_${selectedPatient.id}` : 'encounter_new';
  const { save, load, clear, hasSaved } = useAutoSave(autoSaveKey, form, { enabled: !!selectedPatient });

  // Load patient list for selection
  const patients = useMemo(() => {
    return db.select('patients', { sortBy: 'full_name' }).data;
  }, []);

  // Pre-select patient
  useEffect(() => {
    if (preselectedPatient) {
      const p = db.findById('patients', preselectedPatient);
      if (p) setSelectedPatient(p);
    }
  }, [preselectedPatient]);

  // Check for auto-saved data
  useEffect(() => {
    if (selectedPatient && hasSaved()) {
      setShowRestore(true);
    }
  }, [selectedPatient, hasSaved]);

  function restoreData() {
    const savedData = load();
    if (savedData) {
      setForm(savedData);
    }
    setShowRestore(false);
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPrescription() {
    setForm((prev) => ({
      ...prev,
      prescriptions: [
        ...prev.prescriptions,
        { medicine: null, dosage: '', frequency: '', duration: '', instructions: '' },
      ],
    }));
  }

  function updatePrescription(index, key, value) {
    setForm((prev) => {
      const updated = [...prev.prescriptions];
      updated[index] = { ...updated[index], [key]: value };
      // Auto-fill defaults when medicine is selected
      if (key === 'medicine' && value) {
        if (!updated[index].dosage) updated[index].dosage = value.default_dosage || '';
        if (!updated[index].frequency) updated[index].frequency = value.default_frequency || '';
        if (!updated[index].duration) updated[index].duration = value.default_duration || '';
      }
      return { ...prev, prescriptions: updated };
    });
  }

  function removePrescription(index) {
    setForm((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index),
    }));
  }

  function handleSubmit() {
    if (!selectedPatient) return;

    const encounter = {
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.full_name,
      doctor_id: 'demo-doctor-001',
      // Vitals
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
      // History
      past_medical: form.past_medical,
      past_surgical: form.past_surgical,
      family_history: form.family_history,
      drug_allergies: form.drug_allergies,
      // Investigations
      lab_tests: form.selected_lab_tests.map((t) => t.name),
      xray_notes: form.xray_notes,
      investigation_notes: form.investigation_notes,
      // Diagnosis
      diagnoses: form.selected_diagnoses.map((d) => ({ code: d.code, description: d.description })),
      clinical_notes: form.clinical_notes,
      // Prescription
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

    db.insert('encounters', encounter);
    clear(); // Clear auto-saved data
    setSaved(true);

    setTimeout(() => {
      navigate(`/dashboard/patients/${selectedPatient.id}`);
    }, 1500);
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-scale-in">
        <div className="card p-8 text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(16, 185, 129, 0.15)' }}
          >
            <Check className="w-8 h-8 text-(--color-accent-success)" />
          </div>
          <h2 className="text-xl font-bold mb-2">Encounter Saved!</h2>
          <p className="text-(--color-text-secondary)">
            Redirecting to patient profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-(--color-accent-success)" />
            New Clinical Encounter
          </h1>
          {selectedPatient && (
            <p className="text-(--color-text-secondary) mt-0.5">
              Patient: <strong>{selectedPatient.full_name}</strong> ({selectedPatient.age}y / {selectedPatient.gender})
            </p>
          )}
        </div>
      </div>

      {/* Restore auto-saved data */}
      {showRestore && (
        <div
          className="flex items-center justify-between p-4 rounded-xl animate-slide-up"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-(--color-accent-warning)" />
            <span className="text-sm">Unsaved encounter data found. Restore it?</span>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost text-xs" onClick={() => { clear(); setShowRestore(false); }}>
              Discard
            </button>
            <button className="btn-primary text-xs" onClick={restoreData}>
              Restore
            </button>
          </div>
        </div>
      )}

      {/* Patient Selection (if not preselected) */}
      {!selectedPatient && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-3">Select Patient</h2>
          <SearchableCombobox
            items={patients}
            value={selectedPatient}
            onChange={setSelectedPatient}
            placeholder="Search patient by name or phone..."
            labelKey="full_name"
            renderItem={(item) => (
              <div className="flex-1">
                <div className="font-medium">{item.full_name}</div>
                <div className="text-xs text-(--color-text-muted)">{item.contact} · {item.age}y / {item.gender}</div>
              </div>
            )}
          />
        </div>
      )}

      {selectedPatient && (
        <>
          {/* Step Indicator */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isCompleted = i < step;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'text-white'
                      : isCompleted
                      ? 'text-(--color-accent-success)'
                      : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
                  }`}
                  style={
                    isActive
                      ? { background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))', border: '1px solid rgba(59,130,246,0.3)' }
                      : { border: '1px solid transparent' }
                  }
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="card p-6 animate-fade-in" key={step}>
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              {(() => {
                const Icon = STEPS[step].icon;
                return <Icon className="w-5 h-5 text-(--color-accent-primary)" />;
              })()}
              {STEPS[step].label}
            </h2>

            {step === 0 && (
              <StepVitals
                form={form}
                updateForm={updateForm}
                symptoms={symptoms}
              />
            )}
            {step === 1 && (
              <StepHistory form={form} updateForm={updateForm} />
            )}
            {step === 2 && (
              <StepInvestigations
                form={form}
                updateForm={updateForm}
                labTests={labTests}
              />
            )}
            {step === 3 && (
              <StepDiagnosis
                form={form}
                updateForm={updateForm}
                diagnoses={diagnoses}
              />
            )}
            {step === 4 && (
              <StepPrescription
                form={form}
                medicines={medicines}
                addPrescription={addPrescription}
                updatePrescription={updatePrescription}
                removePrescription={removePrescription}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              className="btn-secondary"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            <button className="btn-ghost text-xs" onClick={save}>
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>

            {step < STEPS.length - 1 ? (
              <button
                className="btn-primary"
                onClick={() => setStep((s) => s + 1)}
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSubmit}>
                <Check className="w-4 h-4" /> Save Encounter
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ===== Step Components ===== */

function StepVitals({ form, updateForm, symptoms }) {
  return (
    <div className="space-y-5">
      {/* Vitals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <VitalInput
          icon={Heart}
          label="Pulse (bpm)"
          value={form.pulse}
          onChange={(v) => updateForm('pulse', v)}
          placeholder="72"
          color="#ef4444"
        />
        <div className="col-span-2 sm:col-span-1">
          <label className="label flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-(--color-accent-danger)" /> Blood Pressure
          </label>
          <div className="flex items-center gap-2">
            <input
              className="input text-center"
              placeholder="120"
              value={form.bp_systolic}
              onChange={(e) => updateForm('bp_systolic', e.target.value)}
            />
            <span className="text-(--color-text-muted) font-bold">/</span>
            <input
              className="input text-center"
              placeholder="80"
              value={form.bp_diastolic}
              onChange={(e) => updateForm('bp_diastolic', e.target.value)}
            />
          </div>
        </div>
        <VitalInput
          icon={Thermometer}
          label="Temp (°F)"
          value={form.temperature}
          onChange={(v) => updateForm('temperature', v)}
          placeholder="98.6"
          color="#f59e0b"
        />
        <VitalInput
          label="Weight (kg)"
          value={form.weight}
          onChange={(v) => updateForm('weight', v)}
          placeholder="70"
        />
        <VitalInput
          label="Resp Rate"
          value={form.respiratory_rate}
          onChange={(v) => updateForm('respiratory_rate', v)}
          placeholder="18"
        />
        <VitalInput
          label="SpO₂ (%)"
          value={form.spo2}
          onChange={(v) => updateForm('spo2', v)}
          placeholder="98"
        />
      </div>

      {/* Symptoms */}
      <div>
        <label className="label">Symptoms</label>
        <SearchableCombobox
          items={symptoms}
          value={form.selected_symptoms}
          onChange={(v) => updateForm('selected_symptoms', v)}
          placeholder="Search symptoms..."
          multi
        />
      </div>

      {/* Free-text complaints */}
      <div>
        <label className="label">Chief Complaints (free text)</label>
        <textarea
          className="input"
          style={{ minHeight: '80px', resize: 'vertical' }}
          placeholder="Describe the patient's chief complaints..."
          value={form.complaints}
          onChange={(e) => updateForm('complaints', e.target.value)}
        />
      </div>
    </div>
  );
}

function StepHistory({ form, updateForm }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="label">Past Medical History</label>
        <textarea
          className="input"
          style={{ minHeight: '80px', resize: 'vertical' }}
          placeholder="e.g., Known hypertensive since 2020, DM-II on Metformin..."
          value={form.past_medical}
          onChange={(e) => updateForm('past_medical', e.target.value)}
        />
      </div>
      <div>
        <label className="label">Past Surgical History</label>
        <textarea
          className="input"
          style={{ minHeight: '60px', resize: 'vertical' }}
          placeholder="e.g., Appendectomy (2015), C-section (2018)..."
          value={form.past_surgical}
          onChange={(e) => updateForm('past_surgical', e.target.value)}
        />
      </div>
      <div>
        <label className="label">Family History</label>
        <textarea
          className="input"
          style={{ minHeight: '60px', resize: 'vertical' }}
          placeholder="e.g., Father — DM-II, Mother — Hypertension..."
          value={form.family_history}
          onChange={(e) => updateForm('family_history', e.target.value)}
        />
      </div>
      <div>
        <label className="label">Drug Allergies</label>
        <input
          className="input"
          placeholder="e.g., Penicillin, Sulfa drugs"
          value={form.drug_allergies}
          onChange={(e) => updateForm('drug_allergies', e.target.value)}
        />
        {form.drug_allergies && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-(--color-accent-danger)">
            <AlertCircle className="w-4 h-4" />
            Drug allergies noted — will appear on prescription
          </div>
        )}
      </div>
    </div>
  );
}

function StepInvestigations({ form, updateForm, labTests }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="label">Lab Tests / Imaging</label>
        <SearchableCombobox
          items={labTests}
          value={form.selected_lab_tests}
          onChange={(v) => updateForm('selected_lab_tests', v)}
          placeholder="Search lab tests, X-rays, ultrasound..."
          multi
        />
      </div>
      <div>
        <label className="label">X-Ray / Imaging Notes</label>
        <textarea
          className="input"
          style={{ minHeight: '60px', resize: 'vertical' }}
          placeholder="e.g., Chest X-ray shows bilateral infiltrates..."
          value={form.xray_notes}
          onChange={(e) => updateForm('xray_notes', e.target.value)}
        />
      </div>
      <div>
        <label className="label">Additional Investigation Notes</label>
        <textarea
          className="input"
          style={{ minHeight: '60px', resize: 'vertical' }}
          placeholder="Any other investigation findings or notes..."
          value={form.investigation_notes}
          onChange={(e) => updateForm('investigation_notes', e.target.value)}
        />
      </div>
    </div>
  );
}

function StepDiagnosis({ form, updateForm, diagnoses }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="label">Diagnosis (ICD-10)</label>
        <SearchableCombobox
          items={diagnoses}
          value={form.selected_diagnoses}
          onChange={(v) => updateForm('selected_diagnoses', v)}
          placeholder="Search diagnosis by name or ICD code..."
          labelKey="description"
          multi
          renderItem={(item) => (
            <div className="flex-1">
              <div className="font-medium">{item.description}</div>
              <div className="text-xs text-(--color-text-muted)">{item.code} · {item.category}</div>
            </div>
          )}
        />
      </div>
      <div>
        <label className="label">Clinical Notes (Private)</label>
        <textarea
          className="input"
          style={{ minHeight: '100px', resize: 'vertical' }}
          placeholder="Private clinical notes — will not appear on printed prescription unless toggled..."
          value={form.clinical_notes}
          onChange={(e) => updateForm('clinical_notes', e.target.value)}
        />
        <p className="text-xs text-(--color-text-muted) mt-1">These notes are for internal records only</p>
      </div>
    </div>
  );
}

function StepPrescription({ form, medicines, addPrescription, updatePrescription, removePrescription }) {
  return (
    <div className="space-y-5">
      {form.prescriptions.length === 0 ? (
        <div className="text-center py-8">
          <Pill className="w-10 h-10 mx-auto text-(--color-text-muted) mb-3" />
          <p className="text-(--color-text-secondary) mb-4">No medicines added yet</p>
          <button className="btn-primary" onClick={addPrescription}>
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>
      ) : (
        <>
          {form.prescriptions.map((rx, index) => (
            <div
              key={index}
              className="p-4 rounded-xl animate-slide-up"
              style={{
                background: 'var(--color-bg-input)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="badge badge-primary">Rx #{index + 1}</span>
                <button
                  className="btn-ghost p-1 text-(--color-text-muted) hover:text-(--color-accent-danger)"
                  onClick={() => removePrescription(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Medicine selector */}
              <div className="mb-3">
                <label className="label">Medicine</label>
                <SearchableCombobox
                  items={medicines}
                  value={rx.medicine}
                  onChange={(v) => updatePrescription(index, 'medicine', v)}
                  placeholder="Search medicine..."
                  renderItem={(item) => (
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-(--color-text-muted)">{item.formulation} · {item.category}</div>
                    </div>
                  )}
                />
              </div>

              {/* Dosage details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="label">Dosage</label>
                  <input
                    className="input text-sm"
                    placeholder="1 tab"
                    value={rx.dosage}
                    onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Frequency</label>
                  <select
                    className="input text-sm appearance-none cursor-pointer"
                    value={rx.frequency}
                    onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="OD (1x/day)">OD (1x/day)</option>
                    <option value="BD (2x/day)">BD (2x/day)</option>
                    <option value="TDS (3x/day)">TDS (3x/day)</option>
                    <option value="QID (4x/day)">QID (4x/day)</option>
                    <option value="PRN (as needed)">PRN (as needed)</option>
                    <option value="HS (at bedtime)">HS (at bedtime)</option>
                    <option value="OD (at night)">OD (at night)</option>
                    <option value="SOS (as needed)">SOS (as needed)</option>
                    <option value="Stat (once)">Stat (once)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input
                    className="input text-sm"
                    placeholder="5 days"
                    value={rx.duration}
                    onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Instructions</label>
                  <input
                    className="input text-sm"
                    placeholder="After meals"
                    value={rx.instructions}
                    onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button className="btn-secondary w-full justify-center" onClick={addPrescription}>
            <Plus className="w-4 h-4" /> Add Another Medicine
          </button>
        </>
      )}
    </div>
  );
}

/* ===== Helpers ===== */

function VitalInput({ icon: Icon, label, value, onChange, placeholder, color }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" style={{ color: color || 'var(--color-text-muted)' }} />}
        {label}
      </label>
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
