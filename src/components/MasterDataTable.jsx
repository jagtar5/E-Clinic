import { useState } from 'react';
import { Search, Plus, Edit3, Trash2, Check, X, AlertCircle } from 'lucide-react';

/**
 * Reusable CRUD data table with inline editing, search, and pagination
 */
export default function MasterDataTable({
  data,
  columns,
  onAdd,
  onUpdate,
  onDelete,
  addLabel = 'Add New',
}) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newValues, setNewValues] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 12;

  // Filter
  const filtered = search
    ? data.filter((row) =>
        columns.some((col) => {
          const val = row[col.key];
          return typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

  function startEdit(row) {
    setEditingId(row.id);
    const vals = {};
    columns.forEach((col) => {
      if (col.editable !== false) vals[col.key] = row[col.key] || '';
    });
    setEditValues(vals);
  }

  function saveEdit() {
    onUpdate(editingId, editValues);
    setEditingId(null);
    setEditValues({});
  }

  function startAdd() {
    setAddingNew(true);
    const vals = {};
    columns.forEach((col) => {
      if (col.editable !== false) vals[col.key] = '';
    });
    setNewValues(vals);
  }

  function saveAdd() {
    const hasContent = Object.values(newValues).some((v) => v.trim());
    if (!hasContent) return;
    onAdd(newValues);
    setAddingNew(false);
    setNewValues({});
  }

  function confirmDelete(id) {
    onDelete(id);
    setDeleteConfirm(null);
  }

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <button className="btn-primary flex-shrink-0" onClick={startAdd}>
          <Plus className="w-4 h-4" /> {addLabel}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-border-default)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border-default)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              <th className="text-right px-4 py-3 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Add New Row */}
            {addingNew && (
              <tr style={{ background: 'rgba(59, 130, 246, 0.05)', borderBottom: '1px solid var(--color-border-default)' }}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2">
                    {col.editable === false ? (
                      <span className="text-xs text-(--color-text-muted)">Auto</span>
                    ) : col.type === 'select' ? (
                      <select
                        className="input text-sm py-1.5"
                        value={newValues[col.key] || ''}
                        onChange={(e) => setNewValues({ ...newValues, [col.key]: e.target.value })}
                      >
                        <option value="">Select</option>
                        {col.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="input text-sm py-1.5"
                        placeholder={col.placeholder || col.label}
                        value={newValues[col.key] || ''}
                        onChange={(e) => setNewValues({ ...newValues, [col.key]: e.target.value })}
                        autoFocus={col === columns.find((c) => c.editable !== false)}
                      />
                    )}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button className="btn-ghost p-1.5 text-(--color-accent-success)" onClick={saveAdd}>
                      <Check className="w-4 h-4" />
                    </button>
                    <button className="btn-ghost p-1.5 text-(--color-text-muted)" onClick={() => setAddingNew(false)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-(--color-text-muted)">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No data found</div>
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-(--color-bg-hover)"
                  style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {editingId === row.id && col.editable !== false ? (
                        col.type === 'select' ? (
                          <select
                            className="input text-sm py-1.5"
                            value={editValues[col.key] || ''}
                            onChange={(e) => setEditValues({ ...editValues, [col.key]: e.target.value })}
                          >
                            <option value="">Select</option>
                            {col.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="input text-sm py-1.5"
                            value={editValues[col.key] || ''}
                            onChange={(e) => setEditValues({ ...editValues, [col.key]: e.target.value })}
                          />
                        )
                      ) : (
                        <span className={`text-sm ${col.key === columns[0].key ? 'font-medium text-(--color-text-primary)' : 'text-(--color-text-secondary)'}`}>
                          {col.render ? col.render(row[col.key], row) : row[col.key] || '—'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === row.id ? (
                        <>
                          <button className="btn-ghost p-1.5 text-(--color-accent-success)" onClick={saveEdit}>
                            <Check className="w-4 h-4" />
                          </button>
                          <button className="btn-ghost p-1.5 text-(--color-text-muted)" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : deleteConfirm === row.id ? (
                        <>
                          <button className="btn-ghost p-1.5 text-(--color-accent-danger) text-xs" onClick={() => confirmDelete(row.id)}>
                            Confirm
                          </button>
                          <button className="btn-ghost p-1.5 text-(--color-text-muted) text-xs" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-ghost p-1.5 text-(--color-text-muted) hover:text-(--color-accent-primary)" onClick={() => startEdit(row)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button className="btn-ghost p-1.5 text-(--color-text-muted) hover:text-(--color-accent-danger)" onClick={() => setDeleteConfirm(row.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-(--color-text-muted)">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} · Page {page + 1}/{totalPages}
          </span>
          <div className="flex gap-1">
            <button className="btn-ghost px-3 py-1.5 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn-ghost px-3 py-1.5 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
