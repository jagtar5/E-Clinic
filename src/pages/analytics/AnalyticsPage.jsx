import { useMemo } from 'react';
import db from '../../lib/store';
import {
  BarChart,
  PieChart,
  Download,
  Users,
  Stethoscope,
  Activity,
  Receipt,
} from 'lucide-react';

export default function AnalyticsPage() {
  const stats = useMemo(() => {
    const patients = db.select('patients').data;
    const encounters = db.select('encounters').data;
    const bills = db.select('bills').data;

    // Simple gender distribution
    const males = patients.filter((p) => p.gender === 'Male').length;
    const females = patients.filter((p) => p.gender === 'Female').length;
    const other = patients.filter((p) => p.gender === 'Other').length;

    // Revenue
    const revenue = bills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    const pending = bills.filter((b) => b.status === 'unpaid').reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

    return {
      totalPatients: patients.length,
      totalEncounters: encounters.length,
      revenue,
      pending,
      demographics: { males, females, other },
      encountersList: encounters,
    };
  }, []);

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BarChart className="w-7 h-7 text-(--color-accent-primary)" />
          Analytics & Reports
        </h1>
        <p className="text-(--color-text-secondary) mt-1">
          Overview of clinic performance and data export
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Patients" value={stats.totalPatients} color="#3b82f6" />
        <StatCard icon={Stethoscope} label="Total Encounters" value={stats.totalEncounters} color="#10b981" />
        <StatCard icon={Receipt} label="Collected Revenue" value={`Rs. ${stats.revenue.toLocaleString()}`} color="#f59e0b" />
        <StatCard icon={Activity} label="Pending Dues" value={`Rs. ${stats.pending.toLocaleString()}`} color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simple Demographics View */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-(--color-accent-secondary)" />
            Patient Demographics
          </h2>
          
          <div className="space-y-4">
            <DemographicBar label="Male" count={stats.demographics.males} total={stats.totalPatients} color="#3b82f6" />
            <DemographicBar label="Female" count={stats.demographics.females} total={stats.totalPatients} color="#ec4899" />
            <DemographicBar label="Other" count={stats.demographics.other} total={stats.totalPatients} color="#8b5cf6" />
          </div>
        </div>

        {/* Export Data */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Download className="w-5 h-5 text-(--color-accent-success)" />
            Export Data
          </h2>
          <p className="text-sm text-(--color-text-secondary) mb-4">
            Download your clinic data in CSV format for backup or external analysis.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ExportButton label="Export Patients" onClick={() => handleExport('patients')} />
            <ExportButton label="Export Encounters" onClick={() => handleExport('encounters')} />
            <ExportButton label="Export Appointments" onClick={() => handleExport('appointments')} />
            <ExportButton label="Export Bills" onClick={() => handleExport('bills')} />
            <ExportButton label="Export Medicines" onClick={() => handleExport('medicines')} />
          </div>
        </div>
      </div>
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

function ExportButton({ label, onClick }) {
  return (
    <button className="btn-secondary justify-center w-full" onClick={onClick}>
      <Download className="w-4 h-4" /> {label}
    </button>
  );
}
