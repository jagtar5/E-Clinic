/**
 * Local data store — localStorage-backed CRUD layer
 * Mirrors Supabase API patterns for easy future migration
 */
import {
  seedPatients,
  seedMedicines,
  seedSymptoms,
  seedDiagnoses,
  seedLabTests,
} from '../data/seed';

const STORE_PREFIX = 'cms_';

function getKey(table) {
  return `${STORE_PREFIX}${table}`;
}

function loadTable(table, fallback = []) {
  try {
    const raw = localStorage.getItem(getKey(table));
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupted — reset
  }
  return fallback;
}

function saveTable(table, data) {
  localStorage.setItem(getKey(table), JSON.stringify(data));
}

// Initialize seed data if not present
function initStore() {
  const tables = {
    patients: seedPatients,
    medicines: seedMedicines,
    symptoms: seedSymptoms,
    diagnoses: seedDiagnoses,
    lab_tests: seedLabTests,
    encounters: [],
    prescriptions: [],
    appointments: [],
    bills: [],
  };

  for (const [table, seed] of Object.entries(tables)) {
    if (!localStorage.getItem(getKey(table))) {
      saveTable(table, seed);
    }
  }
}

// Initialize on import
initStore();

/**
 * Generic CRUD operations
 */
export const db = {
  // SELECT all from a table, with optional filters
  select(table, { search, filters, sortBy, sortOrder, limit, offset } = {}) {
    let data = loadTable(table);

    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          data = data.filter((row) => {
            const rowVal = row[key];
            if (Array.isArray(value)) {
              return value.includes(rowVal);
            }
            if (typeof rowVal === 'string') {
              return rowVal.toLowerCase().includes(String(value).toLowerCase());
            }
            return rowVal === value;
          });
        }
      }
    }

    // Apply text search across common fields
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((val) => {
          if (typeof val === 'string') return val.toLowerCase().includes(q);
          if (typeof val === 'number') return String(val).includes(q);
          return false;
        })
      );
    }

    // Sort
    if (sortBy) {
      data.sort((a, b) => {
        const aVal = a[sortBy] ?? '';
        const bVal = b[sortBy] ?? '';
        const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    }

    const total = data.length;

    // Pagination
    if (offset !== undefined) data = data.slice(offset);
    if (limit !== undefined) data = data.slice(0, limit);

    return { data, total };
  },

  // SELECT single by ID
  findById(table, id) {
    const data = loadTable(table);
    return data.find((row) => row.id === id) || null;
  },

  // INSERT
  insert(table, record) {
    const data = loadTable(table);
    const newRecord = {
      ...record,
      id: record.id || generateId(),
      created_at: record.created_at || new Date().toISOString(),
    };
    data.unshift(newRecord); // prepend (newest first)
    saveTable(table, data);
    return newRecord;
  },

  // UPDATE
  update(table, id, updates) {
    const data = loadTable(table);
    const index = data.findIndex((row) => row.id === id);
    if (index === -1) return null;
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
    saveTable(table, data);
    return data[index];
  },

  // DELETE
  delete(table, id) {
    const data = loadTable(table);
    const filtered = data.filter((row) => row.id !== id);
    if (filtered.length === data.length) return false;
    saveTable(table, filtered);
    return true;
  },

  // Bulk INSERT
  bulkInsert(table, records) {
    const data = loadTable(table);
    const newRecords = records.map((r) => ({
      ...r,
      id: r.id || generateId(),
      created_at: r.created_at || new Date().toISOString(),
    }));
    saveTable(table, [...newRecords, ...data]);
    return newRecords;
  },

  // Count
  count(table, filters) {
    const { total } = this.select(table, { filters });
    return total;
  },

  // Reset a table to seed data
  reset(table) {
    localStorage.removeItem(getKey(table));
    initStore();
  },

  // Reset all tables
  resetAll() {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORE_PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
    initStore();
  },
};

function generateId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

export default db;
