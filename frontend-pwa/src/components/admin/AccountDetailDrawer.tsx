import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { KeyRound, Pencil, ShieldCheck, X } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/lib/apiError';
import type { AccountRole, AccountStatus, AdminAccountDto, AdminTravelerDto } from '@/types/admin';
import { StatusBadge } from './StatusBadge';
import { actionButtonClass } from './statusStyles';
import OverlayPortal from './OverlayPortal';

export type AccountDetailTarget =
  | { kind: 'STAFF'; id: number }
  | { kind: 'TRAVELER'; traveler: AdminTravelerDto };

interface AccountDetailDrawerProps {
  target: AccountDetailTarget;
  currentAccountId?: number;
  onClose: () => void;
  onChanged: () => void;
  onResetPassword: (account: { id: number; email: string }) => void;
  notify: (type: 'success' | 'error', text: string) => void;
}

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

/** Mô tả quyền truy cập hiện tại theo vai trò và trạng thái tài khoản. */
function accessSummary(role: AccountRole | 'TRAVELER', status: AccountStatus, providerName?: string) {
  if (status !== 'ACTIVE') {
    return {
      tone: 'danger' as const,
      title: 'Đang bị chặn đăng nhập',
      items: ['Không thể đăng nhập và mọi phiên đang mở bị từ chối cho đến khi được mở khóa.'],
    };
  }
  if (role === 'ADMIN') {
    return {
      tone: 'brand' as const,
      title: 'Quản trị viên',
      items: ['Cổng quản trị toàn hệ thống', 'Quản lý tài khoản, đối tác, điểm đến, đặt phòng, tài chính và báo cáo', 'Ghi nhận giám sát Booking'],
    };
  }
  if (role === 'PROVIDER') {
    return {
      tone: 'warning' as const,
      title: 'Nhà cung cấp',
      items: [`Cổng đối tác — chỉ dữ liệu của cơ sở ${providerName ? `“${providerName}”` : 'được liên kết'}`, 'Quản lý homestay và đơn đặt phòng của cơ sở', 'Bị chặn khi cơ sở bị đình chỉ hoặc chấm dứt'],
    };
  }
  return {
    tone: 'info' as const,
    title: 'Khách du lịch',
    items: ['Tìm kiếm, đặt phòng và quản lý hồ sơ cá nhân', 'Không truy cập được cổng quản trị hoặc đối tác'],
  };
}

export default function AccountDetailDrawer({ target, currentAccountId, onClose, onChanged, onResetPassword, notify }: AccountDetailDrawerProps) {
  const staffId = target.kind === 'STAFF' ? target.id : null;
  const [account, setAccount] = useState<AdminAccountDto | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(target.kind === 'STAFF');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    if (staffId == null) return;
    setLoading(true);
    setError('');
    try {
      setAccount(await adminService.getAccountById(staffId));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không tải được thông tin tài khoản.'));
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = () => {
    if (!account) return;
    setForm({ fullName: account.fullName ?? '', phone: account.phone ?? '', email: account.email ?? '' });
    setFormError('');
    setEditing(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (!form.fullName.trim()) {
      setFormError('Họ tên không được để trống.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const updated = await adminService.updateAccount(account.id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      });
      setAccount(updated);
      setEditing(false);
      notify('success', 'Đã cập nhật thông tin tài khoản.');
      onChanged();
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, 'Không cập nhật được tài khoản.'));
    } finally {
      setSaving(false);
    }
  };

  const traveler = target.kind === 'TRAVELER' ? target.traveler : null;
  const role: AccountRole | 'TRAVELER' = traveler ? 'TRAVELER' : account?.role ?? 'ADMIN';
  const status: AccountStatus | null = traveler ? traveler.status : account?.status ?? null;
  const summary = status ? accessSummary(role, status, account?.providerName) : null;
  const inputClass =
    'h-9 w-full rounded-md border border-border bg-white px-3 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <OverlayPortal>
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-deep/50" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-label="Chi tiết tài khoản"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Hồ sơ tài khoản</p>
            <h3 className="font-display text-lg font-bold text-ink-deep">
              {traveler ? traveler.fullName || traveler.email : account?.fullName || (loading ? 'Đang tải...' : '—')}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-muted hover:bg-hover">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-center justify-between gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="font-semibold underline">Thử lại</button>
          </div>
        )}

        {(traveler || account) && status && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={status === 'ACTIVE' ? 'success' : 'danger'}>{status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}</StatusBadge>
              <StatusBadge tone={role === 'ADMIN' ? 'brand' : role === 'PROVIDER' ? 'warning' : 'info'}>
                {role === 'ADMIN' ? 'Quản trị viên' : role === 'PROVIDER' ? 'Nhà cung cấp' : 'Khách du lịch'}
              </StatusBadge>
              {traveler && (
                <StatusBadge tone={traveler.signupMethod === 'GOOGLE' ? 'info' : 'neutral'}>
                  Đăng ký bằng {traveler.signupMethod === 'GOOGLE' ? 'Google' : 'Email'}
                </StatusBadge>
              )}
            </div>

            <Section
              title="Thông tin hồ sơ"
              action={
                account && !editing ? (
                  <button type="button" onClick={startEdit} className={actionButtonClass('brand')}>
                    <Pencil className="h-3 w-3" /> Chỉnh sửa
                  </button>
                ) : null
              }
            >
              {editing && account ? (
                <form onSubmit={save} className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
                    Họ tên
                    <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
                    Email
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
                    Số điện thoại
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                  </label>
                  {formError && <p role="alert" className="text-xs text-danger">{formError}</p>}
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setEditing(false)} className="rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:bg-hover">
                      Hủy
                    </button>
                    <button type="submit" disabled={saving} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-60">
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <Row k="Mã tài khoản" v={`#${traveler ? traveler.id : account?.id}`} />
                  <Row k="Họ tên" v={(traveler ? traveler.fullName : account?.fullName) || '—'} />
                  <Row k="Email" v={(traveler ? traveler.email : account?.email) || '—'} />
                  <Row k="Số điện thoại" v={(traveler ? traveler.phone : account?.phone) || '—'} />
                  {account?.providerName && <Row k="Cơ sở liên kết" v={account.providerName} />}
                  <Row k="Ngày tạo" v={fmt(traveler ? traveler.createdAt : account?.createdAt)} />
                  <Row k="Đăng nhập gần nhất" v={fmt(traveler ? traveler.lastLoginAt : account?.lastLoginAt)} />
                </>
              )}
            </Section>

            {summary && (
              <Section title="Quyền truy cập hiện tại">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <StatusBadge tone={summary.tone}>{summary.title}</StatusBadge>
                </div>
                <ul className="list-disc pl-5 text-xs leading-relaxed text-ink">
                  {summary.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </Section>
            )}

            {account && (
              <button
                type="button"
                onClick={() => onResetPassword({ id: account.id, email: account.email ?? account.phone ?? `#${account.id}` })}
                disabled={account.id === currentAccountId}
                title={account.id === currentAccountId ? 'Hãy đổi mật khẩu của chính bạn ở trang cá nhân' : undefined}
                className={`${actionButtonClass('warning')} w-fit disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <KeyRound className="h-3 w-3" /> Đặt lại mật khẩu
              </button>
            )}
          </>
        )}
      </aside>
    </div>
    </OverlayPortal>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-muted">{k}</span>
      <span className="text-right text-ink">{v}</span>
    </div>
  );
}
