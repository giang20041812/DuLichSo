import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { partnerBookingService } from '@/services/partnerBookingService';
import { fetchPartnerHomestays, homestayError } from '@/services/partnerHomestayService';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE } from '@/lib/bookingStatus';
import type { BookingStatusSummary, PageResponse } from '@/types/admin';
import type { BookingStatus, PartnerBookingRowDto } from '@/types/booking';
import { Tabs } from '@/components/partner/PartnerUI';
import PartnerDateRangePicker from '@/components/partner/PartnerDateRangePicker';

const PAGE_SIZE = 15;
const vnd = (n?: number | null) => (n == null ? '—' : new Intl.NumberFormat('vi-VN').format(n) + 'đ');
const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');
const STATUSES = Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[];

/** Hạn phản hồi còn lại (UC-NCC-06, BOOK-BR-11): 120 phút trong khung giờ xử lý của Homestay. */
function DueCell({ dueAt }: { dueAt: string | null }) {
  if (!dueAt) return <span className="text-muted">—</span>;
  const minutes = Math.floor((new Date(dueAt).getTime() - new Date().getTime()) / 60000);
  if (minutes < 0) return <span className="font-semibold text-danger">Quá hạn</span>;
  return (
    <span className={minutes <= 30 ? 'font-semibold text-coral-hover' : 'text-ink'}>
      Còn {minutes} phút<span className="block text-[11px] text-muted">{dateTime(dueAt)}</span>
    </span>
  );
}

/** UC-NCC-06: danh sách yêu cầu Booking của NCC, mặc định lọc "Chờ NCC xác nhận"; đơn chờ mở màn hình xử lý 3 bước. */
export default function PartnerBookingList() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('PENDING');
  const [placeId, setPlaceId] = useState<number | ''>('');
  const [checkInFrom, setCheckInFrom] = useState('');
  const [checkInTo, setCheckInTo] = useState('');
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PageResponse<PartnerBookingRowDto> | null>(null);
  const [summary, setSummary] = useState<BookingStatusSummary | null>(null);
  const [homestays, setHomestays] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounced = useDebouncedValue(keyword);

  useEffect(() => {
    fetchPartnerHomestays().then(res => setHomestays(res.homestays.map(h => ({ id: h.id, name: h.name })))).catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      partnerBookingService.getBookings({ 
        keyword: debounced.trim() || undefined, 
        status: status || undefined, 
        placeId: placeId || undefined,
        checkInFrom: checkInFrom || undefined,
        checkInTo: checkInTo || undefined,
        sortBy: 'createdAt', sortDir: 'desc', page, size: PAGE_SIZE 
      }),
      partnerBookingService.getSummary(),
    ])
      .then(([list, counts]) => { if (active) { setData(list); setSummary(counts); setError(''); } })
      .catch((e: unknown) => { if (active) setError(homestayError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debounced, status, placeId, checkInFrom, checkInTo, page, reload]);

  const refresh = (change: () => void) => { setLoading(true); change(); };

  // Đơn chờ xử lý không có thao tác nhanh: UC-NCC-07/08 bắt buộc đánh giá và xem lại trước khi chấp nhận/từ chối.
  const handleQuickAction = async (bookingId: number, currentStatus: BookingStatus, actionType: 'CHECK_IN' | 'CHECK_OUT') => {
    try {
      if (currentStatus === 'CONFIRMED' && actionType === 'CHECK_IN') {
        await partnerBookingService.stayAction(bookingId, { action: 'CHECK_IN', note: 'Check-in nhanh' });
      } else if (currentStatus === 'CHECKED_IN' && actionType === 'CHECK_OUT') {
        await partnerBookingService.stayAction(bookingId, { action: 'CHECK_OUT', note: 'Check-out nhanh' });
      }
      setReload(n => n + 1);
    } catch (err) {
      alert('Lỗi: ' + homestayError(err));
    }
  };

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
        
        <select
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-none"
          value={placeId}
          onChange={(e) => refresh(() => { setPlaceId(e.target.value ? Number(e.target.value) : ''); setPage(0); })}
        >
          <option value="">Tất cả Homestay</option>
          {homestays.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>

        <PartnerDateRangePicker 
          checkInFrom={checkInFrom} 
          checkInTo={checkInTo} 
          onChange={(from, to) => refresh(() => { setCheckInFrom(from); setCheckInTo(to); setPage(0); })} 
        />

        <button type="button" onClick={() => refresh(() => setReload((n) => n + 1))} aria-label="Tải lại" className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted hover:text-primary">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="-mx-1 px-1">
        <Tabs<BookingStatus | ''> 
          value={status} 
          onChange={(s) => refresh(() => { setStatus(s); setPage(0); setReload(n => n + 1); })} 
          tabs={[
            { id: '', label: 'Tất cả', badge: summary ? Object.values(summary).reduce((a, b) => a + b, 0) : undefined },
            ...STATUSES.map(s => ({ id: s, label: BOOKING_STATUS_LABEL[s], badge: summary?.[s] }))
          ]} 
        />
      </div>

      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}

      <div className={`overflow-x-auto rounded-md border border-border transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas font-semibold text-muted">
              <th className={th}>Mã đặt</th><th className={th}>Khách hàng</th><th className={th}>Homestay / Phòng</th>
              <th className={th}>Lưu trú</th><th className={`${th} text-right`}>Tổng tiền</th><th className={th}>Trạng thái</th>
              <th className={th}>Ngày đặt</th><th className={th}>Hạn phản hồi</th><th className={`${th} text-right`}>Thao tác</th>
              <th className={`${th} w-10 text-center`}></th>
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
                <td className={th}>{b.status === 'PENDING' ? <DueCell dueAt={b.responseDueAt} /> : <span className="text-muted">—</span>}</td>
                <td className={`${th} text-right`}>
                  <div className="flex items-center justify-end gap-2">
                    {b.status === 'PENDING' && (
                      <Link to={`/partner/bookings/${b.id}`} className="rounded-md bg-coral px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-coral)] transition-colors duration-200 hover:bg-coral-hover">
                        Xử lý
                      </Link>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <button onClick={() => handleQuickAction(b.id, b.status, 'CHECK_IN')} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-emerald-600">
                        Check-in
                      </button>
                    )}
                    {b.status === 'CHECKED_IN' && (
                      <button onClick={() => handleQuickAction(b.id, b.status, 'CHECK_OUT')} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover">
                        Check-out
                      </button>
                    )}
                  </div>
                </td>
                <td className={`${th} text-center`}>
                  <Link to={`/partner/bookings/${b.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-primary" title="Xem chi tiết">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !error && <div className="py-10 text-center text-xs text-muted">Không có yêu cầu Booking phù hợp.</div>}
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
