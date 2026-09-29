import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Clock, Mail, Phone, RefreshCw, XCircle } from 'lucide-react';
import { partnerBookingService } from '@/services/partnerBookingService';
import { homestayError } from '@/services/partnerHomestayService';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE } from '@/lib/bookingStatus';
import ConfirmDialog, { type ConfirmRequest } from '@/components/partner/ConfirmDialog';
import { Alert } from '@/components/partner/PartnerUI';
import { ui } from '@/lib/partnerUi';
import type { BookingStatus, PartnerBookingDetailDto, StayAction } from '@/types/booking';

const vnd = (n?: number | null) => (n == null ? '—' : new Intl.NumberFormat('vi-VN').format(n) + 'đ');
const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const shortDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');
const timeDate = (d: string) => `${new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}, ${new Date(d).toLocaleDateString('vi-VN')}`;
const pill = (cls: string) => `inline-block whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-bold ${cls}`;
const REJECT_REASONS = ['Hết phòng trong thời gian yêu cầu', 'Homestay tạm ngừng đón khách', 'Không đáp ứng được yêu cầu đặc biệt', 'Số khách vượt quá khả năng phục vụ'];
const ACTOR_LABEL = { CUSTOMER: 'Khách hàng', PROVIDER: 'Nhà cung cấp', ADMIN: 'Quản trị viên', SYSTEM: 'Hệ thống' } as const;
/** Trên màn hình NCC, đơn chờ hiển thị đúng thuật ngữ đặc tả "Chờ NCC xác nhận". */
const statusLabel = (s: BookingStatus) => (s === 'PENDING' ? 'Chờ NCC xác nhận' : BOOKING_STATUS_LABEL[s]);

/**
 * Thời gian còn lại tới hạn phản hồi: lấy số phút máy chủ tính lúc tải trang rồi đếm lùi theo thời gian đã trôi qua,
 * để không lệch với trạng thái đơn khi đồng hồ/múi giờ trình duyệt khác máy chủ. Cập nhật mỗi 30 giây.
 */
function useRemaining(serverMinutes: number | null) {
  const [loadedAt] = useState(() => Date.now());
  const [now, setNow] = useState(loadedAt);
  useEffect(() => {
    if (serverMinutes == null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [serverMinutes]);
  if (serverMinutes == null) return null;
  return serverMinutes - Math.floor((now - loadedAt) / 60000);
}

/**
 * Xử lý một yêu cầu Booking trên một trang: xem yêu cầu và giá đã chốt (UC-NCC-06), đối chiếu khả năng đáp ứng từng đêm
 * (UC-NCC-07), rồi chấp nhận / yêu cầu bổ sung / từ chối (UC-NCC-08). Kết quả đánh giá được lưu ngay khi NCC chấp nhận.
 */
export default function PartnerBookingProcessPage() {
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);
  const validId = Number.isSafeInteger(bookingId) && bookingId > 0;
  const [booking, setBooking] = useState<PartnerBookingDetailDto | null>(null);
  const [loading, setLoading] = useState(validId);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(validId ? '' : 'Mã đơn đặt phòng không hợp lệ.');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!validId) return;
    let active = true;
    partnerBookingService.getDetail(bookingId)
      .then((data) => { if (active) { setBooking(data); setLoadError(''); } })
      .catch((error: unknown) => { if (active) setLoadError(homestayError(error)); })
      .finally(() => { if (active) { setLoading(false); setRefreshing(false); } });
    return () => { active = false; };
  }, [bookingId, validId, retry]);

  const reload = () => { setRefreshing(true); setRetry((n) => n + 1); };

  if (loading) return <p role="status" className="py-12 text-center text-muted">Đang tải đơn đặt phòng...</p>;
  if (loadError || !booking) {
    return (
      <Alert tone="error" action={<Link to="/partner/bookings" className={ui.btnGhost}>Quay lại</Link>}>
        {loadError || 'Không tìm thấy đơn đặt phòng.'}
        {validId && <button type="button" onClick={() => { setLoading(true); reload(); }} className="ml-3 font-semibold underline">Thử lại</button>}
      </Alert>
    );
  }

  const pending = booking.status === 'PENDING';
  const open = pending && !booking.overdue;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-10">
      <div className="flex flex-col gap-3">
        <Link to="/partner/bookings" className="group inline-flex w-fit items-center gap-1 text-sm font-semibold text-muted hover:text-primary">
          <ChevronLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" /> Yêu cầu Booking
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-ink-deep">
            <span>Booking {booking.bookingCode}</span>
            <span className={pill(BOOKING_STATUS_TONE[booking.status])}>{statusLabel(booking.status)}</span>
          </h1>
          {pending && <DeadlineChip dueAt={booking.responseDueAt} minutesLeft={booking.responseMinutesLeft} overdue={booking.overdue} />}
        </div>
        <p className="text-xs text-muted">{booking.placeName} · Khách gửi lúc {dateTime(booking.createdAt)}</p>
      </div>

      {pending && booking.overdue && (
        <Alert tone="error">Booking đã quá thời hạn phản hồi. Hệ thống không ghi nhận quyết định muộn và đã trả lại phòng đang giữ.</Alert>
      )}

      <Section title="Thông tin yêu cầu" hint="Xem và kiểm tra">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-bold text-ink-deep">{booking.guestName}</p>
            <p className="flex items-center gap-2 text-sm text-ink"><Phone className="h-3.5 w-3.5 text-muted" /> {booking.guestPhone}</p>
            <p className="flex items-center gap-2 text-sm text-ink"><Mail className="h-3.5 w-3.5 text-muted" /> {booking.guestEmail || 'Không có email'}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Row k="Nhận phòng" v={date(booking.checkIn)} />
            <Row k="Trả phòng" v={date(booking.checkOut)} />
            <Row k="Lưu trú" v={`${booking.nights} đêm · ${booking.roomCount} phòng · ${booking.guestCount} khách`} />
            <Row k="Loại phòng" v={booking.roomTypeName} />
          </div>
        </div>
        {(booking.guestNote || booking.serviceItems.length > 0) ? (
          <div className="flex flex-col gap-1.5 rounded-md bg-primary-50/60 p-3 text-sm">
            <p className="font-semibold text-ink-deep">Yêu cầu đặc biệt</p>
            {booking.guestNote && <p className="whitespace-pre-wrap text-ink">{booking.guestNote}</p>}
            {booking.serviceItems.map((s, i) => (
              <p key={`${s.serviceName}-${i}`} className="text-ink">• {s.serviceName}{s.note ? ` — ${s.note}` : ''}</p>
            ))}
          </div>
        ) : <p className="text-sm text-muted">Khách không có yêu cầu đặc biệt.</p>}
        <p className="text-xs text-muted">Yêu cầu đặc biệt chỉ được coi là đã đồng ý khi NCC xác nhận rõ nội dung có thể đáp ứng.</p>
      </Section>

      <PriceSection booking={booking} />

      {pending && <AvailabilitySection booking={booking} refreshing={refreshing} onReload={reload} />}

      {open
        ? <DecisionSection key={`${booking.id}-${booking.infoRequests.length}`} booking={booking} onDone={setBooking} />
        : <ResultPanel booking={booking} onDone={setBooking} />}

      {booking.infoRequests.length > 0 && (
        <Section title="Trao đổi bổ sung thông tin">
          <ul className="flex flex-col gap-3">
            {booking.infoRequests.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
                <p><span className="text-xs text-muted">Bạn hỏi · {dateTime(r.createdAt)}</span><br /><span className="whitespace-pre-wrap text-ink">{r.message}</span></p>
                {r.respondedAt
                  ? <p className="rounded-md bg-primary-50 p-2.5"><span className="text-xs text-muted">Khách trả lời · {dateTime(r.respondedAt)}</span><br /><span className="whitespace-pre-wrap text-ink-deep">{r.responseText}</span></p>
                  : <p className="flex items-center gap-2 text-xs text-sun"><Clock size={14} /> Đang chờ khách phản hồi</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {booking.history.length > 0 && (
        <Section title="Lịch sử xử lý">
          <ol className="flex flex-col gap-3 border-l border-border pl-4">
            {booking.history.map((h, i) => (
              <li key={`${h.createdAt}-${i}`} className="text-sm">
                <p className="font-semibold text-ink-deep">{h.fromStatus ? `${statusLabel(h.fromStatus)} → ` : ''}{statusLabel(h.toStatus)}</p>
                <p className="text-xs text-muted">{ACTOR_LABEL[h.actor]} · {dateTime(h.createdAt)}</p>
                {h.reason && <p className="mt-1 whitespace-pre-wrap text-ink">{h.reason}</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
}

function DeadlineChip({ dueAt, minutesLeft, overdue }: { dueAt: string | null; minutesLeft: number | null; overdue: boolean }) {
  const minutes = useRemaining(minutesLeft);
  if (!dueAt) return null;
  const late = overdue || (minutes != null && minutes < 0);
  const urgent = !late && minutes != null && minutes <= 30;
  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold ${late ? 'border-danger/40 bg-danger/5 text-danger' : urgent ? 'border-coral/40 bg-coral-light text-coral-hover' : 'border-sun/40 bg-sun-light text-ink-deep'}`}>
      <Clock className="h-3.5 w-3.5" />
      {late ? <>Đã quá hạn lúc {timeDate(dueAt)}</> : <>Còn {minutes} phút · Phản hồi trước {timeDate(dueAt)}</>}
    </div>
  );
}

function PriceSection({ booking }: { booking: PartnerBookingDetailDto }) {
  const policy = booking.policySnapshot;
  const text = (key: string) => (typeof policy[key] === 'string' || typeof policy[key] === 'number' ? String(policy[key]) : null);
  return (
    <Section title="Giá và chính sách đã chốt">
      <ul className="flex flex-col gap-1.5 text-sm">
        {booking.nightPrices.map((n) => (
          <li key={n.stayDate} className="flex justify-between gap-3">
            <span className="text-ink">{date(n.stayDate)} · {n.roomCount} phòng</span>
            <span className="tabular-nums text-ink">{vnd(n.unitPrice * n.roomCount)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-semibold text-ink-deep">Tổng giá Booking</span>
        <span className="text-lg font-bold tabular-nums text-ink-deep">{vnd(booking.totalAmount)}</span>
      </div>
      {Object.keys(policy).length > 0 ? (
        <div className="flex flex-col gap-1 rounded-md bg-primary-50/60 p-3 text-sm">
          <p className="font-semibold text-ink-deep">{text('policyName') ?? 'Chính sách hủy'} · Bản tại thời điểm khách gửi</p>
          {text('freeCancelCutoffHours') && <p className="text-ink">Miễn phí hủy trước {text('freeCancelCutoffHours')} giờ so với giờ nhận phòng; hủy muộn {text('refundType') === 'FULL_REFUND' ? 'được hoàn toàn bộ' : 'không được hoàn tiền'}.</p>}
          {text('description') && <p className="whitespace-pre-wrap text-muted">{text('description')}</p>}
        </div>
      ) : <p className="text-sm text-muted">Đơn không kèm chính sách hủy.</p>}
      <p className="text-xs text-muted">Giá và chính sách của Booking đang chờ không tự thay đổi khi bạn sửa giá phòng.</p>
    </Section>
  );
}

function AvailabilitySection({ booking, refreshing, onReload }: { booking: PartnerBookingDetailDto; refreshing: boolean; onReload: () => void }) {
  const room = booking.roomOptions.find((o) => o.current);
  const shortNights = booking.availability.filter((d) => d.stopSell || d.heldRooms < booking.roomCount);
  const capacityFail = booking.checks.some((c) => c.code === 'CAPACITY' && c.level === 'FAIL');
  const ok = shortNights.length === 0 && !capacityFail && booking.availability.length > 0;
  return (
    <Section title="Khả năng đáp ứng" hint="Xem trên cùng trang">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-ink-deep">{booking.roomTypeName}{room?.maxOccupancy ? <span className="font-normal text-muted"> · tối đa {room.maxOccupancy} khách/phòng</span> : null}</span>
        <span className="text-ink">{booking.guestCount} khách</span>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-xs">
          <thead><tr className="border-b border-border bg-canvas text-muted"><th className="px-3 py-2">Đêm</th><th className="px-3 py-2 text-right">Tổng phòng</th><th className="px-3 py-2 text-right">Giữ booking này</th><th className="px-3 py-2 text-right">Đã xác nhận</th><th className="px-3 py-2 text-right">Còn bán</th></tr></thead>
          <tbody className="divide-y divide-border">
            {booking.availability.map((d) => {
              const short = d.stopSell || d.heldRooms < booking.roomCount;
              return (
                <tr key={d.stayDate} className={short ? 'bg-danger/5 text-danger' : 'text-ink'}>
                  <td className="px-3 py-2">{shortDate(d.stayDate)}{d.stopSell && ' · đóng bán'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.totalRooms}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Math.min(booking.roomCount, d.heldRooms)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.confirmedRooms}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.availableRooms}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {ok ? (
        <p className="flex items-start gap-2 rounded-md bg-accent-50 p-3 text-sm text-accent-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span><b>Có thể xác nhận booking này.</b> Mỗi phòng đã được giữ cho chính yêu cầu này trong {booking.nights > 1 ? `cả ${booking.nights} đêm` : 'đêm lưu trú'}; “còn bán 0” không có nghĩa là booking này thiếu phòng.</span>
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-md bg-danger/5 p-3 text-sm text-danger">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{capacityFail ? 'Số khách vượt sức chứa phương án phòng.' : `Không đủ phòng trong toàn bộ thời gian lưu trú (${shortNights.map((d) => shortDate(d.stayDate)).join(', ')}).`} Bạn có thể yêu cầu khách bổ sung/điều chỉnh hoặc từ chối.</span>
        </p>
      )}
      <button type="button" onClick={onReload} disabled={refreshing} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary disabled:opacity-50">
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Kiểm tra lại khả dụng
      </button>
    </Section>
  );
}

type Panel = 'none' | 'info' | 'reject';

function DecisionSection({ booking, onDone }: { booking: PartnerBookingDetailDto; onDone: (b: PartnerBookingDetailDto) => void }) {
  const hasSpecial = !!booking.guestNote || booking.serviceItems.length > 0;
  const [special, setSpecial] = useState<'yes' | 'no' | ''>(booking.evaluation?.specialRequestResult ? 'yes' : '');
  const [specialNote, setSpecialNote] = useState('');
  const [panel, setPanel] = useState<Panel>('none');
  const [infoMessage, setInfoMessage] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const shortNights = booking.availability.filter((d) => d.stopSell || d.heldRooms < booking.roomCount);
  const capacityFail = booking.checks.some((c) => c.code === 'CAPACITY' && c.level === 'FAIL');
  const waitingInfo = booking.infoRequests.some((r) => !r.respondedAt);
  const checkInPassed = booking.checks.some((c) => c.code === 'DATES' && c.level === 'FAIL');
  const acceptBlocked = shortNights.length > 0 || capacityFail || waitingInfo || checkInPassed || (hasSpecial && !special);
  const specialResult = !hasSpecial ? undefined
    : `${special === 'yes' ? 'Có thể đáp ứng yêu cầu đặc biệt' : 'Không đáp ứng được yêu cầu đặc biệt'}${specialNote.trim() ? `: ${specialNote.trim()}` : ''}.`;

  async function run(action: () => Promise<PartnerBookingDetailDto>, done: string) {
    setBusy(true); setError(''); setNotice('');
    try { onDone(await action()); setNotice(done); } catch (e: unknown) { setError(homestayError(e)); } finally { setBusy(false); }
  }

  /** Lưu kết quả đánh giá "Đáp ứng" (UC-NCC-07) rồi chấp nhận (UC-NCC-08); backend kiểm tra lại phòng, sức chứa, hạn trước khi ghi. */
  const acceptFlow = () => run(async () => {
    await partnerBookingService.evaluate(booking.id, { conclusion: 'MEETS', specialRequestResult: specialResult });
    return partnerBookingService.accept(booking.id, { roomTypeId: null, note: specialResult ?? '' });
  }, 'Booking đã được xác nhận');

  return (
    <Section title="Xử lý Booking" hint="Quyết định ngay tại đây">
      {hasSpecial && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-deep">Khả năng đáp ứng yêu cầu đặc biệt <span className="text-danger">*</span></span>
          <select className={ui.select} value={special} disabled={busy} onChange={(e) => setSpecial(e.target.value === 'yes' ? 'yes' : e.target.value === 'no' ? 'no' : '')}>
            <option value="">Chọn khả năng đáp ứng</option>
            <option value="yes">Có thể đáp ứng</option>
            <option value="no">Không đáp ứng được</option>
          </select>
          <input className={ui.input} maxLength={300} value={specialNote} disabled={busy} onChange={(e) => setSpecialNote(e.target.value)}
            placeholder={special === 'no' ? 'Lý do / phương án thay thế (không bắt buộc)' : 'Ghi chú cho khách, VD: có xe đón tại trung tâm (không bắt buộc)'} />
          <span className="text-xs text-muted">Nội dung này sẽ được gửi cho khách khi bạn xác nhận Booking.</span>
        </label>
      )}

      <div className="flex flex-col gap-1.5 rounded-md border border-border p-3 text-sm">
        <Row k="Phương án khách chọn" v={`${booking.roomCount} phòng · ${shortDate(booking.checkIn)}–${shortDate(booking.checkOut)}`} />
        <Row k="Giá đã chốt" v={vnd(booking.totalAmount)} strong />
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      {waitingInfo && <Alert tone="info">Đang chờ khách trả lời yêu cầu bổ sung. Bạn chấp nhận được sau khi khách phản hồi.</Alert>}

      <button type="button" disabled={busy || acceptBlocked} className={`${ui.btnCoral} h-11 w-full`}
        onClick={() => setConfirm({ title: `Xác nhận chấp nhận Booking ${booking.bookingCode}?`, confirmLabel: 'Xác nhận chấp nhận', tone: 'coral',
          body: <><b>{booking.roomTypeName}</b> · {booking.roomCount} phòng · {booking.nights} đêm ({date(booking.checkIn)} → {date(booking.checkOut)}) · {booking.guestCount} khách.<br />Giá khách đã chốt: <b>{vnd(booking.totalAmount)}</b> (không thay đổi).{specialResult && <><br />Yêu cầu đặc biệt: {specialResult}</>}<br />Phòng đang giữ chuyển thành đã xác nhận; khách nhận thông báo và thanh toán trực tiếp tại chỗ nghỉ.</>,
          onConfirm: () => void acceptFlow() })}>
        {busy ? 'Đang xử lý...' : 'Chấp nhận Booking'}
      </button>
      {hasSpecial && !special && <p className="-mt-2 text-xs text-muted">Chọn khả năng đáp ứng yêu cầu đặc biệt để chấp nhận.</p>}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={busy || !booking.canRequestInfo} onClick={() => setPanel(panel === 'info' ? 'none' : 'info')}
          className={`${ui.btnOutline} ${panel === 'info' ? 'bg-primary-50' : ''}`}>Yêu cầu bổ sung</button>
        <button type="button" disabled={busy} onClick={() => setPanel(panel === 'reject' ? 'none' : 'reject')}
          className={`${ui.btnDanger} ${panel === 'reject' ? 'bg-danger/5' : ''}`}>Từ chối</button>
      </div>

      {panel === 'info' && (
        <form className="flex flex-col gap-2 rounded-md border border-secondary/30 bg-secondary-50/50 p-3" onSubmit={(e) => { e.preventDefault(); const m = infoMessage.trim(); if (m) setConfirm({ title: 'Gửi yêu cầu bổ sung cho khách?', confirmLabel: 'Gửi yêu cầu', body: <>“{m}”<br />Đơn vẫn chờ xử lý và vẫn giữ phòng; hạn phản hồi không được gia hạn.</>, onConfirm: () => void run(() => partnerBookingService.requestInfo(booking.id, { message: m }), 'Đã gửi yêu cầu bổ sung thông tin').then(() => { setPanel('none'); setInfoMessage(''); }) }); }}>
          <p className="text-xs font-semibold text-ink">Nêu cụ thể thông tin cần khách bổ sung hoặc điều chỉnh</p>
          <textarea className={ui.textarea} rows={3} required maxLength={500} value={infoMessage} disabled={busy} onChange={(e) => setInfoMessage(e.target.value)} placeholder="VD: Vui lòng cho biết giờ đến dự kiến và độ tuổi của các bé đi cùng." />
          <div className="flex items-center gap-2">
            <button className={ui.btnPrimary} disabled={busy || !infoMessage.trim()}>Gửi yêu cầu</button>
            <button type="button" className={ui.btnGhost} onClick={() => setPanel('none')}>Hủy</button>
            <span className="ml-auto text-xs text-muted">{infoMessage.length}/500</span>
          </div>
        </form>
      )}

      {panel === 'reject' && (
        <form className="flex flex-col gap-2 rounded-md border border-danger/30 bg-danger/5 p-3" onSubmit={(e) => { e.preventDefault(); const r = reason.trim(); if (r) setConfirm({ title: `Từ chối Booking ${booking.bookingCode}?`, confirmLabel: 'Xác nhận từ chối', tone: 'danger', body: <>Lý do (khách xem được): “{r}”<br />Phòng đang giữ được giải phóng. Thao tác này không hoàn tác được.</>, onConfirm: () => void run(() => partnerBookingService.reject(booking.id, { reason: r }), 'Đã từ chối Booking') }); }}>
          <p className="text-xs font-semibold text-ink">Lý do từ chối (khách xem được) <span className="text-danger">*</span></p>
          <div className="flex flex-wrap gap-1.5">
            {REJECT_REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} className={`rounded-sm border px-2 py-1 text-xs transition-colors ${reason === r ? 'border-danger bg-surface text-danger' : 'border-border bg-surface text-ink hover:border-danger/50'}`}>{r}</button>
            ))}
          </div>
          <textarea className={ui.textarea} rows={3} required maxLength={500} value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do cụ thể..." />
          <div className="flex items-center gap-2">
            <button className={ui.btnDanger} disabled={busy || !reason.trim()}>Từ chối Booking</button>
            <button type="button" className={ui.btnGhost} onClick={() => setPanel('none')}>Hủy</button>
          </div>
        </form>
      )}

      <p className="text-xs text-muted">Chỉ có quyết định cuối cùng mới đổi trạng thái Booking. Hệ thống kiểm tra lại quyền, hạn phản hồi và số phòng trước khi ghi nhận.</p>
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </Section>
  );
}

const STAY_ACTION: Record<StayAction, { label: string; confirm: string; body: string; tone: ConfirmRequest['tone'] }> = {
  CHECK_IN: { label: 'Khách đã nhận phòng', confirm: 'Xác nhận nhận phòng', body: 'Đơn chuyển sang “Đã nhận phòng”.', tone: 'primary' },
  CHECK_OUT: { label: 'Khách đã trả phòng', confirm: 'Xác nhận trả phòng', body: 'Đơn được đóng ở trạng thái “Hoàn tất”; khách có thể viết đánh giá.', tone: 'primary' },
  COMPLETE: { label: 'Hoàn thành đơn', confirm: 'Hoàn thành đơn', body: 'Hành động này đã gộp chung với Trả phòng.', tone: 'coral' },
  NO_SHOW: { label: 'Khách không đến', confirm: 'Đánh dấu không đến', body: 'Đơn được đóng; các đêm từ hôm nay trở đi được mở bán lại. Không hoàn tác được.', tone: 'danger' },
};

/** Kết quả xử lý + vận hành lưu trú sau khi đơn đã xác nhận (nhận phòng, trả phòng, khách không đến). */
function ResultPanel({ booking, onDone }: { booking: PartnerBookingDetailDto; onDone: (b: PartnerBookingDetailDto) => void }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  async function run(action: StayAction) {
    setBusy(true); setError('');
    try { onDone(await partnerBookingService.stayAction(booking.id, { action, note: note.trim() || undefined })); setNote(''); }
    catch (e: unknown) { setError(homestayError(e)); }
    finally { setBusy(false); }
  }

  return (
    <Section title="Kết quả xử lý">
      <span className={`${pill(BOOKING_STATUS_TONE[booking.status])} w-fit`}>{statusLabel(booking.status)}</span>
      {booking.status === 'PENDING' && booking.overdue && <p className="text-sm text-danger">Booking đã quá thời hạn phản hồi.</p>}
      {booking.status === 'AWAITING_PAYMENT' && <Row k="Hạn thanh toán" v={dateTime(booking.paymentDeadlineAt)} strong />}
      {booking.confirmedAt && <Row k="Xác nhận lúc" v={dateTime(booking.confirmedAt)} />}
      {booking.closedAt && <Row k="Đóng đơn lúc" v={dateTime(booking.closedAt)} />}
      {booking.closeReason && <p className="whitespace-pre-wrap rounded-md bg-canvas p-2.5 text-sm text-ink">{booking.closeReason}</p>}

      {booking.status === 'CONFIRMED' && booking.stayActions.length === 0 && (
        <p className="text-xs text-muted">Nút nhận phòng mở từ ngày {date(booking.checkIn)}.</p>
      )}
      {booking.stayActions.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted">Vận hành lưu trú</p>
          {error && <Alert tone="error">{error}</Alert>}
          <input className={ui.input} maxLength={500} disabled={busy} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (không bắt buộc)" />
          {booking.stayActions.map((action) => (
            <button key={action} type="button" disabled={busy}
              onClick={() => setConfirm({ title: `${STAY_ACTION[action].label}?`, confirmLabel: STAY_ACTION[action].confirm, tone: STAY_ACTION[action].tone,
                body: <>{STAY_ACTION[action].body}{note.trim() && <><br />Ghi chú: “{note.trim()}”</>}</>, onConfirm: () => void run(action) })}
              className={action === 'NO_SHOW' ? ui.btnDanger : ui.btnPrimary}>
              {busy ? 'Đang xử lý...' : STAY_ACTION[action].label}
            </button>
          ))}
        </div>
      )}
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </Section>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={`${ui.card} flex flex-col gap-3 p-5`}>
      <h2 className="flex flex-wrap items-baseline gap-2 font-semibold text-primary">{title}{hint && <span className="text-xs font-normal text-muted">{hint}</span>}</h2>
      {children}
    </section>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted">{k}</span>
      <span className={`text-right ${strong ? 'font-bold text-ink-deep' : 'text-ink'}`}>{v}</span>
    </div>
  );
}

