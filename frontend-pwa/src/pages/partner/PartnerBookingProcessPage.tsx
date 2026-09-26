import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Mail, Phone, StickyNote, XCircle } from 'lucide-react';
import { partnerBookingService } from '@/services/partnerBookingService';
import { homestayError } from '@/services/partnerHomestayService';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE } from '@/lib/bookingStatus';
import ConfirmDialog, { type ConfirmRequest } from '@/components/partner/ConfirmDialog';
import type { BookingCheckLevel, BookingRoomOptionDto, PartnerBookingDetailDto, StayAction } from '@/types/booking';

const vnd = (n?: number | null) => (n == null ? '—' : new Intl.NumberFormat('vi-VN').format(n) + 'đ');
const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');
const pill = (cls: string) => `rounded-sm border px-2 py-0.5 text-[11px] font-bold ${cls}`;
const field = 'w-full rounded-md border border-border bg-surface p-2 text-sm focus:border-primary focus:outline-none';
const REJECT_REASONS = ['Hết phòng trong thời gian yêu cầu', 'Homestay tạm ngừng đón khách', 'Không đáp ứng được yêu cầu đặc biệt', 'Số khách vượt quá khả năng phục vụ'];
const ACTOR_LABEL = { CUSTOMER: 'Khách hàng', PROVIDER: 'Nhà cung cấp', ADMIN: 'Quản trị viên', SYSTEM: 'Hệ thống' } as const;

const CHECK_STYLE: Record<BookingCheckLevel, { icon: ReactNode; tone: string }> = {
  OK: { icon: <CheckCircle2 className="h-4 w-4 text-success" />, tone: 'border-border' },
  WARN: { icon: <AlertTriangle className="h-4 w-4 text-warning" />, tone: 'border-sun/40 bg-sun-light/30' },
  FAIL: { icon: <XCircle className="h-4 w-4 text-danger" />, tone: 'border-danger/30 bg-danger/5' },
};

export default function PartnerBookingProcessPage() {
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);
  const validId = Number.isSafeInteger(bookingId) && bookingId > 0;
  const [booking, setBooking] = useState<PartnerBookingDetailDto | null>(null);
  const [loading, setLoading] = useState(validId);
  const [loadError, setLoadError] = useState(validId ? '' : 'Mã đơn đặt phòng không hợp lệ.');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!validId) return;
    let active = true;
    partnerBookingService.getDetail(bookingId)
      .then((data) => { if (active) { setBooking(data); setLoadError(''); } })
      .catch((error: unknown) => { if (active) setLoadError(homestayError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookingId, validId, retry]);

  if (loading) return <p role="status" className="py-12 text-center text-muted">Đang tải đơn đặt phòng...</p>;
  if (loadError || !booking) {
    return (
      <div role="alert" className="rounded-lg border border-danger/30 p-5 text-danger">
        {loadError || 'Không tìm thấy đơn đặt phòng.'}
        {validId && <button type="button" onClick={() => { setLoading(true); setRetry((n) => n + 1); }} className="ml-3 rounded-md border px-3 py-1">Thử lại</button>}
        <Link to="/partner/bookings" className="ml-3 underline">Quay lại</Link>
      </div>
    );
  }

  const policy = booking.policySnapshot;
  const policyText = (key: string) => (typeof policy[key] === 'string' || typeof policy[key] === 'number' ? String(policy[key]) : null);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-8">
      <Link to="/partner/bookings" className="flex w-fit items-center gap-2 text-sm text-primary"><ArrowLeft size={16} /> Đơn đặt phòng</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted">{booking.placeName} · Đặt lúc {dateTime(booking.createdAt)}</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-2xl font-bold text-ink-deep">
            <span className="font-mono">{booking.bookingCode}</span>
            <span className={pill(BOOKING_STATUS_TONE[booking.status])}>{BOOKING_STATUS_LABEL[booking.status]}</span>
          </h1>
        </div>
        {booking.status === 'PENDING' && booking.holdExpiresAt && (
          <p className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${booking.canAccept ? 'border-sun/40 bg-sun-light/30 text-ink' : 'border-danger/30 bg-danger/5 text-danger'}`}>
            <Clock size={16} /> {booking.canAccept ? 'Cần xử lý trước' : 'Đã quá hạn xử lý lúc'} {dateTime(booking.holdExpiresAt)}
          </p>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Section title="Thông tin yêu cầu đặt phòng">
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
                <Row k="Tổng tiền" v={vnd(booking.totalAmount)} strong />
              </div>
            </div>
          </Section>

          <Section title="Yêu cầu đặc biệt">
            {booking.guestNote ? (
              <p className="flex items-start gap-2 whitespace-pre-wrap rounded-md bg-canvas p-3 text-sm text-ink">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> {booking.guestNote}
              </p>
            ) : <p className="text-sm text-muted">Khách không để lại ghi chú.</p>}
            {booking.serviceItems.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted">Dịch vụ khách muốn dùng kèm</p>
                <ul className="flex flex-col gap-1 text-sm">
                  {booking.serviceItems.map((s, i) => <li key={`${s.serviceName}-${i}`}>• {s.serviceName}{s.note ? <span className="text-muted"> — {s.note}</span> : null}</li>)}
                </ul>
              </div>
            )}
          </Section>

          {booking.checks.length > 0 && (
            <Section title="Kiểm tra yêu cầu">
              <ul className="flex flex-col gap-2">
                {booking.checks.map((c) => (
                  <li key={c.code} className={`flex items-start gap-3 rounded-md border p-3 ${CHECK_STYLE[c.level].tone}`}>
                    <span className="mt-0.5 shrink-0">{CHECK_STYLE[c.level].icon}</span>
                    <div><p className="text-sm font-semibold text-ink-deep">{c.label}</p><p className="text-xs text-muted">{c.detail}</p></div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Giá và điều kiện áp dụng">
            {booking.nightPrices.length > 0 && (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-border bg-canvas text-xs text-muted"><th className="px-3 py-2">Đêm</th><th className="px-3 py-2 text-right">Giá / phòng</th><th className="px-3 py-2 text-right">Số phòng</th><th className="px-3 py-2 text-right">Thành tiền</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {booking.nightPrices.map((n) => (
                      <tr key={n.stayDate}><td className="px-3 py-2">{date(n.stayDate)}</td><td className="px-3 py-2 text-right">{vnd(n.unitPrice)}</td><td className="px-3 py-2 text-right">{n.roomCount}</td><td className="px-3 py-2 text-right font-medium">{vnd(n.unitPrice * n.roomCount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {Object.keys(policy).length > 0 ? (
              <div className="flex flex-col gap-1.5 rounded-md bg-canvas p-3 text-sm">
                <p className="font-semibold text-ink-deep">{policyText('policyName') ?? 'Chính sách hủy'}{policyText('policyVersion') ? ` · Phiên bản ${policyText('policyVersion')}` : ''}</p>
                {policyText('freeCancelCutoffHours') && <p>Hủy miễn phí trước {policyText('freeCancelCutoffHours')} giờ. Hủy muộn: {policyText('refundType') === 'FULL_REFUND' ? 'hoàn toàn bộ' : 'không hoàn tiền'}.</p>}
                {policyText('description') && <p className="whitespace-pre-wrap text-muted">{policyText('description')}</p>}
              </div>
            ) : <p className="text-sm text-muted">Đơn không kèm chính sách hủy.</p>}
          </Section>

          {booking.infoRequests.length > 0 && (
            <Section title="Yêu cầu bổ sung thông tin">
              <ul className="flex flex-col gap-3">
                {booking.infoRequests.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
                    <p><span className="text-xs text-muted">Bạn hỏi · {dateTime(r.createdAt)}</span><br /><span className="whitespace-pre-wrap text-ink">{r.message}</span></p>
                    {r.respondedAt
                      ? <p className="rounded-md bg-primary-50 p-2.5"><span className="text-xs text-muted">Khách trả lời · {dateTime(r.respondedAt)}</span><br /><span className="whitespace-pre-wrap text-ink-deep">{r.responseText}</span></p>
                      : <p className="flex items-center gap-2 text-xs text-warning"><Clock size={14} /> Đang chờ khách phản hồi</p>}
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
                    <p className="font-semibold text-ink-deep">{h.fromStatus ? `${BOOKING_STATUS_LABEL[h.fromStatus]} → ` : ''}{BOOKING_STATUS_LABEL[h.toStatus]}</p>
                    <p className="text-xs text-muted">{ACTOR_LABEL[h.actor]} · {dateTime(h.createdAt)}</p>
                    {h.reason && <p className="mt-1 whitespace-pre-wrap text-ink">{h.reason}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        <div className="lg:sticky lg:top-4">
          {booking.canAccept || booking.canReject
            ? <DecisionPanel key={`${booking.id}-${booking.status}-${booking.infoRequests.length}`} booking={booking} onDone={setBooking} />
            : <ResultPanel booking={booking} onDone={setBooking} />}
        </div>
      </div>
    </div>
  );
}

function DecisionPanel({ booking, onDone }: { booking: PartnerBookingDetailDto; onDone: (b: PartnerBookingDetailDto) => void }) {
  const [roomTypeId, setRoomTypeId] = useState(booking.roomTypeId);
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'accept' | 'info' | 'reject'>(booking.canAccept ? 'accept' : 'reject');
  const [reason, setReason] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chosen: BookingRoomOptionDto | undefined = booking.roomOptions.find((o) => o.roomTypeId === roomTypeId);
  const changed = roomTypeId !== booking.roomTypeId;

  async function submit(action: () => Promise<PartnerBookingDetailDto>) {
    setBusy(true); setError('');
    try { onDone(await action()); } catch (e: unknown) { setError(homestayError(e)); } finally { setBusy(false); }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-semibold text-primary">Xử lý yêu cầu</h2>
      <div className="grid grid-cols-3 gap-1 rounded-md bg-canvas p-1 text-xs font-semibold sm:text-sm">
        <button type="button" disabled={!booking.canAccept} onClick={() => setMode('accept')} className={`rounded px-2 py-1.5 transition-colors disabled:opacity-40 ${mode === 'accept' ? 'bg-surface text-primary shadow-xs' : 'text-muted'}`}>Chấp nhận</button>
        <button type="button" onClick={() => setMode('info')} className={`rounded px-2 py-1.5 transition-colors ${mode === 'info' ? 'bg-surface text-secondary-700 shadow-xs' : 'text-muted'}`}>Hỏi thêm</button>
        <button type="button" onClick={() => setMode('reject')} className={`rounded px-2 py-1.5 transition-colors ${mode === 'reject' ? 'bg-surface text-danger shadow-xs' : 'text-muted'}`}>Từ chối</button>
      </div>

      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-2.5 text-sm text-danger">{error}</p>}

      {mode === 'accept' ? (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setConfirm({ title: `Chấp nhận đơn ${booking.bookingCode}?`, confirmLabel: "Chấp nhận đơn", tone: "coral", body: <>Phương án: <b>{chosen?.name}</b> · {booking.roomCount} phòng · {booking.nights} đêm · tổng <b>{vnd(chosen?.totalAmount)}</b>.<br />Đơn chuyển sang <b>Chờ thanh toán</b>, khách có 15 phút để thanh toán.{note.trim() && <><br />Lời nhắn: “{note.trim()}”</>}</>, onConfirm: () => void submit(() => partnerBookingService.accept(booking.id, { roomTypeId: changed ? roomTypeId : null, note: note.trim() })) }); }}>
          <fieldset disabled={busy} className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-semibold text-muted">Phương án phòng ({booking.roomCount} phòng · {booking.nights} đêm)</legend>
            {booking.roomOptions.map((o) => (
              <label key={o.roomTypeId} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors ${roomTypeId === o.roomTypeId ? 'border-primary bg-primary-50' : 'border-border'} ${o.suitable ? '' : 'cursor-not-allowed opacity-55'}`}>
                <input type="radio" name="room" className="mt-1" checked={roomTypeId === o.roomTypeId} disabled={!o.suitable} onChange={() => setRoomTypeId(o.roomTypeId)} />
                <span className="flex-1">
                  <span className="flex items-center justify-between gap-2 font-semibold text-ink-deep">{o.name}<span>{vnd(o.totalAmount)}</span></span>
                  <span className="block text-xs text-muted">
                    {o.current ? 'Khách đã chọn · đã giữ phòng' : `Còn ${o.availableRooms} phòng`} · tối đa {o.maxOccupancy ?? '—'} khách/phòng
                  </span>
                  {o.unavailableReason && <span className="block text-xs text-danger">{o.unavailableReason}</span>}
                </span>
              </label>
            ))}
          </fieldset>
          {changed && chosen && (
            <p className="rounded-md border border-sun/40 bg-sun-light/30 p-2.5 text-xs text-ink">
              Đổi sang <b>{chosen.name}</b>: tổng tiền {vnd(booking.totalAmount)} → <b>{vnd(chosen.totalAmount)}</b>. Phòng cũ sẽ được nhả và giữ phòng mới cho khách.
            </p>
          )}
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted">
            Phản hồi yêu cầu đặc biệt / điều kiện gửi khách
            <textarea className={field} rows={3} maxLength={500} value={note} disabled={busy} onChange={(e) => setNote(e.target.value)}
              placeholder={booking.guestNote ? 'VD: Đã chuẩn bị nôi em bé, nhận phòng sớm tùy tình trạng phòng...' : 'Không bắt buộc'} />
            <span className="self-end font-normal">{note.length}/500</span>
          </label>
          <p className="text-xs text-muted">Sau khi chấp nhận, đơn chuyển sang <b>Chờ thanh toán</b> và khách có 15 phút để thanh toán.</p>
          <button disabled={busy || !chosen?.suitable} className="rounded-md bg-coral px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-coral)] transition-all duration-200 hover:bg-coral-hover disabled:opacity-50">
            {busy ? 'Đang xử lý...' : 'Chấp nhận đơn'}
          </button>
        </form>
      ) : mode === 'info' ? (
        booking.canRequestInfo ? (
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); setConfirm({ title: "Gửi yêu cầu bổ sung cho khách?", confirmLabel: "Gửi yêu cầu", body: <>“{infoMessage.trim()}”<br />Đơn vẫn chờ xử lý và giữ phòng; hạn xử lý không đổi.</>, onConfirm: () => void submit(() => partnerBookingService.requestInfo(booking.id, { message: infoMessage.trim() })) }); }}>
            <fieldset disabled={busy} className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-muted">Nội dung cần khách bổ sung hoặc điều chỉnh</p>
              <textarea className={field} rows={4} required maxLength={500} value={infoMessage} onChange={(e) => setInfoMessage(e.target.value)}
                placeholder="VD: Vui lòng cho biết giờ đến dự kiến và độ tuổi của các bé đi cùng." />
              <span className="self-end text-xs text-muted">{infoMessage.length}/500</span>
              <p className="text-xs text-muted">Đơn vẫn ở trạng thái <b>Chờ xử lý</b> và vẫn giữ phòng. Khách trả lời trên trang tra cứu đơn; hạn xử lý không thay đổi.</p>
              <button disabled={busy || !infoMessage.trim()} className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-700 disabled:opacity-50">
                {busy ? 'Đang gửi...' : 'Gửi yêu cầu cho khách'}
              </button>
            </fieldset>
          </form>
        ) : (
          <p className="rounded-md bg-canvas p-3 text-sm text-muted">Đang chờ khách phản hồi yêu cầu trước, hoặc đơn đã quá hạn xử lý.</p>
        )
      ) : (
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); setConfirm({ title: `Từ chối đơn ${booking.bookingCode}?`, confirmLabel: "Từ chối đơn", tone: "danger", body: <>Lý do: “{reason.trim()}”<br />Phòng đang giữ sẽ được mở bán lại. Thao tác này không hoàn tác được.</>, onConfirm: () => void submit(() => partnerBookingService.reject(booking.id, { reason: reason.trim() })) }); }}>
          <fieldset disabled={busy} className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted">Lý do từ chối (khách xem được khi tra cứu đơn)</p>
            <div className="flex flex-wrap gap-1.5">
              {REJECT_REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)} className={`rounded-sm border px-2 py-1 text-xs transition-colors ${reason === r ? 'border-danger bg-danger/5 text-danger' : 'border-border text-ink hover:border-danger/50'}`}>{r}</button>
              ))}
            </div>
            <textarea className={field} rows={3} required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do cụ thể..." />
            <p className="text-xs text-muted">Phòng đang giữ cho đơn sẽ được mở bán lại ngay.</p>
            <button disabled={busy || !reason.trim()} className="rounded-md border border-danger bg-surface px-4 py-2.5 text-sm font-semibold text-danger transition-colors duration-200 hover:bg-danger/5 disabled:opacity-50">
              {busy ? 'Đang xử lý...' : 'Từ chối đơn'}
            </button>
          </fieldset>
        </form>
      )}
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </section>
  );
}

const STAY_ACTION: Record<StayAction, { label: string; confirm: string; body: string; tone: ConfirmRequest['tone'] }> = {
  CHECK_IN: { label: 'Khách đã nhận phòng', confirm: 'Xác nhận nhận phòng', body: 'Đơn chuyển sang “Đã nhận phòng”.', tone: 'primary' },
  CHECK_OUT: { label: 'Khách đã trả phòng', confirm: 'Xác nhận trả phòng', body: 'Đơn chuyển sang “Đã trả phòng”.', tone: 'primary' },
  COMPLETE: { label: 'Hoàn thành đơn', confirm: 'Hoàn thành đơn', body: 'Đơn được đóng ở trạng thái “Hoàn tất”; khách có thể viết đánh giá.', tone: 'coral' },
  NO_SHOW: { label: 'Khách không đến', confirm: 'Đánh dấu không đến', body: 'Đơn được đóng; các đêm từ hôm nay trở đi được mở bán lại. Không hoàn tác được.', tone: 'danger' },
};

/** Kết quả xử lý + vận hành lưu trú sau khi đơn đã xác nhận (nhận phòng, trả phòng, hoàn thành, khách không đến). */
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
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-semibold text-primary">Kết quả xử lý</h2>
      <span className={`${pill(BOOKING_STATUS_TONE[booking.status])} w-fit`}>{BOOKING_STATUS_LABEL[booking.status]}</span>
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
          {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-2.5 text-sm text-danger">{error}</p>}
          <input className={field} maxLength={500} disabled={busy} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (không bắt buộc)" />
          {booking.stayActions.map((action) => (
            <button key={action} type="button" disabled={busy}
              onClick={() => setConfirm({ title: `${STAY_ACTION[action].label}?`, confirmLabel: STAY_ACTION[action].confirm, tone: STAY_ACTION[action].tone,
                body: <>{STAY_ACTION[action].body}{note.trim() && <><br />Ghi chú: “{note.trim()}”</>}</>, onConfirm: () => void run(action) })}
              className={action === 'NO_SHOW'
                ? 'rounded-md border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors duration-200 hover:bg-danger/5 disabled:opacity-50'
                : 'rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-700 disabled:opacity-50'}>
              {busy ? 'Đang xử lý...' : STAY_ACTION[action].label}
            </button>
          ))}
        </div>
      )}
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]"><h2 className="font-semibold text-primary">{title}</h2>{children}</section>;
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted">{k}</span>
      <span className={`text-right ${strong ? 'font-bold text-ink-deep' : 'text-ink'}`}>{v}</span>
    </div>
  );
}
