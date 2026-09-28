import { useCallback, useEffect, useMemo, useState } from 'react';
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
import StatusFilter, { type StatusFilterItem } from './StatusFilter';
import { STATUS_COLOR } from './statusColor';
import { useUrlStatus } from '@/hooks/useUrlStatus';
import { useStatusCounts } from '@/hooks/useStatusCounts';
import { actionButtonClass } from './statusStyles';
import BookingDetailDrawer from './BookingDetailDrawer';
import {
  ATTENTION_TONE,
  BOOKING_GROUP_STATUSES,
  STATUS_LABEL,
  STATUS_TONE,
  fmtDate,
  fmtDateTime,
  isPendingStatus,
  vnd,
  type BookingGroup,
} from './bookingMeta';

const PAGE_SIZE = 15;

const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt:desc', label: 'Đặt gần đây' },
  { value: 'createdAt:asc', label: 'Đặt lâu nhất' },
  { value: 'checkIn:asc', label: 'Nhận phòng sớm nhất' },
  { value: 'checkIn:desc', label: 'Nhận phòng muộn nhất' },
  { value: 'totalAmount:desc', label: 'Giá trị cao nhất' },
];

const STATUS_ORDER: BookingStatus[] = [
  'PENDING',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'COMPLETED',
  'REFUNDED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
  'NO_SHOW',
];

/**
 * Cổng Admin: tab gom nhóm trạng thái thật của đơn (BOOKING_GROUP_STATUSES). "Cần chú ý" là danh sách suy ra
 * (không phải một trạng thái trong DB) nên đặt cuối dải tab.
 */
const ATTENTION_TAB = 'ATTENTION';
type AdminTab = BookingGroup | typeof ATTENTION_TAB;
const ADMIN_TAB_ITEMS: StatusFilterItem<AdminTab>[] = [
  { value: 'NEW', label: 'Mới', tone: STATUS_COLOR.blue },
  { value: 'CONFIRMED', label: 'Đã xác nhận', tone: STATUS_COLOR.green },
  { value: 'DONE', label: 'Hoàn thành', tone: STATUS_COLOR.gray },
  { value: 'CANCELLED', label: 'Đã hủy', tone: STATUS_COLOR.gray },
  { value: ATTENTION_TAB, label: 'Cần chú ý', tone: STATUS_COLOR.red },
];
const ADMIN_TAB_VALUES = ADMIN_TAB_ITEMS.map((i) => i.value);
const GROUP_VALUES = ADMIN_TAB_VALUES.filter((v): v is BookingGroup => v !== ATTENTION_TAB);

/** Nhóm chứa một trạng thái đơn (dùng khi mở từ drill-down báo cáo với đúng một trạng thái). */
const groupOf = (s: BookingStatus): BookingGroup | '' => GROUP_VALUES.find((g) => BOOKING_GROUP_STATUSES[g].includes(s)) ?? '';

/** Bộ lọc khởi tạo khi mở từ nơi khác (vd: drill-down từ báo cáo). */
export interface BookingsPreset {
  providerId?: number;
  placeId?: number;
  status?: BookingStatus;
  createdFrom?: string;
  createdTo?: string;
  /** Mô tả ngắn hiển thị cho người dùng, vd: "NCC Hello Mù Cang Chải · T9/2026". */
  label?: string;
  /** Thời điểm chốt của báo cáo vừa drill-down (UC-AD-07): dữ liệu ở đây là hiện tại, có thể đã khác thời điểm đó. */
  generatedAt?: string;
}

interface BookingsPanelProps {
  /** 'admin': toàn hệ thống; 'partner': chỉ đơn của nhà cung cấp đang đăng nhập. */
  scope?: 'admin' | 'partner';
  preset?: BookingsPreset;
}

export default function BookingsPanel({ scope = 'admin', preset }: BookingsPanelProps) {
  const [keyword, setKeyword] = useState('');
  // Cổng NCC: bộ lọc trạng thái đơn lẻ. Cổng Admin: chỉ giữ trạng thái đơn lẻ khi mở từ drill-down báo cáo,
  // còn lại dùng tab nhóm lưu trên URL (?status=).
  const [status, setStatus] = useState<BookingStatus | ''>(preset?.status ?? '');
  const [adminTab, setAdminTab] = useUrlStatus<AdminTab>(ADMIN_TAB_VALUES, '');
  const [createdFrom, setCreatedFrom] = useState(preset?.createdFrom ?? '');
  const [createdTo, setCreatedTo] = useState(preset?.createdTo ?? '');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');
  const [providerId, setProviderId] = useState<number | undefined>(preset?.providerId);
  const [placeId, setPlaceId] = useState<number | undefined>(preset?.placeId);
  const [presetLabel, setPresetLabel] = useState(preset?.label ?? '');
  const [presetGeneratedAt, setPresetGeneratedAt] = useState(preset?.generatedAt ?? '');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(0);

  const [data, setData] = useState<PageResponse<AdminBookingDto> | null>(null);
  const [summary, setSummary] = useState<BookingStatusSummary | null>(null);
  const [attention, setAttention] = useState<BookingAttentionItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<AdminBookingDto | null>(null);

  const debouncedKeyword = useDebouncedValue(keyword);
  const showingAttention = scope === 'admin' && adminTab === ATTENTION_TAB;
  /** Các trạng thái thật gửi lên backend cho tab Admin đang chọn (trạng thái đơn lẻ từ drill-down được ưu tiên). */
  const adminStatuses = useMemo<BookingStatus[] | undefined>(
    () => (status ? [status] : adminTab && adminTab !== ATTENTION_TAB ? BOOKING_GROUP_STATUSES[adminTab] : undefined),
    [status, adminTab],
  );
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
      if (showingAttention) {
        setAttention(await adminService.getBookingAttention());
        return;
      }
      const params = {
        keyword: debouncedKeyword.trim() || undefined,
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
        const [list, counts] = await Promise.all([
          partnerBookingService.getBookings({ ...params, status: status || undefined }),
          partnerBookingService.getSummary(),
        ]);
        setData(list);
        setSummary(counts);
      } else {
        const [list, att] = await Promise.all([
          adminService.getBookings({ ...params, statuses: adminStatuses, providerId, placeId }),
          adminService.getBookingAttention(),
        ]);
        setData(list);
        setAttention(att);
      }
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Không tải được danh sách đặt phòng. Vui lòng kiểm tra kết nối máy chủ và thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [scope, showingAttention, adminStatuses, debouncedKeyword, status, createdFrom, createdTo, checkInFrom, checkInTo, providerId, placeId, sort, page]);

  useEffect(() => {
    void load();
  }, [load, reload]);

  const attentionCount = attention?.length ?? 0;
  const totalAll = summary ? STATUS_ORDER.reduce((a, s) => a + (summary[s] ?? 0), 0) : null;

  /** Số lượng trên từng tab nhóm (Admin): áp dụng cùng từ khóa / ngày / NCC / điểm đến, chỉ khác nhóm trạng thái. */
  const groupCounts = useStatusCounts(
    scope === 'admin' ? GROUP_VALUES : [],
    async (g) => {
      if (scope !== 'admin') return 0;
      const res = await adminService.getBookings({
        keyword: debouncedKeyword.trim() || undefined,
        statuses: g ? BOOKING_GROUP_STATUSES[g] : undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        checkInFrom: checkInFrom || undefined,
        checkInTo: checkInTo || undefined,
        providerId,
        placeId,
        page: 0,
        size: 1,
      });
      return res.totalElements;
    },
    JSON.stringify([scope, debouncedKeyword.trim(), createdFrom, createdTo, checkInFrom, checkInTo, providerId, placeId]),
    reload,
  );
  const counts = { ...groupCounts, [ATTENTION_TAB]: scope === 'admin' && attention ? attentionCount : null };

  // Cổng NCC: mỗi trạng thái thật là một tab (giữ nguyên hành vi cũ).
  const partnerTabs: TabItem<BookingStatus>[] = [
    { value: '', label: 'Tất cả', count: totalAll },
    ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s], count: summary ? summary[s] ?? 0 : null, tone: STATUS_TONE[s] })),
  ];
  // Cổng Admin: chọn tab nhóm thì bỏ trạng thái đơn lẻ (nếu có) và về trang 1, giữ nguyên các bộ lọc khác.
  const onAdminTab = (v: AdminTab | '') => {
    setPage(0);
    setStatus('');
    setAdminTab(v);
  };
  // Đang mở từ drill-down với một trạng thái đơn lẻ: đánh dấu tab nhóm chứa trạng thái đó.
  const adminTabValue: AdminTab | '' = status ? groupOf(status) : adminTab;

  const th = 'px-4 py-2.5';
  const td = 'px-4 py-2.5';
  const rows = showingAttention
    ? (attention ?? []).map((a) => ({ b: a.booking, reason: a as BookingAttentionItem | null }))
    : (data?.content ?? []).map((b) => ({ b, reason: null as BookingAttentionItem | null }));

  return (
    <section className="rounded-lg border border-border bg-white shadow-sm">
      {scope === 'admin' ? (
        <StatusFilter ariaLabel="Trạng thái đơn" items={ADMIN_TAB_ITEMS} value={adminTabValue} counts={counts} onChange={onAdminTab} />
      ) : (
        <UnderlineTabs
          ariaLabel="Trạng thái đơn"
          items={partnerTabs}
          value={status}
          onChange={(v) => {
            setPage(0);
            setStatus(v);
          }}
        />
      )}

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
            <span className="rise-in flex w-full flex-wrap items-center gap-2 text-xs">
              <StatusBadge tone="brand">Đang lọc: {presetLabel}</StatusBadge>
              <button
                type="button"
                onClick={() => {
                  setProviderId(undefined);
                  setPlaceId(undefined);
                  setPresetLabel('');
                  setPresetGeneratedAt('');
                  setPage(0);
                }}
                className="flex items-center gap-1 text-muted hover:text-danger"
              >
                <X className="h-3.5 w-3.5" /> Bỏ lọc này
              </button>
              {presetGeneratedAt && (
                <span className="text-muted">
                  · Dữ liệu hiện tại có thể khác thời điểm chốt báo cáo (chốt lúc {fmtDateTime(presetGeneratedAt)})
                </span>
              )}
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
