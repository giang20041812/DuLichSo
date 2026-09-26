import { Fragment, useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/lib/apiError';
import type { PageResponse } from '@/types/admin';
import type { AuditActor, AuditLogItem, AuditResult } from '@/types/auditLog';
import { CompactDateRange, CompactSelect, FilterSearch, RefreshButton, TableFooter, type SelectOption } from './AdminFilters';
import { StatusBadge, type StatusTone } from './StatusBadge';
import { AUDIT_ACTION, AUDIT_ENTITY } from './auditMeta';
import OverlayPortal from './OverlayPortal';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const PAGE_SIZE = 20;
const ACTOR_LABEL: Record<AuditActor, string> = { ADMIN: 'Quản trị viên', PROVIDER: 'Nhà cung cấp', CUSTOMER: 'Khách', SYSTEM: 'Hệ thống' };
const RESULT_LABEL: Record<AuditResult, string> = { SUCCESS: 'Thành công', FAILURE: 'Thất bại', DENIED: 'Bị từ chối' };
const RESULT_TONE: Record<AuditResult, StatusTone> = { SUCCESS: 'success', FAILURE: 'danger', DENIED: 'warning' };
const ACTOR_OPTIONS: SelectOption<AuditActor>[] = (Object.keys(ACTOR_LABEL) as AuditActor[]).map((a) => ({ value: a, label: ACTOR_LABEL[a] }));
const RESULT_OPTIONS: SelectOption<AuditResult>[] = (Object.keys(RESULT_LABEL) as AuditResult[]).map((r) => ({ value: r, label: RESULT_LABEL[r] }));
const ENTITY_OPTIONS: SelectOption<string>[] = Object.entries(AUDIT_ENTITY).map(([value, label]) => ({ value, label }));

const fmtDateTime = (d: string) => new Date(d).toLocaleString('vi-VN');

/** Nhật ký hệ thống chỉ đọc: tra cứu theo thời gian, người thao tác, đối tượng, hành động, kết quả và xem chi tiết trước/sau. */
export default function AuditLogDrawer({ onClose }: { onClose: () => void }) {
  const [keyword, setKeyword] = useState('');
  const [actor, setActor] = useState<AuditActor | ''>('');
  const [result, setResult] = useState<AuditResult | ''>('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const [data, setData] = useState<PageResponse<AuditLogItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AuditLogItem | null>(null);
  const [detailError, setDetailError] = useState('');

  // Ô tìm kiếm nhận mã hành động (vd: LOGIN_FAILED) hoặc mã đối tượng (số).
  const debounced = useDebouncedValue(keyword);
  const trimmed = debounced.trim();
  const activeCount = [trimmed, actor, result, entityType, from || to].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const numeric = /^\d+$/.test(trimmed);
      setData(
        await adminService.getAuditLogs({
          actor: actor || undefined,
          result: result || undefined,
          entityType: entityType || undefined,
          action: trimmed && !numeric ? trimmed : undefined,
          entityId: numeric ? Number(trimmed) : undefined,
          from: from || undefined,
          to: to || undefined,
          page,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Không tải được nhật ký hệ thống. Vui lòng kiểm tra kết nối máy chủ và thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [trimmed, actor, result, entityType, from, to, page]);

  useEffect(() => {
    void load();
  }, [load, reload]);

  useEffect(() => {
    if (openId === null) return;
    let alive = true;
    adminService
      .getAuditLog(openId)
      .then((d) => {
        if (alive) {
          setDetail(d);
          setDetailError('');
        }
      })
      .catch((err: unknown) => {
        if (alive) setDetailError(getApiErrorMessage(err, 'Không tải được chi tiết bản ghi.'));
      });
    return () => {
      alive = false;
    };
  }, [openId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = data?.content ?? [];
  const th = 'px-4 py-2.5';
  const td = 'px-4 py-2.5';

  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-50 flex justify-end bg-ink-deep/40 backdrop-blur-[2px] fade-in-overlay" onClick={onClose}>
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Nhật ký hệ thống"
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full max-w-4xl flex-col bg-white shadow-xl panel-slide-in"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink-deep">Nhật ký hệ thống</h3>
              <p className="text-[11px] text-muted">Chỉ đọc · ghi lại đăng nhập, từ chối truy cập, duyệt/từ chối, đổi quyền và các thao tác quản trị</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-muted transition-colors hover:bg-hover hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
            <FilterSearch
              value={keyword}
              onChange={(v) => {
                setKeyword(v);
                setPage(0);
              }}
              placeholder="Mã hành động (vd: LOGIN_FAILED) hoặc mã đối tượng..."
            />
            <CompactSelect label="Người thao tác" value={actor} options={ACTOR_OPTIONS} onChange={(v) => { setActor(v); setPage(0); }} />
            <CompactSelect label="Kết quả" value={result} options={RESULT_OPTIONS} onChange={(v) => { setResult(v); setPage(0); }} />
            <CompactSelect label="Đối tượng" value={entityType} options={ENTITY_OPTIONS} onChange={(v) => { setEntityType(v); setPage(0); }} />
            <CompactDateRange
              label="Thời gian"
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

          <div className={`flex-1 overflow-auto transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className={th}>Thời gian</th>
                  <th className={th}>Người thao tác</th>
                  <th className={th}>Hành động</th>
                  <th className={th}>Đối tượng</th>
                  <th className={th}>Kết quả</th>
                  <th className={th}>IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {rows.map((row) => {
                  const meta = AUDIT_ACTION[row.action];
                  const open = openId === row.id;
                  return (
                    <Fragment key={row.id}>
                      <tr
                        onClick={() => {
                          setDetail(null);
                          setDetailError('');
                          setOpenId(open ? null : row.id);
                        }}
                        className={`cursor-pointer transition-colors duration-150 hover:bg-canvas ${open ? 'bg-primary-50/40' : ''}`}
                      >
                        <td className={`${td} whitespace-nowrap text-ink`}>{fmtDateTime(row.createdAt)}</td>
                        <td className={td}>
                          <div className="text-ink">{row.actorName ?? ACTOR_LABEL[row.actor]}</div>
                          <div className="text-[11px] text-muted">{ACTOR_LABEL[row.actor]}{row.actorId ? ` · #${row.actorId}` : ''}</div>
                        </td>
                        <td className={td}>
                          <StatusBadge tone={meta?.tone ?? 'neutral'}>{meta?.label ?? row.action}</StatusBadge>
                        </td>
                        <td className={`${td} text-ink`}>
                          {row.entityType ? `${AUDIT_ENTITY[row.entityType] ?? row.entityType}${row.entityId ? ` #${row.entityId}` : ''}` : '—'}
                        </td>
                        <td className={td}>
                          {row.result ? <StatusBadge tone={RESULT_TONE[row.result]}>{RESULT_LABEL[row.result]}</StatusBadge> : <span className="text-muted">—</span>}
                        </td>
                        <td className={`${td} font-mono text-[11px] text-muted`}>{row.ip ?? '—'}</td>
                      </tr>
                      {open && (
                        <tr key={`${row.id}-detail`} className="bg-canvas">
                          <td colSpan={6} className="px-4 py-3 text-xs">
                            {detailError && <p className="text-danger">{detailError}</p>}
                            {!detail && !detailError && <p className="text-muted">Đang tải chi tiết...</p>}
                            {detail && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Mã hành động · Lý do</div>
                                  <p className="mt-0.5 break-words text-ink">
                                    <span className="font-mono">{detail.action}</span>
                                    {detail.reason ? ` — ${detail.reason}` : ''}
                                  </p>
                                </div>
                                <div>
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Trước</div>
                                  <pre className="mt-0.5 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-white p-2 font-mono text-[11px] text-ink">
                                    {detail.beforeData ? JSON.stringify(detail.beforeData, null, 2) : '—'}
                                  </pre>
                                </div>
                                <div>
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Sau / chi tiết</div>
                                  <pre className="mt-0.5 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-white p-2 font-mono text-[11px] text-ink">
                                    {detail.afterData ? JSON.stringify(detail.afterData, null, 2) : '—'}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {!loading && rows.length === 0 && !loadError && <div className="py-12 text-center text-xs text-muted">Không có bản ghi nào khớp bộ lọc.</div>}
          </div>

          <TableFooter
            total={data?.totalElements ?? 0}
            activeCount={activeCount}
            onClear={() => {
              setKeyword('');
              setActor('');
              setResult('');
              setEntityType('');
              setFrom('');
              setTo('');
              setPage(0);
            }}
            page={page}
            totalPages={data?.totalPages ?? 0}
            onPage={setPage}
          />
        </aside>
      </div>
    </OverlayPortal>
  );
}
