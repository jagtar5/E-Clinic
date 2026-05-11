import { useState, useMemo, useCallback, useRef } from 'react';
import db from '../../lib/store';
import MasterDataTable from '../../components/MasterDataTable';
import {
  Database,
  Pill,
  Thermometer,
  FlaskConical,
  Stethoscope,
  Upload,
  AlertCircle,
} from 'lucide-react';

const TABS = [
  { id: 'medicines', label: 'Medicines', icon: Pill, color: '#3b82f6' },
  { id: 'symptoms', label: 'Symptoms', icon: Thermometer, color: '#f59e0b' },
  { id: 'lab_tests', label: 'Lab Tests', icon: FlaskConical, color: '#8b5cf6' },
  { id: 'diagnoses', label: 'Diagnoses (ICD-10)', icon: Stethoscope, color: '#10b981' },
];

const MEDICINE_CATEGORIES = ['Analgesic', 'NSAID', 'Antibiotic', 'PPI', 'H2 Blocker', 'Antiemetic', 'Antispasmodic', 'Antiplatelet', 'Antihypertensive', 'ARB', 'Beta Blocker', 'Antidiabetic', 'Statin', 'Antihistamine', 'Leukotriene Inhibitor', 'Bronchodilator', 'Corticosteroid', 'Opioid Analgesic', 'Supplement', 'Rehydration', 'Other'];

const SYMPTOM_CATEGORIES = ['General', 'Neurological', 'Respiratory', 'ENT', 'GI', 'Cardiovascular', 'Musculoskeletal', 'Dermatological', 'Urological', 'Ophthalmological', 'Psychiatric', 'Other'];

const LAB_CATEGORIES = ['Hematology', 'Biochemistry', 'Endocrine', 'Urinalysis', 'Microbiology', 'Serology', 'Parasitology', 'Radiology', 'Cardiology', 'Other'];

const DIAGNOSIS_CATEGORIES = ['Respiratory', 'GI', 'Urological', 'Cardiovascular', 'Endocrine', 'Metabolic', 'Musculoskeletal', 'Neurological', 'ENT', 'Dermatological', 'Infectious', 'Hematological', 'Psychiatric', 'General', 'Other'];

const COLUMN_DEFS = {
  medicines: [
    { key: 'name', label: 'Medicine Name', placeholder: 'e.g. Panadol (Paracetamol)' },
    { key: 'formulation', label: 'Formulation', placeholder: 'e.g. Tablet 500mg' },
    { key: 'default_dosage', label: 'Default Dosage', placeholder: 'e.g. 1 tab' },
    { key: 'default_frequency', label: 'Frequency', placeholder: 'e.g. TDS (3x/day)' },
    { key: 'default_duration', label: 'Duration', placeholder: 'e.g. 5 days' },
    { key: 'category', label: 'Category', type: 'select', options: MEDICINE_CATEGORIES },
  ],
  symptoms: [
    { key: 'name', label: 'Symptom Name', placeholder: 'e.g. Fever' },
    { key: 'category', label: 'Category', type: 'select', options: SYMPTOM_CATEGORIES },
  ],
  lab_tests: [
    { key: 'name', label: 'Test Name', placeholder: 'e.g. CBC' },
    { key: 'category', label: 'Category', type: 'select', options: LAB_CATEGORIES },
  ],
  diagnoses: [
    { key: 'code', label: 'ICD-10 Code', placeholder: 'e.g. J06.9' },
    { key: 'description', label: 'Description', placeholder: 'e.g. Acute URTI' },
    { key: 'category', label: 'Category', type: 'select', options: DIAGNOSIS_CATEGORIES },
  ],
};

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('medicines');
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef(null);

  const data = useMemo(() => {
    const result = db.select(activeTab, {
      sortBy: activeTab === 'diagnoses' ? 'code' : 'name',
    });
    return result.data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function handleAdd(values) {
    db.insert(activeTab, values);
    refresh();
  }

  function handleUpdate(id, values) {
    db.update(activeTab, id, values);
    refresh();
  }

  function handleDelete(id) {
    db.delete(activeTab, id);
    refresh();
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        alert('Invalid CSV: Need at least a header row and one data row.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const expectedKeys = COLUMN_DEFS[activeTab].map(c => c.key);
      
      const missing = expectedKeys.filter(k => !headers.includes(k));
      if (missing.length > 0) {
        alert(`Invalid CSV. Missing required headers for ${activeTab}:\n${missing.join(', ')}`);
        return;
      }

      const newRecords = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const record = {};
        headers.forEach((h, idx) => {
          if (expectedKeys.includes(h)) {
            record[h] = values[idx] || '';
          }
        });
        if (Object.values(record).some(v => v !== '')) {
          newRecords.push(record);
        }
      }

      if (newRecords.length > 0) {
        db.bulkInsert(activeTab, newRecords);
        alert(`Successfully imported ${newRecords.length} records!`);
        refresh();
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  }

  const activeTabDef = TABS.find((t) => t.id === activeTab);
  const expectedHeaders = COLUMN_DEFS[activeTab].map(c => c.key).join(', ');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Database className="w-7 h-7 text-(--color-accent-warning)" />
            Master Data
          </h1>
          <p className="text-(--color-text-secondary) mt-1">
            Manage medicines, symptoms, lab tests, and diagnostic codes
          </p>
        </div>
        <div className="flex flex-col sm:items-end">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button className="btn-secondary" onClick={() => fileInputRef.current.click()}>
            <Upload className="w-4 h-4" /> Import CSV
          </button>
        </div>
      </div>
      
      {/* CSV Requirements Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-blue-400 mb-1">CSV Import Requirements</h3>
          <p className="text-xs text-(--color-text-secondary)">
            Ensure your CSV file contains exactly these column headers (lowercase) in the first row for the <strong>{activeTabDef?.label}</strong> tab:
            <br />
            <span className="inline-block mt-1.5 font-mono text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
              {expectedHeaders}
            </span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-hover)'
              }`}
              style={
                isActive
                  ? { background: `${tab.color}20`, border: `1px solid ${tab.color}40`, color: tab.color }
                  : { border: '1px solid transparent' }
              }
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span
                className="text-[0.65rem] px-1.5 py-0.5 rounded-full"
                style={{
                  background: isActive ? `${tab.color}15` : 'var(--color-bg-elevated)',
                  color: isActive ? tab.color : 'var(--color-text-muted)',
                }}
              >
                {data.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <MasterDataTable
        key={activeTab}
        data={data}
        columns={COLUMN_DEFS[activeTab]}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel={`Add ${activeTabDef?.label?.replace(/s$/, '') || 'Item'}`}
      />
    </div>
  );
}
