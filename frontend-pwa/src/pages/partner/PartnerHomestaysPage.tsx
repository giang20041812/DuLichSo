import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Home,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchPartnerHomestays, updateHomestayStatus, homestayError } from '@/services/partnerHomestayService';
import type {
  PartnerHomestaySummaryDto,
  PartnerHomestayStatsDto,
  PlaceOperationStatus,
  PlaceVisibility,
} from '@/types/partner';
import { Alert, EmptyState, PageHeader, Pill, Tabs } from '@/components/partner/PartnerUI';
import { ui, vnd } from '@/lib/partnerUi';

const EMPTY_STATS: PartnerHomestayStatsDto = {
  totalCount: 0,
  publishedCount: 0,
  draftCount: 0,
  unpublishedCount: 0,
  operatingCount: 0,
  tempClosedCount: 0,
};

type VisibilityTab = PlaceVisibility | 'ALL';
type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

/** Trang chủ quản lý cơ sở lưu trú của NCC: thống kê, lọc và danh sách Homestay. */
export default function PartnerHomestaysPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [homestays, setHomestays] = useState<PartnerHomestaySummaryDto[]>([]);
  const [stats, setStats] = useState<PartnerHomestayStatsDto>(EMPTY_STATS);
  const [result, setResult] = useState<{ key: string; ok: boolean }>({ key: '', ok: true });
  const [reloadTick, setReloadTick] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [keyword, setKeyword] = useState('');
  const [visibility, setVisibility] = useState<VisibilityTab>('ALL');
  const [operation, setOperation] = useState<PlaceOperationStatus | ''>('');
  const [notice, setNotice] = useState<Notice>(() => {
    const state: unknown = location.state;
    if (typeof state === 'object' && state !== null && 'notice' in state && typeof state.notice === 'string') {
      return { tone: 'info', text: state.notice };
    }
    return null;
  });

  const debouncedKeyword = useDebouncedValue(keyword);

  // Đang tải = kết quả hiện có chưa ứng với bộ lọc hiện tại (tính khi render, không setState trong effect).
  const queryKey = `${debouncedKeyword}|${visibility}|${operation}|${reloadTick}`;
  const isLoading = result.key !== queryKey;
  const loadError = !isLoading && !result.ok;
  const load = useCallback(() => setReloadTick((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    fetchPartnerHomestays(debouncedKeyword, visibility === 'ALL' ? undefined : visibility, operation || undefined)
      .then((res) => {
        if (!active) return;
        setHomestays(res.homestays);
        setStats(res.stats);
        setResult({ key: queryKey, ok: true });
      })
      .catch(() => { if (active) setResult({ key: queryKey, ok: false }); });
    return () => { active = false; };
  }, [debouncedKeyword, visibility, operation, queryKey]);

  const handleToggleVisibility = async (homestay: PartnerHomestaySummaryDto) => {
    const next: PlaceVisibility = homestay.visibility === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    setBusyId(homestay.id);
    setNotice(null);
    try {
      await updateHomestayStatus(homestay.id, { visibility: next });
      load();
      setNotice({
        tone: 'success',
        text: next === 'PUBLISHED' ? `Đã xuất bản “${homestay.name}”. Khách có thể tìm thấy ngay.` : `Đã ngừng hiển thị “${homestay.name}”.`,
      });
    } catch (error) {
      setNotice({ tone: 'error', text: homestayError(error) });
    } finally {
      setBusyId(null);
    }
  };

  const filtersActive = Boolean(keyword || visibility !== 'ALL' || operation);
  const clearFilters = () => { setKeyword(''); setVisibility('ALL'); setOperation(''); };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Cơ sở lưu trú" title="Homestay của tôi"
        description="Chọn một Homestay để cập nhật thông tin, phòng, giá và lịch đón khách."
        actions={<Link to="/partner/homestay/create" className={ui.btnCoral}><Plus className="h-4 w-4" />Tạo Homestay mới</Link>} />

      {notice && (
        <Alert tone={notice.tone} action={<button type="button" aria-label="Đóng thông báo" className="opacity-60 transition-opacity duration-200 hover:opacity-100" onClick={() => setNotice(null)}><X className="h-4 w-4" /></button>}>
          {notice.text}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tổng Homestay" value={stats.totalCount} tone="bg-primary-50 text-primary" icon={Home} loading={isLoading} error={loadError} />
        <StatCard label="Đang hiển thị" value={stats.publishedCount} tone="bg-secondary-50 text-secondary-700" icon={Eye} loading={isLoading} error={loadError} />
        <StatCard label="Bản nháp" value={stats.draftCount} tone="bg-sun-light text-ink-deep" icon={FileText} loading={isLoading} error={loadError} />
        <StatCard label="Tạm đóng cửa" value={stats.tempClosedCount} tone="bg-coral-light text-coral-hover" icon={Clock} loading={isLoading} error={loadError} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Tìm Homestay</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className={`${ui.input} pl-9`} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm theo tên Homestay..." />
          </label>
          <select aria-label="Lọc trạng thái đón khách" className={`${ui.select} sm:w-56`} value={operation} onChange={(e) => setOperation(e.target.value === 'OPERATING' || e.target.value === 'TEMP_CLOSED' ? e.target.value : '')}>
            <option value="">Mọi trạng thái đón khách</option>
            <option value="OPERATING">Đang đón khách ({stats.operatingCount})</option>
            <option value="TEMP_CLOSED">Tạm đóng cửa ({stats.tempClosedCount})</option>
          </select>
        </div>
        <Tabs<VisibilityTab> value={visibility} onChange={setVisibility} tabs={[
          { id: 'ALL', label: 'Tất cả', badge: stats.totalCount },
          { id: 'PUBLISHED', label: 'Đang hiển thị', badge: stats.publishedCount },
          { id: 'DRAFT', label: 'Bản nháp', badge: stats.draftCount },
          { id: 'UNPUBLISHED', label: 'Ngừng hiển thị', badge: stats.unpublishedCount },
        ]} />
      </div>

      {isLoading ? (
        <div role="status" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <span className="sr-only">Đang tải danh sách Homestay...</span>
          {[0, 1, 2].map((item) => (
            <div key={item} aria-hidden="true" className="overflow-hidden rounded-lg border border-primary/10 bg-surface">
              <div className="h-44 animate-pulse bg-primary/10" />
              <div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded-sm bg-primary/10" /><div className="h-3 w-full animate-pulse rounded-sm bg-primary/5" /><div className="h-10 animate-pulse rounded-md bg-primary/5" /></div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <Alert tone="error" action={<button type="button" onClick={() => void load()} className={ui.btnGhost}>Thử lại</button>}>
          Không tải được danh sách. Vui lòng kiểm tra kết nối và thử lại.
        </Alert>
      ) : homestays.length === 0 ? (
        <EmptyState icon={Home}
          title={filtersActive ? 'Không có Homestay khớp bộ lọc' : 'Chưa có Homestay nào'}
          description={filtersActive ? 'Thử đổi từ khóa hoặc bỏ bớt bộ lọc.' : 'Tạo Homestay đầu tiên để bắt đầu đón khách qua Đi Du Lịch.'}
          action={filtersActive
            ? <button type="button" onClick={clearFilters} className={ui.btnOutline}>Xóa bộ lọc</button>
            : <Link to="/partner/homestay/create" className={ui.btnCoral}><Plus className="h-4 w-4" />Tạo Homestay đầu tiên</Link>} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {homestays.map((homestay) => (
            <HomestayCard
              key={homestay.id}
              homestay={homestay}
              busy={busyId === homestay.id}
              onToggle={() => void handleToggleVisibility(homestay)}
              onNavigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone, icon: Icon, loading, error }: { label: string; value: number; tone: string; icon: LucideIcon; loading: boolean; error: boolean }) {
  return (
    <div className={`${ui.card} ${ui.cardHover} flex items-center gap-3 p-4`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tone}`}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-extrabold leading-none tabular-nums text-ink-deep" aria-label={loading ? 'Đang tải' : error ? 'Không có dữ liệu' : undefined}>{loading || error ? '—' : value}</p>
        <p className="mt-1 truncate text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

function HomestayCard({ homestay, busy, onToggle, onNavigate }: {
  homestay: PartnerHomestaySummaryDto;
  busy: boolean;
  onToggle: () => void;
  onNavigate: (to: string) => void;
}) {
  const published = homestay.visibility === 'PUBLISHED';
  const draft = homestay.visibility === 'DRAFT';
  const operating = homestay.operationStatus === 'OPERATING';
  const canToggle = published || homestay.isReadyToPublish;
  const needsWork = !published && !homestay.isReadyToPublish;
  const editUrl = `/partner/homestay/${homestay.id}/edit`;
  const priceText = homestay.priceRefMin == null
    ? 'Chưa có giá'
    : homestay.priceRefMax != null && homestay.priceRefMax > homestay.priceRefMin
      ? `${vnd(homestay.priceRefMin)} – ${vnd(homestay.priceRefMax)}`
      : vnd(homestay.priceRefMin);

  return (
    <article className={`group flex flex-col overflow-hidden ${ui.card} ${ui.cardHover}`}>
      <button type="button" onClick={() => onNavigate(editUrl)} className="relative h-44 w-full overflow-hidden bg-primary-50 text-left" aria-label={`Mở ${homestay.name}`}>
        <span className="absolute inset-0 flex items-center justify-center text-primary/30"><Home className="h-12 w-12" /></span>
        {homestay.coverImageUrl && (
          <img src={homestay.coverImageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }}
            className="relative h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        )}
        <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-deep/50 to-transparent" />
        <span className="absolute left-2.5 top-2.5 flex gap-1.5">
          <span className={`rounded-sm px-2 py-1 text-[10px] font-bold ${published ? 'bg-primary text-white' : draft ? 'bg-sun text-ink-deep' : 'bg-ink/80 text-white'}`}>
            {published ? 'Đang hiển thị' : draft ? 'Bản nháp' : 'Ngừng hiển thị'}
          </span>
          {!operating && <span className="flex items-center gap-1 rounded-sm bg-danger px-2 py-1 text-[10px] font-bold text-white"><AlertTriangle className="h-3 w-3" />Tạm đóng cửa</span>}
        </span>
        <span className="absolute bottom-2.5 left-3 right-3 truncate text-xs font-semibold text-white">{homestay.code}</span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-1 font-display text-base font-bold text-ink-deep">{homestay.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><MapPin className="h-3.5 w-3.5 shrink-0 text-coral" /><span className="line-clamp-1">{homestay.address || 'Chưa có địa chỉ'}</span></p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-md bg-canvas p-2.5 text-xs">
          <span className="flex items-center gap-1.5 text-ink"><BedDouble className="h-4 w-4 text-primary" />{homestay.roomTypesCount} loại phòng</span>
          <span className="truncate text-right font-bold text-coral-hover">{priceText}</span>
        </div>

        {homestay.alertNote && (
          <p className={`flex items-start gap-2 rounded-md border p-2.5 text-xs leading-relaxed text-ink-deep ${needsWork ? 'border-sun/40 bg-sun-light' : 'border-secondary/30 bg-secondary-50'}`}>
            <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${needsWork ? 'text-sun' : 'text-secondary-700'}`} />
            <span>{homestay.alertNote}</span>
          </p>
        )}

        <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
          <span className="truncate">Cập nhật {homestay.lastUpdatedText}</span>
          <Pill tone={homestay.auditStatus === 'STANDARD' ? 'primary' : homestay.auditStatus === 'MAINTENANCE' ? 'danger' : 'sun'}>
            {homestay.auditStatus === 'STANDARD' && <ShieldCheck className="h-3 w-3" />}
            {homestay.auditStatus === 'MAINTENANCE' && <Wrench className="h-3 w-3" />}
            {homestay.auditStatus === 'NEEDS_DATA' && <Clock className="h-3 w-3" />}
            {homestay.auditStatusText}
          </Pill>
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-primary/10 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {needsWork ? (
              <button type="button" onClick={() => onNavigate(editUrl)} className={`${ui.btnCoral} col-span-2`}><Pencil className="h-4 w-4" />Hoàn thiện để xuất bản</button>
            ) : (
              <>
                <button type="button" onClick={() => onNavigate(editUrl)} className={ui.btnPrimary}><Pencil className="h-4 w-4" />Sửa thông tin</button>
                <button type="button" onClick={() => onNavigate(`/partner/homestay/${homestay.id}/rooms`)} className={ui.btnOutline}><BedDouble className="h-4 w-4" />Phòng & lịch</button>
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            {needsWork
              ? <button type="button" onClick={() => onNavigate(`/partner/homestay/${homestay.id}/rooms`)} className={`${ui.btnGhost} -ml-2`}><BedDouble className="h-4 w-4" />Phòng & lịch</button>
              : <span className="flex items-center gap-1 text-[11px] font-semibold text-accent-700">{operating && <><CheckCircle2 className="h-3.5 w-3.5" />Đang nhận khách</>}</span>}
            {canToggle && (
              <button type="button" disabled={busy} onClick={onToggle} className={`${ui.btnGhost} -mr-2`}>
                {published ? <><EyeOff className="h-4 w-4" />{busy ? 'Đang xử lý...' : 'Ngừng hiển thị'}</> : <><Eye className="h-4 w-4" />{busy ? 'Đang xử lý...' : 'Xuất bản'}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
