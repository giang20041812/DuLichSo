import { useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { partnerBookingService } from '@/services/partnerBookingService';
import type { BookingChangeRequestDto } from '@/types/booking';

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '—';

export default function PartnerBookingChangeRequests() {
  const [requests, setRequests] = useState<BookingChangeRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      setRequests(await partnerBookingService.getBookingChangeRequests());
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải yêu cầu thay đổi Booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const review = async (request: BookingChangeRequestDto, approved: boolean) => {
    let rejectionReason: string | undefined;
    if (!approved) {
      const reason = window.prompt('Nhập lý do từ chối yêu cầu thay đổi:');
      if (!reason?.trim()) return;
      rejectionReason = reason.trim();
    }

    setProcessingId(request.id);
    try {
      await partnerBookingService.reviewBookingChangeRequest(request.id, approved, rejectionReason);
      await loadRequests();
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Không thể xử lý yêu cầu thay đổi.');
    } finally {
      setProcessingId(null);
    }
  };

  const pending = requests.filter((request) => request.status === 'PENDING');

  return (
    <section className="rounded-lg border border-amber-200 bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink-deep">Yêu cầu thay đổi Booking</h2>
          <p className="mt-1 text-xs text-muted">NCC duyệt hoặc từ chối thay đổi trước khi cập nhật Booking.</p>
        </div>
        <button type="button" onClick={() => void loadRequests()} className="rounded-md border border-border p-2 text-muted hover:text-primary" aria-label="Tải lại yêu cầu">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <p role="alert" className="mb-3 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
      {!loading && pending.length === 0 && !error && <p className="rounded-md bg-canvas p-4 text-center text-sm text-muted">Không có yêu cầu thay đổi đang chờ duyệt.</p>}

      <div className="grid gap-3">
        {pending.map((request) => (
          <article key={request.id} className="rounded-md border border-amber-200 bg-amber-50/40 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-bold text-primary">#{request.bookingCode}</p>
                <p className="mt-1 text-xs text-ink">Khách: <strong>{request.guestName || '—'}</strong> · gửi {formatDateTime(request.createdAt)}</p>
              </div>
              <span className="rounded-sm border border-amber-300 bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">CHỜ DUYỆT</span>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-ink sm:grid-cols-2">
              <div><span className="font-semibold text-muted">Lưu trú:</span> {formatDate(request.checkIn)} → {formatDate(request.checkOut)}</div>
              <div><span className="font-semibold text-muted">Phòng / khách:</span> {request.roomCount ?? '—'} phòng · {request.guestCount ?? '—'} khách</div>
              <div><span className="font-semibold text-muted">SĐT:</span> {request.guestPhone || '—'}</div>
              <div><span className="font-semibold text-muted">Email:</span> {request.guestEmail || '—'}</div>
            </div>
            {request.guestNote && <p className="mt-2 text-xs"><span className="font-semibold text-muted">Ghi chú:</span> {request.guestNote}</p>}
            {request.reason && <p className="mt-2 text-xs"><span className="font-semibold text-muted">Lý do:</span> {request.reason}</p>}

            <div className="mt-3 flex justify-end gap-2 border-t border-amber-200 pt-3">
              <button type="button" disabled={processingId === request.id} onClick={() => void review(request, false)} className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5 disabled:opacity-50">
                <X className="h-3.5 w-3.5" /> Từ chối
              </button>
              <button type="button" disabled={processingId === request.id} onClick={() => void review(request, true)} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
                <Check className="h-3.5 w-3.5" /> Duyệt thay đổi
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
