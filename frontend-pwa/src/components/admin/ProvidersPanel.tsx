import { Fragment, useEffect, useMemo, useState } from 'react';
import { Building2, Check, Copy, Eye, EyeOff, KeyRound, Plus } from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { AdminProviderSummaryDto, ProviderAccountDto, ProviderStatus } from '@/types/admin';
import { FilterSearch, RefreshButton, UnderlineTabs, type TabItem } from './AdminFilters';
import { StatusBadge } from './StatusBadge';
import { PROVIDER_STATUS, actionButtonClass } from './statusStyles';

interface ProvidersPanelProps {
  providers: AdminProviderSummaryDto[];
  loading: boolean;
  error: boolean;
  onReload: () => void;
  onCreate: () => void;
  onChangeStatus: (id: number, name: string, status: ProviderStatus) => void;
  notify: (type: 'success' | 'error', text: string) => void;
}

const th = 'px-3 py-2.5';
const dateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : 'Chưa đăng nhập');

/** Sinh mật khẩu ngẫu nhiên mạnh bằng CSPRNG (đủ chữ hoa, thường, số, ký tự đặc biệt). */
function generatePassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '@#$%'];
  const all = sets.join('');
  const rand = (n: number) => (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) % n;
  const chars = sets.map((s) => s.charAt(rand(s.length)));
  while (chars.length < 12) chars.push(all.charAt(rand(all.length)));
  const out: string[] = [];
  while (chars.length > 0) out.push(chars.splice(rand(chars.length), 1).join(''));
  return out.join('');
}

export default function ProvidersPanel({ providers, loading, error, onReload, onCreate, onChangeStatus, notify }: ProvidersPanelProps) {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ProviderStatus | ''>('');
  const [openId, setOpenId] = useState<number | null>(null);

  const counts = useMemo(() => {
    const c: Record<ProviderStatus, number> = { ACTIVE: 0, SUSPENDED: 0, TERMINATED: 0 };
    providers.forEach((p) => {
      c[p.status] += 1;
    });
    return c;
  }, [providers]);

  const statusTabs: TabItem<ProviderStatus>[] = [
    { value: '', label: 'Tất cả', count: providers.length },
    ...(Object.keys(PROVIDER_STATUS) as ProviderStatus[]).map((s) => ({
      value: s,
      label: PROVIDER_STATUS[s].label,
      count: counts[s],
      tone: PROVIDER_STATUS[s].tone,
    })),
  ];

  const rows = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return providers.filter(
      (p) =>
        (!status || p.status === status) &&
        (!k || [p.name, p.contactName, p.contactPhone, p.contactEmail, p.address].some((v) => v?.toLowerCase().includes(k))),
    );
  }, [providers, keyword, status]);

  return (
    <section className="rounded-lg border border-border bg-white shadow-sm">
      <UnderlineTabs ariaLabel="Trạng thái đối tác" items={statusTabs} value={status} onChange={setStatus} />

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <FilterSearch value={keyword} onChange={setKeyword} placeholder="Tìm theo tên đối tác, người liên hệ, SĐT, email..." />
        <RefreshButton loading={loading} onClick={onReload} />
        <button
          type="button"
          onClick={onCreate}
          className="ml-auto flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-[var(--shadow-teal)]"
        >
          <Plus className="h-4 w-4" /> Tạo đối tác mới
        </button>
      </div>

      {error && (
        <div role="alert" className="border-b border-danger/20 bg-danger/5 px-4 py-2.5 text-xs text-danger">
          Không tải được danh sách đối tác. Vui lòng thử lại.
        </div>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className={th}>Đối tác</th>
              <th className={th}>Liên hệ</th>
              <th className={`${th} text-center`}>Điểm đến</th>
              <th className={`${th} text-center`}>Tài khoản</th>
              <th className={th}>Trạng thái</th>
              <th className={`${th} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((p) => {
              const st = PROVIDER_STATUS[p.status];
              const open = openId === p.id;
              return (
                <Fragment key={p.id}>
                  <tr className={`transition-colors duration-150 hover:bg-canvas ${open ? 'bg-primary-50/40' : ''}`}>
                    <td className={th}>
                      <div className="font-semibold text-ink-deep">{p.name}</div>
                      <div className="max-w-[220px] truncate text-[11px] text-muted" title={p.address}>
                        #{p.id} · {p.address || 'Chưa có địa chỉ'}
                      </div>
                    </td>
                    <td className={th}>
                      <div className="text-ink">{p.contactName || '—'}</div>
                      <div className="text-[11px] text-muted">{[p.contactPhone, p.contactEmail].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td className={`${th} text-center font-bold text-primary`}>{p.placeCount}</td>
                    <td className={`${th} text-center font-semibold text-ink`}>{p.accountCount}</td>
                    <td className={th}>
                      <StatusBadge tone={st.tone} pulse={p.status === 'SUSPENDED'}>
                        {st.label}
                      </StatusBadge>
                    </td>
                    <td className={`${th} text-right`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setOpenId(open ? null : p.id)}
                          aria-expanded={open}
                          title={open ? 'Ẩn thông tin tài khoản' : 'Xem thông tin tài khoản'}
                          className={`flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-inset transition-all duration-200 active:scale-95 ${
                            open ? 'bg-primary text-white ring-primary' : 'text-muted ring-border hover:bg-primary-50 hover:text-primary hover:ring-primary/40'
                          }`}
                        >
                          {open ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        {p.status !== 'ACTIVE' && (
                          <button type="button" onClick={() => onChangeStatus(p.id, p.name, 'ACTIVE')} className={actionButtonClass('success')}>
                            Kích hoạt
                          </button>
                        )}
                        {p.status !== 'SUSPENDED' && (
                          <button type="button" onClick={() => onChangeStatus(p.id, p.name, 'SUSPENDED')} className={actionButtonClass('warning')}>
                            Đình chỉ
                          </button>
                        )}
                        {p.status !== 'TERMINATED' && (
                          <button type="button" onClick={() => onChangeStatus(p.id, p.name, 'TERMINATED')} className={actionButtonClass('danger')}>
                            Chấm dứt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-canvas">
                      <td colSpan={6} className="px-4 py-3">
                        <ProviderCredentials providerId={p.id} notify={notify} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-xs text-muted">
            <Building2 className="h-6 w-6 text-primary-300" />
            {providers.length === 0 ? 'Chưa có đối tác nào.' : 'Không có đối tác nào khớp bộ lọc.'}
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-2.5 text-xs text-muted">
        <strong className="tabular-nums text-ink">{rows.length}</strong> / {providers.length} đối tác
      </div>
    </section>
  );
}

type LoadState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; accounts: ProviderAccountDto[] };

/** Khối "mắt": tên đăng nhập của các tài khoản NCC + cấp lại mật khẩu (mật khẩu mới chỉ hiện một lần). */
function ProviderCredentials({ providerId, notify }: { providerId: number; notify: ProvidersPanelProps['notify'] }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [issued, setIssued] = useState<Record<number, string>>({});
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminService
      .getProviderAccounts(providerId)
      .then((accounts) => {
        if (!cancelled) setState({ kind: 'ready', accounts });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      notify('error', 'Không thể sao chép, vui lòng chọn và copy thủ công.');
    }
  };

  const reset = async (acc: ProviderAccountDto) => {
    if (!window.confirm(`Cấp lại mật khẩu cho ${acc.email}? Mật khẩu cũ sẽ không còn dùng được.`)) return;
    const next = generatePassword();
    setBusyId(acc.id);
    try {
      await adminService.resetPassword(acc.id, { newPassword: next, reason: 'Admin cấp lại mật khẩu cho đối tác' });
      setIssued((m) => ({ ...m, [acc.id]: next }));
      setShown((m) => ({ ...m, [acc.id]: true }));
      notify('success', `Đã cấp mật khẩu mới cho ${acc.email}. Hãy sao chép và gửi cho đối tác.`);
    } catch {
      notify('error', 'Không đặt lại được mật khẩu.');
    } finally {
      setBusyId(null);
    }
  };

  if (state.kind === 'loading') return <p className="text-xs text-muted">Đang tải thông tin tài khoản...</p>;
  if (state.kind === 'error') return <p className="text-xs text-danger">Không tải được thông tin tài khoản.</p>;
  if (state.accounts.length === 0) return <p className="text-xs text-muted">Đối tác này chưa có tài khoản đăng nhập.</p>;

  return (
    <div className="flex flex-col gap-2">
      {state.accounts.map((acc) => {
        const pwd = issued[acc.id];
        const visible = shown[acc.id];
        return (
          <div key={acc.id} className="grid gap-3 rounded-md border border-border bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Tài khoản</div>
              <div className="truncate font-semibold text-ink-deep">{acc.fullName}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-ink">
                <span className="truncate">
                  {acc.phone ? `${acc.phone} · ` : ''}
                  {acc.email}
                </span>
                <button type="button" onClick={() => copy(`id-${acc.id}`, acc.phone || acc.email)} aria-label="Sao chép tên đăng nhập" className="text-muted hover:text-primary">
                  {copied === `id-${acc.id}` ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <div className="mt-0.5 text-[11px] text-muted">Đăng nhập gần nhất: {dateTime(acc.lastLoginAt)}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Mật khẩu</div>
              {pwd ? (
                <div className="flex items-center gap-1.5">
                  <code className="rounded-sm bg-primary-50 px-2 py-1 font-mono text-xs text-primary-700">{visible ? pwd : '••••••••••••'}</code>
                  <button type="button" onClick={() => setShown((m) => ({ ...m, [acc.id]: !visible }))} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="text-muted hover:text-primary">
                    {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" onClick={() => copy(`pw-${acc.id}`, pwd)} aria-label="Sao chép mật khẩu" className="text-muted hover:text-primary">
                    {copied === `pw-${acc.id}` ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ) : (
                <div className="text-[11px] leading-relaxed text-muted">
                  <span className="font-mono tracking-widest text-ink">••••••••••••</span> — mã hóa một chiều, hệ thống không thể xem lại. Cấp lại mật khẩu mới nếu cần.
                </div>
              )}
              {pwd && <div className="mt-0.5 text-[11px] text-amber-700">Chỉ hiển thị một lần — rời trang là mất.</div>}
            </div>
            <button type="button" disabled={busyId === acc.id} onClick={() => reset(acc)} className={`${actionButtonClass('brand')} justify-center disabled:opacity-50`}>
              <KeyRound className="h-3 w-3" /> {busyId === acc.id ? 'Đang cấp...' : 'Cấp lại mật khẩu'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
