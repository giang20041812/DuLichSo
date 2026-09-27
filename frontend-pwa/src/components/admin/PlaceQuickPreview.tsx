import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, FilePenLine, MapPin, Star, X } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/lib/apiError';
import type { AdminPlaceDetailDto, AdminPlaceSummaryDto } from '@/types/admin';
import { StatusBadge } from './StatusBadge';
import { kindMeta, VERIFICATION_LABEL, VERIFICATION_TONE, VISIBILITY_LABEL, VISIBILITY_TONE } from './placeMeta';
import OverlayPortal from './OverlayPortal';

interface PlaceQuickPreviewProps {
  /** Dữ liệu dòng đã có sẵn trong bảng — hiển thị ngay trong lúc tải chi tiết. */
  place: AdminPlaceSummaryDto;
  onClose: () => void;
  onApprove: () => void;
  onRequestUpdate: () => void;
  onToggleVisibility: () => void;
}

const vnd = (n?: number | null) => (n == null ? null : new Intl.NumberFormat('vi-VN').format(n) + 'đ');
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

/** Ngăn xem nhanh bên phải: Admin đọc chi tiết điểm đến và Duyệt / Yêu cầu bổ sung ngay. */
export default function PlaceQuickPreview({ place, onClose, onApprove, onRequestUpdate, onToggleVisibility }: PlaceQuickPreviewProps) {
  const [detail, setDetail] = useState<AdminPlaceDetailDto | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    adminService
      .getPlaceById(place.id)
      .then((d) => {
        if (alive) setDetail(d);
      })
      .catch((err: unknown) => {
        if (alive) setError(getApiErrorMessage(err, 'Không tải được chi tiết điểm đến.'));
      });
    return () => {
      alive = false;
    };
  }, [place.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const p = detail ?? place;
  const kind = kindMeta(p.kind);
  const KindIcon = kind.icon;
  const price =
    p.priceRefMin != null || p.priceRefMax != null
      ? [vnd(p.priceRefMin), vnd(p.priceRefMax)].filter(Boolean).join(' – ') + (detail?.priceUnitNote ? ` · ${detail.priceUnitNote}` : '')
      : null;
  const attributes = detail?.attributes ? Object.entries(detail.attributes).filter(([, v]) => v !== null && v !== '' && typeof v !== 'object') : [];

  return (
    <OverlayPortal>
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-deep/40 backdrop-blur-[2px] fade-in-overlay" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Xem nhanh ${p.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl panel-slide-in"
      >
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${kind.tone}`}>
            <KindIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-bold text-ink-deep">{p.name}</h3>
            <p className="truncate font-mono text-[11px] text-muted">#{p.id} · {p.slug}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge tone={VERIFICATION_TONE[p.verification]} pulse={p.verification === 'UNVERIFIED'}>
                {VERIFICATION_LABEL[p.verification]}
              </StatusBadge>
              <StatusBadge tone={VISIBILITY_TONE[p.visibility]}>{VISIBILITY_LABEL[p.visibility]}</StatusBadge>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${kind.tone}`}>{kind.label}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div role="alert" className="mb-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/5 p-2.5 text-xs text-danger">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <Field label="Nhà cung cấp">{p.providerName || 'Hệ thống du lịch'}</Field>
            <Field label="Khu vực">{p.regionName || '—'}</Field>
            <Field label="Danh mục">{p.categoryName || kind.label}</Field>
            <Field label="Đánh giá">
              {p.ratingAvg != null && (p.ratingCount ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-sun text-sun" /> {Number(p.ratingAvg).toFixed(1)}
                  <span className="text-muted">({p.ratingCount})</span>
                </span>
              ) : (
                'Chưa có'
              )}
            </Field>
            <Field label="Giá tham khảo" wide>{price || '—'}</Field>
            <Field label="Địa chỉ" wide>
              <span className="inline-flex items-start gap-1">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" /> {p.address || '—'}
              </span>
            </Field>
            <Field label="Ngày tạo">{fmtDate(p.createdAt)}</Field>
            <Field label="Kiểm duyệt gần nhất">{fmtDate(p.lastVerifiedAt)}</Field>
          </dl>

          {!detail && !error && (
            <div className="mt-4 flex flex-col gap-2" aria-busy="true">
              <div className="h-3 w-24 animate-pulse rounded-sm bg-canvas" />
              <div className="h-16 animate-pulse rounded-md bg-canvas" />
            </div>
          )}

          {detail?.description && (
            <Block title="Mô tả">
              <p className="whitespace-pre-line text-xs leading-relaxed text-ink">{detail.description}</p>
            </Block>
          )}
          {detail?.accessNote && (
            <Block title="Hướng dẫn đường đi">
              <p className="whitespace-pre-line text-xs leading-relaxed text-ink">{detail.accessNote}</p>
            </Block>
          )}
          {attributes.length > 0 && (
            <Block title="Thuộc tính">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {attributes.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="truncate text-muted">{k}</dt>
                    <dd className="truncate text-ink">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </Block>
          )}
          {detail && !detail.description && !detail.accessNote && (
            <p className="mt-4 rounded-md bg-sun/10 px-3 py-2 text-[11px] text-amber-700">
              Điểm đến chưa có mô tả — cân nhắc yêu cầu NCC bổ sung trước khi duyệt.
            </p>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-canvas/60 px-5 py-3">
          {p.verification !== 'VERIFIED' && (
            <button
              type="button"
              onClick={onApprove}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600"
            >
              <CheckCircle2 className="h-4 w-4" /> Duyệt
            </button>
          )}
          {p.verification !== 'NEEDS_UPDATE' && (
            <button
              type="button"
              onClick={onRequestUpdate}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-sun/60 bg-white px-3 text-xs font-semibold text-amber-700 transition-colors hover:bg-sun/10"
            >
              <FilePenLine className="h-4 w-4" /> Yêu cầu bổ sung
            </button>
          )}
          <button
            type="button"
            onClick={onToggleVisibility}
            title={p.visibility === 'PUBLISHED' ? 'Ẩn điểm đến' : 'Công khai điểm đến'}
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 text-xs font-semibold text-muted transition-colors hover:border-primary/40 hover:text-primary"
          >
            {p.visibility === 'PUBLISHED' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {p.visibility === 'PUBLISHED' ? 'Ẩn' : 'Công khai'}
          </button>
        </footer>
      </aside>
    </div>
    </OverlayPortal>
  );
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 border-t border-border pt-3">
      <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">{title}</h4>
      {children}
    </section>
  );
}
