import { useState, useMemo, useCallback, useEffect } from 'react';
import db from '../../lib/store';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
} from 'lucide-react';

export default function BillingPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Consultation Fee');
  const [status, setStatus] = useState('unpaid');
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const patients = useMemo(() => db.select('patients', { sortBy: 'full_name' }).data, []);

  const bills = useMemo(() => {
    let all = db.select('bills', { sortBy: 'created_at', sortOrder: 'desc' }).data;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      all = all.filter((b) => 
        b.patient_name?.toLowerCase().includes(q) || 
        b.id.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      );
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, searchQuery]);

  const stats = useMemo(() => {
    const total = bills.length;
    const paid = bills.filter((b) => b.status === 'paid');
    const unpaid = bills.filter((b) => b.status === 'unpaid');
    
    const revenue = paid.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    const pending = unpaid.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

    return { total, revenue, pending, unpaidCount: unpaid.length };
  }, [bills]);

  function handleAddBill() {
    if (!selectedPatient || !amount) return;
    const patient = patients.find((p) => p.id === selectedPatient);
    if (!patient) return;

    db.insert('bills', {
      patient_id: patient.id,
      patient_name: patient.full_name,
      amount: parseFloat(amount),
      description,
      status,
      date: new Date().toISOString(),
    });

    setShowAdd(false);
    setSelectedPatient('');
    setAmount('');
    setDescription('Consultation Fee');
    setStatus('unpaid');
    refresh();
  }

  function updateStatus(id, newStatus) {
    db.update('bills', id, { status: newStatus });
    refresh();
  }

  function deleteBill(id) {
    if (confirm('Are you sure you want to delete this bill?')) {
      db.delete('bills', id);
      refresh();
    }
  }

  function formatCurrency(val) {
    return `Rs. ${parseFloat(val || 0).toLocaleString()}`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Receipt className="w-7 h-7 text-(--color-accent-success)" />
            Billing & Invoices
          </h1>
          <p className="text-(--color-text-secondary) mt-1">Manage patient payments and pending dues</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Generate Bill
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4" style={{ borderLeftColor: 'var(--color-accent-success)' }}>
          <div className="text-sm text-(--color-text-muted) mb-1 uppercase tracking-wider font-semibold">Total Revenue</div>
          <div className="text-3xl font-bold text-(--color-accent-success)">{formatCurrency(stats.revenue)}</div>
        </div>
        <div className="card p-5 border-l-4" style={{ borderLeftColor: 'var(--color-accent-warning)' }}>
          <div className="text-sm text-(--color-text-muted) mb-1 uppercase tracking-wider font-semibold">Pending Dues</div>
          <div className="text-3xl font-bold text-(--color-accent-warning)">{formatCurrency(stats.pending)}</div>
          <div className="text-xs text-(--color-text-muted) mt-1">from {stats.unpaidCount} bills</div>
        </div>
        <div className="card p-5 border-l-4" style={{ borderLeftColor: 'var(--color-accent-primary)' }}>
          <div className="text-sm text-(--color-text-muted) mb-1 uppercase tracking-wider font-semibold">Total Bills</div>
          <div className="text-3xl font-bold text-(--color-accent-primary)">{stats.total}</div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search bills by patient name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border-default)' }}>
                <th className="px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase">Patient</th>
                <th className="px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase">Description</th>
                <th className="px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-(--color-text-muted) uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-(--color-text-muted)">
                    No bills found.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="transition-colors hover:bg-(--color-bg-hover)" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td className="px-5 py-3.5 text-sm text-(--color-text-secondary)">
                      {new Date(bill.date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium">{bill.patient_name}</td>
                    <td className="px-5 py-3.5 text-sm text-(--color-text-secondary)">{bill.description}</td>
                    <td className="px-5 py-3.5 text-sm font-bold">{formatCurrency(bill.amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${bill.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {bill.status === 'unpaid' && (
                          <button 
                            className="btn-ghost text-xs text-(--color-accent-success)" 
                            onClick={() => updateStatus(bill.id, 'paid')}
                            title="Mark as Paid"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          className="btn-ghost text-xs text-(--color-text-muted) hover:text-(--color-accent-danger)"
                          onClick={() => deleteBill(bill.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bill Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-md glass-strong rounded-2xl p-6 animate-scale-in">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-(--color-accent-success)" />
              Generate Bill
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Patient *</label>
                <select className="input appearance-none cursor-pointer" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Description</label>
                <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Consultation Fee" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (Rs.) *</label>
                  <input type="number" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1500" />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input appearance-none cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddBill} disabled={!selectedPatient || !amount}>
                  <Plus className="w-4 h-4" /> Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
