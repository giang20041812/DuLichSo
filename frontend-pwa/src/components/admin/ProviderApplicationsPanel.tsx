import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/lib/apiError';
import type { PageResponse } from '@/types/admin';
import type { ProviderApplicationDetail, ProviderApplicationStatus, ProviderApplicationSummary } from '@/types/providerApplication';
import {
  CompactDateRange,
  CompactSelect,
  FilterSearch,
  ReasonDialog,
  RefreshButton,
  TableFooter,
  type SelectOption,
} from './AdminFilters';
import { StatusBadge, type StatusTone } from './StatusBadge';
import { actionButtonClass } from './statusStyles';
import OverlayPortal from './OverlayPortal';

interface ProviderApplicationsPanelProps {
  notify: (type: 'success' | 'error', text: string) => void;
  /** Gọi sau khi duyệt/từ chối: cập nhật số đếm ở tab và (khi duyệt) danh sách đối tác. */
  onChanged: (approved: boolean) => void;
}

const PAGE_SIZE = 15;

const STATUS_LABEL: Record<ProviderApplicationStatus, string> = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối' };
const STATUS_TONE: Record<ProviderApplicationStatus, StatusTone> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };
const STATUS_OPTIONS: SelectOption<ProviderApplicationStatus>[] = (Object.keys(STATUS_LABEL) as ProviderApplicationStatus[]).map((s) => ({
  value: s,
  label: STATUS_LABEL[s],
}));

const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

type Decision = { type: 'approve' | 'reject'; application: ProviderApplicationSummary };

/** Hồ sơ đăng ký NCC mới: Admin xem thông tin, thẩm định rồi Duyệt (tạo đối tác + tài khoản) hoặc Từ chối (bắt buộc lý do). */
export default function ProviderApplicationsPanel({ notify, onChanged }: ProviderApplicationsPanelProps) {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ProviderApplicationStatus | ''>('PENDING');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const [data, setData] = useState<PageResponse<ProviderApplicationSummary> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [dialogError, setDialogError] = useState('');

  const debouncedKeyword = useDebouncedValue(keyword);
  const activeCount = [debouncedKeyword, from || to, status === 'PENDING' ? '' : status].filter(Boolean).length;

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const clearFilters = () => {
    setKeyword('');
    setStatus('PENDING');
    setFrom('');
    setTo('');
    setPage(0);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setData(
        await adminService.getProviderApplications({
          status: status || undefined,
          keyword: debouncedKeyword.trim() || undefined,
          from: from || undefined,
          to: to || undefined,
          sortDir: status === 'PENDING' ? 'asc' : 'desc',
          page,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Không tải được danh sách hồ sơ đăng ký. Vui lòng kiểm tra kết nối máy chủ và thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [status, debouncedKeyword, from, to, page]);

  useEffect(() => {
    void load();
  }, [load, reload]);

  const confirm = async (reason: string) => {
    if (!decision) return;
    if (decision.type === 'reject' && !reason) {
      setDialogError('Vui lòng nhập lý do từ chối.');
      return;
    }
    try {
      if (decision.type === 'approve') await adminService.approveProviderApplication(decision.application.id, reason || undefined);
      else await adminService.rejectProviderApplication(decision.application.id, reason);
      notify(
        'success',
        decision.type === 'approve' ? 'Đã duyệt hồ sơ, tài khoản đối tác đã được tạo.' : 'Đã từ chối hồ sơ và gửi phản hồi cho nhà cung cấp.',
      );
      const approved = decision.type === 'approve';
      setDecision(null);
      setDialogError('');
      setOpenId(null);
      setReload((n) => n + 1);
      onChanged(approved);
    } catch (err: unknown) {
      setDialogError(getApiErrorMessage(err, 'Không thể xử lý hồ sơ đăng ký.'));
    }
  };

  const ask = (type: Decision['type'], application: ProviderApplicationSummary) => {
    setDialogError('');
    setDecision({ type, application });
  };

  const rows = data?.content ?? [];
  const th = 'px-4 py-2.5';
  const td = 'px-4 py-2.5';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <FilterSearch value={keyword} onChange={resetPage(setKeyword)} placeholder="Tìm theo tên cơ sở, người liên hệ, SĐT hoặc email..." />
        <CompactSelect label="Trạng thái" value={status} options={STATUS_OPTIONS} onChange={resetPage(setStatus)} />
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
              <th className={th}>Cơ sở đăng ký</th>
              <th className={th}>Liên hệ</th>
              <th className={th}>Gửi lúc</th>
              <th className={th}>Trạng thái</th>
              <th className={`${th} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((application) => (
              <tr key={application.id} onClick={() => setOpenId(application.id)} className="cursor-pointer transition-colors duration-150 hover:bg-canvas">
                <td className={td}>
                  <div className="max-w-[260px] truncate font-semibold text-ink-deep" title={application.businessName}>{application.businessName}</div>
                  <div className="max-w-[260px] truncate text-[11px] text-muted" title={application.address}>#{application.id} · {application.address}</div>
                </td>
                <td className={td}>
                  <div className="text-ink">{application.contactName}</div>
                  <div className="text-[11px] text-muted">{[application.contactPhone, application.contactEmail].filter(Boolean).join(' · ')}</div>
                </td>
                <td className={`${td} whitespace-nowrap text-ink`}>{fmtDateTime(application.createdAt)}</td>
                <td className={td}>
                  <StatusBadge tone={STATUS_TONE[application.status]} pulse={application.status === 'PENDING'}>
                    {STATUS_LABEL[application.status]}
                  </StatusBadge>
                </td>
                <td className={`${td} text-right`} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setOpenId(application.id)} className={actionButtonClass('brand')}>
                      Xem
                    </button>
                    {application.status === 'PENDING' && (
                      <>
                        <button type="button" onClick={() => ask('approve', application)} className={actionButtonClass('success')}>
                          Duyệt
                        </button>
                        <button type="button" onClick={() => ask('reject', application)} className={actionButtonClass('danger')}>
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
          <div className="py-12 text-center text-xs text-muted">Không có hồ sơ đăng ký nào khớp bộ lọc.</div>
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
        <ApplicationDrawer
          key={openId}
          id={openId}
          onClose={() => setOpenId(null)}
          onApprove={(application) => ask('approve', application)}
          onReject={(application) => ask('reject', application)}
        />
      )}

      {decision && (
        <ReasonDialog
          title={decision.type === 'approve' ? 'Duyệt hồ sơ đối tác' : 'Từ chối hồ sơ đối tác'}
          description={
            decision.type === 'approve'
              ? `Hệ thống sẽ tạo đối tác và tài khoản đăng nhập cho "${decision.application.businessName}" bằng thông tin và mật khẩu nhà cung cấp đã đăng ký.`
              : `Hồ sơ "${decision.application.businessName}" sẽ bị từ chối và nhà cung cấp được thông báo lý do. Nhà cung cấp có thể đăng ký lại.`
          }
          confirmLabel={decision.type === 'approve' ? 'Duyệt hồ sơ' : 'Từ chối'}
          reasonRequired={decision.type === 'reject'}
          hideReason={decision.type === 'approve'}
          tone={decision.type === 'reject' ? 'danger' : 'primary'}
          error={dialogError}
          onCancel={() => setDecision(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}

interface ApplicationDrawerProps {
  id: number;
  onClose: () => void;
  onApprove: (application: ProviderApplicationSummary) => void;
  onReject: (application: ProviderApplicationSummary) => void;
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-ink">{children}</dd>
    </div>
  );
}

/** Ngăn bên phải: thông tin hồ sơ đăng ký để thẩm định. */
function ApplicationDrawer({ id, onClose, onApprove, onReject }: ApplicationDrawerProps) {
  const [detail, setDetail] = useState<ProviderApplicationDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    adminService
      .getProviderApplication(id)
      .then((d) => {
        if (alive) setDetail(d);
      })
      .catch((err: unknown) => {
        if (alive) setError(getApiErrorMessage(err, 'Không tải được chi tiết hồ sơ đăng ký.'));
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

  const a = detail?.summary;
  const taken = detail && (detail.phoneTaken || detail.emailTaken);

  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-50 flex justify-end bg-ink-deep/40 backdrop-blur-[2px] fade-in-overlay" onClick={onClose}>
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết hồ sơ đăng ký đối tác"
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full max-w-md flex-col bg-white shadow-xl panel-slide-in"
        >
          <header className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-base font-bold text-ink-deep">{a?.businessName ?? 'Hồ sơ đăng ký'}</h3>
              {a && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge tone={STATUS_TONE[a.status]} pulse={a.status === 'PENDING'}>
                    {STATUS_LABEL[a.status]}
                  </StatusBadge>
                </div>
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
            {taken && (
              <p role="alert" className="mb-3 rounded-md bg-danger/5 px-3 py-2 text-[11px] text-danger">
                {[detail.phoneTaken ? 'Số điện thoại' : '', detail.emailTaken ? 'Email' : ''].filter(Boolean).join(' và ')} của hồ sơ đã thuộc một tài khoản khác nên
                không thể duyệt. Hãy từ chối hồ sơ kèm lý do.
              </p>
            )}
            {a && detail && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <Field label="Người liên hệ">{a.contactName}</Field>
                <Field label="Số điện thoại">{a.contactPhone}</Field>
                <Field label="Email" wide>{a.contactEmail || '—'}</Field>
                <Field label="Địa chỉ" wide>{a.address}</Field>
                <Field label="Giấy phép kinh doanh">{a.businessLicenseNo || 'Chưa cung cấp'}</Field>
                <Field label="Gửi lúc">{fmtDateTime(a.createdAt)}</Field>
                <Field label="Mô tả cơ sở" wide>
                  <span className="whitespace-pre-line">{detail.description || '—'}</span>
                </Field>
              </dl>
            )}
            {a?.reviewedAt && (
              <p className="mt-4 rounded-md bg-canvas px-3 py-2 text-[11px] text-muted">
                Xử lý {fmtDateTime(a.reviewedAt)} bởi {a.reviewedByName ?? 'quản trị viên'}
                {a.reviewNote ? ` — ${a.reviewNote}` : ''}
                {a.providerId ? ` · Đối tác #${a.providerId}` : ''}
              </p>
            )}
          </div>

          {a?.status === 'PENDING' && (
            <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-canvas/60 px-5 py-3">
              {!taken && (
                <button
                  type="button"
                  onClick={() => onApprove(a)}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-600"
                >
                  <CheckCircle2 className="h-4 w-4" /> Duyệt
                </button>
              )}
              <button
                type="button"
                onClick={() => onReject(a)}
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
