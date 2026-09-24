import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Eye, X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminService } from '@/services/adminService';
import { partnerBookingService } from '@/services/partnerBookingService';
import { getApiErrorMessage } from '@/lib/apiError';
import type {
  AdminBookingDto,
  BookingAttentionItem,
  BookingStatus,
  BookingStatusSummary,
  PageResponse,
} from '@/types/admin';
import {
  CompactDateRange,
  FilterSearch,
  RefreshButton,
  SortSelect,
  TableFooter,
  UnderlineTabs,
  type SortOption,
  type TabItem,
} from './AdminFilters';
import { StatusBadge } from './StatusBadge';
import { actionButtonClass } from './statusStyles';
import BookingDetailDrawer from './BookingDetailDrawer';
import { ATTENTION_TONE, STATUS_LABEL, STATUS_TONE, fmtDate, fmtDateTime, isPendingStatus, vnd } from './bookingMeta';

const PAGE_SIZE = 15;

const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt:desc', label: 'Đặt gần đây' },
  { value: 'createdAt:asc', label: 'Đặt lâu nhất' },
  { value: 'checkIn:asc', label: 'Nhận phòng sớm nhất' },
  { value: 'checkIn:desc', label: 'Nhận phòng muộn nhất' },
  { value: 'totalAmount:desc', label: 'Giá trị cao nhất' },
];

const STATUS_ORDER: BookingStatus[] = ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED', 'NO_SHOW'];

/** Giá trị tab đặc biệt cho danh sách "Cần chú ý" (chỉ Admin). */
const ATTENTION_TAB = 'ATTENTION';
type TabValue = BookingStatus | typeof ATTENTION_TAB;

/** Bộ lọc khởi tạo khi mở từ nơi khác (vd: drill-down từ báo cáo). */
export interface BookingsPreset {
  providerId?: number;
  placeId?: number;
  status?: BookingStatus;
  createdFrom?: string;
  createdTo?: string;
  /** Mô tả ngắn hiển thị cho người dùng, vd: "NCC Hello Mù Cang Chải · T9/2026". */
  label?: string;
}

interface BookingsPanelProps {
  /** 'admin': toàn hệ thống; 'partner': chỉ đơn của nhà cung cấp đang đăng nhập. */
  scope?: 'admin' | 'partner';
  preset?: BookingsPreset;
}

export default function BookingsPanel({ scope = 'admin', preset }: BookingsPanelProps) {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>(preset?.status ?? '');
  const [createdFrom, setCreatedFrom] = useState(preset?.createdFrom ?? '');
  const [createdTo, setCreatedTo] = useState(preset?.createdTo ?? '');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');
  const [providerId, setProviderId] = useState<number | undefined>(preset?.providerId);
  const [placeId, setPlaceId] = useState<number | undefined>(preset?.placeId);
  const [presetLabel, setPresetLabel] = useState(preset?.label ?? '');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<'all' | 'attention'>('all');

  const [data, setData] = useState<PageResponse<AdminBookingDto> | null>(null);
  const [summary, setSummary] = useState<BookingStatusSummary | null>(null);
  const [attention, setAttention] = useState<BookingAttentionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<AdminBookingDto | null>(null);

  const debouncedKeyword = useDebouncedValue(keyword);
  const activeCount = [debouncedKeyword, status, createdFrom || createdTo, checkInFrom || checkInTo, providerId, placeId].filter(Boolean).length;

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
    setProviderId(undefined);
    setPlaceId(undefined);
    setPresetLabel('');
    setPage(0);
  };

  const load = useCallback(async () => {
    const [sortBy, sortDir] = sort.split(':') as [string, 'asc' | 'desc'];
    setLoading(true);
    setLoadError('');
    try {
      if (scope === 'admin' && mode === 'attention') {
        setAttention(await adminService.getBookingAttention());
        return;
      }
      const params = {
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
      };
      if (scope === 'partner') {
        const [list, counts] = await Promise.all([partnerBookingService.getBookings(params), partnerBookingService.getSummary()]);
        setData(list);
        setSummary(counts);
      } else {
        const [list, counts, att] = await Promise.all([
          adminService.getBookings({ ...params, providerId, placeId }),
          adminService.getBookingsSummary(),
          adminService.getBookingAttention(),
        ]);
        setData(list);
        setSummary(counts);
        setAttention(att);
      }
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Không tải được danh sách đặt phòng. Vui lòng kiểm tra kết nối máy chủ và thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [scope, mode, debouncedKeyword, status, createdFrom, createdTo, checkInFrom, checkInTo, providerId, placeId, sort, page]);

  useEffect(() => {
    void load();
  }, [load, reload]);

  const showingAttention = scope === 'admin' && mode === 'attention';
  const attentionCount = attention?.length ?? 0;
  const totalAll = summary ? STATUS_ORDER.reduce((a, s) => a + (summary[s] ?? 0), 0) : null;

  const tabs: TabItem<TabValue>[] = [
    { value: '', label: 'Tất cả', count: totalAll },
    ...(scope === 'admin'
      ? [{ value: ATTENTION_TAB as TabValue, label: 'Cần chú ý', count: attention ? attentionCount : null, tone: 'danger' as const }]
      : []),
    ...STATUS_ORDER.map((s) => ({ value: s as TabValue, label: STATUS_LABEL[s], count: summary ? summary[s] ?? 0 : null, tone: STATUS_TONE[s] })),
  ];
  const tabValue: TabValue | '' = showingAttention ? ATTENTION_TAB : status;
  const onTab = (v: TabValue | '') => {
    setPage(0);
    if (v === ATTENTION_TAB) {
      setMode('attention');
      return;
    }
    setMode('all');
    setStatus(v);
  };

  const th = 'px-4 py-2.5';
  const td = 'px-4 py-2.5';
  const rows = showingAttention
    ? (attention ?? []).map((a) => ({ b: a.booking, reason: a as BookingAttentionItem | null }))
    : (data?.content ?? []).map((b) => ({ b, reason: null as BookingAttentionItem | null }));

  return (
    <section className="rounded-lg border border-border bg-white shadow-sm">
      <UnderlineTabs ariaLabel="Trạng thái đơn" items={tabs} value={tabValue} onChange={onTab} />

      {showingAttention ? (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-danger/5 px-4 py-2.5 text-xs text-ink">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            Chờ NCC quá 24 giờ, quá hạn thanh toán, đã qua ngày trả phòng chưa hoàn tất, hoặc được đánh dấu cần theo dõi.
          </span>
          <RefreshButton loading={loading} onClick={() => setReload((n) => n + 1)} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          <FilterSearch
            value={keyword}
            onChange={resetPage(setKeyword)}
            placeholder={scope === 'partner' ? 'Tìm theo mã đặt, tên / SĐT khách hoặc homestay...' : 'Tìm theo mã đặt VJ-..., tên khách, SĐT hoặc Homestay...'}
          />
          <CompactDateRange
            label="Ngày đặt"
            from={createdFrom}
            to={createdTo}
            onChange={(f, t) => {
              setCreatedFrom(f);
              setCreatedTo(t);
              setPage(0);
            }}
          />
          <CompactDateRange
            label="Nhận phòng"
            from={checkInFrom}
            to={checkInTo}
            onChange={(f, t) => {
              setCheckInFrom(f);
              setCheckInTo(t);
              setPage(0);
            }}
          />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <SortSelect value={sort} options={SORT_OPTIONS} onChange={resetPage(setSort)} />
            <RefreshButton loading={loading} onClick={() => setReload((n) => n + 1)} />
          </div>
          {presetLabel && (
            <span className="rise-in flex w-full items-center gap-2 text-xs">
              <StatusBadge tone="brand">Đang lọc: {presetLabel}</StatusBadge>
              <button
                type="button"
                onClick={() => {
                  setProviderId(undefined);
                  setPlaceId(undefined);
                  setPresetLabel('');
                  setPage(0);
                }}
                className="flex items-center gap-1 text-muted hover:text-danger"
              >
                <X className="h-3.5 w-3.5" /> Bỏ lọc này
              </button>
            </span>
          )}
        </div>
      )}

      {loadError && (
        <div role="alert" className="border-b border-danger/20 bg-danger/5 px-4 py-2.5 text-xs text-danger">
          {loadError}
        </div>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className={th}>Mã đặt</th>
              <th className={th}>Khách hàng</th>
              <th className={th}>Homestay / Phòng</th>
              <th className={th}>Lưu trú</th>
              <th className={`${th} text-right`}>Tổng tiền</th>
              <th className={th}>{showingAttention ? 'Lý do cần chú ý' : 'Trạng thái'}</th>
              <th className={th}>Ngày đặt</th>
              <th className={`${th} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map(({ b, reason }) => (
              <tr key={b.id} onClick={() => setSelected(b)} className="cursor-pointer transition-colors duration-150 hover:bg-canvas">
                <td className={`${td} whitespace-nowrap font-mono font-semibold text-primary`}>{b.bookingCode}</td>
                <td className={td}>
                  <div className="max-w-[180px] truncate font-semibold text-ink-deep">{b.guestName}</div>
                  <div className="text-[11px] tabular-nums text-muted">{b.guestPhone}</div>
                </td>
                <td className={td}>
                  <div className="max-w-[220px] truncate font-medium text-ink">{b.placeName}</div>
                  <div className="max-w-[220px] truncate text-[11px] text-muted">
                    {b.roomTypeName} · {b.providerName}
                  </div>
                </td>
                <td className={`${td} whitespace-nowrap text-ink`}>
                  <div>
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                  </div>
                  <div className="text-[11px] text-muted">
                    {b.nights} đêm · {b.roomCount} phòng · {b.guestCount} khách
                  </div>
                </td>
                <td className={`${td} whitespace-nowrap text-right font-semibold tabular-nums text-ink-deep`}>{vnd(b.totalAmount)}</td>
                <td className={td}>
                  {reason ? (
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge tone={ATTENTION_TONE[reason.reason]} pulse>
                        {reason.reasonLabel}
                      </StatusBadge>
                      <span className="text-[11px] text-muted">{STATUS_LABEL[b.status]}</span>
                    </div>
                  ) : (
                    <StatusBadge tone={STATUS_TONE[b.status]} pulse={isPendingStatus(b.status)}>
                      {STATUS_LABEL[b.status]}
                    </StatusBadge>
                  )}
                </td>
                <td className={`${td} whitespace-nowrap text-muted`}>{fmtDateTime(b.createdAt)}</td>
                <td className={`${td} text-right`} onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => setSelected(b)} className={actionButtonClass('brand')} aria-label={`Chi tiết đơn ${b.bookingCode}`}>
                    <Eye className="h-3 w-3" /> Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !loadError && rows.length === 0 && (
          <div className="py-12 text-center text-xs text-muted">
            {showingAttention ? 'Không có đơn nào cần chú ý.' : 'Không có đơn đặt phòng nào khớp bộ lọc.'}
          </div>
        )}
      </div>

      {showingAttention ? (
        <div className="border-t border-border px-4 py-2.5 text-xs text-muted">
          <strong className="tabular-nums text-ink">{attentionCount}</strong> đơn cần chú ý
        </div>
      ) : (
        <TableFooter
          total={data?.totalElements ?? 0}
          activeCount={activeCount}
          onClear={clearFilters}
          page={page}
          totalPages={data?.totalPages ?? 0}
          onPage={setPage}
        />
      )}

      {selected && (
        <BookingDetailDrawer
          key={selected.id}
          booking={selected}
          scope={scope}
          onClose={() => setSelected(null)}
          onChanged={() => setReload((n) => n + 1)}
        />
      )}
    </section>
  );
}
