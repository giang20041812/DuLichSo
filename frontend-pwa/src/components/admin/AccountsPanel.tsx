import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Plus, RefreshCw } from 'lucide-react';
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

const STATUS_OPTIONS: ChipOption<AccountStatus>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Bị khóa' },
];
const ROLE_OPTIONS: ChipOption<AccountRole>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PROVIDER', label: 'Nhà cung cấp' },
];
const PROVIDER_STATUS_OPTIONS: ChipOption<ProviderStatus>[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'SUSPENDED', label: 'Đình chỉ' },
  { value: 'TERMINATED', label: 'Chấm dứt' },
];
const SIGNUP_OPTIONS: ChipOption<TravelerSignupMethod>[] = [
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

const pill = (cls: string) => `rounded-sm border px-2 py-0.5 text-[10px] font-bold ${cls}`;
const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

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
    } catch {
      setLoadError('Không tải được danh sách. Vui lòng kiểm tra kết nối máy chủ và thử lại.');
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
      const serverMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setLockError(serverMsg || 'Không thể cập nhật trạng thái tài khoản.');
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

  const th = 'px-3 py-2.5';

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-white p-4 shadow-xs">
      {/* Loại tài khoản */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-border bg-canvas p-0.5" role="tablist" aria-label="Loại tài khoản">
          {(
            [
              ['STAFF', 'Quản trị & Nhà cung cấp'],
              ['TRAVELER', 'Khách du lịch'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={kind === value}
              onClick={() => switchKind(value)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                kind === value ? 'bg-white text-primary shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {kind === 'STAFF' && (
          <button
            type="button"
            onClick={onCreateAdmin}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" /> Tạo Admin mới
          </button>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col gap-3 rounded-md border border-border bg-canvas/60 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSearch
            value={keyword}
            onChange={resetPage(setKeyword)}
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
          />
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
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <ChipGroup label="Trạng thái" options={STATUS_OPTIONS} value={status} onChange={resetPage(setStatus)} />
          {kind === 'STAFF' ? (
            <>
              <ChipGroup label="Vai trò" options={ROLE_OPTIONS} value={role} onChange={resetPage(setRole)} />
              <ChipGroup label="Trạng thái NCC" options={PROVIDER_STATUS_OPTIONS} value={providerStatus} onChange={resetPage(setProviderStatus)} />
            </>
          ) : (
            <ChipGroup label="Đăng ký bằng" options={SIGNUP_OPTIONS} value={signup} onChange={resetPage(setSignup)} />
          )}
          <DateRangeFilter
            from={createdFrom}
            to={createdTo}
            onChange={(f, t) => {
              setCreatedFrom(f);
              setCreatedTo(t);
              setPage(0);
            }}
          />
        </div>
        <FilterFooter total={total} activeCount={activeCount} onClear={clearFilters} />
      </div>

      {loadError && (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
          {loadError}
        </div>
      )}

      {/* Bảng */}
      <div className={`overflow-x-auto rounded-md border border-border transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {kind === 'STAFF' ? (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas font-semibold text-muted">
                <th className={th}>ID</th>
                <th className={th}>Họ tên & Email</th>
                <th className={th}>Số điện thoại</th>
                <th className={th}>Vai trò</th>
                <th className={th}>Cơ sở liên kết</th>
                <th className={th}>Đăng nhập gần nhất</th>
                <th className={th}>Trạng thái</th>
                <th className={`${th} text-right`}>Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff?.content.map((acc) => (
                <tr key={acc.id} className="transition-colors hover:bg-hover/60">
                  <td className={`${th} font-mono text-muted`}>#{acc.id}</td>
                  <td className={th}>
                    <div className="font-semibold text-ink-deep">{acc.fullName}</div>
                    <div className="text-[11px] text-muted">{acc.email}</div>
                  </td>
                  <td className={`${th} text-ink`}>{acc.phone || '—'}</td>
                  <td className={th}>
                    <span className={pill(acc.role === 'ADMIN' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-secondary-200 bg-secondary-50 text-secondary-700')}>
                      {acc.role === 'ADMIN' ? 'ADMIN' : 'NCC'}
                    </span>
                  </td>
                  <td className={`${th} text-[11px] font-medium text-primary`}>{acc.providerName || '—'}</td>
                  <td className={`${th} text-muted`}>{formatDate(acc.lastLoginAt)}</td>
                  <td className={th}>
                    <StatusPill status={acc.status} />
                  </td>
                  <td className={`${th} text-right`}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onResetPassword({ id: acc.id, email: acc.email })}
                        title="Đặt lại mật khẩu"
                        className="rounded-md p-1.5 text-muted transition-colors hover:bg-sun-light hover:text-sun"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <LockButton status={acc.status} onClick={() => openLock('STAFF', acc.id, acc.fullName, acc.status)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas font-semibold text-muted">
                <th className={th}>ID</th>
                <th className={th}>Họ tên & Email</th>
                <th className={th}>Số điện thoại</th>
                <th className={th}>Đăng ký bằng</th>
                <th className={th}>Ngày tạo</th>
                <th className={th}>Đăng nhập gần nhất</th>
                <th className={th}>Trạng thái</th>
                <th className={`${th} text-right`}>Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {travelers?.content.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-hover/60">
                  <td className={`${th} font-mono text-muted`}>#{t.id}</td>
                  <td className={th}>
                    <div className="flex items-center gap-2">
                      {t.pictureUrl ? (
                        <img src={t.pictureUrl} alt="" referrerPolicy="no-referrer" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-[11px] font-bold text-primary">
                          {(t.fullName || t.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <div className="font-semibold text-ink-deep">{t.fullName || '—'}</div>
                        <div className="text-[11px] text-muted">{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`${th} text-ink`}>{t.phone || '—'}</td>
                  <td className={th}>
                    <span className={pill(t.signupMethod === 'GOOGLE' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-border bg-canvas text-muted')}>
                      {t.signupMethod === 'GOOGLE' ? 'Google' : 'Email'}
                    </span>
                  </td>
                  <td className={`${th} text-muted`}>{formatDate(t.createdAt)}</td>
                  <td className={`${th} text-muted`}>{formatDate(t.lastLoginAt)}</td>
                  <td className={th}>
                    <StatusPill status={t.status} />
                  </td>
                  <td className={`${th} text-right`}>
                    <LockButton status={t.status} onClick={() => openLock('TRAVELER', t.id, t.fullName || t.email, t.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && rowsEmpty && !loadError && (
          <div className="py-10 text-center text-xs text-muted">Không có tài khoản nào khớp bộ lọc.</div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

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
    </div>
  );
}

function StatusPill({ status }: { status: AccountStatus }) {
  return (
    <span className={pill(status === 'ACTIVE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')}>
      {status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
    </span>
  );
}

function LockButton({ status, onClick }: { status: AccountStatus; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
        status === 'ACTIVE'
          ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
      }`}
    >
      {status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
    </button>
  );
}
