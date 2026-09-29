import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Mail, Phone, RefreshCw, StickyNote, XCircle } from 'lucide-react';
import { partnerBookingService } from '@/services/partnerBookingService';
import { homestayError } from '@/services/partnerHomestayService';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE } from '@/lib/bookingStatus';
import ConfirmDialog, { type ConfirmRequest } from '@/components/partner/ConfirmDialog';
import { Alert, PageHeader } from '@/components/partner/PartnerUI';
import { ui } from '@/lib/partnerUi';
import type { BookingCheckLevel, BookingEvaluationConclusion, PartnerBookingDetailDto, StayAction } from '@/types/booking';

const vnd = (n?: number | null) => (n == null ? '—' : new Intl.NumberFormat('vi-VN').format(n) + 'đ');
const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');
const pill = (cls: string) => `rounded-sm border px-2 py-0.5 text-[11px] font-bold ${cls}`;
const REJECT_REASONS = ['Hết phòng trong thời gian yêu cầu', 'Homestay tạm ngừng đón khách', 'Không đáp ứng được yêu cầu đặc biệt', 'Số khách vượt quá khả năng phục vụ'];
const ACTOR_LABEL = { CUSTOMER: 'Khách hàng', PROVIDER: 'Nhà cung cấp', ADMIN: 'Quản trị viên', SYSTEM: 'Hệ thống' } as const;
const CONCLUSION: Record<BookingEvaluationConclusion, { label: string; hint: string; tone: string }> = {
  MEETS: { label: 'Đáp ứng', hint: 'Đủ phòng, đúng sức chứa, giá và chính sách phù hợp.', tone: 'border-accent bg-accent-50 text-accent-700' },
  NEEDS_ADJUSTMENT: { label: 'Cần điều chỉnh', hint: 'Muốn đổi phòng/ngày/giá: chỉ đề xuất cho khách xác nhận, không sửa Booking gốc.', tone: 'border-sun bg-sun-light text-ink-deep' },
  NOT_MEETS: { label: 'Không đáp ứng', hint: 'Còn điều kiện cốt lõi không đạt.', tone: 'border-danger bg-danger/5 text-danger' },
};

const CHECK_STYLE: Record<BookingCheckLevel, { icon: ReactNode; tone: string }> = {
  OK: { icon: <CheckCircle2 className="h-4 w-4 text-accent-600" />, tone: 'border-border' },
  WARN: { icon: <AlertTriangle className="h-4 w-4 text-sun" />, tone: 'border-sun/40 bg-sun-light/30' },
  FAIL: { icon: <XCircle className="h-4 w-4 text-danger" />, tone: 'border-danger/30 bg-danger/5' },
};

/** Thời gian còn lại tới hạn phản hồi, cập nhật mỗi 30 giây. */
function useRemaining(dueAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!dueAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [dueAt]);
  if (!dueAt) return null;
  return Math.floor((new Date(dueAt).getTime() - now) / 60000);
}

/** UC-NCC-06/07/08: tiếp nhận – đánh giá – quyết định một yêu cầu Booking. */
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

  const reload = () => setRetry((n) => n + 1);

  if (loading) return <p role="status" className="py-12 text-center text-muted">Đang tải đơn đặt phòng...</p>;
  if (loadError || !booking) {
    return (
      <Alert tone="error" action={<Link to="/partner/bookings" className={ui.btnGhost}>Quay lại</Link>}>
        {loadError || 'Không tìm thấy đơn đặt phòng.'}
        {validId && <button type="button" onClick={() => { setLoading(true); reload(); }} className="ml-3 font-semibold underline">Thử lại</button>}
      </Alert>
    );
  }

  const policy = booking.policySnapshot;
  const policyText = (key: string) => (typeof policy[key] === 'string' || typeof policy[key] === 'number' ? String(policy[key]) : null);
  const pending = booking.status === 'PENDING';

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader title={booking.bookingCode} breadcrumbs={[{ label: 'Bảng điều khiển', to: '/partner' }, { label: 'Đơn đặt phòng', to: '/partner/bookings' }, { label: booking.bookingCode }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted">{booking.placeName} · Khách gửi lúc {dateTime(booking.createdAt)}</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 text-2xl font-bold text-ink-deep">
            <span className="font-mono">{booking.bookingCode}</span>
            <span className={pill(BOOKING_STATUS_TONE[booking.status])}>{BOOKING_STATUS_LABEL[booking.status]}</span>
          </h1>
        </div>
        {pending && <DeadlineChip dueAt={booking.responseDueAt} overdue={booking.overdue} />}
      </div>

      {pending && booking.overdue && <Alert tone="error">Booking đã quá thời hạn xử lý. Hệ thống không ghi nhận quyết định muộn; phòng đã giữ sẽ được trả lại tự động.</Alert>}

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-7">
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
                <Row k="Giá đã chốt khi gửi" v={vnd(booking.totalAmount)} strong />
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
              <ul className="flex flex-col gap-2 text-sm">
                {booking.serviceItems.map((s, i) => (
                  <li key={`${s.serviceName}-${i}`} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span><b className="font-medium text-ink-deep">{s.serviceName}</b>{s.note && <span className="block text-xs text-muted">{s.note}</span>}</span></li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted">Yêu cầu đặc biệt chưa được coi là NCC đã đồng ý cho tới khi bạn ghi kết quả ở bước Đánh giá.</p>
          </Section>

          <Section title="Giá và chính sách tại thời điểm khách gửi">
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
            <p className="text-xs text-muted">BOOK-BR-16: giá và chính sách của Booking đang chờ không tự thay đổi khi bạn sửa giá phòng.</p>
          </Section>

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
                    <p className="font-semibold text-ink-deep">{h.fromStatus ? `${BOOKING_STATUS_LABEL[h.fromStatus]} → ` : ''}{BOOKING_STATUS_LABEL[h.toStatus]}</p>
                    <p className="text-xs text-muted">{ACTOR_LABEL[h.actor]} · {dateTime(h.createdAt)}</p>
                    {h.reason && <p className="mt-1 whitespace-pre-wrap text-ink">{h.reason}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-4 lg:col-span-5">
          {pending && !booking.overdue
            ? <ProcessPanel key={`${booking.id}-${booking.evaluation?.evaluatedAt ?? 'none'}-${booking.infoRequests.length}`} booking={booking} onDone={setBooking} onReload={reload} />
            : <ResultPanel booking={booking} onDone={setBooking} />}
        </div>
      </div>
    </div>
  );
}

function DeadlineChip({ dueAt, overdue }: { dueAt: string | null; overdue: boolean }) {
  const minutes = useRemaining(dueAt);
  if (!dueAt) return null;
  const late = overdue || (minutes != null && minutes < 0);
  const urgent = !late && minutes != null && minutes <= 30;
  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${late ? 'border-danger/40 bg-danger/5 text-danger' : urgent ? 'border-coral/40 bg-coral-light text-coral-hover' : 'border-sun/40 bg-sun-light text-ink-deep'}`}>
      <Clock className="h-4 w-4" />
      {late ? <>Đã quá hạn lúc {dateTime(dueAt)}</> : <>Còn {minutes} phút · phản hồi trước {dateTime(dueAt)}</>}
    </div>
  );
}

type Step = 'check' | 'evaluate' | 'decide';
const STEPS: { id: Step; label: string; uc: string }[] = [
  { id: 'check', label: 'Kiểm tra', uc: 'UC-NCC-06' },
  { id: 'evaluate', label: 'Đánh giá', uc: 'UC-NCC-07' },
  { id: 'decide', label: 'Quyết định', uc: 'UC-NCC-08' },
];

function ProcessPanel({ booking, onDone, onReload }: { booking: PartnerBookingDetailDto; onDone: (b: PartnerBookingDetailDto) => void; onReload: () => void }) {
  const evaluation = booking.evaluation;
  const [step, setStep] = useState<Step>(evaluation ? (evaluation.conclusion === 'MEETS' && !evaluation.stale ? 'decide' : 'evaluate') : 'check');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  async function submit(action: () => Promise<PartnerBookingDetailDto>, done: string) {
    setBusy(true); setError(''); setNotice('');
    try { onDone(await action()); setNotice(done); } catch (e: unknown) { setError(homestayError(e)); } finally { setBusy(false); }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  return (
    <section className={`${ui.card} flex flex-col gap-4 p-5`}>
      <h2 className="font-semibold text-primary">Xử lý yêu cầu Booking</h2>
      <ol className="grid grid-cols-3 gap-1.5">
        {STEPS.map((s, i) => {
          const reachable = s.id === 'check' || (s.id === 'evaluate' && booking.canEvaluate) || (s.id === 'decide' && evaluation != null);
          return (
            <li key={s.id}>
              <button type="button" disabled={!reachable || busy} onClick={() => setStep(s.id)}
                className={`flex w-full flex-col items-start rounded-md border px-2.5 py-2 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${step === s.id ? 'border-primary bg-primary-50' : i < stepIndex ? 'border-accent/40 bg-accent-50/50' : 'border-border hover:border-primary/40'}`}>
                <span className="text-[10px] font-semibold text-muted">{i + 1}. {s.uc}</span>
                <span className={`text-sm font-bold ${step === s.id ? 'text-primary' : 'text-ink-deep'}`}>{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      {step === 'check' && <CheckStep booking={booking} busy={busy} onNext={() => setStep('evaluate')}
        onRequestInfo={(message) => setConfirm({ title: 'Gửi yêu cầu bổ sung cho khách?', confirmLabel: 'Gửi yêu cầu', body: <>“{message}”<br />Đơn vẫn chờ xử lý và vẫn giữ phòng; hạn phản hồi không được gia hạn.</>, onConfirm: () => void submit(() => partnerBookingService.requestInfo(booking.id, { message }), 'Đã gửi yêu cầu bổ sung thông tin') })} />}
      {step === 'evaluate' && <EvaluateStep booking={booking} busy={busy} onReload={onReload} onBack={() => setStep('check')}
        onSave={(input) => void submit(() => partnerBookingService.evaluate(booking.id, input), 'Đã lưu kết quả đánh giá')}
        onNext={() => setStep('decide')} />}
      {step === 'decide' && <DecideStep booking={booking} busy={busy} onBack={() => setStep('evaluate')}
        onAccept={(note) => setConfirm({ title: `Xác nhận chấp nhận ${booking.bookingCode}?`, confirmLabel: 'Xác nhận chấp nhận', tone: 'coral',
          body: <><b>{booking.roomTypeName}</b> · {booking.roomCount} phòng · {booking.nights} đêm ({date(booking.checkIn)} → {date(booking.checkOut)}) · {booking.guestCount} khách.<br />Giá khách đã chốt: <b>{vnd(booking.totalAmount)}</b> (không thay đổi).{evaluation?.specialRequestResult && <><br />Yêu cầu đặc biệt: {evaluation.specialRequestResult}</>}<br />Phòng đang giữ chuyển thành đã xác nhận; khách nhận thông báo và thanh toán trực tiếp tại chỗ nghỉ.</>,
          onConfirm: () => void submit(() => partnerBookingService.accept(booking.id, { roomTypeId: null, note }), 'Booking đã được xác nhận') })}
        onReject={(reason) => setConfirm({ title: `Từ chối ${booking.bookingCode}?`, confirmLabel: 'Xác nhận từ chối', tone: 'danger',
          body: <>Lý do (khách xem được): “{reason}”<br />Phòng đang giữ được giải phóng. Thao tác này không hoàn tác được.</>,
          onConfirm: () => void submit(() => partnerBookingService.reject(booking.id, { reason }), 'Đã từ chối Booking') })} />}
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </section>
  );
}

function CheckStep({ booking, busy, onNext, onRequestInfo }: { booking: PartnerBookingDetailDto; busy: boolean; onNext: () => void; onRequestInfo: (message: string) => void }) {
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState('');
  const waiting = booking.infoRequests.some((r) => !r.respondedAt);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">Xem thông tin khách gửi. Nếu thiếu hoặc chưa phù hợp, yêu cầu khách bổ sung; nếu đủ, tiếp tục đánh giá.</p>
      <ul className="flex flex-col gap-2">
        {booking.checks.map((c) => (
          <li key={c.code} className={`flex items-start gap-2.5 rounded-md border p-2.5 text-sm ${CHECK_STYLE[c.level].tone}`}>
            <span className="mt-0.5 shrink-0">{CHECK_STYLE[c.level].icon}</span>
            <span><b className="font-semibold text-ink-deep">{c.label}</b><span className="block text-xs text-muted">{c.detail}</span></span>
          </li>
        ))}
      </ul>
      {waiting && <Alert tone="info">Đang chờ khách phản hồi yêu cầu bổ sung. Bạn đánh giá được sau khi khách trả lời.</Alert>}
      {asking ? (
        <form className="flex flex-col gap-2 rounded-md border border-secondary/30 bg-secondary-50/50 p-3" onSubmit={(e) => { e.preventDefault(); if (message.trim()) onRequestInfo(message.trim()); }}>
          <p className="text-xs font-semibold text-ink">Nội dung cần khách bổ sung (nêu cụ thể dữ liệu cần trả lời)</p>
          <textarea className={ui.textarea} rows={3} required maxLength={500} value={message} disabled={busy} onChange={(e) => setMessage(e.target.value)} placeholder="VD: Vui lòng cho biết giờ đến dự kiến và độ tuổi của các bé đi cùng." />
          <div className="flex items-center gap-2">
            <button className={ui.btnPrimary} disabled={busy || !message.trim()}>Gửi yêu cầu</button>
            <button type="button" className={ui.btnGhost} onClick={() => setAsking(false)}>Hủy</button>
            <span className="ml-auto text-xs text-muted">{message.length}/500</span>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={ui.btnOutline} disabled={busy || !booking.canRequestInfo} onClick={() => setAsking(true)}>Yêu cầu bổ sung</button>
          <button type="button" className={`${ui.btnPrimary} flex-1`} disabled={busy || !booking.canEvaluate} onClick={onNext}>Tiếp tục đánh giá <ArrowRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}

function EvaluateStep({ booking, busy, onReload, onBack, onSave, onNext }: {
  booking: PartnerBookingDetailDto; busy: boolean; onReload: () => void; onBack: () => void;
  onSave: (input: { conclusion: BookingEvaluationConclusion; specialRequestResult?: string; note?: string }) => void; onNext: () => void;
}) {
  const evaluation = booking.evaluation;
  const [conclusion, setConclusion] = useState<BookingEvaluationConclusion | ''>(evaluation?.conclusion ?? '');
  const [special, setSpecial] = useState(evaluation?.specialRequestResult ?? '');
  const [note, setNote] = useState(evaluation?.note ?? '');
  const hasSpecial = !!booking.guestNote || booking.serviceItems.length > 0;
  const shortNights = booking.availability.filter((d) => d.stopSell || d.heldRooms < booking.roomCount);
  const capacityFail = booking.checks.some((c) => c.code === 'CAPACITY' && c.level === 'FAIL');
  const coreFail = shortNights.length > 0 || capacityFail;

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (conclusion) onSave({ conclusion, specialRequestResult: special.trim() || undefined, note: note.trim() || undefined }); }}>
      {evaluation?.stale && <Alert tone="info">Dữ liệu phòng đã thay đổi sau lần đánh giá lúc {dateTime(evaluation.evaluatedAt)}. Vui lòng kiểm tra và lưu đánh giá lại.</Alert>}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-ink">Khả dụng theo từng đêm · {booking.roomTypeName}</p>
          <button type="button" className={ui.btnGhost} disabled={busy} onClick={onReload}><RefreshCw className="h-3.5 w-3.5" />Kiểm tra lại</button>
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b border-border bg-canvas text-muted"><th className="px-2 py-1.5">Đêm</th><th className="px-2 py-1.5 text-right">Thực tế</th><th className="px-2 py-1.5 text-right">Giữ cho đơn này</th><th className="px-2 py-1.5 text-right">Đã xác nhận</th><th className="px-2 py-1.5 text-right">Còn bán</th></tr></thead>
            <tbody className="divide-y divide-border">
              {booking.availability.map((d) => {
                const short = d.stopSell || d.heldRooms < booking.roomCount;
                return (
                  <tr key={d.stayDate} className={short ? 'bg-danger/5 text-danger' : ''}>
                    <td className="px-2 py-1.5">{date(d.stayDate)}{d.stopSell && ' · đóng bán'}</td>
                    <td className="px-2 py-1.5 text-right">{d.totalRooms}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{Math.min(booking.roomCount, d.heldRooms)}</td>
                    <td className="px-2 py-1.5 text-right">{d.confirmedRooms}</td>
                    <td className="px-2 py-1.5 text-right">{d.availableRooms}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shortNights.length > 0 && <Alert tone="error">Không đủ phòng trong toàn bộ thời gian lưu trú.</Alert>}
        {capacityFail && <Alert tone="error">Số khách vượt sức chứa phương án phòng.</Alert>}
      </div>

      <fieldset disabled={busy} className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold text-ink">Kết luận <span className="text-danger">*</span></legend>
        {(Object.keys(CONCLUSION) as BookingEvaluationConclusion[]).map((key) => {
          const disabled = key === 'MEETS' && coreFail;
          return (
            <label key={key} className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 text-sm transition-colors duration-200 ${conclusion === key ? CONCLUSION[key].tone : 'border-border'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
              <input type="radio" name="conclusion" className="mt-1 accent-[var(--color-primary)]" checked={conclusion === key} disabled={disabled} onChange={() => setConclusion(key)} />
              <span><b className="font-semibold">{CONCLUSION[key].label}</b><span className="block text-xs text-muted">{CONCLUSION[key].hint}</span></span>
            </label>
          );
        })}
        {conclusion === 'NEEDS_ADJUSTMENT' && booking.roomOptions.some((o) => !o.current && o.suitable) && (
          <div className="rounded-md bg-canvas p-2.5 text-xs text-ink">
            <p className="mb-1 font-semibold">Phương án khác có thể đề xuất cho khách (tham khảo):</p>
            <ul className="flex flex-col gap-0.5">{booking.roomOptions.filter((o) => !o.current && o.suitable).map((o) => <li key={o.roomTypeId}>{o.name} · còn {o.availableRooms} phòng · {vnd(o.totalAmount)}</li>)}</ul>
            <p className="mt-1 text-muted">Gửi đề xuất bằng “Yêu cầu bổ sung” để khách xác nhận. Booking gốc không bị sửa.</p>
          </div>
        )}
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Kết quả yêu cầu đặc biệt {hasSpecial && <span className="text-danger">*</span>}</span>
        <textarea className={ui.textarea} rows={2} maxLength={1000} required={hasSpecial} disabled={busy || !hasSpecial} value={special} onChange={(e) => setSpecial(e.target.value)}
          placeholder={hasSpecial ? 'Ghi rõ từng yêu cầu: đáp ứng hay không (VD: Có nôi em bé; không nhận phòng sớm được).' : 'Khách không có yêu cầu đặc biệt.'} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Ghi chú đánh giá</span>
        <textarea className={ui.textarea} rows={2} maxLength={1000} disabled={busy} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Căn cứ cho quyết định tiếp theo (không gửi cho khách)." />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.btnGhost} disabled={busy} onClick={onBack}><ArrowLeft className="h-4 w-4" />Quay lại</button>
        <button className={ui.btnPrimary} disabled={busy || !conclusion}>{busy ? 'Đang lưu...' : 'Lưu đánh giá'}</button>
        <button type="button" className={`${ui.btnOutline} ml-auto`} disabled={busy || !evaluation || evaluation.stale} onClick={onNext}>Chuyển sang quyết định <ArrowRight className="h-4 w-4" /></button>
      </div>
      {evaluation && <p className="text-[11px] text-muted">Đã lưu đánh giá “{CONCLUSION[evaluation.conclusion].label}” lúc {dateTime(evaluation.evaluatedAt)}. Booking vẫn chưa được xác nhận.</p>}
    </form>
  );
}

function DecideStep({ booking, busy, onBack, onAccept, onReject }: {
  booking: PartnerBookingDetailDto; busy: boolean; onBack: () => void; onAccept: (note: string) => void; onReject: (reason: string) => void;
}) {
  const evaluation = booking.evaluation;
  const [mode, setMode] = useState<'accept' | 'reject'>(booking.canAccept ? 'accept' : 'reject');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 rounded-md border border-primary/10 bg-canvas p-3 text-sm">
        <Row k="Phương án" v={`${booking.roomTypeName} · ${booking.roomCount} phòng`} />
        <Row k="Ngày lưu trú" v={`${date(booking.checkIn)} → ${date(booking.checkOut)} (${booking.nights} đêm)`} />
        <Row k="Số khách" v={String(booking.guestCount)} />
        <Row k="Giá đã chốt" v={vnd(booking.totalAmount)} strong />
        {evaluation && <Row k="Kết luận đánh giá" v={CONCLUSION[evaluation.conclusion].label} />}
        {evaluation?.specialRequestResult && <Row k="Yêu cầu đặc biệt" v={evaluation.specialRequestResult} />}
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-md bg-canvas p-1 text-sm font-semibold">
        <button type="button" disabled={!booking.canAccept} onClick={() => setMode('accept')} className={`rounded px-2 py-1.5 transition-colors disabled:opacity-40 ${mode === 'accept' ? 'bg-surface text-primary shadow-xs' : 'text-muted'}`}>Chấp nhận</button>
        <button type="button" onClick={() => setMode('reject')} className={`rounded px-2 py-1.5 transition-colors ${mode === 'reject' ? 'bg-surface text-danger shadow-xs' : 'text-muted'}`}>Từ chối</button>
      </div>

      {!booking.canAccept && evaluation?.conclusion !== 'MEETS' && (
        <Alert tone="info">Chỉ chấp nhận được khi kết luận đánh giá là “Đáp ứng”. {evaluation?.conclusion === 'NEEDS_ADJUSTMENT' ? 'Hãy gửi đề xuất điều chỉnh cho khách qua “Yêu cầu bổ sung”, hoặc từ chối.' : ''}</Alert>
      )}

      {mode === 'accept' ? (
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onAccept(note.trim()); }}>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Lời nhắn gửi khách (không bắt buộc)</span>
            <textarea className={ui.textarea} rows={2} maxLength={500} value={note} disabled={busy} onChange={(e) => setNote(e.target.value)} placeholder="Mặc định gửi kết quả yêu cầu đặc biệt đã đánh giá." />
          </label>
          <p className="text-xs text-muted">Hệ thống kiểm tra lần cuối quyền, trạng thái, hạn xử lý, phòng và sức chứa trước khi xác nhận.</p>
          <button className={ui.btnCoral} disabled={busy || !booking.canAccept}>{busy ? 'Đang xử lý...' : 'Chấp nhận'}</button>
        </form>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (reason.trim()) onReject(reason.trim()); }}>
          <p className="text-xs font-semibold text-ink">Lý do từ chối (khách xem được) <span className="text-danger">*</span></p>
          <div className="flex flex-wrap gap-1.5">
            {REJECT_REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} className={`rounded-sm border px-2 py-1 text-xs transition-colors ${reason === r ? 'border-danger bg-danger/5 text-danger' : 'border-border text-ink hover:border-danger/50'}`}>{r}</button>
            ))}
          </div>
          <textarea className={ui.textarea} rows={3} required maxLength={500} value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do cụ thể..." />
          <button className={ui.btnDanger} disabled={busy || !reason.trim()}>{busy ? 'Đang xử lý...' : 'Từ chối'}</button>
        </form>
      )}
      <button type="button" className={`${ui.btnGhost} w-fit`} disabled={busy} onClick={onBack}><ArrowLeft className="h-4 w-4" />Quay lại đánh giá</button>
    </div>
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
    <section className={`${ui.card} flex flex-col gap-3 p-5`}>
      <h2 className="font-semibold text-primary">Kết quả xử lý</h2>
      <span className={`${pill(BOOKING_STATUS_TONE[booking.status])} w-fit`}>{BOOKING_STATUS_LABEL[booking.status]}</span>
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
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className={`${ui.card} flex flex-col gap-3 p-5`}><h2 className="font-semibold text-primary">{title}</h2>{children}</section>;
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted">{k}</span>
      <span className={`text-right ${strong ? 'font-bold text-ink-deep' : 'text-ink'}`}>{v}</span>
    </div>
  );
}
