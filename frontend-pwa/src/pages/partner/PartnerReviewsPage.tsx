import { useEffect, useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { partnerReviewService } from '@/services/partnerReviewService';
import { homestayError } from '@/services/partnerHomestayService';
import type { PartnerReviewDto } from '@/types/partner';

const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');
const field = 'w-full rounded-md border border-border bg-surface p-2 text-sm focus:border-primary focus:outline-none';
type Filter = 'all' | 'unreplied' | 'replied';

/** UC-NCC-09: xem đánh giá của khách về các Homestay mình quản lý và phản hồi công khai. */
export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<PartnerReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('unreplied');
  const [placeId, setPlaceId] = useState<number | ''>('');

  useEffect(() => {
    let active = true;
    partnerReviewService.list()
      .then((data) => { if (active) setReviews(data); })
      .catch((e: unknown) => { if (active) setError(homestayError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const places = [...new Map(reviews.map((r) => [r.placeId, r.placeName])).entries()];
  const shown = reviews.filter((r) => (placeId === '' || r.placeId === placeId)
    && (filter === 'all' || (filter === 'replied' ? !!r.providerReply : !r.providerReply)));
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const update = (next: PartnerReviewDto) => setReviews((list) => list.map((r) => (r.id === next.id ? next : r)));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Chăm sóc khách hàng</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-deep sm:text-3xl">Đánh giá của khách</h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">Phản hồi của bạn được hiển thị công khai ngay dưới đánh giá trên trang Homestay.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Tổng đánh giá" value={String(reviews.length)} />
        <Stat label="Điểm trung bình" value={reviews.length ? `${avg.toFixed(1)} / 5` : '—'} />
        <Stat label="Chưa phản hồi" value={String(reviews.filter((r) => !r.providerReply).length)} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex gap-1 rounded-md bg-canvas p-1 text-sm font-semibold">
          {(['unreplied', 'replied', 'all'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded px-3 py-1.5 transition-colors ${filter === f ? 'bg-surface text-primary shadow-xs' : 'text-muted'}`}>
              {f === 'unreplied' ? 'Chưa phản hồi' : f === 'replied' ? 'Đã phản hồi' : 'Tất cả'}
            </button>
          ))}
        </div>
        {places.length > 1 && (
          <select className="rounded-md border border-border bg-surface px-3 py-2 text-sm" value={placeId} onChange={(e) => setPlaceId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Tất cả Homestay</option>
            {places.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
      </div>

      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
      {loading ? <p role="status" className="py-10 text-center text-muted">Đang tải đánh giá...</p> : (
        <div className="flex flex-col gap-4">
          {shown.map((r) => <ReviewCard key={r.id} review={r} onChange={update} />)}
          {!shown.length && !error && <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted">Không có đánh giá nào trong mục này.</p>}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, onChange }: { review: PartnerReviewDto; onChange: (r: PartnerReviewDto) => void }) {
  const [editing, setEditing] = useState(!review.providerReply);
  const [text, setText] = useState(review.providerReply ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action: () => Promise<PartnerReviewDto>, keepEditing: boolean) {
    setBusy(true); setError('');
    try { const next = await action(); onChange(next); setText(next.providerReply ?? ''); setEditing(keepEditing); }
    catch (e: unknown) { setError(homestayError(e)); } finally { setBusy(false); }
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink-deep">{review.guestName}</p>
          <p className="text-xs text-muted">{review.placeName}{review.bookingCode ? ` · Đơn ${review.bookingCode}` : ''} · {dateTime(review.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {review.status === 'HIDDEN' && <span className="rounded-sm border border-border bg-canvas px-2 py-0.5 text-[11px] font-bold text-muted">Đang ẩn</span>}
          <span className="flex items-center gap-0.5" aria-label={`${review.rating} sao`}>
            {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= review.rating ? 'fill-sun text-sun' : 'text-border'}`} />)}
          </span>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm text-ink">{review.content || <span className="text-muted">Khách không để lại nội dung.</span>}</p>

      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-2.5 text-sm text-danger">{error}</p>}
      {editing ? (
        <form className="flex flex-col gap-2 border-l-2 border-primary pl-3" onSubmit={(e) => { e.preventDefault(); void run(() => partnerReviewService.reply(review.id, text.trim()), false); }}>
          <textarea className={field} rows={3} required maxLength={2000} disabled={busy} value={text} onChange={(e) => setText(e.target.value)} placeholder="Cảm ơn khách, giải đáp góp ý hoặc chia sẻ cải thiện của bạn..." />
          <div className="flex items-center gap-2">
            <button disabled={busy || !text.trim()} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-700 disabled:opacity-50">{busy ? 'Đang lưu...' : 'Đăng phản hồi'}</button>
            {review.providerReply && <button type="button" disabled={busy} onClick={() => { setEditing(false); setText(review.providerReply ?? ''); }} className="rounded-md px-3 py-2 text-sm text-muted hover:text-ink">Hủy</button>}
            <span className="ml-auto text-xs text-muted">{text.length}/2000</span>
          </div>
        </form>
      ) : review.providerReply && (
        <div className="flex flex-col gap-2 rounded-md bg-primary-50 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-primary"><MessageSquare className="h-3.5 w-3.5" /> Phản hồi của bạn · {dateTime(review.providerReplyAt)}</p>
          <p className="whitespace-pre-wrap text-sm text-ink">{review.providerReply}</p>
          <div className="flex gap-3 text-xs font-semibold">
            <button type="button" disabled={busy} onClick={() => setEditing(true)} className="text-primary hover:underline">Sửa</button>
            <button type="button" disabled={busy} onClick={() => void run(() => partnerReviewService.removeReply(review.id), true)} className="text-danger hover:underline">Gỡ phản hồi</button>
          </div>
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink-deep">{value}</p>
    </div>
  );
}
