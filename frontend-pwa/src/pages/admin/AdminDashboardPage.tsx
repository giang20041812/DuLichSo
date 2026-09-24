import React, { useState, useEffect, type ReactNode } from 'react';
import AccountsPanel from '@/components/admin/AccountsPanel';
import PlacesPanel from '@/components/admin/PlacesPanel';
import OverviewPanel from '@/components/admin/OverviewPanel';
import BookingsPanel, { type BookingsPreset } from '@/components/admin/BookingsPanel';
import ReportsPanel from '@/components/admin/ReportsPanel';
import ProvidersPanel from '@/components/admin/ProvidersPanel';
import AdminSidebar, { type SidebarItem } from '@/components/admin/AdminSidebar';
import { getApiErrorMessage } from '@/lib/apiError';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { actionButtonClass } from '@/components/admin/statusStyles';
import type { StatusTone } from '@/components/admin/StatusBadge';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  CheckCircle,
  ChevronRight,
  FileBarChart,
  LayoutDashboard,
  MapPin,
  Menu,
  ReceiptText,
  RefreshCw,
  Undo2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import type {
  AdminProviderSummaryDto,
  AdminDashboardSummaryDto,
  BookingStatusSummary,
  ProviderStatus,
} from '@/types/admin';

type AdminTab = 'dashboard' | 'accounts' | 'providers' | 'places' | 'bookings' | 'reports' | 'finance';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const REFUND_STATUS: Record<'PENDING' | 'PROCESSED' | 'REJECTED', { tone: StatusTone; label: string }> = {
  PENDING: { tone: 'warning', label: 'Chờ duyệt' },
  PROCESSED: { tone: 'success', label: 'Đã hoàn tiền' },
  REJECTED: { tone: 'danger', label: 'Đã từ chối' },
};

const TAB_META: Record<AdminTab, { label: string; description: string; icon: SidebarItem<AdminTab>['icon']; group: string }> = {
  dashboard: { label: 'Tổng quan', description: 'Chỉ số vận hành, việc cần xử lý và hoạt động gần đây.', icon: LayoutDashboard, group: 'Tổng quan' },
  reports: { label: 'Báo cáo', description: 'Thống kê đặt phòng theo thời gian, nhà cung cấp và homestay.', icon: FileBarChart, group: 'Tổng quan' },
  places: { label: 'Kiểm duyệt điểm đến', description: 'Duyệt nội dung và kiểm soát hiển thị của điểm đến.', icon: MapPin, group: 'Vận hành' },
  bookings: { label: 'Đặt phòng', description: 'Giám sát đơn đặt phòng và ghi nhận xử lý trên toàn hệ thống.', icon: CalendarCheck, group: 'Vận hành' },
  accounts: { label: 'Tài khoản', description: 'Tài khoản quản trị, nhà cung cấp và khách du lịch.', icon: Users, group: 'Quản lý' },
  providers: { label: 'Đối tác / NCC', description: 'Trạng thái hoạt động và tài khoản đăng nhập của đối tác.', icon: Building2, group: 'Quản lý' },
  finance: { label: 'Tài chính', description: 'Doanh thu đối soát và yêu cầu hoàn tiền.', icon: Wallet, group: 'Tài chính' },
};
const TAB_ORDER: AdminTab[] = ['dashboard', 'reports', 'places', 'bookings', 'accounts', 'providers', 'finance'];

const inputCls =
  'h-9 w-full rounded-md border border-border bg-white px-3 text-xs text-ink transition-colors placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const labelCls = 'mb-1 block text-xs font-semibold text-ink-deep';

function FinanceCard({ label, value, tone, icon }: { label: string; value: string; tone: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${tone}`}>{icon}</span>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
        <div className="font-display text-lg font-bold tabular-nums text-ink-deep">{value}</div>
      </div>
    </div>
  );
}

/** Khung modal dùng chung cho các biểu mẫu của trang quản trị. */
function Modal({ title, subtitle, onClose, size = 'md', children }: { title: string; subtitle?: string; onClose: () => void; size?: 'sm' | 'md' | 'lg'; children: ReactNode }) {
  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-lg' : 'max-w-md';
  return (
    <div className="fade-in-overlay fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/60 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className={`rise-in w-full ${width} overflow-hidden rounded-lg border border-border bg-white shadow-xl`}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h3 className="font-display text-sm font-bold text-ink-deep">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-md p-1 text-muted transition-colors hover:bg-hover hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, submitLabel, submitTone = 'primary' }: { onCancel: () => void; submitLabel: string; submitTone?: 'primary' | 'warning' | 'danger' }) {
  const tone =
    submitTone === 'danger'
      ? 'bg-danger text-white hover:opacity-90'
      : submitTone === 'warning'
      ? 'bg-sun text-ink-deep hover:opacity-90'
      : 'bg-primary text-white hover:bg-primary-600';
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="h-9 rounded-md px-4 text-xs font-semibold text-muted transition-colors hover:bg-hover hover:text-ink">
        Hủy
      </button>
      <button type="submit" className={`h-9 rounded-md px-4 text-xs font-semibold shadow-xs transition-all ${tone}`}>
        {submitLabel}
      </button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const rawUser = typeof window !== 'undefined' ? localStorage.getItem('portal_user') : null;
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // 1. Dashboard State
  const [dashboardData, setDashboardData] = useState<AdminDashboardSummaryDto | null>(null);
  const [dashboardError, setDashboardError] = useState(false);
  // Số đếm cho badge menu (Đặt phòng chờ xử lý).
  const [bookingSummary, setBookingSummary] = useState<BookingStatusSummary | null>(null);

  // 2. Accounts State
  const [accountsRefreshKey, setAccountsRefreshKey] = useState(0);
  const [bookingsPreset, setBookingsPreset] = useState<{ key: number; preset?: BookingsPreset }>({ key: 0 });
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

  /** Số đếm cho badge sidebar — tải ngầm, lỗi thì chỉ ẩn badge. */
  const loadNavCounts = async (withDashboard: boolean) => {
    const [summary, bookings] = await Promise.allSettled([
      withDashboard ? adminService.getDashboardSummary() : Promise.resolve(null),
      adminService.getBookingsSummary(),
    ]);
    if (summary.status === 'fulfilled' && summary.value) setDashboardData(summary.value);
    if (bookings.status === 'fulfilled') setBookingSummary(bookings.value);
  };

  const refreshActiveTab = () => {
    if (activeTab === 'dashboard') loadDashboard();
    else if (activeTab === 'providers') loadProviders();
    else if (activeTab === 'finance') loadFinance();
    else setAccountsRefreshKey((k) => k + 1);
    void loadNavCounts(activeTab !== 'dashboard');
  };

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    else if (activeTab === 'providers') loadProviders();
    else if (activeTab === 'finance') loadFinance();
    void loadNavCounts(activeTab !== 'dashboard');
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
      const msg = getApiErrorMessage(err, 'Lỗi khi tạo tài khoản Admin.');
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
      const msg = getApiErrorMessage(err, 'Lỗi khi đặt lại mật khẩu.');
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
      const msg = getApiErrorMessage(err, 'Lỗi khi tạo Đối tác NCC.');
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
      setProviderStatusError(getApiErrorMessage(err, 'Lỗi cập nhật trạng thái đối tác.'));
    }
  };

  const handleApproveRefund = async (id: number) => {
    try {
      await adminService.approveRefund(id, 'Admin duyệt hoàn tiền');
      showNotification('success', 'Đã duyệt yêu cầu hoàn tiền thành công!');
      loadFinance();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi duyệt hoàn tiền.');
      showNotification('error', msg);
    }
  };

  const handleRejectRefund = async (id: number) => {
    try {
      await adminService.rejectRefund(id, 'Yêu cầu không đủ điều kiện theo chính sách hủy');
      showNotification('success', 'Đã từ chối yêu cầu hoàn tiền');
      loadFinance();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi từ chối hoàn tiền.');
      showNotification('error', msg);
    }
  };

  // ─────────────────────────────────────────────
  // Sidebar
  // ─────────────────────────────────────────────
  const pendingBookings = bookingSummary ? bookingSummary.PENDING + bookingSummary.AWAITING_PAYMENT : 0;
  const navItems: SidebarItem<AdminTab>[] = TAB_ORDER.map((key) => ({
    key,
    label: TAB_META[key].label,
    icon: TAB_META[key].icon,
    group: TAB_META[key].group,
    badge:
      key === 'places' && dashboardData
        ? { count: dashboardData.unverifiedPlaces, tone: 'amber' }
        : key === 'bookings'
        ? { count: pendingBookings, tone: 'green' }
        : null,
  }));
  const meta = TAB_META[activeTab];

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <AdminSidebar
        items={navItems}
        active={activeTab}
        onSelect={setActiveTab}
        user={currentUser}
        onLogout={handleLogout}
        onHome={() => navigate('/')}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-white/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Mở menu"
              className="rounded-md p-2 text-muted transition-colors hover:bg-hover hover:text-ink lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-muted">
                <span>Quản trị</span>
                <ChevronRight className="h-3 w-3" />
                <span>{meta.group}</span>
              </nav>
              <h1 className="truncate font-display text-base font-bold text-ink-deep sm:text-lg">{meta.label}</h1>
            </div>
            <p className="hidden max-w-sm text-right text-xs text-muted xl:block">{meta.description}</p>
            <button
              type="button"
              onClick={refreshActiveTab}
              className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-xs font-semibold text-muted transition-colors hover:border-primary/40 hover:text-primary"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </header>

        <main key={activeTab} className="fade-in-overlay mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          {/* Tab 1: Dashboard Tổng quan */}
          {activeTab === 'dashboard' && (
            <OverviewPanel
              data={dashboardData}
              bookingSummary={bookingSummary}
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
          {activeTab === 'bookings' && <BookingsPanel key={bookingsPreset.key} preset={bookingsPreset.preset} />}

          {/* Tab: Báo cáo & thống kê */}
          {activeTab === 'reports' && (
            <ReportsPanel
              onDrill={(preset) => {
                setBookingsPreset((p) => ({ key: p.key + 1, preset }));
                setActiveTab('bookings');
              }}
            />
          )}

          {/* Tab 5: Tài chính & Hoàn tiền */}
          {activeTab === 'finance' && (
            <>
              {financeError && (
                <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
                  Không tải được dữ liệu tài chính. Vui lòng thử lại.
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FinanceCard icon={<Wallet className="h-5 w-5" />} tone="bg-primary-50 text-primary" label="Tổng doanh thu sàn" value={vnd.format(revenueData?.grandTotal ?? 0)} />
                <FinanceCard icon={<ReceiptText className="h-5 w-5" />} tone="bg-secondary/10 text-secondary-700" label="Giao dịch thành công" value={`${revenueData?.totalTransactions ?? 0} giao dịch`} />
                <FinanceCard icon={<Undo2 className="h-5 w-5" />} tone="bg-sun/15 text-amber-700" label="Hoàn tiền chờ duyệt" value={`${refunds.filter((r) => r.status === 'PENDING').length} yêu cầu`} />
              </div>

              <section className="rounded-lg border border-border bg-white shadow-sm">
                <header className="flex items-center justify-between border-b border-border px-4 py-3">
                  <h3 className="font-display text-sm font-bold text-ink-deep">Yêu cầu hoàn tiền</h3>
                  <span className="rounded bg-canvas px-1.5 py-px text-[10px] font-bold tabular-nums text-muted">{refunds.length}</span>
                </header>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        <th className="px-4 py-2.5">Mã đặt phòng</th>
                        <th className="px-4 py-2.5 text-right">Số tiền</th>
                        <th className="px-4 py-2.5">Lý do</th>
                        <th className="px-4 py-2.5">Loại</th>
                        <th className="px-4 py-2.5">Trạng thái</th>
                        <th className="px-4 py-2.5">Thời gian</th>
                        <th className="px-4 py-2.5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {refunds.map((ref) => (
                        <tr key={ref.id} className="transition-colors duration-150 hover:bg-canvas">
                          <td className="px-4 py-2.5 font-mono font-semibold text-primary">{ref.bookingCode}</td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-ink-deep">{vnd.format(ref.amount)}</td>
                          <td className="max-w-[240px] truncate px-4 py-2.5 text-muted" title={ref.reason}>
                            {ref.reason}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-muted">{ref.type}</td>
                          <td className="px-4 py-2.5">
                            <StatusBadge tone={REFUND_STATUS[ref.status].tone} pulse={ref.status === 'PENDING'}>
                              {REFUND_STATUS[ref.status].label}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-muted">{new Date(ref.requestedAt).toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-2.5 text-right">
                            {ref.status === 'PENDING' && (
                              <div className="flex items-center justify-end gap-1">
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
                    </tbody>
                  </table>
                  {refunds.length === 0 && <div className="py-12 text-center text-xs text-muted">Hiện không có yêu cầu hoàn tiền nào.</div>}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Toast thông báo */}
      {message && (
        <div
          role="status"
          className={`rise-in fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-2.5 rounded-lg border bg-white px-4 py-3 text-xs font-medium shadow-lg ${
            message.type === 'success' ? 'border-accent/40 text-primary-700' : 'border-danger/30 text-danger'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="mt-px h-4 w-4 shrink-0 text-accent" /> : <AlertTriangle className="mt-px h-4 w-4 shrink-0" />}
          <span className="flex-1 text-ink">{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Đóng thông báo" className="text-muted hover:text-ink">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Modal 1: Tạo Admin mới */}
      {showCreateAdminModal && (
        <Modal title="Tạo tài khoản Quản trị viên" subtitle="Tài khoản có toàn quyền trên cổng quản trị." onClose={() => setShowCreateAdminModal(false)}>
          <form onSubmit={handleCreateAdmin} className="space-y-3 p-5">
            <div>
              <label className={labelCls} htmlFor="adm-name">Họ và tên *</label>
              <input id="adm-name" type="text" required value={newAdminForm.fullName} onChange={(e) => setNewAdminForm({ ...newAdminForm, fullName: e.target.value })} className={inputCls} placeholder="Lê Quản Trị" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="adm-email">Email *</label>
                <input id="adm-email" type="email" required value={newAdminForm.email} onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })} className={inputCls} placeholder="admin.le@taybactrails.vn" />
              </div>
              <div>
                <label className={labelCls} htmlFor="adm-phone">Số điện thoại *</label>
                <input id="adm-phone" type="tel" required value={newAdminForm.phone} onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })} className={inputCls} placeholder="0981122334" />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="adm-pass">Mật khẩu khởi tạo *</label>
              <input id="adm-pass" type="password" required value={newAdminForm.password} onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })} className={inputCls} placeholder="Tối thiểu 6 ký tự" />
            </div>
            <ModalActions onCancel={() => setShowCreateAdminModal(false)} submitLabel="Tạo tài khoản" />
          </form>
        </Modal>
      )}

      {/* Modal 2: Đổi trạng thái NCC */}
      {providerStatusTarget && (
        <Modal
          title={providerStatusTarget.status === 'ACTIVE' ? 'Mở lại đối tác' : providerStatusTarget.status === 'SUSPENDED' ? 'Đình chỉ đối tác' : 'Chấm dứt đối tác'}
          onClose={() => setProviderStatusTarget(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleUpdateProviderStatus();
            }}
            className="space-y-3 p-5"
          >
            <p className="text-xs leading-relaxed text-muted">
              <strong className="text-ink-deep">{providerStatusTarget.name}</strong>
              {providerStatusTarget.status === 'ACTIVE'
                ? ' sẽ đăng nhập và thao tác lại bình thường.'
                : ' sẽ thấy màn hình thông báo bị đình chỉ và không thể thao tác gì cho đến khi được mở lại.'}
            </p>
            <div>
              <label className={labelCls} htmlFor="provider-status-reason">
                Lý do {providerStatusTarget.status !== 'ACTIVE' && <span className="text-danger">*</span>}
              </label>
              <textarea
                id="provider-status-reason"
                rows={3}
                value={providerStatusReason}
                onChange={(e) => setProviderStatusReason(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {providerStatusError && <p className="text-xs text-danger">{providerStatusError}</p>}
            <ModalActions
              onCancel={() => setProviderStatusTarget(null)}
              submitLabel="Xác nhận"
              submitTone={providerStatusTarget.status === 'ACTIVE' ? 'primary' : providerStatusTarget.status === 'SUSPENDED' ? 'warning' : 'danger'}
            />
          </form>
        </Modal>
      )}

      {/* Modal 3: Tạo NCC mới + tài khoản 1 bước */}
      {showCreateProviderModal && (
        <Modal title="Tạo đối tác NCC & tài khoản đăng nhập" subtitle="Đối tác được kích hoạt ngay ở trạng thái Đang hoạt động." size="lg" onClose={() => setShowCreateProviderModal(false)}>
          <form onSubmit={handleCreateProvider} className="max-h-[75vh] space-y-3 overflow-y-auto p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">1. Hồ sơ đối tác / cơ sở</div>
            <div>
              <label className={labelCls} htmlFor="p-name">Tên Homestay / Cơ sở *</label>
              <input id="p-name" type="text" required value={newProviderForm.name} onChange={(e) => setNewProviderForm({ ...newProviderForm, name: e.target.value })} className={inputCls} placeholder="La Pán Tẩn Eco Homestay" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="p-contact">Người đại diện</label>
                <input id="p-contact" type="text" value={newProviderForm.contactName} onChange={(e) => setNewProviderForm({ ...newProviderForm, contactName: e.target.value })} className={inputCls} placeholder="Lò Thị Mai" />
              </div>
              <div>
                <label className={labelCls} htmlFor="p-phone">SĐT cơ sở</label>
                <input id="p-phone" type="tel" value={newProviderForm.contactPhone} onChange={(e) => setNewProviderForm({ ...newProviderForm, contactPhone: e.target.value })} className={inputCls} placeholder="0987654321" />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="p-address">Địa chỉ chi tiết</label>
              <input id="p-address" type="text" value={newProviderForm.address} onChange={(e) => setNewProviderForm({ ...newProviderForm, address: e.target.value })} className={inputCls} placeholder="Bản Háng Tày, Xã La Pán Tẩn, Mù Cang Chải" />
            </div>

            <div className="border-t border-border pt-3 text-[11px] font-semibold uppercase tracking-wide text-primary">2. Tài khoản đăng nhập đầu tiên</div>
            <div>
              <label className={labelCls} htmlFor="p-acc-name">Họ tên chủ tài khoản *</label>
              <input id="p-acc-name" type="text" required value={newProviderForm.accountFullName} onChange={(e) => setNewProviderForm({ ...newProviderForm, accountFullName: e.target.value })} className={inputCls} placeholder="Lò Thị Mai" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="p-acc-email">Email đăng nhập *</label>
                <input id="p-acc-email" type="email" required value={newProviderForm.accountEmail} onChange={(e) => setNewProviderForm({ ...newProviderForm, accountEmail: e.target.value })} className={inputCls} placeholder="mai@lapantan.vn" />
              </div>
              <div>
                <label className={labelCls} htmlFor="p-acc-pass">Mật khẩu *</label>
                <input id="p-acc-pass" type="password" required value={newProviderForm.accountPassword} onChange={(e) => setNewProviderForm({ ...newProviderForm, accountPassword: e.target.value })} className={inputCls} placeholder="Tối thiểu 6 ký tự" />
              </div>
            </div>
            <ModalActions onCancel={() => setShowCreateProviderModal(false)} submitLabel="Tạo đối tác & tài khoản" />
          </form>
        </Modal>
      )}

      {/* Modal 4: Reset Mật khẩu */}
      {resetPassModal && (
        <Modal title="Đặt lại mật khẩu" size="sm" onClose={() => setResetPassModal(null)}>
          <form onSubmit={handleResetPassword} className="space-y-3 p-5">
            <p className="text-xs text-muted">
              Tài khoản: <strong className="text-ink-deep">{resetPassModal.email || `#${resetPassModal.id}`}</strong>
            </p>
            <div>
              <label className={labelCls} htmlFor="reset-pass">Mật khẩu mới *</label>
              <input id="reset-pass" type="password" required value={newPasswordVal} onChange={(e) => setNewPasswordVal(e.target.value)} className={inputCls} placeholder="Tối thiểu 6 ký tự" />
            </div>
            <ModalActions onCancel={() => setResetPassModal(null)} submitLabel="Lưu mật khẩu mới" />
          </form>
        </Modal>
      )}
    </div>
  );
}
