import { useState, useEffect } from 'react';
import { Printer, Save, Check } from 'lucide-react';

const DEFAULT_PRINT_SETTINGS = {
  header: true,
  patient: true,
  vitals: true,
  complaints: true,
  diagnosis: true,
  investigations: true,
  prescription: true,
  notes: false,
  footer: true,
};

export default function SettingsPage() {
  const [printSettings, setPrintSettings] = useState(DEFAULT_PRINT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('eclinic_print_settings');
    if (savedSettings) {
      try {
        setPrintSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse print settings', e);
      }
    }
  }, []);

  const handleToggle = (key) => {
    setPrintSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    localStorage.setItem('eclinic_print_settings', JSON.stringify(printSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { key: 'header', label: 'Clinic Header (Name, Address)' },
    { key: 'patient', label: 'Patient Info (Name, Age, Date)' },
    { key: 'vitals', label: 'Vitals Strip' },
    { key: 'complaints', label: 'Chief Complaints & Symptoms' },
    { key: 'diagnosis', label: 'Diagnosis (ICD-10)' },
    { key: 'investigations', label: 'Investigations Advised' },
    { key: 'prescription', label: 'Prescription Table (Rx)' },
    { key: 'notes', label: 'Clinical Notes' },
    { key: 'footer', label: 'Footer (Follow-up & Signature)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Printer className="w-7 h-7 text-(--color-accent-primary)" />
          Print Settings
        </h1>
        <p className="text-(--color-text-secondary) mt-1">
          Configure what sections to include by default when printing prescriptions.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Prescription Sections</h2>
        <div className="space-y-3 mb-8">
          {sections.map(sec => (
            <label key={sec.key} className="flex items-center justify-between p-3 border border-(--color-border-subtle) rounded-lg hover:bg-(--color-bg-hover) cursor-pointer transition-colors">
              <span className="font-medium text-sm">{sec.label}</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={printSettings[sec.key]}
                  onChange={() => handleToggle(sec.key)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-accent-primary)"></div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-(--color-border-subtle)">
          <button className="btn-primary" onClick={handleSave}>
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Defaults'}
          </button>
        </div>
      </div>
    </div>
  );
}
