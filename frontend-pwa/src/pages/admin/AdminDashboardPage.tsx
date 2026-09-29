import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import AccountsPanel from '@/components/admin/AccountsPanel';
import PlacesPanel from '@/components/admin/PlacesPanel';
import OverviewPanel from '@/components/admin/OverviewPanel';
import BookingsPanel, { type BookingsPreset } from '@/components/admin/BookingsPanel';
import ReportsPanel from '@/components/admin/ReportsPanel';
import ProvidersPanel from '@/components/admin/ProvidersPanel';
import ProviderApplicationsPanel from '@/components/admin/ProviderApplicationsPanel';
import ChangeRequestsPanel from '@/components/admin/ChangeRequestsPanel';
import ReviewsPanel from '@/components/admin/ReviewsPanel';
import NoticeDialog, { type Notice } from '@/components/admin/NoticeDialog';
import ActivityPanel from '@/components/admin/ActivityPanel';
import AdminStaffPanel from '@/components/admin/AdminStaffPanel';
import AdminSidebar, { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from '@/components/admin/AdminSidebar';
import AdminCommandPalette, { type QuickAction } from '@/components/admin/AdminCommandPalette';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';
import { NAV_GROUPS, NAV_META, type AdminTab, type NavShortcutKind } from '@/components/admin/adminNav';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import { AdminLevelContext } from '@/hooks/useAdminPermission';
import { ADMIN_LEVELS, LEVEL_META, levelCan, toAdminLevel, type AdminCapability } from '@/lib/adminPermissions';
import { getApiErrorMessage } from '@/lib/apiError';
import { clearPortalSession } from '@/lib/authInterceptor';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clearStatusParam } from '@/hooks/useUrlStatus';
import { Building2, ChevronRight, Construction, Download, MapPin, Menu, RefreshCw, ShieldCheck, UserPlus, X } from 'lucide-react';
import { adminService } from '@/services/adminService';
import type {
  AdminLevel,
  AdminProviderSummaryDto,
  AdminDashboardSummaryDto,
  BookingStatusSummary,
  ProviderStatus,
} from '@/types/admin';


const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed';
const RECENT_TABS_KEY = 'admin_recent_tabs';
const MAX_RECENT_TABS = 5;

/** Các mục đã mở gần đây (mới nhất trước), đọc từ localStorage và bỏ mã không còn hợp lệ. */
function readRecentTabs(): AdminTab[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_TABS_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is AdminTab => typeof t === 'string' && t in NAV_META).slice(0, MAX_RECENT_TABS);
  } catch {
    return [];
  }
}

/** Tải file CSV (thêm BOM để Excel đọc đúng tiếng Việt). */
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`;
  const csv = '﻿' + rows.map((r) => r.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Khung thẻ dùng chung cho các hàng đợi được đưa lên menu riêng (giống thẻ của các bảng danh sách khác). */
function PanelCard({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-border bg-white shadow-sm">{children}</section>;
}

const inputCls =
  'h-9 w-full rounded-md border border-border bg-white px-3 text-xs text-ink transition-colors placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const labelCls = 'mb-1 block text-xs font-semibold text-ink-deep';

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

function ModalActions({
  onCancel,
  submitLabel,
  submitTone = 'primary',
  cancelLabel = 'Hủy',
}: {
  onCancel: () => void;
  submitLabel: string;
  submitTone?: 'primary' | 'warning' | 'danger';
  cancelLabel?: string;
}) {
  const tone =
    submitTone === 'danger'
      ? 'bg-danger text-white hover:opacity-90'
      : submitTone === 'warning'
      ? 'bg-sun text-ink-deep hover:opacity-90'
      : 'bg-primary text-white hover:bg-primary-600';
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="h-9 rounded-md px-4 text-xs font-semibold text-muted transition-colors hover:bg-hover hover:text-ink">
        {cancelLabel}
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

  // Cấp quản trị: lấy nhanh từ phiên đăng nhập rồi xác nhận lại từ máy chủ (phiên cũ có thể chưa lưu cấp).
  const [level, setLevel] = useState<AdminLevel>(toAdminLevel(currentUser?.adminLevel));
  useEffect(() => {
    let alive = true;
    adminService
      .getMe()
      .then((me) => {
        if (alive) setLevel(toAdminLevel(me.adminLevel));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  const can = (capability: AdminCapability) => levelCan(level, capability);
  const tabAllowed = (tab: AdminTab) => {
    const need = NAV_META[tab].capability;
    return !need || can(need);
  };

  const [requestedTab, setRequestedTab] = useState<AdminTab>('dashboard');
  const [, setSearchParams] = useSearchParams();
  // Mỗi mục có bộ trạng thái riêng nên đổi mục thì bỏ ?status= của mục trước (các tham số khác giữ nguyên).
  const setActiveTab = useCallback(
    (tab: AdminTab) => {
      setSearchParams(clearStatusParam, { replace: true });
      setRequestedTab(tab);
    },
    [setSearchParams],
  );
  // Mục đang mở không còn được phép (vd: bị hạ cấp) thì quay về Tổng quan.
  const activeTab: AdminTab = tabAllowed(requestedTab) ? requestedTab : 'dashboard';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Notice | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Sidebar: ghi nhớ thu gọn/mở rộng cho lần mở sau (localStorage có thể bị chặn nên luôn bọc try/catch).
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggleSidebar = () =>
    setSidebarCollapsed((c) => {
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, c ? '0' : '1');
      } catch {
        /* không lưu được thì vẫn dùng bình thường trong phiên này */
      }
      return !c;
    });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [recentTabs, setRecentTabs] = useState<AdminTab[]>(readRecentTabs);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // 1. Dashboard State
  const [dashboardData, setDashboardData] = useState<AdminDashboardSummaryDto | null>(null);
  const [dashboardError, setDashboardError] = useState(false);
  // Số đếm cho badge menu (Đặt phòng chờ xử lý).
  const [bookingSummary, setBookingSummary] = useState<BookingStatusSummary | null>(null);
  // Số đếm cho các hàng đợi "Cần xử lý": hồ sơ NCC mới, yêu cầu thay đổi của NCC.
  const [pendingApplications, setPendingApplications] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number | null>(null);
  // Đổi giá trị để tải lại các màn tự quản dữ liệu (nút "Làm mới" trên thanh trên cùng).
  const [panelKey, setPanelKey] = useState(0);

  // 2. Accounts State
  const [accountsRefreshKey, setAccountsRefreshKey] = useState(0);
  const [bookingsPreset, setBookingsPreset] = useState<{ key: number; preset?: BookingsPreset }>({ key: 0 });
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState<{ email: string; phone: string; fullName: string; password: string; adminLevel: AdminLevel }>({
    email: '',
    phone: '',
    fullName: '',
    password: '',
    adminLevel: 3,
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
  const [providerStatusFinal, setProviderStatusFinal] = useState(false);
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


  const handleLogout = () => {
    clearPortalSession();
    navigate('/admin/login');
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
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

  /** Số đếm cho badge sidebar — tải ngầm, lỗi thì chỉ ẩn badge. */
  const loadNavCounts = async (withDashboard: boolean) => {
    // Hàng đợi hồ sơ NCC / yêu cầu thay đổi chỉ dành cho từ cấp 2 (máy chủ chặn cấp 3) nên cấp 3 không gọi.
    const queues = can('viewQueues');
    const [summary, bookings, applications, changes] = await Promise.allSettled([
      withDashboard ? adminService.getDashboardSummary() : Promise.resolve(null),
      adminService.getBookingsSummary(),
      queues ? adminService.getPendingProviderApplicationCount() : Promise.resolve(null),
      queues ? adminService.getPendingChangeRequestCount() : Promise.resolve(null),
    ]);
    if (summary.status === 'fulfilled' && summary.value) setDashboardData(summary.value);
    if (bookings.status === 'fulfilled') setBookingSummary(bookings.value);
    if (applications.status === 'fulfilled' && applications.value !== null) setPendingApplications(applications.value);
    if (changes.status === 'fulfilled' && changes.value !== null) setPendingChanges(changes.value);
  };

  /** "Làm mới": đưa mục đang mở về trạng thái ban đầu (bỏ tab trạng thái trên URL, bộ lọc, tìm kiếm) rồi tải lại dữ liệu. */
  const refreshActiveTab = () => {
    setSearchParams(clearStatusParam, { replace: true });
    if (activeTab === 'bookings') setBookingsPreset((p) => ({ key: p.key + 1 }));
    if (activeTab === 'dashboard') loadDashboard();
    else if (activeTab === 'providers') {
      loadProviders();
      setPanelKey((k) => k + 1);
    } else if (activeTab !== 'finance') {
      setAccountsRefreshKey((k) => k + 1);
      setPanelKey((k) => k + 1);
    }
    void loadNavCounts(activeTab !== 'dashboard');
  };

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    else if (activeTab === 'providers') loadProviders();
    void loadNavCounts(activeTab !== 'dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải lại khi đổi mục hoặc đổi cấp
  }, [activeTab, level]);

  // ─────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createAdminAccount(newAdminForm);
      showNotification('success', `Đã tạo tài khoản quản trị viên ${LEVEL_META[newAdminForm.adminLevel].label} (${LEVEL_META[newAdminForm.adminLevel].role}) thành công.`);
      setShowCreateAdminModal(false);
      setNewAdminForm({ email: '', phone: '', fullName: '', password: '', adminLevel: 3 });
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
    setProviderStatusFinal(false);
  };

  const handleUpdateProviderStatus = async () => {
    if (!providerStatusTarget) return;
    const { id, status } = providerStatusTarget;
    const reason = providerStatusReason.trim();
    if (status !== 'ACTIVE' && !reason) {
      setProviderStatusError('Vui lòng nhập lý do.');
      return;
    }
    // Đình chỉ / chấm dứt cần thêm một bước xác nhận lần cuối trước khi ghi nhận.
    if (status !== 'ACTIVE' && !providerStatusFinal) {
      setProviderStatusError('');
      setProviderStatusFinal(true);
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


  // ─────────────────────────────────────────────
  // Sidebar
  // ─────────────────────────────────────────────
  const pendingBookings = bookingSummary ? bookingSummary.PENDING + bookingSummary.AWAITING_PAYMENT : 0;
  /** Số đếm cạnh mục menu — logic đếm giữ nguyên như trước. */
  const navCounts: Partial<Record<AdminTab, number | null>> = {
    applications: pendingApplications,
    changes: pendingChanges,
    places: dashboardData ? dashboardData.unverifiedPlaces : null,
    bookings: pendingBookings,
  };
  // Cấu hình menu (adminNav.ts) đã lọc bỏ mục ngoài quyền và nhóm rỗng.
  const navGroups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => tabAllowed(i.key)) })).filter((g) => g.items.length > 0);
  const meta = NAV_META[activeTab];

  // Ghi nhớ các mục vừa mở để hiện ở phần "Mở gần đây" của bảng lệnh.
  useEffect(() => {
    setRecentTabs((prev) => {
      const next = [activeTab, ...prev.filter((t) => t !== activeTab)].slice(0, MAX_RECENT_TABS);
      try {
        localStorage.setItem(RECENT_TABS_KEY, JSON.stringify(next));
      } catch {
        /* bỏ qua: chỉ là tiện ích */
      }
      return next;
    });
  }, [activeTab]);

  /** Mở mục từ thông báo (chỉ khi cấp hiện tại được phép vào mục đó). */
  const openFromNotification = (target: string) => {
    if ((target === 'applications' || target === 'accounts') && tabAllowed(target)) setActiveTab(target);
  };

  /** Đưa con trỏ vào ô tìm kiếm đầu tiên của màn vừa mở (chờ màn vẽ xong). */
  const focusMainSearch = () => {
    window.setTimeout(() => document.querySelector<HTMLInputElement>('main input[type="text"]')?.focus(), 150);
  };

  /** Nút tắt khi rê chuột trên mục menu. "Xử lý mục tiếp theo" mở hàng đợi tương ứng (mặc định hiện việc chờ trước). */
  const handleShortcut = (key: AdminTab, kind: NavShortcutKind) => {
    if (kind === 'add') {
      if (key === 'providers') setShowCreateProviderModal(true);
      else if (key === 'admins') setShowCreateAdminModal(true);
      return;
    }
    setActiveTab(key);
    if (kind === 'search') focusMainSearch();
  };

  const exportQueueCsv = () => {
    const queueItems = NAV_GROUPS.find((g) => g.id === 'attention')?.items.filter((i) => tabAllowed(i.key)) ?? [];
    const stamp = new Date();
    downloadCsv(`viec-can-xu-ly-${stamp.toISOString().slice(0, 10)}.csv`, [
      ['Mục', 'Số việc chờ xử lý', 'Thời điểm xuất'],
      ...queueItems.map((i) => [i.label, navCounts[i.key] ?? 0, stamp.toLocaleString('vi-VN')]),
    ]);
    showNotification('success', 'Đã xuất file CSV danh sách việc cần xử lý.');
  };

  // Thao tác nhanh của bảng lệnh, đã lọc theo quyền của cấp hiện tại.
  const quickActions: QuickAction[] = [
    ...(tabAllowed('places') && can('operate')
      ? [{ id: 'next-place', label: 'Duyệt điểm đến tiếp theo', hint: 'Mở hàng đợi', icon: MapPin, run: () => setActiveTab('places') }]
      : []),
    ...(can('operate')
      ? [{ id: 'add-provider', label: 'Thêm đối tác', hint: 'Tạo NCC + tài khoản', icon: Building2, run: () => setShowCreateProviderModal(true) }]
      : []),
    ...(can('manageAdmins')
      ? [{ id: 'add-admin', label: 'Tạo quản trị viên', hint: 'Chọn cấp 1–3', icon: UserPlus, run: () => setShowCreateAdminModal(true) }]
      : []),
    { id: 'export-csv', label: 'Xuất CSV', hint: 'Việc cần xử lý', icon: Download, run: exportQueueCsv },
  ];

  // Phím tắt Ctrl K (hoặc ⌘ K) bật / tắt bảng lệnh.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const levelLabel = `${LEVEL_META[level].label} · ${LEVEL_META[level].role}`;

  return (
    <AdminLevelContext.Provider value={level}>
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <AdminSidebar
        groups={navGroups}
        active={activeTab}
        counts={navCounts}
        can={can}
        onSelect={setActiveTab}
        onShortcut={handleShortcut}
        onOpenNotificationTarget={openFromNotification}
        onOpenPalette={() => setPaletteOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
        user={currentUser ? { fullName: currentUser.fullName, email: currentUser.email, levelLabel } : { levelLabel }}
        onOpenProfile={() => setShowProfile(true)}
        onChangePassword={() => setShowChangePassword(true)}
        onHome={() => navigate('/')}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Nội dung chừa chỗ cho sidebar (264px, hoặc 72px khi thu gọn) trên màn hình rộng. */}
      <div
        className="transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[var(--admin-sidebar-w)]"
        style={{ '--admin-sidebar-w': `${sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH}px` } as React.CSSProperties}
      >
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
                <span>{meta.breadcrumb}</span>
              </nav>
              <h1 className="truncate font-display text-base font-bold text-ink-deep sm:text-lg">{meta.label}</h1>
            </div>
            <p className="hidden max-w-sm text-right text-xs text-muted xl:block">{meta.description}</p>
            <AdminNotificationBell onOpenTarget={openFromNotification} placement="below-right" />
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
              pendingApplications={pendingApplications}
              pendingChanges={pendingChanges}
              canOpen={tabAllowed}
              loading={loading}
              error={dashboardError}
              onRetry={loadDashboard}
              onNavigate={setActiveTab}
              reports={
                <ReportsPanel
                  notify={showNotification}
                  onDrill={(preset) => {
                    setBookingsPreset((p) => ({ key: p.key + 1, preset }));
                    setActiveTab('bookings');
                  }}
                />
              }
            />
          )}

          {/* Tab 2: Quản lý Tài khoản */}
          {activeTab === 'accounts' && (
            <AccountsPanel
              key={panelKey}
              currentAccountId={currentUser?.accountId}
              refreshKey={accountsRefreshKey}
              onCreateAdmin={() => setShowCreateAdminModal(true)}
              onCreateProvider={() => setShowCreateProviderModal(true)}
              onResetPassword={setResetPassModal}
              notify={showNotification}
            />
          )}

          {/* Tab 3: Quản lý Đối tác / NCC */}
          {activeTab === 'providers' && (
            <ProvidersPanel
              key={panelKey}
              providers={providers}
              loading={loading}
              error={providersError}
              onReload={loadProviders}
              onCreate={() => setShowCreateProviderModal(true)}
              onChangeStatus={openProviderStatusDialog}
              notify={showNotification}
              pendingApplications={pendingApplications}
              onOpenApplications={() => setActiveTab('applications')}
            />
          )}

          {/* Hàng đợi: hồ sơ đăng ký NCC mới (duyệt → tạo đối tác + tài khoản) */}
          {activeTab === 'applications' && (
            <PanelCard>
              <ProviderApplicationsPanel
                key={panelKey}
                notify={showNotification}
                onChanged={(approved) => {
                  void loadNavCounts(false);
                  if (approved) void loadProviders();
                }}
              />
            </PanelCard>
          )}

          {/* Hàng đợi: duyệt điểm đến / homestay */}
          {activeTab === 'places' && <PlacesPanel key={panelKey} notify={showNotification} />}

          {/* Hàng đợi: thay đổi homestay / phòng / giá do NCC gửi */}
          {activeTab === 'changes' && (
            <PanelCard>
              <ChangeRequestsPanel key={panelKey} notify={showNotification} onChanged={() => void loadNavCounts(true)} />
            </PanelCard>
          )}

          {/* Hàng đợi: đánh giá bị báo vi phạm */}
          {activeTab === 'reviews' && (
            <PanelCard>
              <ReviewsPanel key={panelKey} notify={showNotification} />
            </PanelCard>
          )}

          {/* Tab: Đặt phòng */}
          {activeTab === 'bookings' && <BookingsPanel key={bookingsPreset.key} preset={bookingsPreset.preset} />}

          {/* Hoạt động hệ thống (nhật ký): lọc theo tìm kiếm, trạng thái, vai trò */}
          {activeTab === 'activity' && <ActivityPanel key={panelKey} />}

          {/* Quản trị viên theo cấp (chỉ cấp 1) */}
          {activeTab === 'admins' && (
            <AdminStaffPanel
              key={panelKey}
              currentAccountId={currentUser?.accountId}
              refreshKey={accountsRefreshKey}
              onCreate={() => setShowCreateAdminModal(true)}
              onResetPassword={setResetPassModal}
              notify={showNotification}
            />
          )}

          {/* Tab 5: Tài chính — đang phát triển, chưa bật xử lý dòng tiền thật */}
          {activeTab === 'finance' && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-white p-12 text-center shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-canvas text-muted">
                <Construction className="h-6 w-6" />
              </span>
              <h3 className="font-display text-sm font-bold text-ink-deep">Tính năng đang phát triển</h3>
              <p className="max-w-md text-xs text-muted">
                Đối soát doanh thu, xử lý hoàn tiền và dòng tiền theo nhà cung cấp đang được hoàn thiện. Màn hình
                này sẽ được kích hoạt khi sẵn sàng.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Thông báo kết quả đặt giữa màn hình */}
      {message && <NoticeDialog notice={message} onClose={() => setMessage(null)} />}

      {/* Bảng lệnh Ctrl K: thao tác nhanh, đi tới trang, mở gần đây */}
      {paletteOpen && (
        <AdminCommandPalette
          open
          onClose={() => setPaletteOpen(false)}
          actions={quickActions}
          pages={navGroups.flatMap((g) => g.items)}
          recent={recentTabs.filter((t) => tabAllowed(t) && t !== activeTab)}
          onGo={setActiveTab}
        />
      )}

      {/* Menu tài khoản: Hồ sơ cá nhân */}
      {showProfile && (
        <Modal title="Hồ sơ cá nhân" subtitle="Thông tin tài khoản quản trị đang đăng nhập." size="sm" onClose={() => setShowProfile(false)}>
          <div className="space-y-3 p-5 text-xs">
            <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2">
              <dt className="text-muted">Họ và tên</dt>
              <dd className="font-semibold text-ink-deep">{currentUser?.fullName || '—'}</dd>
              <dt className="text-muted">Email</dt>
              <dd className="break-all text-ink">{currentUser?.email || '—'}</dd>
              <dt className="text-muted">Số điện thoại</dt>
              <dd className="text-ink">{currentUser?.phone || '—'}</dd>
              <dt className="text-muted">Cấp quản trị</dt>
              <dd className="font-semibold text-nav-active-text">{levelLabel}</dd>
            </dl>
            <div className="rounded-md border border-border bg-canvas/60 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-ink-deep">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> Quyền của bạn
              </div>
              <ul className="flex flex-col gap-1 text-ink">
                {LEVEL_META[level].capabilities.map((c) => (
                  <li key={c} className="flex gap-1.5">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end pt-1">
              <button type="button" onClick={() => setShowProfile(false)} className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-600">
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Menu tài khoản: Đổi mật khẩu (dùng luồng OTP qua email có sẵn) */}
      {showChangePassword && (
        <ForgotPasswordModal
          initialIdentifier={currentUser?.email ?? ''}
          onClose={() => setShowChangePassword(false)}
          onDone={() => {
            setShowChangePassword(false);
            showNotification('success', 'Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.');
          }}
        />
      )}

      {/* Modal 1: Tạo Admin mới */}
      {showCreateAdminModal && (
        <Modal title="Tạo tài khoản Quản trị viên" subtitle="Chọn cấp để giới hạn chức năng của tài khoản (cấp 1 cao nhất, cấp 3 ít quyền nhất)." onClose={() => setShowCreateAdminModal(false)}>
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
            <fieldset>
              <legend className={labelCls}>Cấp quản trị *</legend>
              <div className="grid gap-2">
                {ADMIN_LEVELS.map((l) => (
                  <label
                    key={l}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 transition-colors ${
                      newAdminForm.adminLevel === l ? 'border-primary bg-primary-50/60' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adm-level"
                      checked={newAdminForm.adminLevel === l}
                      onChange={() => setNewAdminForm({ ...newAdminForm, adminLevel: l })}
                      className="mt-0.5 accent-[var(--color-primary)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-ink-deep">
                        {LEVEL_META[l].label} · {LEVEL_META[l].role}
                      </span>
                      <span className="block text-[11px] leading-snug text-muted">{LEVEL_META[l].description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
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
                onChange={(e) => {
                  setProviderStatusReason(e.target.value);
                  setProviderStatusFinal(false);
                }}
                readOnly={providerStatusFinal}
                className="w-full rounded-md border border-border px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {providerStatusFinal && (
              <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs leading-relaxed text-danger">
                <strong>Xác nhận lần cuối:</strong> bạn sắp {providerStatusTarget.status === 'SUSPENDED' ? 'đình chỉ' : 'chấm dứt'}{' '}
                <strong>{providerStatusTarget.name}</strong>. Nhà cung cấp sẽ không thể thao tác cho đến khi được mở lại. Bấm "Quay lại" nếu muốn sửa lý do.
              </p>
            )}
            {providerStatusError && <p className="text-xs text-danger">{providerStatusError}</p>}
            <ModalActions
              onCancel={() => (providerStatusFinal ? setProviderStatusFinal(false) : setProviderStatusTarget(null))}
              cancelLabel={providerStatusFinal ? 'Quay lại' : 'Hủy'}
              submitLabel={providerStatusFinal ? 'Xác nhận lần cuối' : 'Xác nhận'}
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
    </AdminLevelContext.Provider>
  );
}
