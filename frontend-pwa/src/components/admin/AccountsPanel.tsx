import { useCallback, useEffect, useState } from 'react';
import { Building2, Eye, KeyRound, Lock, Mail, Plus, ShieldCheck, Unlock, UserPlus, Users } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminService } from '@/services/adminService';
import type {
  AccountRole,
  AccountStatus,
  AdminAccountDto,
  AdminTravelerDto,
  PageResponse,
  ProviderStatus,
  TravelerSignupMethod,
} from '@/types/admin';
import {
  CompactDateRange,
  CompactSelect,
  FilterSearch,
  ReasonDialog,
  RefreshButton,
  SegmentedTabs,
  SortSelect,
  TableFooter,
  UnderlineTabs,
  type SegmentOption,
  type SelectOption,
  type SortOption,
  type TabItem,
} from './AdminFilters';
import { StatusBadge } from './StatusBadge';
import AccountDetailDrawer, { type AccountDetailTarget } from './AccountDetailDrawer';
import CreateTravelerModal from './CreateTravelerModal';
import Avatar from './Avatar';
import { GoogleMark } from '@/components/auth/GoogleMark';
import { getApiErrorMessage } from '@/lib/apiError';
import { actionButtonClass } from './statusStyles';

type AccountKind = 'STAFF' | 'TRAVELER';

interface AccountsPanelProps {
  currentAccountId?: number;
  /** Đổi giá trị này để buộc tải lại (vd: sau khi tạo Admin mới). */
  refreshKey?: number;
  onCreateAdmin: () => void;
  onResetPassword: (account: { id: number; email: string }) => void;
  notify: (type: 'success' | 'error', text: string) => void;
}

const PAGE_SIZE = 15;

const KIND_SEGMENTS: SegmentOption<AccountKind>[] = [
  { value: 'STAFF', label: 'Quản trị & Nhà cung cấp', icon: ShieldCheck, tone: 'brand' },
  { value: 'TRAVELER', label: 'Khách du lịch', icon: Users, tone: 'info' },
];

const STATUS_TABS: TabItem<AccountStatus>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hoạt động', tone: 'success' },
  { value: 'INACTIVE', label: 'Bị khóa', tone: 'danger' },
];
const ROLE_OPTIONS: SelectOption<AccountRole>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PROVIDER', label: 'Nhà cung cấp' },
];
const PROVIDER_STATUS_OPTIONS: SelectOption<ProviderStatus>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'SUSPENDED', label: 'Đình chỉ' },
  { value: 'TERMINATED', label: 'Chấm dứt' },
];
const SIGNUP_OPTIONS: SelectOption<TravelerSignupMethod>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'EMAIL', label: 'Email' },
];
const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt:desc', label: 'Mới tạo nhất' },
  { value: 'createdAt:asc', label: 'Cũ nhất' },
  { value: 'lastLoginAt:desc', label: 'Đăng nhập gần đây' },
  { value: 'fullName:asc', label: 'Tên A → Z' },
];

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

/** Tên hiển thị cho tài khoản staff: họ tên → tên cơ sở liên kết → null (chưa cập nhật). */
const staffDisplayName = (acc: AdminAccountDto) => acc.fullName?.trim() || acc.providerName?.trim() || null;

export default function AccountsPanel({ currentAccountId, refreshKey = 0, onCreateAdmin, onResetPassword, notify }: AccountsPanelProps) {
  const [kind, setKind] = useState<AccountKind>('STAFF');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<AccountStatus | ''>('');
  const [role, setRole] = useState<AccountRole | ''>('');
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | ''>('');
  const [signup, setSignup] = useState<TravelerSignupMethod | ''>('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(0);

  const [staff, setStaff] = useState<PageResponse<AdminAccountDto> | null>(null);
  const [travelers, setTravelers] = useState<PageResponse<AdminTravelerDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);

  const [lockTarget, setLockTarget] = useState<{ kind: AccountKind; id: number; name: string; next: AccountStatus } | null>(null);
  const [lockError, setLockError] = useState('');
  const [detail, setDetail] = useState<AccountDetailTarget | null>(null);
  const [showCreateTraveler, setShowCreateTraveler] = useState(false);

  const debouncedKeyword = useDebouncedValue(keyword);

  const activeCount = [
    debouncedKeyword,
    status,
    kind === 'STAFF' ? role : signup,
    kind === 'STAFF' ? providerStatus : '',
    createdFrom || createdTo,
  ].filter(Boolean).length;

  // Đổi bất kỳ bộ lọc nào thì về trang đầu.
  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const clearFilters = () => {
    setKeyword('');
    setStatus('');
    setRole('');
    setProviderStatus('');
    setSignup('');
    setCreatedFrom('');
    setCreatedTo('');
    setPage(0);
  };

  const switchKind = (next: AccountKind) => {
    setKind(next);
    clearFilters();
    setSort('createdAt:desc');
  };

  const load = useCallback(async () => {
    const [sortBy, sortDir] = sort.split(':') as [string, 'asc' | 'desc'];
    const common = {
      status: status || undefined,
      keyword: debouncedKeyword.trim() || undefined,
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
      sortBy,
      sortDir,
      page,
      size: PAGE_SIZE,
    };
    setLoading(true);
    setLoadError('');
    try {
      if (kind === 'STAFF') {
        setStaff(await adminService.getAccounts({ ...common, role: role || undefined, providerStatus: providerStatus || undefined }));
      } else {
        setTravelers(await adminService.getTravelers({ ...common, signupMethod: signup || undefined }));
      }
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Không tải được danh sách. Vui lòng kiểm tra kết nối máy chủ và thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [kind, status, role, providerStatus, signup, debouncedKeyword, createdFrom, createdTo, sort, page]);

  useEffect(() => {
    void load();
  }, [load, reload, refreshKey]);

  const confirmLock = async (reason: string) => {
    if (!lockTarget) return;
    if (lockTarget.next === 'INACTIVE' && !reason) {
      setLockError('Vui lòng nhập lý do.');
      return;
    }
    try {
      const body = { status: lockTarget.next, reason: reason || 'Admin mở khóa tài khoản' };
      if (lockTarget.kind === 'STAFF') await adminService.updateAccountStatus(lockTarget.id, body);
      else await adminService.updateTravelerStatus(lockTarget.id, body);
      notify('success', lockTarget.next === 'ACTIVE' ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      setLockTarget(null);
      setLockError('');
      setReload((n) => n + 1);
    } catch (err: unknown) {
      setLockError(getApiErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản.'));
    }
  };

  const openLock = (k: AccountKind, id: number, name: string, current: AccountStatus) => {
    if (k === 'STAFF' && id === currentAccountId) {
      notify('error', 'Bạn không thể tự khóa tài khoản của chính mình.');
      return;
    }
    setLockError('');
    setLockTarget({ kind: k, id, name, next: current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
  };

  const total = kind === 'STAFF' ? staff?.totalElements ?? 0 : travelers?.totalElements ?? 0;
  const totalPages = kind === 'STAFF' ? staff?.totalPages ?? 0 : travelers?.totalPages ?? 0;
  const rowsEmpty = kind === 'STAFF' ? !staff?.content.length : !travelers?.content.length;

  const th = 'px-4 py-2.5';
  const td = 'px-4 py-2.5';
  const iconBtn = 'rounded-md p-1.5 text-muted transition-colors';

  return (
    <section className="rounded-lg border border-border bg-white shadow-sm">
      {/* Đầu thẻ: loại tài khoản + thao tác chính */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3">
        <SegmentedTabs ariaLabel="Loại tài khoản" options={KIND_SEGMENTS} value={kind} onChange={switchKind} />
        <button
          type="button"
          onClick={kind === 'STAFF' ? onCreateAdmin : () => setShowCreateTraveler(true)}
          className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 ${
            kind === 'STAFF' ? 'bg-primary hover:bg-primary-600 hover:shadow-[var(--shadow-teal)]' : 'bg-secondary hover:bg-secondary-600'
          }`}
        >
          {kind === 'STAFF' ? <Plus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {kind === 'STAFF' ? 'Tạo Admin mới' : 'Tạo tài khoản khách'}
        </button>
      </header>

      <UnderlineTabs ariaLabel="Trạng thái tài khoản" items={STATUS_TABS} value={status} onChange={resetPage(setStatus)} />

      {/* Toolbar một dòng */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <FilterSearch
          value={keyword}
          onChange={resetPage(setKeyword)}
          placeholder={kind === 'STAFF' ? 'Tìm theo tên, email, SĐT hoặc cơ sở...' : 'Tìm theo tên, email hoặc số điện thoại...'}
        />
        {kind === 'STAFF' ? (
          <>
            <CompactSelect label="Vai trò" value={role} options={ROLE_OPTIONS} onChange={resetPage(setRole)} />
            <CompactSelect label="Trạng thái NCC" value={providerStatus} options={PROVIDER_STATUS_OPTIONS} onChange={resetPage(setProviderStatus)} />
          </>
        ) : (
          <CompactSelect label="Đăng ký bằng" value={signup} options={SIGNUP_OPTIONS} onChange={resetPage(setSignup)} />
        )}
        <CompactDateRange
          label="Ngày tạo"
          from={createdFrom}
          to={createdTo}
          onChange={(f, t) => {
            setCreatedFrom(f);
            setCreatedTo(t);
            setPage(0);
          }}
        />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <SortSelect value={sort} options={SORT_OPTIONS} onChange={resetPage(setSort)} />
          <RefreshButton loading={loading} onClick={() => setReload((n) => n + 1)} />
        </div>
      </div>

      {loadError && (
        <div role="alert" className="border-b border-danger/20 bg-danger/5 px-4 py-2.5 text-xs text-danger">
          {loadError}
        </div>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
        {kind === 'STAFF' ? (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className={th}>Tài khoản</th>
                <th className={th}>Số điện thoại</th>
                <th className={th}>Vai trò</th>
                <th className={th}>Cơ sở liên kết</th>
                <th className={th}>Đăng nhập gần nhất</th>
                <th className={th}>Trạng thái</th>
                <th className={`${th} text-right`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {staff?.content.map((acc) => {
                const name = staffDisplayName(acc);
                const label = name || acc.email || acc.phone || `#${acc.id}`;
                return (
                  <tr key={acc.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={label} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {name ? (
                              <span className="truncate font-semibold text-ink-deep">{name}</span>
                            ) : (
                              <span className="italic text-muted">Chưa cập nhật tên</span>
                            )}
                            {!acc.fullName?.trim() && acc.providerName && (
                              <span className="rounded bg-canvas px-1 text-[10px] text-muted">tên cơ sở</span>
                            )}
                          </div>
                          <div className="truncate text-[11px] text-muted">
                            {acc.email || <span className="italic">Chưa có email</span>} · #{acc.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} tabular-nums text-ink`}>{acc.phone || '—'}</td>
                    <td className={td}>
                      <RoleBadge role={acc.role} />
                    </td>
                    <td className={`${td} max-w-[180px] truncate text-[11px] font-medium text-primary`} title={acc.providerName}>
                      {acc.providerName || <span className="text-muted">—</span>}
                    </td>
                    <td className={`${td} text-muted`}>{formatDate(acc.lastLoginAt)}</td>
                    <td className={td}>
                      <StatusPill status={acc.status} />
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetail({ kind: 'STAFF', id: acc.id })}
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết ${label}`}
                          className={`${iconBtn} hover:bg-primary-50 hover:text-primary`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onResetPassword({ id: acc.id, email: acc.email ?? acc.phone ?? `#${acc.id}` })}
                          title="Đặt lại mật khẩu"
                          aria-label={`Đặt lại mật khẩu ${label}`}
                          className={`${iconBtn} hover:bg-sun/15 hover:text-amber-700`}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <LockButton status={acc.status} onClick={() => openLock('STAFF', acc.id, label, acc.status)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className={th}>Khách hàng</th>
                <th className={th}>Số điện thoại</th>
                <th className={th}>Đăng ký bằng</th>
                <th className={th}>Ngày tạo</th>
                <th className={th}>Đăng nhập gần nhất</th>
                <th className={th}>Trạng thái</th>
                <th className={`${th} text-right`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {travelers?.content.map((t) => {
                const label = t.fullName?.trim() || t.email;
                return (
                  <tr key={t.id} className="transition-colors duration-150 hover:bg-canvas">
                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={label} src={t.pictureUrl} />
                        <div className="min-w-0">
                          {t.fullName?.trim() ? (
                            <div className="truncate font-semibold text-ink-deep">{t.fullName}</div>
                          ) : (
                            <div className="italic text-muted">Chưa cập nhật tên</div>
                          )}
                          <div className="truncate text-[11px] text-muted">{t.email} · #{t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} tabular-nums text-ink`}>{t.phone || '—'}</td>
                    <td className={td}>
                      <SignupBadge method={t.signupMethod} />
                    </td>
                    <td className={`${td} text-muted`}>{formatDate(t.createdAt)}</td>
                    <td className={`${td} text-muted`}>{formatDate(t.lastLoginAt)}</td>
                    <td className={td}>
                      <StatusPill status={t.status} />
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetail({ kind: 'TRAVELER', traveler: t })}
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết ${label}`}
                          className={`${iconBtn} hover:bg-primary-50 hover:text-primary`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <LockButton status={t.status} onClick={() => openLock('TRAVELER', t.id, label, t.status)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && rowsEmpty && !loadError && (
          <div className="py-12 text-center text-xs text-muted">Không có tài khoản nào khớp bộ lọc.</div>
        )}
      </div>

      <TableFooter total={total} activeCount={activeCount} onClear={clearFilters} page={page} totalPages={totalPages} onPage={setPage} />

      {detail && (
        <AccountDetailDrawer
          key={detail.kind === 'STAFF' ? `s${detail.id}` : `t${detail.traveler.id}`}
          target={detail}
          currentAccountId={currentAccountId}
          onClose={() => setDetail(null)}
          onChanged={() => setReload((n) => n + 1)}
          onResetPassword={onResetPassword}
          notify={notify}
        />
      )}

      {showCreateTraveler && (
        <CreateTravelerModal
          onClose={() => setShowCreateTraveler(false)}
          onCreated={(email) => {
            setShowCreateTraveler(false);
            notify('success', `Đã tạo tài khoản khách ${email}.`);
            setReload((n) => n + 1);
          }}
        />
      )}

      {lockTarget && (
        <ReasonDialog
          title={lockTarget.next === 'INACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          description={
            lockTarget.next === 'INACTIVE'
              ? `${lockTarget.name} sẽ không thể đăng nhập cho đến khi được mở khóa.`
              : `${lockTarget.name} sẽ đăng nhập được trở lại.`
          }
          confirmLabel={lockTarget.next === 'INACTIVE' ? 'Khóa' : 'Mở khóa'}
          reasonRequired={lockTarget.next === 'INACTIVE'}
          tone={lockTarget.next === 'INACTIVE' ? 'danger' : 'primary'}
          error={lockError}
          onCancel={() => setLockTarget(null)}
          onConfirm={confirmLock}
        />
      )}
    </section>
  );
}

function StatusPill({ status }: { status: AccountStatus }) {
  return (
    <StatusBadge tone={status === 'ACTIVE' ? 'success' : 'danger'} pulse={status !== 'ACTIVE'}>
      {status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
    </StatusBadge>
  );
}

function RoleBadge({ role }: { role: AccountRole }) {
  return role === 'ADMIN' ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/30">
      <ShieldCheck className="h-3 w-3" /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-sun/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-sun/40">
      <Building2 className="h-3 w-3" /> Nhà cung cấp
    </span>
  );
}

function SignupBadge({ method }: { method: TravelerSignupMethod }) {
  return method === 'GOOGLE' ? (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary-700 ring-1 ring-inset ring-secondary/30">
      <GoogleMark size={12} /> Google
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-inset ring-border">
      <Mail className="h-3 w-3" /> Email
    </span>
  );
}

function LockButton({ status, onClick }: { status: AccountStatus; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={actionButtonClass(status === 'ACTIVE' ? 'danger' : 'success')}>
      {status === 'ACTIVE' ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
      {status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
    </button>
  );
}
