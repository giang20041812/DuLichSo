import { useState } from 'react';
import { ArrowUpDown, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StatusTone } from './StatusBadge';
import OverlayPortal from './OverlayPortal';

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
      <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-border bg-white pl-8 pr-8 text-xs text-ink transition-all duration-200 placeholder:text-muted/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xóa từ khóa"
          className="absolute right-2 top-2 text-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Toolbar gọn (High-Density): tab gạch chân có số đếm + select một dòng
// ─────────────────────────────────────────────

export interface TabItem<T extends string> {
  value: T | '';
  label: string;
  /** null/undefined = không hiện số đếm (khi backend không có số liệu). */
  count?: number | null;
  tone?: StatusTone;
}

/** Số đếm của tab đang chọn: tô đặc. */
const TAB_COUNT_ACTIVE: Record<StatusTone, string> = {
  success: 'bg-accent text-white',
  warning: 'bg-sun text-ink-deep',
  danger: 'bg-danger text-white',
  info: 'bg-secondary text-white',
  brand: 'bg-primary text-white',
  neutral: 'bg-muted text-white',
};
/** Số đếm của tab chưa chọn (khi > 0): nền nhạt cùng tông. */
const TAB_COUNT_IDLE: Record<StatusTone, string> = {
  success: 'bg-accent/10 text-primary-700',
  warning: 'bg-sun/15 text-amber-700',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-secondary/10 text-secondary-700',
  brand: 'bg-primary-50 text-primary',
  neutral: 'bg-muted/10 text-ink',
};
const TAB_TEXT_ACTIVE: Record<StatusTone, string> = {
  success: 'text-primary-700',
  warning: 'text-amber-700',
  danger: 'text-danger',
  info: 'text-secondary-700',
  brand: 'text-primary',
  neutral: 'text-ink-deep',
};
const TAB_HOVER: Record<StatusTone, string> = {
  success: 'hover:bg-accent/5 hover:text-primary-700',
  warning: 'hover:bg-sun/10 hover:text-amber-700',
  danger: 'hover:bg-danger/5 hover:text-danger',
  info: 'hover:bg-secondary/5 hover:text-secondary-700',
  brand: 'hover:bg-primary-50 hover:text-primary',
  neutral: 'hover:bg-hover hover:text-ink-deep',
};
const TAB_DOT: Record<StatusTone, string> = {
  success: 'bg-accent',
  warning: 'bg-sun',
  danger: 'bg-danger',
  info: 'bg-secondary',
  brand: 'bg-primary',
  neutral: 'bg-muted/60',
};
const TAB_UNDERLINE: Record<StatusTone, string> = {
  success: 'bg-accent',
  warning: 'bg-sun',
  danger: 'bg-danger',
  info: 'bg-secondary',
  brand: 'bg-primary',
  neutral: 'bg-muted',
};

/** Dải tab gạch chân đặt ở đầu bảng, thay cho nhóm nút lọc trạng thái chính. */
export function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: TabItem<T>[];
  value: T | '';
  onChange: (v: T | '') => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-1 overflow-x-auto border-b border-border px-3">
      {items.map((it) => {
        const active = it.value === value;
        const tone: StatusTone = it.tone ?? 'brand';
        return (
          <button
            key={it.value || 'all'}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-md px-2.5 py-2.5 text-xs font-semibold transition-colors duration-200 ${
              active ? `${TAB_TEXT_ACTIVE[tone]} bg-canvas/70` : `text-muted ${TAB_HOVER[tone]}`
            }`}
          >
            {it.tone && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${TAB_DOT[tone]} ${!active && it.count === 0 ? 'opacity-40' : ''}`} />}
            {it.label}
            {it.count != null && (
              <span
                className={`rounded px-1.5 py-px text-[10px] font-bold tabular-nums transition-colors duration-200 ${
                  active ? TAB_COUNT_ACTIVE[tone] : it.count > 0 ? TAB_COUNT_IDLE[tone] : 'bg-canvas text-muted/70'
                }`}
              >
                {it.count}
              </span>
            )}
            <span
              className={`absolute inset-x-1.5 -bottom-px h-0.5 rounded-sm transition-all duration-300 ${TAB_UNDERLINE[tone]} ${
                active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** Màu ngữ nghĩa của mục: khi chọn thì tô đặc, khi chưa chọn thì icon mang màu này. */
  tone: StatusTone;
  count?: number | null;
}

const SEG_ACTIVE: Record<StatusTone, string> = {
  brand: 'bg-primary text-white shadow-[var(--shadow-teal)]',
  info: 'bg-secondary text-white shadow-sm',
  success: 'bg-accent text-white shadow-sm',
  warning: 'bg-sun text-ink-deep shadow-sm',
  danger: 'bg-danger text-white shadow-sm',
  neutral: 'bg-ink text-white shadow-sm',
};
const SEG_IDLE: Record<StatusTone, string> = {
  brand: 'hover:bg-primary-50 hover:text-primary',
  info: 'hover:bg-secondary/10 hover:text-secondary-700',
  success: 'hover:bg-accent/10 hover:text-primary-700',
  warning: 'hover:bg-sun/15 hover:text-amber-700',
  danger: 'hover:bg-danger/10 hover:text-danger',
  neutral: 'hover:bg-hover hover:text-ink',
};
const SEG_ICON: Record<StatusTone, string> = {
  brand: 'text-primary',
  info: 'text-secondary-700',
  success: 'text-accent',
  warning: 'text-amber-700',
  danger: 'text-danger',
  neutral: 'text-muted',
};

/** Bộ chuyển mục con dạng "viên" có màu theo ngữ nghĩa từng mục (vd: Quản trị & NCC / Khách du lịch). */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  stretch = false,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  /** true: các mục chia đều chiều ngang. */
  stretch?: boolean;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={`${stretch ? 'flex' : 'inline-flex'} gap-0.5 rounded-md border border-border bg-canvas p-0.5`}>
      {options.map(({ value: v, label, icon: Icon, tone, count }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
              stretch ? 'flex-1' : ''
            } ${active ? SEG_ACTIVE[tone] : `text-muted ${SEG_IDLE[tone]}`}`}
          >
            {Icon && <Icon className={`h-3.5 w-3.5 ${active ? 'text-current' : SEG_ICON[tone]}`} />}
            {label}
            {count != null && (
              <span className={`rounded px-1.5 py-px text-[10px] font-bold tabular-nums ${active ? 'bg-white/25 text-current' : 'bg-white text-muted'}`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface SelectOption<T extends string> {
  value: T | '';
  label: string;
}

/** Select gọn cho bộ lọc phụ; khi đang lọc thì tô màu thương hiệu để dễ nhận biết. */
export function CompactSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | '';
  options: SelectOption<T>[];
  onChange: (v: T | '') => void;
}) {
  const active = value !== '';
  return (
    <label className="relative flex items-center" title={label}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | '')}
        className={`h-8 cursor-pointer appearance-none rounded-md border py-0 pl-2.5 pr-7 text-xs transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          active ? 'border-primary/50 bg-primary-50 font-semibold text-primary' : 'border-border bg-white text-ink hover:border-primary/40'
        }`}
      >
        {options.map((o) => (
          <option key={o.value || 'all'} value={o.value}>
            {`${label}: ${o.label}`}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted" />
    </label>
  );
}

/** Khoảng ngày gọn trong một ô, dùng trong toolbar một dòng. */
export function CompactDateRange({
  label,
  from,
  to,
  onChange,
}: {
  label: string;
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const active = Boolean(from || to);
  const input =
    'w-[6.9rem] bg-transparent text-xs text-ink [color-scheme:light] [accent-color:var(--color-primary)] focus:outline-none';
  return (
    <div
      className={`flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs transition-colors duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
        active ? 'border-primary/50 bg-primary-50' : 'border-border bg-white hover:border-primary/40'
      }`}
    >
      <CalendarDays className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : 'text-muted'}`} />
      <span className={`shrink-0 ${active ? 'font-semibold text-primary' : 'text-muted'}`}>{label}</span>
      <input type="date" value={from} max={to || undefined} onChange={(e) => onChange(e.target.value, to)} aria-label={`${label} từ`} className={input} />
      <span className="text-muted">–</span>
      <input type="date" value={to} min={from || undefined} onChange={(e) => onChange(from, e.target.value)} aria-label={`${label} đến`} className={input} />
      {active && (
        <button type="button" onClick={() => onChange('', '')} aria-label={`Xóa lọc ${label}`} className="text-muted hover:text-danger">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** Nút làm mới vuông nhỏ dùng trong toolbar. */
export function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tải lại"
      title="Tải lại"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-white text-muted transition-colors hover:border-primary/40 hover:text-primary"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );
}

/** Chân bảng: số kết quả + xóa bộ lọc (trái), phân trang (phải). */
export function TableFooter({
  total,
  activeCount,
  onClear,
  page,
  totalPages,
  onPage,
}: {
  total: number;
  activeCount: number;
  onClear: () => void;
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-muted">
      <span>
        <strong className="tabular-nums text-ink">{total}</strong> kết quả
        {activeCount > 0 && (
          <>
            {' · '}
            {activeCount} bộ lọc ·{' '}
            <button type="button" onClick={onClear} className="font-semibold text-primary hover:underline">
              Xóa bộ lọc
            </button>
          </>
        )}
      </span>
      <Pagination page={page} totalPages={totalPages} onChange={onPage} />
    </div>
  );
}

export interface ChipOption<T extends string> {
  value: T | '';
  label: string;
  /** Màu ngữ nghĩa của chip; bỏ trống = màu thương hiệu. */
  tone?: StatusTone;
}

const CHIP_ACTIVE: Record<StatusTone, string> = {
  success: 'border-accent bg-accent/15 text-primary-700 shadow-sm',
  warning: 'border-sun bg-sun/20 text-amber-700 shadow-sm',
  danger: 'border-danger bg-danger/10 text-danger shadow-sm',
  info: 'border-secondary bg-secondary/15 text-secondary-700 shadow-sm',
  brand: 'border-primary bg-primary text-white shadow-sm',
  neutral: 'border-muted/50 bg-muted/10 text-ink shadow-sm',
};
const CHIP_HOVER: Record<StatusTone, string> = {
  success: 'hover:border-accent/60 hover:bg-accent/5',
  warning: 'hover:border-sun/60 hover:bg-sun/10',
  danger: 'hover:border-danger/50 hover:bg-danger/5',
  info: 'hover:border-secondary/60 hover:bg-secondary/5',
  brand: 'hover:border-primary/50 hover:bg-primary-50',
  neutral: 'hover:border-muted/50 hover:bg-hover',
};
const CHIP_DOT: Record<StatusTone, string> = {
  success: 'bg-accent',
  warning: 'bg-sun',
  danger: 'bg-danger',
  info: 'bg-secondary',
  brand: 'bg-primary',
  neutral: 'bg-muted/60',
};

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
        const tone: StatusTone = o.tone ?? 'brand';
        return (
          <button
            key={o.value || 'all'}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
              active ? CHIP_ACTIVE[tone] : `border-border bg-white text-muted ${CHIP_HOVER[tone]}`
            }`}
          >
            {o.tone && <span className={`h-1.5 w-1.5 rounded-full ${active && tone === 'brand' ? 'bg-white' : CHIP_DOT[tone]}`} />}
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
    'h-7 rounded-md border border-border bg-white pl-6 pr-1.5 text-xs text-ink [color-scheme:light] [accent-color:var(--color-primary)] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="relative">
        <CalendarDays className="pointer-events-none absolute left-1.5 top-1.5 h-3.5 w-3.5 text-muted" />
        <input type="date" value={from} max={to || undefined} onChange={(e) => onChange(e.target.value, to)} aria-label={`${label} từ`} className={inputClass} />
      </span>
      <span className="text-xs text-muted">→</span>
      <span className="relative">
        <CalendarDays className="pointer-events-none absolute left-1.5 top-1.5 h-3.5 w-3.5 text-muted" />
        <input type="date" value={to} min={from || undefined} onChange={(e) => onChange(from, e.target.value)} aria-label={`${label} đến`} className={inputClass} />
      </span>
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
    <label className="relative flex items-center" title="Sắp xếp">
      <span className="sr-only">Sắp xếp</span>
      <ArrowUpDown className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 cursor-pointer appearance-none rounded-md border border-border bg-white py-0 pl-7 pr-7 text-xs text-ink transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted" />
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
    'inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-border bg-white px-1.5 text-xs font-medium tabular-nums text-ink transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40';
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Phân trang">
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
    <OverlayPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/60 p-4 backdrop-blur-[2px]">
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
    </OverlayPortal>
  );
}
