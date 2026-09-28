import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/lib/apiError';
import type { PageResponse } from '@/types/admin';
import type { ChangeRequestDetail, ChangeRequestStatus, ChangeRequestSummary, ChangeTargetType } from '@/types/changeRequest';
import {
  CompactDateRange,
  CompactSelect,
  FilterSearch,
  ReasonDialog,
  RefreshButton,
  TableFooter,
  type SelectOption,
} from './AdminFilters';
import { StatusBadge } from './StatusBadge';
import StatusFilter, { type StatusFilterItem } from './StatusFilter';
import { STATUS_COLOR } from './statusColor';
import { useUrlStatus } from '@/hooks/useUrlStatus';
import { useStatusCounts } from '@/hooks/useStatusCounts';
import { actionButtonClass } from './statusStyles';
import OverlayPortal from './OverlayPortal';
import {
  CHANGE_OPERATION_LABEL,
  CHANGE_STATUS_LABEL,
  CHANGE_STATUS_TONE,
  CHANGE_TARGET_LABEL,
  CHANGE_TARGET_ORDER,
} from './changeRequestMeta';

interface ChangeRequestsPanelProps {
  notify: (type: 'success' | 'error', text: string) => void;
  /** Gọi sau khi duyệt/từ chối để cập nhật số đếm ở tab. */
  onChanged: () => void;
}

const PAGE_SIZE = 15;
/** Tab trạng thái yêu cầu thay đổi = change_request.status (mặc định "Chờ duyệt"). */
const STATUS_ITEMS: StatusFilterItem<ChangeRequestStatus>[] = [
  { value: 'PENDING', label: CHANGE_STATUS_LABEL.PENDING, tone: STATUS_COLOR.yellow },
  { value: 'APPROVED', label: CHANGE_STATUS_LABEL.APPROVED, tone: STATUS_COLOR.green },
  { value: 'REJECTED', label: CHANGE_STATUS_LABEL.REJECTED, tone: STATUS_COLOR.red },
  { value: 'CANCELLED', label: CHANGE_STATUS_LABEL.CANCELLED, tone: STATUS_COLOR.gray },
];
const STATUS_VALUES = STATUS_ITEMS.map((i) => i.value);
const TARGET_OPTIONS: SelectOption<ChangeTargetType>[] = [
  { value: '', label: 'Tất cả' },
  ...CHANGE_TARGET_ORDER.map((t) => ({ value: t, label: CHANGE_TARGET_LABEL[t] })),
];

const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

type Decision = { type: 'approve' | 'reject'; request: ChangeRequestSummary };

/** Danh sách yêu cầu thay đổi Homestay/phòng/giá của NCC: Admin xem nội dung cũ/mới rồi Duyệt hoặc Từ chối. */
export default function ChangeRequestsPanel({ notify, onChanged }: ChangeRequestsPanelProps) {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useUrlStatus<ChangeRequestStatus>(STATUS_VALUES, 'PENDING');
  const [targetType, setTargetType] = useState<ChangeTargetType | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const [data, setData] = useState<PageResponse<ChangeRequestSummary> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [dialogError, setDialogError] = useState('');

  const debouncedKeyword = useDebouncedValue(keyword);
  const activeCount = [debouncedKeyword, targetType, from || to].filter(Boolean).length;

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const clearFilters = () => {
    setKeyword('');
    setTargetType('');
    setFrom('');
    setTo('');
    setPage(0);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setData(
        await adminService.getChangeRequests({
          status: status || undefined,
          targetType: targetType || undefined,
          keyword: debouncedKeyword.trim() || undefined,
          from: from || undefined,
          to: to || undefined,
          sortDir: status === 'PENDING' ? 'asc' : 'desc',
          page,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Không tải được danh sách yêu cầu thay đổi. Vui lòng kiểm tra kết nối máy chủ và thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [status, targetType, debouncedKeyword, from, to, page]);

  useEffect(() => {
    void load();
  }, [load, reload]);

  /** Số lượng trên từng tab: áp dụng cùng từ khóa / đối tượng / ngày gửi, chỉ khác trạng thái. */
  const counts = useStatusCounts(
    STATUS_VALUES,
    async (s) =>
      (
        await adminService.getChangeRequests({
          status: s || undefined,
          targetType: targetType || undefined,
          keyword: debouncedKeyword.trim() || undefined,
          from: from || undefined,
          to: to || undefined,
          page: 0,
          size: 1,
        })
      ).totalElements,
    JSON.stringify([debouncedKeyword.trim(), targetType, from, to]),
    reload,
  );

  const confirm = async (reason: string) => {
    if (!decision) return;
    if (decision.type === 'reject' && !reason) {
      setDialogError('Vui lòng nhập lý do từ chối.');
      return;
    }
    try {
      if (decision.type === 'approve') await adminService.approveChangeRequest(decision.request.id, reason || undefined);
      else await adminService.rejectChangeRequest(decision.request.id, reason);
      notify('success', decision.type === 'approve' ? 'Đã duyệt và cập nhật dữ liệu chính thức.' : 'Đã từ chối yêu cầu thay đổi.');
      setDecision(null);
      setDialogError('');
      setOpenId(null);
      setReload((n) => n + 1);
      onChanged();
    } catch (err: unknown) {
      setDialogError(getApiErrorMessage(err, 'Không thể xử lý yêu cầu thay đổi.'));
    }
  };

  const ask = (type: Decision['type'], request: ChangeRequestSummary) => {
    setDialogError('');
    setDecision({ type, request });
  };

  const rows = data?.content ?? [];
  const th = 'px-4 py-2.5';
  const td = 'px-4 py-2.5';

  return (
    <>
      <StatusFilter ariaLabel="Trạng thái yêu cầu thay đổi" items={STATUS_ITEMS} value={status} counts={counts} onChange={resetPage(setStatus)} />

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <FilterSearch value={keyword} onChange={resetPage(setKeyword)} placeholder="Tìm theo tên Homestay hoặc nhà cung cấp..." />
        <CompactSelect label="Đối tượng" value={targetType} options={TARGET_OPTIONS} onChange={resetPage(setTargetType)} />
        <CompactDateRange
          label="Ngày gửi"
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
            setPage(0);
          }}
        />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <RefreshButton loading={loading} onClick={() => setReload((n) => n + 1)} />
        </div>
      </div>

      {loadError && (
        <div role="alert" className="border-b border-danger/20 bg-danger/5 px-4 py-2.5 text-xs text-danger">
          {loadError}
        </div>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className={th}>Homestay / NCC</th>
              <th className={th}>Đối tượng</th>
              <th className={th}>Nội dung thay đổi</th>
              <th className={th}>Gửi lúc</th>
              <th className={th}>Trạng thái</th>
              <th className={`${th} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((request) => (
              <tr key={request.id} onClick={() => setOpenId(request.id)} className="cursor-pointer transition-colors duration-150 hover:bg-canvas">
                <td className={td}>
                  <div className="max-w-[240px] truncate font-semibold text-ink-deep" title={request.placeName}>{request.placeName}</div>
                  <div className="max-w-[240px] truncate text-[11px] text-muted">{request.providerName}</div>
                </td>
                <td className={td}>
                  <div className="text-ink">{CHANGE_TARGET_LABEL[request.targetType]}</div>
                  <div className="max-w-[200px] truncate text-[11px] text-muted">
                    {CHANGE_OPERATION_LABEL[request.operation]} · {request.targetName}
                  </div>
                </td>
                <td className={`${td} text-ink`}>
                  <div className="max-w-[280px] truncate" title={request.changeSummary}>{request.changeSummary || '—'}</div>
                </td>
                <td className={`${td} whitespace-nowrap text-ink`}>{fmtDateTime(request.submittedAt)}</td>
                <td className={td}>
                  <StatusBadge tone={CHANGE_STATUS_TONE[request.status]} pulse={request.status === 'PENDING'}>
                    {CHANGE_STATUS_LABEL[request.status]}
                  </StatusBadge>
                </td>
                <td className={`${td} text-right`} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setOpenId(request.id)} className={actionButtonClass('brand')}>
                      Xem
                    </button>
                    {request.status === 'PENDING' && (
                      <>
                        <button type="button" onClick={() => ask('approve', request)} className={actionButtonClass('success')}>
                          Duyệt
                        </button>
                        <button type="button" onClick={() => ask('reject', request)} className={actionButtonClass('danger')}>
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !loadError && (
          <div className="py-12 text-center text-xs text-muted">Không có yêu cầu thay đổi nào khớp bộ lọc.</div>
        )}
      </div>

      <TableFooter
        total={data?.totalElements ?? 0}
        activeCount={activeCount}
        onClear={clearFilters}
        page={page}
        totalPages={data?.totalPages ?? 0}
        onPage={setPage}
      />

      {openId !== null && (
        <ChangeRequestDrawer
          key={openId}
          id={openId}
          onClose={() => setOpenId(null)}
          onApprove={(request) => ask('approve', request)}
          onReject={(request) => ask('reject', request)}
        />
      )}

      {decision && (
        <ReasonDialog
          title={decision.type === 'approve' ? 'Duyệt thay đổi' : 'Từ chối thay đổi'}
          description={
            decision.type === 'approve'
              ? `Nội dung mới sẽ được ghi vào dữ liệu chính thức của "${decision.request.placeName}" (${decision.request.changeSummary}).`
              : `Yêu cầu của "${decision.request.placeName}" sẽ bị từ chối, dữ liệu chính thức giữ nguyên. Lý do sẽ được lưu lại.`
          }
          confirmLabel={decision.type === 'approve' ? 'Duyệt và cập nhật' : 'Từ chối'}
          reasonRequired={decision.type === 'reject'}
          reasonRequiredMessage="Vui lòng nhập lý do từ chối."
          finalConfirm={
            decision.type === 'reject'
              ? `Bạn sắp từ chối yêu cầu thay đổi của "${decision.request.placeName}". Dữ liệu chính thức giữ nguyên, nhà cung cấp được báo kết quả và không thể hoàn tác thao tác này.`
              : undefined
          }
          tone={decision.type === 'reject' ? 'danger' : 'primary'}
          error={dialogError}
          onCancel={() => setDecision(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}

interface ChangeRequestDrawerProps {
  id: number;
  onClose: () => void;
  onApprove: (request: ChangeRequestSummary) => void;
  onReject: (request: ChangeRequestSummary) => void;
}

/** Ngăn bên phải: so sánh nội dung cũ và mới của một yêu cầu thay đổi. */
function ChangeRequestDrawer({ id, onClose, onApprove, onReject }: ChangeRequestDrawerProps) {
  const [detail, setDetail] = useState<ChangeRequestDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    adminService
      .getChangeRequest(id)
      .then((d) => {
        if (alive) setDetail(d);
      })
      .catch((err: unknown) => {
        if (alive) setError(getApiErrorMessage(err, 'Không tải được chi tiết yêu cầu thay đổi.'));
      });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const summary = detail?.summary;

  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-50 flex justify-end bg-ink-deep/40 backdrop-blur-[2px] fade-in-overlay" onClick={onClose}>
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết yêu cầu thay đổi"
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl panel-slide-in"
        >
          <header className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-base font-bold text-ink-deep">{summary?.placeName ?? 'Yêu cầu thay đổi'}</h3>
              {summary && (
                <>
                  <p className="truncate text-[11px] text-muted">
                    {summary.providerName} · gửi {fmtDateTime(summary.submittedAt)} bởi {summary.submittedByName ?? '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatusBadge tone={CHANGE_STATUS_TONE[summary.status]} pulse={summary.status === 'PENDING'}>
                      {CHANGE_STATUS_LABEL[summary.status]}
                    </StatusBadge>
                    <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {CHANGE_TARGET_LABEL[summary.targetType]} · {CHANGE_OPERATION_LABEL[summary.operation]}
                    </span>
                  </div>
                </>
              )}
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
            {!detail && !error && (
              <div className="flex flex-col gap-2" aria-busy="true">
                <div className="h-3 w-24 animate-pulse rounded-sm bg-canvas" />
                <div className="h-24 animate-pulse rounded-md bg-canvas" />
              </div>
            )}
            {detail?.stale && (
              <p role="alert" className="mb-3 rounded-md bg-sun/10 px-3 py-2 text-[11px] text-amber-700">
                Dữ liệu chính thức đã thay đổi kể từ lúc nhà cung cấp gửi yêu cầu, nội dung "Hiện tại" bên dưới có thể không còn khớp.
              </p>
            )}
            {detail && detail.changes.length === 0 && <p className="text-xs text-muted">Yêu cầu không có trường nào khác với dữ liệu hiện tại.</p>}
            <div className="flex flex-col gap-3">
              {detail?.changes.map((change) => (
                <section key={change.field} className="rounded-md border border-border">
                  <h4 className="border-b border-border bg-canvas/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{change.label}</h4>
                  <div className="grid grid-cols-2 gap-3 px-3 py-2 text-xs">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Hiện tại</div>
                      <p className="mt-0.5 whitespace-pre-line break-words text-ink">{change.before || '—'}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Đề xuất mới</div>
                      <p className="mt-0.5 whitespace-pre-line break-words font-semibold text-ink-deep">{change.after || '—'}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>
            {summary?.reviewedAt && (
              <p className="mt-4 rounded-md bg-canvas px-3 py-2 text-[11px] text-muted">
                Xử lý {fmtDateTime(summary.reviewedAt)} bởi {summary.reviewedByName ?? 'hệ thống'}
                {summary.reviewNote ? ` — ${summary.reviewNote}` : ''}
              </p>
            )}
          </div>

          {summary?.status === 'PENDING' && (
            <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-canvas/60 px-5 py-3">
              <button
                type="button"
                onClick={() => onApprove(summary)}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600"
              >
                <CheckCircle2 className="h-4 w-4" /> Duyệt
              </button>
              <button
                type="button"
                onClick={() => onReject(summary)}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-danger/40 bg-white px-3 text-xs font-semibold text-danger transition-colors hover:bg-danger/5"
              >
                <XCircle className="h-4 w-4" /> Từ chối
              </button>
            </footer>
          )}
        </aside>
      </div>
    </OverlayPortal>
  );
}
