import React, { useState, useEffect } from 'react';
import AccountsPanel from '@/components/admin/AccountsPanel';
import PlacesPanel from '@/components/admin/PlacesPanel';
import OverviewPanel from '@/components/admin/OverviewPanel';
import BookingsPanel from '@/components/admin/BookingsPanel';
import ProvidersPanel from '@/components/admin/ProvidersPanel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { actionButtonClass } from '@/components/admin/statusStyles';
import type { StatusTone } from '@/components/admin/StatusBadge';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Users,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  MapPin,
  DollarSign,
  CalendarCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import type {
  AdminProviderSummaryDto,
  AdminDashboardSummaryDto,
  ProviderStatus,
} from '@/types/admin';

type AdminTab = 'dashboard' | 'accounts' | 'providers' | 'places' | 'bookings' | 'finance';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const REFUND_STATUS: Record<'PENDING' | 'PROCESSED' | 'REJECTED', { tone: StatusTone; label: string }> = {
  PENDING: { tone: 'warning', label: 'Chờ duyệt' },
  PROCESSED: { tone: 'success', label: 'Đã hoàn tiền' },
  REJECTED: { tone: 'danger', label: 'Đã từ chối' },
};

function FinanceCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${tone}`}>
        <DollarSign className="h-5 w-5" />
      </span>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
        <div className="font-display text-lg font-bold text-ink-deep">{value}</div>
      </div>
    </div>
  );
}

const TABS: { key: AdminTab; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: BarChart3 },
  { key: 'accounts', label: 'Tài khoản', icon: Users },
  { key: 'providers', label: 'Đối tác / NCC', icon: Building2 },
  { key: 'places', label: 'Kiểm duyệt điểm đến', icon: MapPin },
  { key: 'bookings', label: 'Đặt phòng', icon: CalendarCheck },
  { key: 'finance', label: 'Tài chính', icon: DollarSign },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const rawUser = typeof window !== 'undefined' ? localStorage.getItem('portal_user') : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Dashboard State
  const [dashboardData, setDashboardData] = useState<AdminDashboardSummaryDto | null>(null);
  const [dashboardError, setDashboardError] = useState(false);

  // 2. Accounts State
  const [accountsRefreshKey, setAccountsRefreshKey] = useState(0);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    email: '',
    phone: '',
    fullName: '',
    password: '',
  });
  const [resetPassModal, setResetPassModal] = useState<{ id: number; email: string } | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // 3. Providers State
  const [providers, setProviders] = useState<AdminProviderSummaryDto[]>([]);
  const [providersError, setProvidersError] = useState(false);
  const [showCreateProviderModal, setShowCreateProviderModal] = useState(false);
  const [providerStatusTarget, setProviderStatusTarget] = useState<{ id: number; name: string; status: ProviderStatus } | null>(null);
  const [providerStatusReason, setProviderStatusReason] = useState('');
  const [providerStatusError, setProviderStatusError] = useState('');
  const [newProviderForm, setNewProviderForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    note: '',
    accountEmail: '',
    accountPhone: '',
    accountPassword: '',
    accountFullName: '',
  });

  // 4. Places State

  // 5. Finance State
  const [revenueData, setRevenueData] = useState<{
    grandTotal: number;
    totalTransactions: number;
    byMonth: Array<{ year: number; month: number; totalAmount: number; transactionCount: number }>;
  } | null>(null);
  const [financeError, setFinanceError] = useState(false);
  const [refunds, setRefunds] = useState<
    Array<{
      id: number;
      bookingCode: string;
      amount: number;
      reason: string;
      type: string;
      status: 'PENDING' | 'PROCESSED' | 'REJECTED';
      requestedAt: string;
    }>
  >([]);

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    navigate('/admin/login');
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ─────────────────────────────────────────────
  // Data Loaders
  // ─────────────────────────────────────────────
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setDashboardError(false);
      setDashboardData(await adminService.getDashboardSummary());
    } catch {
      setDashboardError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      setLoading(true);
      setProvidersError(false);
      setProviders(await adminService.getProviders());
    } catch {
      setProvidersError(true);
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveTab = () => {
    if (activeTab === 'dashboard') loadDashboard();
    else if (activeTab === 'providers') loadProviders();
    else if (activeTab === 'finance') loadFinance();
    else setAccountsRefreshKey((k) => k + 1);
  };

  const loadFinance = async () => {
    try {
      setLoading(true);
      setFinanceError(false);
      const [rev, ref] = await Promise.all([adminService.getRevenueSummary(), adminService.getRefunds(false)]);
      setRevenueData(rev);
      setRefunds(ref);
    } catch {
      setFinanceError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    else if (activeTab === 'providers') loadProviders();
    else if (activeTab === 'finance') loadFinance();
  }, [activeTab]);

  // ─────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createAdminAccount(newAdminForm);
      showNotification('success', 'Đã tạo tài khoản Quản trị viên mới thành công!');
      setShowCreateAdminModal(false);
      setNewAdminForm({ email: '', phone: '', fullName: '', password: '' });
      setAccountsRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo tài khoản Admin.';
      showNotification('error', msg);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassModal) return;
    try {
      await adminService.resetPassword(resetPassModal.id, {
        newPassword: newPasswordVal,
        reason: 'Admin đặt lại mật khẩu thủ công',
      });
      showNotification('success', `Đã đặt lại mật khẩu cho ${resetPassModal.email}`);
      setResetPassModal(null);
      setNewPasswordVal('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi đặt lại mật khẩu.';
      showNotification('error', msg);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createProviderWithAccount(newProviderForm);
      showNotification('success', 'Đã tạo mới Đối tác NCC và tài khoản đăng nhập đầu tiên thành công!');
      setShowCreateProviderModal(false);
      setNewProviderForm({
        name: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        note: '',
        accountEmail: '',
        accountPhone: '',
        accountPassword: '',
        accountFullName: '',
      });
      loadProviders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo Đối tác NCC.';
      showNotification('error', msg);
    }
  };

  const openProviderStatusDialog = (id: number, name: string, status: ProviderStatus) => {
    setProviderStatusTarget({ id, name, status });
    setProviderStatusReason('');
    setProviderStatusError('');
  };

  const handleUpdateProviderStatus = async () => {
    if (!providerStatusTarget) return;
    const { id, status } = providerStatusTarget;
    const reason = providerStatusReason.trim();
    if (status !== 'ACTIVE' && !reason) {
      setProviderStatusError('Vui lòng nhập lý do.');
      return;
    }
    try {
      await adminService.updateProviderStatus(id, {
        status,
        reason: reason || 'Admin mở lại tài khoản đối tác',
      });
      showNotification('success', `Đã đổi trạng thái đối tác sang ${status}`);
      setProviderStatusTarget(null);
      loadProviders();
    } catch (err: unknown) {
      const serverMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setProviderStatusError(serverMsg || 'Lỗi cập nhật trạng thái đối tác.');
    }
  };

  const handleApproveRefund = async (id: number) => {
    try {
      await adminService.approveRefund(id, 'Admin duyệt hoàn tiền');
      showNotification('success', 'Đã duyệt yêu cầu hoàn tiền thành công!');
      loadFinance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi duyệt hoàn tiền.';
      showNotification('error', msg);
    }
  };

  const handleRejectRefund = async (id: number) => {
    try {
      await adminService.rejectRefund(id, 'Yêu cầu không đủ điều kiện theo chính sách hủy');
      showNotification('success', 'Đã từ chối yêu cầu hoàn tiền');
      loadFinance();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi từ chối hoàn tiền.';
      showNotification('error', msg);
    }
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-md p-2 text-muted transition-colors hover:bg-hover hover:text-primary"
              title="Về trang chủ"
              aria-label="Về trang chủ"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white shadow-[var(--shadow-teal)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-sm font-bold text-ink-deep sm:text-base">Quản trị hệ thống</h1>
              <p className="text-[11px] text-muted">Du Lịch Số</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-xs font-semibold text-ink-deep">{currentUser?.fullName || 'Quản trị viên'}</div>
              <div className="text-[11px] text-muted">{currentUser?.email}</div>
            </div>
            <button
              type="button"
              onClick={refreshActiveTab}
              className="rounded-md border border-border p-2 text-muted transition-colors hover:border-primary/40 hover:text-primary"
              title="Làm mới dữ liệu"
              aria-label="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-danger/40 hover:bg-danger/5 hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Điều hướng quản trị">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex cursor-pointer items-center gap-2 whitespace-nowrap px-3 py-3 text-xs font-semibold transition-colors duration-200 ${
                  active ? 'text-primary' : 'text-muted hover:text-ink-deep'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span
                  className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary transition-all duration-300 ${
                    active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-5 p-4 sm:p-6">
        {message && (
          <div
            role="status"
            className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-medium animate-in fade-in duration-200 ${
              message.type === 'success' ? 'border-accent/40 bg-accent/10 text-primary-700' : 'border-danger/30 bg-danger/10 text-danger'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab 1: Dashboard Tổng quan */}
        {activeTab === 'dashboard' && (
          <OverviewPanel
            data={dashboardData}
            loading={loading}
            error={dashboardError}
            onRetry={loadDashboard}
            onNavigate={setActiveTab}
          />
        )}

        {/* Tab 2: Quản lý Tài khoản */}
        {activeTab === 'accounts' && (
          <AccountsPanel
            currentAccountId={currentUser?.accountId}
            refreshKey={accountsRefreshKey}
            onCreateAdmin={() => setShowCreateAdminModal(true)}
            onResetPassword={setResetPassModal}
            notify={showNotification}
          />
        )}

        {/* Tab 3: Quản lý Đối tác / NCC */}
        {activeTab === 'providers' && (
          <ProvidersPanel
            providers={providers}
            loading={loading}
            error={providersError}
            onReload={loadProviders}
            onCreate={() => setShowCreateProviderModal(true)}
            onChangeStatus={openProviderStatusDialog}
            notify={showNotification}
          />
        )}

        {/* Tab 4: Kiểm duyệt Điểm đến */}
        {activeTab === 'places' && <PlacesPanel notify={showNotification} />}

        {/* Tab: Đặt phòng */}
        {activeTab === 'bookings' && <BookingsPanel />}

        {/* Tab 5: Tài chính & Hoàn tiền */}
        {activeTab === 'finance' && (
          <div className="flex flex-col gap-5">
            {financeError && (
              <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
                Không tải được dữ liệu tài chính. Vui lòng thử lại.
              </div>
            )}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <FinanceCard tone="bg-primary-50 text-primary" label="Tổng doanh thu sàn" value={vnd.format(revenueData?.grandTotal ?? 0)} />
              <FinanceCard tone="bg-secondary/10 text-secondary-700" label="Giao dịch thành công" value={`${revenueData?.totalTransactions ?? 0} giao dịch`} />
              <FinanceCard tone="bg-sun/15 text-amber-700" label="Hoàn tiền chờ duyệt" value={`${refunds.filter((r) => r.status === 'PENDING').length} yêu cầu`} />
            </div>

            <section className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-[var(--shadow-card)]">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink-deep">
                <DollarSign className="h-4 w-4 text-primary" />
                Yêu cầu hoàn tiền
              </h3>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-canvas text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <th className="px-3 py-2.5">Mã đặt phòng</th>
                      <th className="px-3 py-2.5">Số tiền</th>
                      <th className="px-3 py-2.5">Lý do</th>
                      <th className="px-3 py-2.5">Loại</th>
                      <th className="px-3 py-2.5">Trạng thái</th>
                      <th className="px-3 py-2.5">Thời gian</th>
                      <th className="px-3 py-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {refunds.map((ref) => (
                      <tr key={ref.id} className="transition-colors duration-200 hover:bg-primary-50/40">
                        <td className="px-3 py-2.5 font-mono font-semibold text-primary">{ref.bookingCode}</td>
                        <td className="px-3 py-2.5 font-semibold text-ink-deep">{vnd.format(ref.amount)}</td>
                        <td className="max-w-[200px] truncate px-3 py-2.5 text-muted" title={ref.reason}>
                          {ref.reason}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-muted">{ref.type}</td>
                        <td className="px-3 py-2.5">
                          <StatusBadge tone={REFUND_STATUS[ref.status].tone} pulse={ref.status === 'PENDING'}>
                            {REFUND_STATUS[ref.status].label}
                          </StatusBadge>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted">{new Date(ref.requestedAt).toLocaleString('vi-VN')}</td>
                        <td className="px-3 py-2.5 text-right">
                          {ref.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" onClick={() => handleApproveRefund(ref.id)} className={actionButtonClass('success')}>
                                Duyệt
                              </button>
                              <button type="button" onClick={() => handleRejectRefund(ref.id)} className={actionButtonClass('danger')}>
                                Từ chối
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {refunds.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-xs text-muted">
                          Hiện không có yêu cầu hoàn tiền nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Modal 1: Tạo Admin mới */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[var(--color-bg-canvas,#F6FAF8)]">
              <h3 className="text-sm font-bold text-slate-800">Tạo tài khoản Quản trị viên mới</h3>
              <button
                type="button"
                onClick={() => setShowCreateAdminModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={newAdminForm.fullName}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, fullName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                  placeholder="Lê Quản Trị"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                  placeholder="admin.le@taybactrails.vn"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  value={newAdminForm.phone}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                  placeholder="0981122334"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo *</label>
                <input
                  type="password"
                  required
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary,#048C73)] hover:bg-[#03705C] rounded-md transition-colors shadow-xs"
                >
                  Xác nhận tạo Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tạo NCC mới + tài khoản 1 bước */}
      {providerStatusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-md rounded-lg bg-white border border-slate-200 shadow-xl p-5 flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-800">
              {providerStatusTarget.status === 'ACTIVE'
                ? 'Mở lại đối tác'
                : providerStatusTarget.status === 'SUSPENDED'
                ? 'Đình chỉ đối tác'
                : 'Chấm dứt đối tác'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{providerStatusTarget.name}</strong>
              {providerStatusTarget.status === 'ACTIVE'
                ? ' sẽ đăng nhập và thao tác lại bình thường.'
                : ' sẽ thấy màn hình thông báo bị đình chỉ và không thể thao tác gì cho đến khi được mở lại.'}
            </p>
            <label className="text-xs font-semibold text-slate-700" htmlFor="provider-status-reason">
              Lý do {providerStatusTarget.status !== 'ACTIVE' && <span className="text-rose-600">*</span>}
            </label>
            <textarea
              id="provider-status-reason"
              rows={3}
              value={providerStatusReason}
              onChange={(e) => setProviderStatusReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
            />
            {providerStatusError && <p className="text-xs text-rose-600">{providerStatusError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setProviderStatusTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleUpdateProviderStatus}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-md ${
                  providerStatusTarget.status === 'ACTIVE'
                    ? 'bg-[var(--color-primary,#048C73)] hover:bg-[#03705C]'
                    : providerStatusTarget.status === 'SUSPENDED'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateProviderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[var(--color-bg-canvas,#F6FAF8)]">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Tạo mới Đối tác NCC & Tài khoản đăng nhập</h3>
                <p className="text-[11px] text-slate-500">Kích hoạt trực tiếp trạng thái ACTIVE (UC-09)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateProviderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProvider} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="text-xs font-bold text-[var(--color-primary,#048C73)] border-b pb-1">
                1. Hồ sơ Đối tác / Cơ sở
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Homestay / Cơ sở *</label>
                <input
                  type="text"
                  required
                  value={newProviderForm.name}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                  placeholder="La Pán Tẩn Eco Homestay"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Người đại diện</label>
                  <input
                    type="text"
                    value={newProviderForm.contactName}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, contactName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden"
                    placeholder="Lò Thị Mai"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SĐT cơ sở</label>
                  <input
                    type="tel"
                    value={newProviderForm.contactPhone}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden"
                    placeholder="0987654321"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  value={newProviderForm.address}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden"
                  placeholder="Bản Háng Tày, Xã La Pán Tẩn, Mù Cang Chải"
                />
              </div>

              <div className="text-xs font-bold text-[var(--color-primary,#048C73)] border-b pb-1 pt-2">
                2. Tài khoản đăng nhập đầu tiên cho NCC
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ tên chủ tài khoản *</label>
                <input
                  type="text"
                  required
                  value={newProviderForm.accountFullName}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, accountFullName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden"
                  placeholder="Lò Thị Mai"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email đăng nhập *</label>
                  <input
                    type="email"
                    required
                    value={newProviderForm.accountEmail}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, accountEmail: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden"
                    placeholder="mai@lapantan.vn"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu *</label>
                  <input
                    type="password"
                    required
                    value={newProviderForm.accountPassword}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, accountPassword: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateProviderModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary,#048C73)] hover:bg-[#03705C] rounded-md transition-colors shadow-xs"
                >
                  Hoàn tất tạo NCC & Tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Mật khẩu */}
      {resetPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[var(--color-bg-canvas,#F6FAF8)]">
              <h3 className="text-sm font-bold text-slate-800">Đặt lại mật khẩu</h3>
              <button
                type="button"
                onClick={() => setResetPassModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Đặt lại mật khẩu cho tài khoản: <strong>{resetPassModal.email}</strong>
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#048C73)]"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassModal(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary,#048C73)] hover:bg-[#03705C] rounded-md transition-colors shadow-xs"
                >
                  Lưu mật khẩu mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
