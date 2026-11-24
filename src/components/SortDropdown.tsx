import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import type { CatalogSortOrder } from '../types/nexplay';

export interface SortOption {
  value: CatalogSortOrder;
  label: string;
  hint: string;
}

export const CATALOG_SORT_OPTIONS: SortOption[] = [
  {
    value: 'newest',
    label: 'Eng yangi (Newest)',
    hint: "So'nggi qo'shilgan o'yinlar birinchi",
  },
  {
    value: 'popular',
    label: "Eng ko'p o'ynalgan (Most Played)",
    hint: "Startlar soni bo'yicha yuqoridan pastga",
  },
  {
    value: 'title',
    label: "Alifbo bo'yicha (Alphabetical)",
    hint: "Nomi A–Z tartibida",
  },
];

interface SortDropdownProps {
  value: CatalogSortOrder;
  onChange: (next: CatalogSortOrder) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeOption =
    CATALOG_SORT_OPTIONS.find((opt) => opt.value === value) || CATALOG_SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;

    const handleDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = CATALOG_SORT_OPTIONS.findIndex((o) => o.value === value);
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const nextIdx =
          (idx + delta + CATALOG_SORT_OPTIONS.length) % CATALOG_SORT_OPTIONS.length;
        onChange(CATALOG_SORT_OPTIONS[nextIdx].value);
      }
    };

    document.addEventListener('mousedown', handleDocClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, value, onChange]);

  return (
    <div ref={rootRef} id="catalog-sort-dropdown" className="relative">
      <button
        type="button"
        id="catalog-sort-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="catalog-sort-menu"
        aria-label="Saralash tartibi"
        onClick={() => setOpen((prev) => !prev)}
        className={`nx-input rounded-xl px-3.5 py-2.5 text-xs inline-flex items-center justify-between gap-2.5 min-w-[185px] sm:min-w-[215px] whitespace-nowrap cursor-pointer ${
          open ? 'border-blue-400/70 bg-[#080d1a]' : ''
        }`}
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span className="font-medium text-white truncate">{activeOption.label}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="catalog-sort-menu"
            role="listbox"
            aria-label="O'yinlarni saralash variantlari"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0b1222] border border-white/[0.14] shadow-[0_24px_54px_-12px_rgba(0,0,0,0.96)] p-1.5 z-50"
          >
            {CATALOG_SORT_OPTIONS.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-sort-value={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-white/[0.1] text-white'
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-[11px] text-slate-400 leading-snug">{opt.hint}</div>
                  </div>
                  {selected && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
