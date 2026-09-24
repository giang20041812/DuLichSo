import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Home,
  Info,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Tag,
  Wrench,
} from 'lucide-react';
import { ChipGroup, FilterSearch, type ChipOption } from '@/components/admin/AdminFilters';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchPartnerHomestays, updateHomestayStatus } from '@/services/partnerHomestayService';
import type {
  PartnerHomestaySummaryDto,
  PartnerHomestayStatsDto,
  PlaceOperationStatus,
  PlaceVisibility,
} from '@/types/partner';

const EMPTY_STATS: PartnerHomestayStatsDto = {
  totalCount: 0,
  publishedCount: 0,
  draftCount: 0,
  unpublishedCount: 0,
  operatingCount: 0,
  tempClosedCount: 0,
};

const formatPrice = (price: number) => `${price.toLocaleString('vi-VN')}đ`;

export default function PartnerDashboardPage() {
  const navigate = useNavigate();

  const [homestays, setHomestays] = useState<PartnerHomestaySummaryDto[]>([]);
  const [stats, setStats] = useState<PartnerHomestayStatsDto>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [visibility, setVisibility] = useState<PlaceVisibility | ''>('');
  const [operation, setOperation] = useState<PlaceOperationStatus | ''>('');
  const [toast, setToast] = useState<string | null>(null);

  const debouncedKeyword = useDebouncedValue(keyword);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await fetchPartnerHomestays(
        'DEFAULT',
        debouncedKeyword,
        visibility || undefined,
        operation || undefined,
      );
      setHomestays(res.homestays);
      setStats(res.stats);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedKeyword, visibility, operation]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleVisibility = async (homestay: PartnerHomestaySummaryDto) => {
    const next: PlaceVisibility = homestay.visibility === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    try {
      const updated = await updateHomestayStatus(homestay.id, { visibility: next });
      setHomestays((prev) => prev.map((h) => (h.id === homestay.id ? updated : h)));
      showToast(
        next === 'PUBLISHED'
          ? `Đã xuất bản "${homestay.name}" lên trang chủ.`
          : `Đã ngừng hiển thị "${homestay.name}" khỏi web.`,
      );
    } catch {
      showToast('Cập nhật trạng thái thất bại.');
    }
  };

  const visibilityOptions: ChipOption<PlaceVisibility>[] = [
    { value: '', label: `Tất cả (${stats.totalCount})` },
    { value: 'PUBLISHED', label: `Đang hiển thị (${stats.publishedCount})` },
    { value: 'DRAFT', label: `Nháp (${stats.draftCount})` },
    { value: 'UNPUBLISHED', label: `Ngừng hiển thị (${stats.unpublishedCount})` },
  ];
  const operationOptions: ChipOption<PlaceOperationStatus>[] = [
    { value: '', label: 'Tất cả' },
    { value: 'OPERATING', label: `Đang đón khách (${stats.operatingCount})` },
    { value: 'TEMP_CLOSED', label: `Tạm đóng (${stats.tempClosedCount})` },
  ];

  const filtersActive = Boolean(keyword || visibility || operation);

  return (
    <div className="flex flex-col gap-6">
      {/* Tiêu đề */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-coral-hover">Cổng nhà cung cấp</p>
          <h1 className="font-display text-2xl font-extrabold text-ink-deep">Homestay của tôi</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            Homestay mới tạo ở trạng thái <strong className="text-ink">Nháp</strong> và tự hiển thị ra ngoài khi đã
            hoàn thiện đủ thông tin bắt buộc — không cần phê duyệt.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/partner/homestay/create')}
          className="flex h-11 items-center gap-2 rounded-md bg-coral px-5 text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-coral-hover active:translate-y-0"
        >
          <PlusCircle className="h-4 w-4" /> Tạo homestay mới
        </button>
      </div>

      {toast && (
        <div role="status" className="flex items-center gap-2 rounded-md bg-ink-deep px-4 py-2.5 text-xs text-white shadow-lg">
          <Info className="h-4 w-4 shrink-0 text-primary-light" />
          {toast}
        </div>
      )}

      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tổng số" value={stats.totalCount} tone="text-ink-deep" />
        <StatCard label="Đang hiển thị" value={stats.publishedCount} tone="text-primary" />
        <StatCard label="Bản nháp" value={stats.draftCount} tone="text-sun" />
        <StatCard label="Tạm đóng" value={stats.tempClosedCount} tone="text-coral" />
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-xs">
        <FilterSearch value={keyword} onChange={setKeyword} placeholder="Tìm theo tên homestay..." />
        <ChipGroup label="Hiển thị" options={visibilityOptions} value={visibility} onChange={setVisibility} />
        <ChipGroup label="Vận hành" options={operationOptions} value={operation} onChange={setOperation} />
      </div>

      {/* Danh sách */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs">Đang tải danh sách homestay...</span>
        </div>
      ) : loadError ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 p-8 text-center">
          <AlertTriangle className="h-6 w-6 text-danger" />
          <p className="text-sm text-danger">Không tải được danh sách. Vui lòng kiểm tra kết nối và thử lại.</p>
          <button type="button" onClick={() => void load()} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600">
            Thử lại
          </button>
        </div>
      ) : homestays.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-white p-10 text-center shadow-xs">
          <span className="flex h-14 w-14 items-center justify-center rounded-md bg-primary-50 text-primary">
            <Home className="h-7 w-7" />
          </span>
          <h3 className="font-display text-base font-bold text-ink-deep">
            {filtersActive ? 'Không có homestay khớp bộ lọc' : 'Chưa có homestay nào'}
          </h3>
          <p className="max-w-xs text-xs leading-relaxed text-muted">
            {filtersActive
              ? 'Thử đổi từ khóa hoặc bỏ bớt bộ lọc.'
              : 'Tạo homestay đầu tiên để bắt đầu đón khách qua Đi Du Lịch.'}
          </p>
          {!filtersActive && (
            <button
              type="button"
              onClick={() => navigate('/partner/homestay/create')}
              className="mt-1 flex items-center gap-1.5 rounded-md bg-coral px-4 py-2.5 text-xs font-bold text-white shadow-[var(--shadow-coral)] hover:bg-coral-hover"
            >
              <PlusCircle className="h-4 w-4" /> Tạo homestay đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {homestays.map((homestay) => (
            <HomestayCard
              key={homestay.id}
              homestay={homestay}
              onToggle={() => void handleToggleVisibility(homestay)}
              onNavigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-[var(--shadow-card)]">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <p className={`mt-1 font-display text-3xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function HomestayCard({
  homestay,
  onToggle,
  onNavigate,
}: {
  homestay: PartnerHomestaySummaryDto;
  onToggle: () => void;
  onNavigate: (to: string) => void;
}) {
  const published = homestay.visibility === 'PUBLISHED';
  const draft = homestay.visibility === 'DRAFT';
  const quick = 'flex items-center justify-center gap-1 rounded-md bg-canvas py-2 text-[11px] font-semibold text-ink transition-colors hover:bg-primary-50 hover:text-primary';

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)]">
      <div className="relative h-44 w-full overflow-hidden bg-canvas">
        <img src={homestay.coverImageUrl} alt={homestay.name} className="h-full w-full object-cover" />
        <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between">
          <span
            className={`flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-bold text-white ${
              published ? 'bg-primary' : draft ? 'bg-sun text-ink-deep' : 'bg-ink/80'
            }`}
          >
            {published ? 'Đang hiển thị' : draft ? 'Bản nháp' : 'Ngừng hiển thị'}
          </span>
          {homestay.operationStatus === 'OPERATING' ? (
            <span className="flex items-center gap-1 rounded-sm bg-white/95 px-2 py-1 text-[10px] font-bold text-primary">
              <CheckCircle2 className="h-3 w-3" /> {draft ? 'Sẵn sàng phòng' : 'Đang nhận khách'}
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-sm bg-danger px-2 py-1 text-[10px] font-bold text-white">
              <AlertTriangle className="h-3 w-3" /> Tạm ngưng đón khách
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-extrabold leading-snug text-ink-deep">{homestay.name}</h3>
          <span className="shrink-0 text-xs font-bold text-muted">{homestay.code}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-coral" />
          <span className="line-clamp-1">{homestay.address}</span>
        </div>

        {homestay.alertNote && (
          <div
            className={`flex items-start gap-2 rounded-md border p-2.5 text-xs leading-relaxed ${
              draft ? 'border-sun/40 bg-sun-light text-ink-deep' : 'border-secondary-200 bg-secondary-50 text-ink-deep'
            }`}
          >
            {draft ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sun" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary-700" />}
            <span>{homestay.alertNote}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-y border-border py-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-ink">
            <Bed className="h-4 w-4 text-muted" /> {homestay.roomTypesCount} loại phòng
          </span>
          <span className="flex items-center gap-1 font-bold text-coral-hover">
            <Tag className="h-3.5 w-3.5" />
            {formatPrice(homestay.priceRefMin)}
            {homestay.priceRefMax > homestay.priceRefMin && ` – ${formatPrice(homestay.priceRefMax)}`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>Cập nhật: {homestay.lastUpdatedText}</span>
          <span
            className={`flex items-center gap-1 font-semibold ${
              homestay.auditStatus === 'STANDARD' ? 'text-primary' : homestay.auditStatus === 'MAINTENANCE' ? 'text-danger' : 'text-sun'
            }`}
          >
            {homestay.auditStatus === 'STANDARD' && <ShieldCheck className="h-3.5 w-3.5" />}
            {homestay.auditStatus === 'MAINTENANCE' && <Wrench className="h-3.5 w-3.5" />}
            {homestay.auditStatus === 'NEEDS_DATA' && <Clock className="h-3.5 w-3.5" />}
            {homestay.auditStatusText}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onNavigate(`/homestay/${homestay.slug}/check-rooms`)} className={quick}>
            <Bed className="h-3.5 w-3.5" /> Loại phòng
          </button>
          <button type="button" onClick={() => onNavigate(`/homestay/${homestay.slug}/availability`)} className={quick}>
            <Calendar className="h-3.5 w-3.5" /> Lịch phòng
          </button>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          {draft && !homestay.isReadyToPublish ? (
            <button
              type="button"
              onClick={() => onNavigate(`/partner/homestay/${homestay.id}/edit`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-coral py-2.5 text-xs font-bold text-white shadow-[var(--shadow-coral)] transition-colors hover:bg-coral-hover"
            >
              <Edit className="h-3.5 w-3.5" /> Hoàn thiện để xuất bản
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(`/partner/homestay/${homestay.id}`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary py-2.5 text-xs font-bold text-white shadow-[var(--shadow-teal)] transition-colors hover:bg-primary-600"
            >
              <FileText className="h-3.5 w-3.5" /> Chi tiết & Quản trị
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate(`/partner/homestay/${homestay.id}/edit`)}
            title="Chỉnh sửa thông tin homestay"
            aria-label="Chỉnh sửa"
            className="rounded-md border border-border p-2.5 text-muted transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            title={published ? 'Ngừng hiển thị lên web' : 'Xuất bản lên web'}
            aria-label={published ? 'Ngừng hiển thị' : 'Xuất bản'}
            className={`rounded-md border p-2.5 transition-colors ${
              published ? 'border-border text-muted hover:border-primary/40 hover:text-primary' : 'border-sun/50 bg-sun-light text-sun'
            }`}
          >
            {published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
