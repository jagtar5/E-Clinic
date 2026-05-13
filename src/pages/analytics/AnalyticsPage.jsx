import { useMemo, useState } from 'react';
import db from '../../lib/store';
import {
  BarChart,
  PieChart,
  Download,
  Users,
  Stethoscope,
  Activity,
  Receipt,
  Pill,
  Thermometer,
  FlaskConical,
  X,
  Search,
} from 'lucide-react';

const PERIODS = [
  { label: 'Today', days: 0 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '3 Months', days: 90 },
  { label: 'All Time', days: -1 },
];

export default function AnalyticsPage() {
  const [detailModal, setDetailModal] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [periodDays, setPeriodDays] = useState(-1); // -1 = All Time

  const stats = useMemo(() => {
    const patients = db.select('patients').data;
    const allEncounters = db.select('encounters').data;
    const bills = db.select('bills').data;

    // Filter encounters by time period
    let encounters = allEncounters;
    if (periodDays === 0) {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      encounters = allEncounters.filter(e => new Date(e.created_at) >= todayStart);
    } else if (periodDays > 0) {
      const cutoff = new Date(Date.now() - periodDays * 86400000);
      encounters = allEncounters.filter(e => new Date(e.created_at) >= cutoff);
    }

    // Demographics (always all-time)
    const males = patients.filter((p) => p.gender === 'Male').length;
    const females = patients.filter((p) => p.gender === 'Female').length;
    const other = patients.filter((p) => p.gender === 'Other').length;

    // Revenue (period-filtered bills by encounter date approximation — use all for now)
    const revenue = bills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    const pending = bills.filter((b) => b.status === 'unpaid').reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

    // Frequency counts from filtered encounters
    const medCounts = {};
    const symptomCounts = {};
    const diagnosisCounts = {};
    const testCounts = {};

    encounters.forEach(enc => {
      enc.prescriptions?.forEach(rx => {
        if (rx.medicine_name) medCounts[rx.medicine_name] = (medCounts[rx.medicine_name] || 0) + 1;
      });
      enc.symptoms?.forEach(s => { symptomCounts[s] = (symptomCounts[s] || 0) + 1; });
      enc.diagnoses?.forEach(d => {
        const key = `${d.code} - ${d.description}`;
        diagnosisCounts[key] = (diagnosisCounts[key] || 0) + 1;
      });
      enc.lab_tests?.forEach(t => { testCounts[t] = (testCounts[t] || 0) + 1; });
    });

    const sortDict = (dict) => Object.entries(dict).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

    return {
      totalPatients: patients.length,
      totalEncounters: encounters.length,
      revenue, pending,
      demographics: { males, females, other },
      allMedicines: sortDict(medCounts),
      allSymptoms: sortDict(symptomCounts),
      allDiagnoses: sortDict(diagnosisCounts),
      allTests: sortDict(testCounts),
    };
  }, [periodDays]);

  function handleExport(table) {
    const data = db.select(table).data;
    if (!data.length) return alert(`No data found in ${table}`);

    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csvContent = [
      keys.join(','),
      ...data.map((row) => 
        keys.map(k => `"${String(row[k]).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export_${table}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Helper for detail modal
  let modalData = [];
  let modalTitle = '';
  let modalIcon = null;
  let modalColor = '';

  if (detailModal === 'medicines') {
    modalData = stats.allMedicines;
    modalTitle = 'All Prescribed Medicines';
    modalIcon = Pill;
    modalColor = '#3b82f6';
  } else if (detailModal === 'symptoms') {
    modalData = stats.allSymptoms;
    modalTitle = 'All Reported Symptoms';
    modalIcon = Thermometer;
    modalColor = '#f59e0b';
  } else if (detailModal === 'diagnoses') {
    modalData = stats.allDiagnoses;
    modalTitle = 'All Diagnoses';
    modalIcon = Stethoscope;
    modalColor = '#10b981';
  } else if (detailModal === 'tests') {
    modalData = stats.allTests;
    modalTitle = 'All Advised Lab Tests';
    modalIcon = FlaskConical;
    modalColor = '#8b5cf6';
  }

  const filteredModalData = modalData.filter(d => d.name.toLowerCase().includes(modalSearch.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart className="w-7 h-7 text-(--color-accent-primary)" />
            Analytics & Reports
          </h1>
          <p className="text-(--color-text-secondary) mt-1">
            Overview of clinic performance, trends, and data export
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time Period Filter Pills */}
          <div className="flex items-center gap-1 bg-(--color-bg-secondary) p-1 rounded-xl border border-(--color-border-default)">
            {PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => setPeriodDays(p.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodDays === p.days
                    ? 'bg-white text-(--color-accent-primary) shadow-sm border border-(--color-border-default)'
                    : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 relative group">
            <button className="btn-secondary">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-(--color-bg-elevated) border border-(--color-border-default) rounded-xl shadow-xl p-2 hidden group-hover:block z-50">
              <ExportItem label="Patients" onClick={() => handleExport('patients')} />
              <ExportItem label="Encounters" onClick={() => handleExport('encounters')} />
              <ExportItem label="Appointments" onClick={() => handleExport('appointments')} />
              <ExportItem label="Bills" onClick={() => handleExport('bills')} />
              <ExportItem label="Medicines" onClick={() => handleExport('medicines')} />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-min mt-6">
        
        {/* Quick Stats Grid */}
        <StatCard icon={Users} label="Total Patients" value={stats.totalPatients} color="#3b82f6" />
        <StatCard icon={Stethoscope} label="Total Encounters" value={stats.totalEncounters} color="#10b981" />
        <StatCard icon={Receipt} label="Collected Revenue" value={`Rs. ${stats.revenue.toLocaleString()}`} color="#f59e0b" />
        <StatCard icon={Activity} label="Pending Dues" value={`Rs. ${stats.pending.toLocaleString()}`} color="#ef4444" />

        {/* Most Prescribed Medicines */}
        <div className="card p-6 flex flex-col lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-500" />
              Top Prescribed Medicines
            </h2>
            <button className="text-xs text-blue-500 hover:text-blue-600 font-semibold" onClick={() => setDetailModal('medicines')}>View All</button>
          </div>
          <div className="space-y-4 flex-grow">
            {stats.allMedicines.length === 0 ? <p className="text-sm text-(--color-text-muted)">No data available yet.</p> : 
              stats.allMedicines.slice(0, 5).map((item, i) => (
                <ProgressBar key={i} label={item.name} count={item.count} max={stats.allMedicines[0].count} color="#3b82f6" />
              ))
            }
          </div>
        </div>

        {/* Patient Demographics - Tall Card */}
        <div className="card p-6 lg:col-span-2 lg:row-span-2 flex flex-col bg-gradient-to-br from-pink-50 to-white">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-8">
            <PieChart className="w-5 h-5 text-pink-500" />
            Patient Demographics
          </h2>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <DemographicBar label="Male" count={stats.demographics.males} total={stats.totalPatients} color="#3b82f6" />
            <DemographicBar label="Female" count={stats.demographics.females} total={stats.totalPatients} color="#ec4899" />
            <DemographicBar label="Other" count={stats.demographics.other} total={stats.totalPatients} color="#8b5cf6" />
          </div>
        </div>

        {/* Most Common Diagnoses */}
        <div className="card p-6 flex flex-col lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-green-500" />
              Most Common Diagnoses
            </h2>
            <button className="text-xs text-green-500 hover:text-green-600 font-semibold" onClick={() => setDetailModal('diagnoses')}>View All</button>
          </div>
          <div className="space-y-4 flex-grow">
            {stats.allDiagnoses.length === 0 ? <p className="text-sm text-(--color-text-muted)">No data available yet.</p> : 
              stats.allDiagnoses.slice(0, 5).map((item, i) => (
                <ProgressBar key={i} label={item.name} count={item.count} max={stats.allDiagnoses[0].count} color="#10b981" />
              ))
            }
          </div>
        </div>

        {/* Most Common Symptoms */}
        <div className="card p-6 flex flex-col lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-500" />
              Top Reported Symptoms
            </h2>
            <button className="text-xs text-amber-500 hover:text-amber-600 font-semibold" onClick={() => setDetailModal('symptoms')}>View All</button>
          </div>
          <div className="space-y-4 flex-grow">
            {stats.allSymptoms.length === 0 ? <p className="text-sm text-(--color-text-muted)">No data available yet.</p> : 
              stats.allSymptoms.slice(0, 5).map((item, i) => (
                <ProgressBar key={i} label={item.name} count={item.count} max={stats.allSymptoms[0].count} color="#f59e0b" />
              ))
            }
          </div>
        </div>

        {/* Most Prescribed Lab Tests */}
        <div className="card p-6 flex flex-col lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-500" />
              Top Advised Lab Tests
            </h2>
            <button className="text-xs text-purple-500 hover:text-purple-600 font-semibold" onClick={() => setDetailModal('tests')}>View All</button>
          </div>
          <div className="space-y-4 flex-grow">
            {stats.allTests.length === 0 ? <p className="text-sm text-(--color-text-muted)">No data available yet.</p> : 
              stats.allTests.slice(0, 5).map((item, i) => (
                <ProgressBar key={i} label={item.name} count={item.count} max={stats.allTests[0].count} color="#8b5cf6" />
              ))
            }
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      {detailModal && (() => {
        const ModalIcon = modalIcon;
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => {setDetailModal(null); setModalSearch('');}} />
            <div className="relative w-full max-w-2xl bg-(--color-bg-base) border border-(--color-border-default) rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  {ModalIcon && <ModalIcon className="w-6 h-6" style={{ color: modalColor }} />}
                  {modalTitle}
                </h2>
                <button className="btn-ghost p-1" onClick={() => {setDetailModal(null); setModalSearch('');}}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
              <input 
                className="input" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="Search..." 
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />
            </div>

            <div className="overflow-y-auto flex-grow space-y-3 pr-2">
              {filteredModalData.length === 0 ? (
                <div className="text-center py-8 text-(--color-text-muted)">No items found.</div>
              ) : (
                filteredModalData.map((item, i) => (
                  <ProgressBar key={i} label={item.name} count={item.count} max={modalData[0].count} color={modalColor} />
                ))
              )}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-(--color-text-primary)">{value}</div>
      <div className="text-sm text-(--color-text-muted) mt-1">{label}</div>
    </div>
  );
}

function ProgressBar({ label, count, max, color }) {
  const percentage = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium truncate pr-4">{label}</span>
        <span className="text-(--color-text-muted) flex-shrink-0">{count}x</span>
      </div>
      <div className="h-2 w-full bg-(--color-bg-input) rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
}

function DemographicBar({ label, count, total, color }) {
  const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-(--color-text-muted)">{count} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full bg-(--color-bg-input) rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
}

function ExportItem({ label, onClick }) {
  return (
    <div className="px-3 py-2 text-sm hover:bg-(--color-bg-hover) cursor-pointer rounded-lg text-(--color-text-primary)" onClick={onClick}>
      {label}
    </div>
  );
}
