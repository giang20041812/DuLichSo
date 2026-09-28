import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  ChevronRight,
  FilePenLine,
  Inbox,
  MapPin,
  MessageSquare,
  RefreshCw,
  Undo2,
  UserX,
  Users,
} from 'lucide-react';
import type { AdminDashboardSummaryDto, BookingStatusSummary } from '@/types/admin';
import { type StatusTone } from './StatusBadge';

export type OverviewTarget = 'accounts' | 'providers' | 'places' | 'finance' | 'bookings' | 'applications' | 'changes' | 'reviews';

interface OverviewPanelProps {
  data: AdminDashboardSummaryDto | null;
  bookingSummary: BookingStatusSummary | null;
  /** Số hồ sơ đăng ký NCC chờ duyệt / yêu cầu thay đổi chờ duyệt (null = chưa biết, ẩn khỏi "Cần xử lý"). */
  pendingApplications?: number | null;
  pendingChanges?: number | null;
  /** Admin có quyền mở mục này không (ẩn ô "Cần xử lý" và tắt thẻ KPI dẫn tới mục ngoài quyền cấp bậc). */
  canOpen: (target: OverviewTarget) => boolean;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onNavigate: (tab: OverviewTarget) => void;
  /** Phần "Báo cáo đặt phòng" gộp ngay dưới các chỉ số tổng quan. */
  reports?: ReactNode;
}

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export default function OverviewPanel({
  data,
  bookingSummary,
  pendingApplications,
  pendingChanges,
  canOpen,
  loading,
  error,
  onRetry,
  onNavigate,
  reports,
}: OverviewPanelProps) {
  if (error && !data) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-white p-10 text-center shadow-sm">
        <AlertTriangle className="h-6 w-6 text-danger" />
        <p className="text-sm text-danger">Không tải được số liệu tổng quan. Vui lòng kiểm tra kết nối máy chủ.</p>
        <button type="button" onClick={onRetry} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600">
          Thử lại
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[132px] animate-pulse rounded-lg border border-border bg-white" />
        ))}
      </div>
    );
  }

  // ─── KPI ───
  const reviewed = data.totalPlaces - data.unverifiedPlaces;
  const stoppedProviders = data.suspendedProviders + data.terminatedProviders;
  const activeTravelers = data.totalTravelers - data.lockedTravelers;
  const bookingsTotal = bookingSummary ? Object.values(bookingSummary).reduce((a, b) => a + b, 0) : 0;
  const bookingsConfirmed = bookingSummary
    ? bookingSummary.CONFIRMED + bookingSummary.CHECKED_IN + bookingSummary.CHECKED_OUT + bookingSummary.COMPLETED
    : 0;
  const bookingsPending = bookingSummary ? bookingSummary.PENDING + bookingSummary.AWAITING_PAYMENT : 0;

  // ─── Cần xử lý (sắp theo mức ưu tiên: hàng đợi chờ quyết định trước, cảnh báo sau) ───
  const attention: { key: string; label: string; count: number; icon: ReactNode; tone: string; target: OverviewTarget }[] = [
    { key: 'applications', label: 'Hồ sơ đăng ký NCC chờ duyệt', count: pendingApplications ?? 0, icon: <Inbox className="h-4 w-4" />, tone: 'text-amber-700 bg-sun/15', target: 'applications' },
    { key: 'unverified', label: 'Điểm đến chờ duyệt', count: data.unverifiedPlaces, icon: <MapPin className="h-4 w-4" />, tone: 'text-amber-700 bg-sun/15', target: 'places' },
    { key: 'changes', label: 'Yêu cầu thay đổi của NCC chờ duyệt', count: pendingChanges ?? 0, icon: <FilePenLine className="h-4 w-4" />, tone: 'text-amber-700 bg-sun/15', target: 'changes' },
    { key: 'bookings', label: 'Đơn đặt phòng chờ xử lý', count: bookingsPending, icon: <CalendarCheck className="h-4 w-4" />, tone: 'text-primary-700 bg-accent/15', target: 'bookings' },
    { key: 'refunds', label: 'Hoàn tiền chờ duyệt', count: data.pendingRefundsCount, icon: <Undo2 className="h-4 w-4" />, tone: 'text-secondary-700 bg-secondary/10', target: 'finance' },
    { key: 'needsUpdate', label: 'Điểm đến chờ NCC bổ sung', count: data.needsUpdatePlaces, icon: <MessageSquare className="h-4 w-4" />, tone: 'text-amber-700 bg-sun/15', target: 'places' },
    { key: 'suspended', label: 'NCC đang bị đình chỉ', count: data.suspendedProviders, icon: <Building2 className="h-4 w-4" />, tone: 'text-danger bg-danger/10', target: 'providers' },
    { key: 'locked', label: 'Tài khoản khách bị khóa', count: data.lockedTravelers, icon: <UserX className="h-4 w-4" />, tone: 'text-muted bg-canvas', target: 'accounts' },
  ];
  const openItems = attention.filter((a) => a.count > 0 && canOpen(a.target));

  return (
    <div className={`flex flex-col gap-5 transition-opacity duration-300 ${loading ? 'opacity-60' : ''}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<MapPin className="h-4 w-4" />}
          iconTone="bg-primary-50 text-primary"
          label="Điểm đến toàn sàn"
          value={data.totalPlaces}
          badge={data.unverifiedPlaces > 0 ? { tone: 'warning', text: `${data.unverifiedPlaces} chờ duyệt` } : { tone: 'success', text: 'Đã duyệt hết' }}
          progress={{ value: pct(reviewed, data.totalPlaces), label: 'đã kiểm duyệt', bar: 'bg-primary' }}
          onClick={canOpen('places') ? () => onNavigate('places') : undefined}
        />
        <KpiCard
          icon={<Building2 className="h-4 w-4" />}
          iconTone="bg-secondary/10 text-secondary-700"
          label="Đối tác / NCC"
          value={data.totalProviders}
          badge={stoppedProviders > 0 ? { tone: 'danger', text: `${stoppedProviders} ngừng hoạt động` } : { tone: 'success', text: 'Tất cả hoạt động' }}
          progress={{ value: pct(data.activeProviders, data.totalProviders), label: 'đang hoạt động', bar: 'bg-secondary' }}
          onClick={canOpen('providers') ? () => onNavigate('providers') : undefined}
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          iconTone="bg-accent/10 text-primary-700"
          label="Khách du lịch"
          value={data.totalTravelers}
          badge={data.newTravelers7d > 0 ? { tone: 'success', text: `+${data.newTravelers7d} tuần này`, up: true } : { tone: 'neutral', text: `+${data.newTravelers30d} trong 30 ngày` }}
          progress={{ value: pct(activeTravelers, data.totalTravelers), label: 'đang hoạt động', bar: 'bg-accent' }}
          onClick={canOpen('accounts') ? () => onNavigate('accounts') : undefined}
        />
        <KpiCard
          icon={<CalendarCheck className="h-4 w-4" />}
          iconTone="bg-sun/15 text-amber-700"
          label="Đặt phòng tháng này"
          value={data.monthlyBookingsCount}
          badge={bookingsPending > 0 ? { tone: 'warning', text: `${bookingsPending} chờ xử lý` } : { tone: 'neutral', text: vnd.format(data.monthlyRevenue ?? 0) }}
          progress={
            bookingSummary
              ? { value: pct(bookingsConfirmed, bookingsTotal), label: `xác nhận · ${bookingsConfirmed}/${bookingsTotal} đơn`, bar: 'bg-sun' }
              : null
          }
          onClick={canOpen('bookings') ? () => onNavigate('bookings') : undefined}
        />
      </div>

      <section className="rounded-lg border border-border bg-white shadow-sm" aria-label="Cần xử lý">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-bold text-ink-deep">Cần xử lý</h3>
            <span className="rounded bg-canvas px-1.5 py-px text-[10px] font-bold tabular-nums text-muted">{openItems.length}</span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            aria-label="Tải lại số liệu"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-primary/40 hover:text-primary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>
        {openItems.length === 0 ? (
          <p className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-muted">
            <Inbox className="h-4 w-4" /> Không có việc tồn đọng.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {openItems.map((a) => (
              <li key={a.key}>
                <button
                  type="button"
                  onClick={() => onNavigate(a.target)}
                  className="group flex h-full w-full items-center gap-3 rounded-md border border-border bg-white p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${a.tone}`}>{a.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold leading-none tabular-nums text-ink-deep">{a.count}</span>
                    <span className="mt-1 block text-[11px] leading-snug text-muted">{a.label}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reports && (
        <section aria-label="Báo cáo đặt phòng" className="flex flex-col gap-3">
          <div>
            <h3 className="font-display text-sm font-bold text-ink-deep">Báo cáo đặt phòng</h3>
            <p className="text-[11px] text-muted">Thống kê theo kỳ, nhà cung cấp và nhóm đơn. Bấm vào số liệu hoặc cột biểu đồ để xem danh sách đơn liên quan.</p>
          </div>
          {reports}
        </section>
      )}
    </div>
  );
}

const BADGE_TONE: Record<StatusTone, string> = {
  success: 'bg-accent/10 text-primary-700',
  warning: 'bg-sun/15 text-amber-700',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-secondary/10 text-secondary-700',
  brand: 'bg-primary-50 text-primary',
  neutral: 'bg-canvas text-muted',
};

function KpiCard({
  icon,
  iconTone,
  label,
  value,
  badge,
  progress,
  onClick,
}: {
  icon: ReactNode;
  iconTone: string;
  label: string;
  value: number | string;
  badge: { tone: StatusTone; text: string; up?: boolean };
  progress: { value: number; label: string; bar: string } | null;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconTone}`}>{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-display text-2xl font-bold leading-none tabular-nums text-ink-deep">{value}</span>
        <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${BADGE_TONE[badge.tone]}`}>
          {badge.up && <ArrowUpRight className="h-3 w-3" />}
          {badge.text}
        </span>
      </div>
      {progress ? (
        <div>
          <div className="h-1.5 overflow-hidden rounded-sm bg-canvas">
            <div className={`h-full rounded-sm ${progress.bar} transition-all duration-700 ease-out`} style={{ width: `${progress.value}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted">
            <span>{progress.label}</span>
            <strong className="tabular-nums text-ink">{progress.value}%</strong>
          </div>
        </div>
      ) : (
        <div className="h-[26px]" />
      )}
    </>
  );
  const base = 'flex flex-col gap-3 rounded-lg border border-border bg-white p-4 text-left shadow-sm';
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`${base} group transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)]`}
    >
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}
