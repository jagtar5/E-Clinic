import { useState, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';

/**
 * Reusable searchable combobox with fuzzy search
 * Supports single and multi-select modes
 */
export default function SearchableCombobox({
  items = [],
  value,
  onChange,
  placeholder = 'Search...',
  labelKey = 'name',
  valueKey = 'id',
  renderItem,
  multi = false,
  className = '',
  disabled = false,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items with fuzzy match
  const filtered = query
    ? items.filter((item) => {
        const label = item[labelKey] || '';
        const extra = item.code || item.formulation || item.category || '';
        const combined = `${label} ${extra}`.toLowerCase();
        return combined.includes(query.toLowerCase());
      })
    : items;

  // Reset highlight when filtered changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && open) {
      const el = listRef.current.children[highlightIndex];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex, open]);

  function handleKeyDown(e) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIndex]) {
          selectItem(filtered[highlightIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  }

  function selectItem(item) {
    if (multi) {
      const currentValues = Array.isArray(value) ? value : [];
      const exists = currentValues.some((v) => v[valueKey] === item[valueKey]);
      if (exists) {
        onChange(currentValues.filter((v) => v[valueKey] !== item[valueKey]));
      } else {
        onChange([...currentValues, item]);
      }
      setQuery('');
    } else {
      onChange(item);
      setQuery('');
      setOpen(false);
    }
  }

  function removeItem(item) {
    if (multi && Array.isArray(value)) {
      onChange(value.filter((v) => v[valueKey] !== item[valueKey]));
    }
  }

  const selectedValues = multi ? (Array.isArray(value) ? value : []) : [];
  const isSelected = (item) => {
    if (multi) return selectedValues.some((v) => v[valueKey] === item[valueKey]);
    return value && value[valueKey] === item[valueKey];
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected Tags (multi mode) */}
      {multi && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedValues.map((item) => (
            <span
              key={item[valueKey]}
              className="badge badge-primary flex items-center gap-1 pr-1"
            >
              {item[labelKey]}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="hover:text-white ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
        <input
          ref={inputRef}
          className="input"
          style={{ paddingLeft: '2.5rem' }}
          placeholder={
            !multi && value
              ? value[labelKey]
              : placeholder
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        {!multi && value && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text-primary)"
            onClick={() => {
              onChange(null);
              setQuery('');
              inputRef.current?.focus();
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1 py-1 rounded-xl overflow-hidden animate-scale-in"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '240px',
            overflowY: 'auto',
          }}
          ref={listRef}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-(--color-text-muted) text-center">
              No results found
            </div>
          ) : (
            filtered.slice(0, 50).map((item, i) => (
              <div
                key={item[valueKey]}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  i === highlightIndex ? 'bg-(--color-bg-hover)' : ''
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onClick={() => selectItem(item)}
              >
                {/* Check icon for selected */}
                <div className="w-4 flex-shrink-0">
                  {isSelected(item) && <Check className="w-4 h-4 text-(--color-accent-success)" />}
                </div>

                {/* Custom render or default */}
                {renderItem ? (
                  renderItem(item)
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item[labelKey]}</div>
                    {(item.code || item.formulation || item.category) && (
                      <div className="text-xs text-(--color-text-muted) truncate">
                        {[item.code, item.formulation, item.category].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
