import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, FilePenLine, X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/lib/apiError';
import type {
  AdminPlaceSummaryDto,
  CategoryKind,
  PageResponse,
  PlaceVerificationStatus,
  PlaceVerificationSummary,
  PlaceVisibility,
} from '@/types/admin';
import {
  CompactDateRange,
  CompactSelect,
  FilterSearch,
  ReasonDialog,
  RefreshButton,
  SortSelect,
  TableFooter,
  UnderlineTabs,
  type SelectOption,
  type SortOption,
  type TabItem,
} from './AdminFilters';
import { StatusBadge } from './StatusBadge';
import { actionButtonClass } from './statusStyles';
import PlaceQuickPreview from './PlaceQuickPreview';
import { KIND_META, kindMeta, VERIFICATION_LABEL, VERIFICATION_TONE, VISIBILITY_LABEL, VISIBILITY_TONE } from './placeMeta';

interface PlacesPanelProps {
  notify: (type: 'success' | 'error', text: string) => void;
}

const PAGE_SIZE = 15;

const VERIFICATION_ORDER: PlaceVerificationStatus[] = ['UNVERIFIED', 'VERIFIED', 'NEEDS_UPDATE', 'ARCHIVED'];

const VISIBILITY_OPTIONS: SelectOption<PlaceVisibility>[] = [
  { value: '', label: 'Tất cả' },
  ...(['PUBLISHED', 'UNPUBLISHED', 'DRAFT'] as PlaceVisibility[]).map((v) => ({ value: v, label: VISIBILITY_LABEL[v] })),
];
const KIND_OPTIONS: SelectOption<CategoryKind>[] = [
  { value: '', label: 'Tất cả' },
  ...(Object.keys(KIND_META) as CategoryKind[]).map((k) => ({ value: k, label: KIND_META[k].label })),
];
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt:desc', label: 'Mới tạo nhất' },
  { value: 'createdAt:asc', label: 'Cũ nhất' },
  { value: 'updatedAt:desc', label: 'Cập nhật gần đây' },
  { value: 'ratingAvg:desc', label: 'Đánh giá cao' },
  { value: 'name:asc', label: 'Tên A → Z' },
];

type PendingAction =
  | { type: 'verification'; ids: number[]; label: string; verification: PlaceVerificationStatus }
  | { type: 'visibility'; id: number; label: string; visibility: PlaceVisibility };

export default function PlacesPanel({ notify }: PlacesPanelProps) {
  const [keyword, setKeyword] = useState('');
  const [verification, setVerification] = useState<PlaceVerificationStatus | ''>('');
  const [visibility, setVisibility] = useState<PlaceVisibility | ''>('');
  const [kind, setKind] = useState<CategoryKind | ''>('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(0);

  const [data, setData] = useState<PageResponse<AdminPlaceSummaryDto> | null>(null);
  const [summary, setSummary] = useState<PlaceVerificationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [preview, setPreview] = useState<AdminPlaceSummaryDto | null>(null);

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [dialogError, setDialogError] = useState('');

  const debouncedKeyword = useDebouncedValue(keyword);
  const activeCount = [debouncedKeyword, verification, visibility, kind, createdFrom || createdTo].filter(Boolean).length;

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
    setSelected([]);
  };

  const clearFilters = () => {
    setKeyword('');
    setVerification('');
    setVisibility('');
    setKind('');
    setCreatedFrom('');
    setCreatedTo('');
    setPage(0);
    setSelected([]);
  };

  const load = useCallback(async () => {
    const [sortBy, sortDir] = sort.split(':') as [string, 'asc' | 'desc'];
    setLoading(true);
    setLoadError('');
    try {
      const [list, counts] = await Promise.all([
        adminService.getPlaces({
          keyword: debouncedKeyword.trim() || undefined,
          verification: verification || undefined,
          visibility: visibility || undefined,
          kind: kind || undefined,
          createdFrom: createdFrom || undefined,
          createdTo: createdTo || undefined,
          sortBy,
          sortDir,
          page,
          size: PAGE_SIZE,
        }),
        adminService.getPlacesSummary(),
      ]);
      setData(list);
      setSummary(counts);
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Không tải được danh sách điểm đến. Vui lòng kiểm tra kết nối máy chủ và thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, verification, visibility, kind, createdFrom, createdTo, sort, page]);

  useEffect(() => {
    void load();
  }, [load, reload]);

  const totalAll = summary ? VERIFICATION_ORDER.reduce((a, v) => a + (summary[v] ?? 0), 0) : null;
  const tabs: TabItem<PlaceVerificationStatus>[] = [
    { value: '', label: 'Tất cả', count: totalAll },
    ...VERIFICATION_ORDER.map((v) => ({ value: v, label: VERIFICATION_LABEL[v], count: summary ? summary[v] ?? 0 : null, tone: VERIFICATION_TONE[v] })),
  ];

  const rows = data?.content ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelected(allSelected ? [] : rows.map((r) => r.id));
  const toggleOne = (id: number) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const reasonRequired =
    pending?.type === 'verification'
      ? pending.verification === 'NEEDS_UPDATE' || pending.verification === 'ARCHIVED'
      : pending?.visibility !== 'PUBLISHED';

  const confirm = async (reason: string) => {
    if (!pending) return;
    if (reasonRequired && !reason) {
      setDialogError('Vui lòng nhập lý do.');
      return;
    }
    try {
      if (pending.type === 'verification') {
        const [firstId] = pending.ids;
        if (pending.ids.length === 1 && firstId !== undefined) {
          await adminService.updatePlaceVerification(firstId, {
            verification: pending.verification,
            reason: reason || 'Admin duyệt nội dung điểm đến',
          });
        } else {
          await adminService.bulkUpdatePlaceVerification({
            ids: pending.ids,
            verification: pending.verification,
            reason: reason || 'Admin duyệt nội dung điểm đến',
          });
        }
      } else {
        await adminService.updatePlaceVisibility(pending.id, {
          visibility: pending.visibility,
          reason: reason || 'Admin công khai lại điểm đến',
        });
      }
      notify('success', 'Đã cập nhật điểm đến.');
      setPending(null);
      setDialogError('');
      setSelected([]);
      setPreview(null);
      setReload((n) => n + 1);
    } catch (err: unknown) {
      setDialogError(getApiErrorMessage(err, 'Không thể cập nhật điểm đến.'));
    }
  };

  const ask = (action: PendingAction) => {
    setDialogError('');
    setPending(action);
  };

  const askVerify = (place: AdminPlaceSummaryDto, v: PlaceVerificationStatus) =>
    ask({ type: 'verification', ids: [place.id], label: place.name, verification: v });
  const askVisibility = (place: AdminPlaceSummaryDto) =>
    ask({ type: 'visibility', id: place.id, label: place.name, visibility: place.visibility === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED' });

  const th = 'px-4 py-2.5';
  const td = 'px-4 py-2.5';

  return (
    <section className="rounded-lg border border-border bg-white shadow-sm">
      <UnderlineTabs ariaLabel="Trạng thái kiểm duyệt" items={tabs} value={verification} onChange={resetPage(setVerification)} />

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <FilterSearch value={keyword} onChange={resetPage(setKeyword)} placeholder="Tìm theo tên, slug, địa chỉ hoặc nhà cung cấp..." />
        <CompactSelect label="Loại hình" value={kind} options={KIND_OPTIONS} onChange={resetPage(setKind)} />
        <CompactSelect label="Hiển thị" value={visibility} options={VISIBILITY_OPTIONS} onChange={resetPage(setVisibility)} />
        <CompactDateRange
          label="Ngày tạo"
          from={createdFrom}
          to={createdTo}
          onChange={(f, t) => {
            setCreatedFrom(f);
            setCreatedTo(t);
            setPage(0);
            setSelected([]);
          }}
        />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <SortSelect value={sort} options={SORT_OPTIONS} onChange={resetPage(setSort)} />
          <RefreshButton loading={loading} onClick={() => setReload((n) => n + 1)} />
        </div>
      </div>

      {selected.length > 0 && (
        <div className="rise-in flex flex-wrap items-center gap-2 border-b border-primary/20 bg-primary-50 px-4 py-2 text-xs">
          <strong className="text-primary">Đã chọn {selected.length} điểm đến</strong>
          <button
            type="button"
            onClick={() => ask({ type: 'verification', ids: selected, label: `${selected.length} điểm đến`, verification: 'VERIFIED' })}
            className="flex h-7 items-center gap-1 rounded-md bg-accent px-2.5 font-semibold text-white transition-colors hover:bg-accent-600"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
          </button>
          <button
            type="button"
            onClick={() => ask({ type: 'verification', ids: selected, label: `${selected.length} điểm đến`, verification: 'NEEDS_UPDATE' })}
            className="flex h-7 items-center gap-1 rounded-md border border-sun/60 bg-white px-2.5 font-semibold text-amber-700 transition-colors hover:bg-sun/10"
          >
            <FilePenLine className="h-3.5 w-3.5" /> Yêu cầu bổ sung
          </button>
          <button type="button" onClick={() => setSelected([])} className="ml-auto flex items-center gap-1 text-muted hover:text-ink">
            <X className="h-3.5 w-3.5" /> Bỏ chọn
          </button>
        </div>
      )}

      {loadError && (
        <div role="alert" className="border-b border-danger/20 bg-danger/5 px-4 py-2.5 text-xs text-danger">
          {loadError}
        </div>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className={`${th} w-10`}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Chọn tất cả" className="accent-[var(--color-primary)]" />
              </th>
              <th className={th}>Điểm đến</th>
              <th className={th}>Loại hình</th>
              <th className={th}>NCC / Khu vực</th>
              <th className={th}>Hiển thị</th>
              <th className={th}>Kiểm duyệt</th>
              <th className={`${th} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((place) => {
              const k = kindMeta(place.kind);
              const KindIcon = k.icon;
              const isSel = selected.includes(place.id);
              return (
                <tr
                  key={place.id}
                  onClick={() => setPreview(place)}
                  className={`cursor-pointer transition-colors duration-150 ${isSel ? 'bg-primary-50/60' : 'hover:bg-canvas'}`}
                >
                  <td className={td} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleOne(place.id)}
                      aria-label={`Chọn ${place.name}`}
                      className="accent-[var(--color-primary)]"
                    />
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${k.tone}`} aria-hidden>
                        <KindIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="max-w-[260px] truncate font-semibold text-ink-deep" title={place.name}>{place.name}</div>
                        <div className="max-w-[260px] truncate font-mono text-[11px] text-muted">#{place.id} · {place.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className={td}>
                    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${k.tone}`}>
                      <KindIcon className="h-3 w-3" /> {k.label}
                    </span>
                  </td>
                  <td className={`${td} text-ink`}>
                    <div className="max-w-[200px] truncate">{place.providerName || 'Hệ thống du lịch'}</div>
                    <div className="max-w-[200px] truncate text-[11px] text-muted">{place.regionName || place.address || '—'}</div>
                  </td>
                  <td className={td}>
                    <StatusBadge tone={VISIBILITY_TONE[place.visibility]}>{VISIBILITY_LABEL[place.visibility]}</StatusBadge>
                  </td>
                  <td className={td}>
                    <StatusBadge tone={VERIFICATION_TONE[place.verification]} pulse={place.verification === 'UNVERIFIED'}>
                      {VERIFICATION_LABEL[place.verification]}
                    </StatusBadge>
                  </td>
                  <td className={`${td} text-right`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {place.verification !== 'VERIFIED' && (
                        <button type="button" onClick={() => askVerify(place, 'VERIFIED')} className={actionButtonClass('success')}>
                          Duyệt
                        </button>
                      )}
                      {place.verification !== 'NEEDS_UPDATE' && (
                        <button type="button" onClick={() => askVerify(place, 'NEEDS_UPDATE')} className={actionButtonClass('warning')}>
                          Bổ sung
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => askVisibility(place)}
                        title={place.visibility === 'PUBLISHED' ? 'Ẩn điểm đến' : 'Công khai'}
                        aria-label={place.visibility === 'PUBLISHED' ? `Ẩn ${place.name}` : `Công khai ${place.name}`}
                        className="rounded-md p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink"
                      >
                        {place.visibility === 'PUBLISHED' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !loadError && (
          <div className="py-12 text-center text-xs text-muted">Không có điểm đến nào khớp bộ lọc.</div>
        )}
      </div>

      <TableFooter
        total={data?.totalElements ?? 0}
        activeCount={activeCount}
        onClear={clearFilters}
        page={page}
        totalPages={data?.totalPages ?? 0}
        onPage={(p) => {
          setPage(p);
          setSelected([]);
        }}
      />

      {preview && (
        <PlaceQuickPreview
          key={preview.id}
          place={preview}
          onClose={() => setPreview(null)}
          onApprove={() => askVerify(preview, 'VERIFIED')}
          onRequestUpdate={() => askVerify(preview, 'NEEDS_UPDATE')}
          onToggleVisibility={() => askVisibility(preview)}
        />
      )}

      {pending && (
        <ReasonDialog
          title={
            pending.type === 'verification'
              ? pending.verification === 'VERIFIED'
                ? 'Duyệt điểm đến'
                : 'Yêu cầu bổ sung nội dung'
              : pending.visibility === 'PUBLISHED'
              ? 'Công khai điểm đến'
              : 'Ẩn điểm đến'
          }
          description={`Áp dụng cho: ${pending.label}.`}
          confirmLabel="Xác nhận"
          reasonRequired={reasonRequired}
          tone={reasonRequired ? 'danger' : 'primary'}
          error={dialogError}
          onCancel={() => setPending(null)}
          onConfirm={confirm}
        />
      )}
    </section>
  );
}
