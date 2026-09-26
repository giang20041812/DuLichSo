import React, { useState, useEffect } from 'react';
import AccountsPanel from '@/components/admin/AccountsPanel';
import PlacesPanel from '@/components/admin/PlacesPanel';
import OverviewPanel from '@/components/admin/OverviewPanel';
import BookingsPanel from '@/components/admin/BookingsPanel';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Users,
  BarChart3,
  Plus,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  MapPin,
  DollarSign,
  CalendarCheck,
  X,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import type {
  AdminProviderSummaryDto,
  AdminDashboardSummaryDto,
  ProviderStatus,
} from '@/types/admin';

type AdminTab = 'dashboard' | 'accounts' | 'providers' | 'places' | 'bookings' | 'finance';

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
  const [providerStatusFilter, setProviderStatusFilter] = useState<ProviderStatus | ''>('');
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
      const data = await adminService.getProviders(
        providerStatusFilter ? providerStatusFilter : undefined
      );
      setProviders(data);
    } catch {
      setProviders([
        {
          id: 2001,
          name: 'Bản Lìm Mông Eco Lodge',
          contactName: 'Giàng A Páo',
          contactPhone: '0912345678',
          contactEmail: 'ncc@taybactrails.vn',
          address: 'Bản Lìm Mông, Xã Cao Phạ, Mù Cang Chải',
          status: 'ACTIVE',
          placeCount: 4,
          accountCount: 2,
          createdAt: '2026-02-15T09:30:00',
          updatedAt: '2026-03-10T14:20:00',
        },
        {
          id: 2002,
          name: 'Mù Cang Chải Ecolodge',
          contactName: 'Hoàng Thị Mẩy',
          contactPhone: '0987654321',
          contactEmail: 'may@ecolodge.vn',
          address: 'Bản Hua Khắt, Xã Nậm Khắt, Mù Cang Chải',
          status: 'ACTIVE',
          placeCount: 6,
          accountCount: 3,
          createdAt: '2026-01-20T11:00:00',
          updatedAt: '2026-02-28T16:45:00',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadFinance = async () => {
    try {
      setLoading(true);
      const [rev, ref] = await Promise.all([
        adminService.getRevenueSummary(),
        adminService.getRefunds(false),
      ]);
      setRevenueData(rev);
      setRefunds(ref);
    } catch {
      setRevenueData({
        grandTotal: 1250000000,
        totalTransactions: 680,
        byMonth: [
          { year: 2026, month: 1, totalAmount: 280000000, transactionCount: 150 },
          { year: 2026, month: 2, totalAmount: 410000000, transactionCount: 220 },
          { year: 2026, month: 3, totalAmount: 560000000, transactionCount: 310 },
        ],
      });
      setRefunds([
        {
          id: 101,
          bookingCode: 'MCC-BK-20260312-001',
          amount: 1450000,
          reason: 'Khách hủy phòng do thời tiết sạt lở',
          type: 'FULL_REFUND',
          status: 'PENDING',
          requestedAt: '2026-03-15T10:20:00',
        },
      ]);
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
    <div className="min-h-screen bg-[var(--color-bg-canvas,#F6FAF8)] text-slate-800 font-sans p-4 sm:p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-lg p-4 shadow-xs border border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
              title="Về Trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[var(--color-ink-deep,#0f2d3c)] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--color-primary,#10b981)]" />
                Cổng Quản Trị Hệ Thống Du Lịch Số
              </h1>
              <p className="text-xs text-slate-500">
                Phiên làm việc: <strong className="text-slate-700">{currentUser?.fullName || 'Quản trị viên'}</strong> ({currentUser?.email || 'admin@taybactrails.vn'}) — Vai trò <span className="px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-semibold text-[10px]">ADMIN</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'dashboard') loadDashboard();
                            else if (activeTab === 'providers') loadProviders();
                            else if (activeTab === 'finance') loadFinance();
              }}
              className="p-2 text-slate-600 hover:text-[var(--color-primary,#10b981)] hover:bg-slate-50 rounded-md border border-slate-200 transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 px-3.5 py-2 rounded-md font-semibold transition-colors cursor-pointer border border-rose-200/60"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Thông báo Alert */}
        {message && (
          <div
            className={`p-3 rounded-md text-xs font-medium border flex items-center gap-2 animate-in fade-in duration-200 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-md transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-[var(--color-primary,#10b981)] text-[var(--color-primary,#10b981)] bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tổng quan (Dashboard)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-md transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'accounts'
                ? 'border-[var(--color-primary,#10b981)] text-[var(--color-primary,#10b981)] bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản lý Tài khoản</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-md transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'providers'
                ? 'border-[var(--color-primary,#10b981)] text-[var(--color-primary,#10b981)] bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Quản lý Đối tác / NCC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-md transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'places'
                ? 'border-[var(--color-primary,#10b981)] text-[var(--color-primary,#10b981)] bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Kiểm duyệt Điểm đến</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-md transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'bookings'
                ? 'border-[var(--color-primary,#10b981)] text-[var(--color-primary,#10b981)] bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Đặt phòng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-md transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'finance'
                ? 'border-[var(--color-primary,#10b981)] text-[var(--color-primary,#10b981)] bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Tài chính & Hoàn tiền</span>
          </button>
        </div>

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
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={providerStatusFilter}
                  onChange={(e) => setProviderStatusFilter(e.target.value as ProviderStatus | '')}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-hidden"
                >
                  <option value="">Tất cả trạng thái NCC</option>
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="SUSPENDED">Đang đình chỉ (SUSPENDED)</option>
                  <option value="TERMINATED">Chấm dứt (TERMINATED)</option>
                </select>
                <button
                  type="button"
                  onClick={loadProviders}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                >
                  Lọc
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateProviderModal(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary,#10b981)] text-white text-xs font-semibold rounded-md hover:bg-[#059669] transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Đối tác NCC mới (1 bước)</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Tên cơ sở / Đối tác</th>
                    <th className="py-2.5 px-3">Đại diện & Liên hệ</th>
                    <th className="py-2.5 px-3">Địa chỉ</th>
                    <th className="py-2.5 px-3 text-center">Điểm đến</th>
                    <th className="py-2.5 px-3 text-center">Tài khoản</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right">Đổi trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {providers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">#{p.id}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{p.name}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 font-medium">{p.contactName || '—'}</div>
                        <div className="text-slate-500 text-[11px]">
                          {p.contactPhone} {p.contactEmail ? `• ${p.contactEmail}` : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={p.address}>
                        {p.address || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[var(--color-primary,#10b981)]">
                        {p.placeCount}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {p.accountCount}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'SUSPENDED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status !== 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => openProviderStatusDialog(p.id, p.name, 'ACTIVE')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-[11px] font-semibold transition-colors"
                            >
                              Kích hoạt
                            </button>
                          )}
                          {p.status !== 'SUSPENDED' && (
                            <button
                              type="button"
                              onClick={() => openProviderStatusDialog(p.id, p.name, 'SUSPENDED')}
                              className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-[11px] font-semibold transition-colors"
                            >
                              Đình chỉ
                            </button>
                          )}
                          {p.status !== 'TERMINATED' && (
                            <button
                              type="button"
                              onClick={() => openProviderStatusDialog(p.id, p.name, 'TERMINATED')}
                              className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-[11px] font-semibold transition-colors"
                            >
                              Chấm dứt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {providers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Chưa có Đối tác NCC nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Kiểm duyệt Điểm đến */}
        {activeTab === 'places' && <PlacesPanel notify={showNotification} />}

        {/* Tab: Đặt phòng */}
        {activeTab === 'bookings' && <BookingsPanel />}

        {/* Tab 5: Tài chính & Hoàn tiền */}
        {activeTab === 'finance' && (
          <div className="flex flex-col gap-5">
            {/* Doanh thu Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Tổng Doanh Thu Sàn
                </span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    revenueData?.grandTotal ?? 0
                  )}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Tổng Giao Dịch Thành Công
                </span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {revenueData?.totalTransactions ?? 0} giao dịch
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Yêu Cầu Hoàn Tiền Chờ Duyệt
                </span>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {refunds.filter((r) => r.status === 'PENDING').length} ca
                </p>
              </div>
            </div>

            {/* Bảng yêu cầu hoàn tiền */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[var(--color-primary,#10b981)]" />
                <span>Danh sách yêu cầu hoàn tiền (Refunds)</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Mã Đặt Phòng</th>
                      <th className="py-2.5 px-3">Số tiền</th>
                      <th className="py-2.5 px-3">Lý do</th>
                      <th className="py-2.5 px-3">Loại</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {refunds.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[var(--color-primary,#10b981)]">
                          {ref.bookingCode}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            ref.amount
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={ref.reason}>
                          {ref.reason}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{ref.type}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                              ref.status === 'PROCESSED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ref.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {ref.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {new Date(ref.requestedAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {ref.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveRefund(ref.id)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-[11px] font-semibold transition-colors"
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectRefund(ref.id)}
                                className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-[11px] font-semibold transition-colors"
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {refunds.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          Hiện không có yêu cầu hoàn tiền nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#10b981)]"
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#10b981)]"
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#10b981)]"
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#10b981)]"
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary,#10b981)] hover:bg-[#059669] rounded-md transition-colors shadow-xs"
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
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#10b981)]"
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
                    ? 'bg-[var(--color-primary,#10b981)] hover:bg-[#059669]'
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
              <div className="text-xs font-bold text-[var(--color-primary,#10b981)] border-b pb-1">
                1. Hồ sơ Đối tác / Cơ sở
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Homestay / Cơ sở *</label>
                <input
                  type="text"
                  required
                  value={newProviderForm.name}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#10b981)]"
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

              <div className="text-xs font-bold text-[var(--color-primary,#10b981)] border-b pb-1 pt-2">
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary,#10b981)] hover:bg-[#059669] rounded-md transition-colors shadow-xs"
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-[var(--color-primary,#10b981)]"
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary,#10b981)] hover:bg-[#059669] rounded-md transition-colors shadow-xs"
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
