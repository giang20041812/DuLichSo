import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminService } from '@/services/adminService';
import type {
  AdminPlaceSummaryDto,
  CategoryKind,
  PageResponse,
  PlaceVerificationStatus,
  PlaceVerificationSummary,
  PlaceVisibility,
} from '@/types/admin';
import {
  ChipGroup,
  DateRangeFilter,
  FilterFooter,
  FilterSearch,
  Pagination,
  ReasonDialog,
  SortSelect,
  type ChipOption,
  type SortOption,
} from './AdminFilters';
import { StatusBadge } from './StatusBadge';
import type { StatusTone } from './StatusBadge';
import { actionButtonClass } from './statusStyles';

interface PlacesPanelProps {
  notify: (type: 'success' | 'error', text: string) => void;
}

const PAGE_SIZE = 15;

const VERIFICATION_LABEL: Record<PlaceVerificationStatus, string> = {
  UNVERIFIED: 'Chờ duyệt',
  VERIFIED: 'Đã duyệt',
  NEEDS_UPDATE: 'Cần bổ sung',
  ARCHIVED: 'Lưu trữ',
};
const VISIBILITY_OPTIONS: ChipOption<PlaceVisibility>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'PUBLISHED', label: 'Công khai', tone: 'success' },
  { value: 'UNPUBLISHED', label: 'Đã ẩn', tone: 'neutral' },
  { value: 'DRAFT', label: 'Bản nháp', tone: 'warning' },
];
const KIND_OPTIONS: ChipOption<CategoryKind>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'HOMESTAY', label: 'Homestay' },
  { value: 'HOTEL', label: 'Khách sạn' },
  { value: 'RESTAURANT', label: 'Ẩm thực' },
  { value: 'ATTRACTION', label: 'Điểm tham quan' },
  { value: 'ACTIVITY', label: 'Trải nghiệm' },
  { value: 'TRANSPORT', label: 'Vận chuyển' },
];
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt:desc', label: 'Mới tạo nhất' },
  { value: 'createdAt:asc', label: 'Cũ nhất' },
  { value: 'updatedAt:desc', label: 'Cập nhật gần đây' },
  { value: 'ratingAvg:desc', label: 'Đánh giá cao' },
  { value: 'name:asc', label: 'Tên A → Z' },
];

const VERIFICATION_TONE: Record<PlaceVerificationStatus, StatusTone> = {
  VERIFIED: 'success',
  UNVERIFIED: 'neutral',
  NEEDS_UPDATE: 'warning',
  ARCHIVED: 'danger',
};

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
    } catch {
      setLoadError('Không tải được danh sách điểm đến. Vui lòng kiểm tra kết nối máy chủ và thử lại.');
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, verification, visibility, kind, createdFrom, createdTo, sort, page]);

  useEffect(() => {
    void load();
  }, [load, reload]);

  // Chip trạng thái xác thực kèm số lượng.
  const verificationOptions: ChipOption<PlaceVerificationStatus>[] = [
    { value: '', label: 'Tất cả' },
    ...(Object.keys(VERIFICATION_LABEL) as PlaceVerificationStatus[]).map((v) => ({
      value: v,
      label: `${VERIFICATION_LABEL[v]}${summary ? ` (${summary[v] ?? 0})` : ''}`,
      tone: VERIFICATION_TONE[v],
    })),
  ];

  const rows = data?.content ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelected(allSelected ? [] : rows.map((r) => r.id));
  const toggleOne = (id: number) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

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
      setReload((n) => n + 1);
    } catch (err: unknown) {
      const serverMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setDialogError(serverMsg || 'Không thể cập nhật điểm đến.');
    }
  };

  const ask = (action: PendingAction) => {
    setDialogError('');
    setPending(action);
  };

  const th = 'px-3 py-2.5';

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 rounded-lg border border-border border-l-4 border-l-primary bg-primary-50/40 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSearch value={keyword} onChange={resetPage(setKeyword)} placeholder="Tìm theo tên, slug, địa chỉ hoặc nhà cung cấp..." />
          <SortSelect value={sort} options={SORT_OPTIONS} onChange={resetPage(setSort)} />
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            aria-label="Tải lại"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-muted hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <ChipGroup label="Kiểm duyệt" options={verificationOptions} value={verification} onChange={resetPage(setVerification)} />
          <ChipGroup label="Hiển thị" options={VISIBILITY_OPTIONS} value={visibility} onChange={resetPage(setVisibility)} />
          <ChipGroup label="Loại hình" options={KIND_OPTIONS} value={kind} onChange={resetPage(setKind)} />
          <DateRangeFilter
            from={createdFrom}
            to={createdTo}
            onChange={(f, t) => {
              setCreatedFrom(f);
              setCreatedTo(t);
              setPage(0);
              setSelected([]);
            }}
          />
        </div>
        <FilterFooter total={data?.totalElements ?? 0} activeCount={activeCount} onClear={clearFilters} />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary-50 px-3 py-2 text-xs">
          <strong className="text-primary">Đã chọn {selected.length} điểm đến</strong>
          <button
            type="button"
            onClick={() => ask({ type: 'verification', ids: selected, label: `${selected.length} điểm đến`, verification: 'VERIFIED' })}
            className="rounded-md bg-primary px-3 py-1 font-semibold text-white hover:bg-primary-600"
          >
            Duyệt
          </button>
          <button
            type="button"
            onClick={() => ask({ type: 'verification', ids: selected, label: `${selected.length} điểm đến`, verification: 'NEEDS_UPDATE' })}
            className="rounded-md border border-amber-300 bg-white px-3 py-1 font-semibold text-amber-700 hover:bg-amber-50"
          >
            Yêu cầu bổ sung
          </button>
          <button type="button" onClick={() => setSelected([])} className="ml-auto text-muted hover:text-ink">
            Bỏ chọn
          </button>
        </div>
      )}

      {loadError && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
          {loadError}
        </div>
      )}

      <div className={`overflow-x-auto rounded-md border border-border transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas font-semibold text-muted">
              <th className={`${th} w-8`}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Chọn tất cả" />
              </th>
              <th className={th}>Điểm đến</th>
              <th className={th}>Loại hình</th>
              <th className={th}>NCC / Khu vực</th>
              <th className={th}>Hiển thị</th>
              <th className={th}>Kiểm duyệt</th>
              <th className={`${th} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((place) => (
              <tr key={place.id} className="transition-colors hover:bg-hover/60">
                <td className={th}>
                  <input
                    type="checkbox"
                    checked={selected.includes(place.id)}
                    onChange={() => toggleOne(place.id)}
                    aria-label={`Chọn ${place.name}`}
                  />
                </td>
                <td className={th}>
                  <div className="font-semibold text-ink-deep">{place.name}</div>
                  <div className="font-mono text-[11px] text-muted">#{place.id} · {place.slug}</div>
                </td>
                <td className={th}>
                  <StatusBadge tone="info">{place.kind}</StatusBadge>
                </td>
                <td className={`${th} text-ink`}>
                  <div>{place.providerName || 'Hệ thống du lịch'}</div>
                  <div className="text-[11px] text-muted">{place.regionName || place.address}</div>
                </td>
                <td className={th}>
                  <StatusBadge tone={place.visibility === 'PUBLISHED' ? 'success' : 'neutral'}>
                    {place.visibility === 'PUBLISHED' ? 'Công khai' : place.visibility === 'DRAFT' ? 'Bản nháp' : 'Đã ẩn'}
                  </StatusBadge>
                </td>
                <td className={th}>
                  <StatusBadge tone={VERIFICATION_TONE[place.verification]} pulse={place.verification === 'UNVERIFIED'}>{VERIFICATION_LABEL[place.verification]}</StatusBadge>
                </td>
                <td className={`${th} text-right`}>
                  <div className="flex items-center justify-end gap-1.5">
                    {place.verification !== 'VERIFIED' && (
                      <button
                        type="button"
                        onClick={() => ask({ type: 'verification', ids: [place.id], label: place.name, verification: 'VERIFIED' })}
                        className={actionButtonClass('success')}
                      >
                        Duyệt
                      </button>
                    )}
                    {place.verification !== 'NEEDS_UPDATE' && (
                      <button
                        type="button"
                        onClick={() => ask({ type: 'verification', ids: [place.id], label: place.name, verification: 'NEEDS_UPDATE' })}
                        className={actionButtonClass('warning')}
                      >
                        Bổ sung
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        ask({
                          type: 'visibility',
                          id: place.id,
                          label: place.name,
                          visibility: place.visibility === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED',
                        })
                      }
                      title={place.visibility === 'PUBLISHED' ? 'Ẩn điểm đến' : 'Công khai'}
                      className="rounded-md p-1 text-muted hover:bg-hover"
                    >
                      {place.visibility === 'PUBLISHED' ? (
                        <EyeOff className="h-3.5 w-3.5 text-rose-600" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !loadError && (
          <div className="py-10 text-center text-xs text-muted">Không có điểm đến nào khớp bộ lọc.</div>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={(p) => { setPage(p); setSelected([]); }} />

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
    </div>
  );
}
