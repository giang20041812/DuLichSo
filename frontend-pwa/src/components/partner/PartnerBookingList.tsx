import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { partnerBookingService } from '@/services/partnerBookingService';
import { homestayError } from '@/services/partnerHomestayService';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE } from '@/lib/bookingStatus';
import type { AdminBookingDto, BookingStatusSummary, PageResponse } from '@/types/admin';
import type { BookingStatus } from '@/types/booking';

const PAGE_SIZE = 15;
const vnd = (n?: number | null) => (n == null ? '—' : new Intl.NumberFormat('vi-VN').format(n) + 'đ');
const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');
const STATUSES = Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[];

/** FR-NCC-11: danh sách yêu cầu đặt phòng của nhà cung cấp; đơn chờ xử lý có nút mở màn hình xử lý. */
export default function PartnerBookingList() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('PENDING');
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PageResponse<AdminBookingDto> | null>(null);
  const [summary, setSummary] = useState<BookingStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounced = useDebouncedValue(keyword);

  useEffect(() => {
    let active = true;
    Promise.all([
      partnerBookingService.getBookings({ keyword: debounced.trim() || undefined, status: status || undefined, sortBy: 'createdAt', sortDir: 'desc', page, size: PAGE_SIZE }),
      partnerBookingService.getSummary(),
    ])
      .then(([list, counts]) => { if (active) { setData(list); setSummary(counts); setError(''); } })
      .catch((e: unknown) => { if (active) setError(homestayError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debounced, status, page, reload]);

  const refresh = (change: () => void) => { setLoading(true); change(); };
  const rows = data?.content ?? [];
  const th = 'px-3 py-2.5';

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm focus:border-primary focus:outline-none" placeholder="Tìm theo mã đặt, tên / SĐT / email khách hoặc homestay..."
            value={keyword} onChange={(e) => refresh(() => { setKeyword(e.target.value); setPage(0); })} />
        </label>
        <button type="button" onClick={() => refresh(() => setReload((n) => n + 1))} aria-label="Tải lại" className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted hover:text-primary">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['', ...STATUSES] as const).map((s) => (
          <button key={s || 'all'} type="button" onClick={() => refresh(() => { setStatus(s); setPage(0); })}
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${status === s ? 'border-primary bg-primary text-white' : 'border-border text-ink hover:border-primary'}`}>
            {s ? BOOKING_STATUS_LABEL[s] : 'Tất cả'}{s && summary ? ` (${summary[s] ?? 0})` : ''}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}

      <div className={`overflow-x-auto rounded-md border border-border transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas font-semibold text-muted">
              <th className={th}>Mã đặt</th><th className={th}>Khách hàng</th><th className={th}>Homestay / Phòng</th>
              <th className={th}>Lưu trú</th><th className={`${th} text-right`}>Tổng tiền</th><th className={th}>Trạng thái</th>
              <th className={th}>Ngày đặt</th><th className={`${th} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-canvas/60">
                <td className={`${th} font-mono font-semibold text-primary`}>{b.bookingCode}</td>
                <td className={th}><div className="font-semibold text-ink-deep">{b.guestName}</div><div className="text-[11px] text-muted">{b.guestPhone}</div></td>
                <td className={th}><div className="font-medium text-ink">{b.placeName}</div><div className="text-[11px] text-muted">{b.roomTypeName}</div></td>
                <td className={`${th} text-ink`}><div>{date(b.checkIn)} → {date(b.checkOut)}</div><div className="text-[11px] text-muted">{b.nights} đêm · {b.roomCount} phòng · {b.guestCount} khách</div></td>
                <td className={`${th} text-right font-semibold text-ink-deep`}>{vnd(b.totalAmount)}</td>
                <td className={th}><span className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold ${BOOKING_STATUS_TONE[b.status]}`}>{BOOKING_STATUS_LABEL[b.status]}</span></td>
                <td className={`${th} text-muted`}>{dateTime(b.createdAt)}</td>
                <td className={`${th} text-right`}>
                  <Link to={`/partner/bookings/${b.id}`} className={b.status === 'PENDING'
                    ? 'inline-block whitespace-nowrap rounded-md bg-coral px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-coral-hover'
                    : 'inline-block whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-200 hover:border-primary'}>
                    {b.status === 'PENDING' ? 'Xử lý' : 'Xem'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !error && <div className="py-10 text-center text-xs text-muted">Không có đơn đặt phòng nào.</div>}
      </div>

      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button type="button" disabled={page === 0} onClick={() => refresh(() => setPage((p) => p - 1))} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40">Trước</button>
          <span className="text-muted">Trang {page + 1} / {data?.totalPages}</span>
          <button type="button" disabled={page + 1 >= (data?.totalPages ?? 0)} onClick={() => refresh(() => setPage((p) => p + 1))} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40">Sau</button>
        </div>
      )}
    </div>
  );
}
