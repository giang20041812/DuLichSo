import { useCallback, useEffect, useState } from 'react';
import { Mail, Phone, RefreshCw, StickyNote, X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminService } from '@/services/adminService';
import { partnerBookingService } from '@/services/partnerBookingService';
import type { AdminBookingDto, BookingStatus, BookingStatusSummary, PageResponse } from '@/types/admin';
import {
  ChipGroup,
  DateRangeFilter,
  FilterFooter,
  FilterSearch,
  Pagination,
  SortSelect,
  type ChipOption,
  type SortOption,
} from './AdminFilters';

const PAGE_SIZE = 15;

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Chờ xử lý',
  AWAITING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
  COMPLETED: 'Hoàn tất',
  NO_SHOW: 'Khách không đến',
};
const STATUS_TONE: Record<BookingStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  AWAITING_PAYMENT: 'border-secondary-200 bg-secondary-50 text-secondary-700',
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-primary/30 bg-primary-50 text-primary',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
  EXPIRED: 'border-border bg-canvas text-muted',
  NO_SHOW: 'border-border bg-canvas text-muted',
};
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt:desc', label: 'Đặt gần đây' },
  { value: 'createdAt:asc', label: 'Đặt lâu nhất' },
  { value: 'checkIn:asc', label: 'Nhận phòng sớm nhất' },
  { value: 'checkIn:desc', label: 'Nhận phòng muộn nhất' },
  { value: 'totalAmount:desc', label: 'Giá trị cao nhất' },
];

const vnd = (n?: number | null) => (n == null ? '—' : new Intl.NumberFormat('vi-VN').format(n) + 'đ');
const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');
const pill = (cls: string) => `rounded-sm border px-2 py-0.5 text-[10px] font-bold ${cls}`;

interface BookingsPanelProps {
  /** 'admin': toàn hệ thống; 'partner': chỉ đơn của nhà cung cấp đang đăng nhập. */
  scope?: 'admin' | 'partner';
}

export default function BookingsPanel({ scope = 'admin' }: BookingsPanelProps) {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(0);

  const [data, setData] = useState<PageResponse<AdminBookingDto> | null>(null);
  const [summary, setSummary] = useState<BookingStatusSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<AdminBookingDto | null>(null);

  const debouncedKeyword = useDebouncedValue(keyword);
  const activeCount = [debouncedKeyword, status, createdFrom || createdTo, checkInFrom || checkInTo].filter(Boolean).length;

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const clearFilters = () => {
    setKeyword('');
    setStatus('');
    setCreatedFrom('');
    setCreatedTo('');
    setCheckInFrom('');
    setCheckInTo('');
    setPage(0);
  };

  const load = useCallback(async () => {
    const api =
      scope === 'partner'
        ? { list: partnerBookingService.getBookings, summary: partnerBookingService.getSummary }
        : { list: adminService.getBookings, summary: adminService.getBookingsSummary };
    const [sortBy, sortDir] = sort.split(':') as [string, 'asc' | 'desc'];
    setLoading(true);
    setLoadError('');
    try {
      const [list, counts] = await Promise.all([
        api.list({
          keyword: debouncedKeyword.trim() || undefined,
          status: status || undefined,
          createdFrom: createdFrom || undefined,
          createdTo: createdTo || undefined,
          checkInFrom: checkInFrom || undefined,
          checkInTo: checkInTo || undefined,
          sortBy,
          sortDir,
          page,
          size: PAGE_SIZE,
        }),
        api.summary(),
      ]);
      setData(list);
      setSummary(counts);
    } catch {
      setLoadError('Không tải được danh sách đặt phòng. Vui lòng kiểm tra kết nối máy chủ và thử lại.');
    } finally {
      setLoading(false);
    }
  }, [scope, debouncedKeyword, status, createdFrom, createdTo, checkInFrom, checkInTo, sort, page]);

  useEffect(() => {
    void load();
  }, [load, reload]);

  const statusOptions: ChipOption<BookingStatus>[] = [
    { value: '', label: 'Tất cả' },
    ...(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => ({
      value: s,
      label: `${STATUS_LABEL[s]}${summary ? ` (${summary[s] ?? 0})` : ''}`,
    })),
  ];

  const th = 'px-3 py-2.5';
  const rows = data?.content ?? [];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 rounded-md border border-border bg-canvas/60 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSearch
            value={keyword}
            onChange={resetPage(setKeyword)}
            placeholder={scope === 'partner' ? 'Tìm theo mã đặt, tên / SĐT / email khách hoặc homestay...' : 'Tìm theo mã đặt, tên / SĐT / email khách, homestay hoặc nhà cung cấp...'}
          />
          <SortSelect value={sort} options={SORT_OPTIONS} onChange={resetPage(setSort)} />
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            aria-label="Tải lại"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-muted hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <ChipGroup label="Trạng thái" options={statusOptions} value={status} onChange={resetPage(setStatus)} />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <DateRangeFilter
            label="Ngày đặt"
            from={createdFrom}
            to={createdTo}
            onChange={(f, t) => {
              setCreatedFrom(f);
              setCreatedTo(t);
              setPage(0);
            }}
          />
          <DateRangeFilter
            label="Nhận phòng"
            from={checkInFrom}
            to={checkInTo}
            onChange={(f, t) => {
              setCheckInFrom(f);
              setCheckInTo(t);
              setPage(0);
            }}
          />
        </div>
        <FilterFooter total={data?.totalElements ?? 0} activeCount={activeCount} onClear={clearFilters} />
      </div>

      {loadError && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
          {loadError}
        </div>
      )}

      <div className={`overflow-x-auto rounded-md border border-border transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas font-semibold text-muted">
              <th className={th}>Mã đặt</th>
              <th className={th}>Khách hàng</th>
              <th className={th}>Homestay / Phòng</th>
              <th className={th}>Lưu trú</th>
              <th className={`${th} text-right`}>Tổng tiền</th>
              <th className={th}>Trạng thái</th>
              <th className={th}>Ngày đặt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((b) => (
              <tr
                key={b.id}
                onClick={() => setSelected(b)}
                className="cursor-pointer transition-colors hover:bg-hover/60"
              >
                <td className={`${th} font-mono font-semibold text-primary`}>{b.bookingCode}</td>
                <td className={th}>
                  <div className="font-semibold text-ink-deep">{b.guestName}</div>
                  <div className="text-[11px] text-muted">{b.guestPhone}</div>
                </td>
                <td className={th}>
                  <div className="font-medium text-ink">{b.placeName}</div>
                  <div className="text-[11px] text-muted">{b.roomTypeName} · {b.providerName}</div>
                </td>
                <td className={`${th} text-ink`}>
                  <div>{date(b.checkIn)} → {date(b.checkOut)}</div>
                  <div className="text-[11px] text-muted">{b.nights} đêm · {b.roomCount} phòng · {b.guestCount} khách</div>
                </td>
                <td className={`${th} text-right font-semibold text-ink-deep`}>{vnd(b.totalAmount)}</td>
                <td className={th}>
                  <span className={pill(STATUS_TONE[b.status])}>{STATUS_LABEL[b.status]}</span>
                </td>
                <td className={`${th} text-muted`}>{dateTime(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !loadError && (
          <div className="py-10 text-center text-xs text-muted">Không có đơn đặt phòng nào khớp bộ lọc.</div>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50" onClick={() => setSelected(null)}>
          <aside
            className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Chi tiết đơn ${selected.bookingCode}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Mã đặt phòng</p>
                <h3 className="font-mono text-lg font-bold text-primary">{selected.bookingCode}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Đóng" className="rounded-md p-1.5 text-muted hover:bg-hover">
                <X className="h-5 w-5" />
              </button>
            </div>
            <span className={`${pill(STATUS_TONE[selected.status])} w-fit`}>{STATUS_LABEL[selected.status]}</span>

            <Section title="Khách hàng">
              <p className="text-sm font-bold text-ink-deep">{selected.guestName}</p>
              <p className="flex items-center gap-2 text-xs text-ink"><Phone className="h-3.5 w-3.5 text-muted" /> {selected.guestPhone}</p>
              <p className="flex items-center gap-2 text-xs text-ink"><Mail className="h-3.5 w-3.5 text-muted" /> {selected.guestEmail || '—'}</p>
              {selected.guestNote && (
                <p className="flex items-start gap-2 rounded-md bg-canvas p-2.5 text-xs text-ink">
                  <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" /> {selected.guestNote}
                </p>
              )}
            </Section>

            <Section title="Lưu trú">
              <Row k="Homestay" v={selected.placeName} />
              <Row k="Loại phòng" v={selected.roomTypeName} />
              <Row k="Nhà cung cấp" v={selected.providerName} />
              <Row k="Nhận phòng" v={date(selected.checkIn)} />
              <Row k="Trả phòng" v={date(selected.checkOut)} />
              <Row k="Số đêm" v={`${selected.nights}`} />
              <Row k="Số phòng / khách" v={`${selected.roomCount} phòng · ${selected.guestCount} khách`} />
            </Section>

            <Section title="Thanh toán & thời gian">
              <Row k="Tổng tiền" v={vnd(selected.totalAmount)} strong />
              <Row k="Ngày đặt" v={dateTime(selected.createdAt)} />
              <Row k="Ngày xác nhận" v={dateTime(selected.confirmedAt)} />
              {selected.closedAt && <Row k="Đóng đơn lúc" v={dateTime(selected.closedAt)} />}
              {selected.closeReason && <Row k="Lý do đóng" v={selected.closeReason} />}
            </Section>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-md border border-border p-3">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">{title}</h4>
      {children}
    </section>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-muted">{k}</span>
      <span className={`text-right ${strong ? 'font-bold text-ink-deep' : 'text-ink'}`}>{v}</span>
    </div>
  );
}
