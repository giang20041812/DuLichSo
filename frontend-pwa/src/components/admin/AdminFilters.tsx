import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

export function FilterSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-border bg-white pl-9 pr-8 text-xs text-ink transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xóa từ khóa"
          className="absolute right-2 top-2.5 text-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export interface ChipOption<T extends string> {
  value: T | '';
  label: string;
}

/** Nhóm chip chọn một giá trị; `value: ''` là "Tất cả". */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T | '';
  onChange: (v: T | '') => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={label}>
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value || 'all'}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`h-7 rounded-md border px-2.5 text-xs font-medium transition-all duration-200 ${
              active
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-border bg-white text-muted hover:border-primary/40 hover:text-primary'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function DateRangeFilter({
  label = 'Ngày tạo',
  from,
  to,
  onChange,
}: {
  label?: string;
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const inputClass =
    'h-7 rounded-md border border-border bg-white px-2 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <input type="date" value={from} max={to || undefined} onChange={(e) => onChange(e.target.value, to)} aria-label={`${label} từ`} className={inputClass} />
      <span className="text-xs text-muted">→</span>
      <input type="date" value={to} min={from || undefined} onChange={(e) => onChange(from, e.target.value)} aria-label={`${label} đến`} className={inputClass} />
    </div>
  );
}

export interface SortOption {
  value: string; // dạng "field:dir"
  label: string;
}

export function SortSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SortOption[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted">
      <span className="text-[11px] font-semibold uppercase tracking-wide">Sắp xếp</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 rounded-md border border-border bg-white px-2 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterFooter({
  total,
  activeCount,
  onClear,
}: {
  total: number;
  activeCount: number;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-muted">
      <span>
        <strong className="text-ink">{total}</strong> kết quả
        {activeCount > 0 && <> · đang áp dụng {activeCount} bộ lọc</>}
      </span>
      {activeCount > 0 && (
        <button type="button" onClick={onClear} className="font-semibold text-primary hover:underline">
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number; // bắt đầu từ 0
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-white px-2 text-xs font-medium text-ink transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40';
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Phân trang">
      <button type="button" className={btn} disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Trang trước">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`${btn} ${p === page ? '!border-primary !bg-primary !text-white' : ''}`}
        >
          {p + 1}
        </button>
      ))}
      <button type="button" className={btn} disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} aria-label="Trang sau">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

/** Hộp thoại xác nhận có ô nhập lý do (dùng khi khóa / từ chối / ẩn). */
export function ReasonDialog({
  title,
  description,
  confirmLabel,
  reasonRequired,
  tone = 'danger',
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  reasonRequired: boolean;
  tone?: 'danger' | 'primary';
  error?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-border bg-white p-5 shadow-xl">
        <h3 className="font-display text-base font-bold text-ink-deep">{title}</h3>
        <p className="text-xs leading-relaxed text-muted">{description}</p>
        <label htmlFor="reason-dialog-input" className="text-xs font-semibold text-ink-deep">
          Lý do {reasonRequired && <span className="text-danger">*</span>}
        </label>
        <textarea
          id="reason-dialog-input"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-xs font-medium text-muted hover:bg-hover">
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            className={`rounded-md px-4 py-2 text-xs font-semibold text-white ${
              tone === 'danger' ? 'bg-danger hover:opacity-90' : 'bg-primary hover:bg-primary-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
