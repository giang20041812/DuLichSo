import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  ChevronRight,
  Inbox,
  LineChart,
  MapPin,
  RefreshCw,
  Undo2,
  UserX,
  Users,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { AdminDashboardSummaryDto, AuditLogEntryDto, BookingStatusSummary, MonthlyRevenuePoint } from '@/types/admin';
import { StatusBadge, type StatusTone } from './StatusBadge';
import { AUDIT_ACTION, AUDIT_ENTITY, timeAgo } from './auditMeta';

export type OverviewTarget = 'accounts' | 'providers' | 'places' | 'finance' | 'bookings';

interface OverviewPanelProps {
  data: AdminDashboardSummaryDto | null;
  bookingSummary: BookingStatusSummary | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onNavigate: (tab: OverviewTarget) => void;
}

const ACTIVITY_POLL_MS = 30_000;

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const compactVnd = (n: number) =>
  n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)} tỷ` : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} tr` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : `${n}`;
const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export default function OverviewPanel({ data, bookingSummary, loading, error, onRetry, onNavigate }: OverviewPanelProps) {
  const [activity, setActivity] = useState<AuditLogEntryDto[] | null>(null);
  const [activityError, setActivityError] = useState(false);
  const [activityKey, setActivityKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Live Audit Feed: tải ngay và tự làm mới định kỳ.
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const rows = await adminService.getRecentActivity(8);
        if (!alive) return;
        setActivity(rows);
        setActivityError(false);
        setNow(Date.now());
      } catch {
        if (alive) setActivityError(true);
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), ACTIVITY_POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [activityKey]);

  const refreshAll = () => {
    onRetry();
    setActivityKey((k) => k + 1);
  };

  if (error && !data) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-white p-10 text-center shadow-sm">
        <AlertTriangle className="h-6 w-6 text-danger" />
        <p className="text-sm text-danger">Không tải được số liệu tổng quan. Vui lòng kiểm tra kết nối máy chủ.</p>
        <button type="button" onClick={refreshAll} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600">
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
  const bookingsConfirmed = bookingSummary ? bookingSummary.CONFIRMED + bookingSummary.COMPLETED : 0;
  const bookingsPending = bookingSummary ? bookingSummary.PENDING + bookingSummary.AWAITING_PAYMENT : 0;

  // ─── Cần xử lý ───
  const attention: { key: string; label: string; count: number; icon: ReactNode; tone: string; target: OverviewTarget }[] = [
    { key: 'unverified', label: 'Điểm đến chờ duyệt', count: data.unverifiedPlaces, icon: <MapPin className="h-3.5 w-3.5" />, tone: 'text-amber-700 bg-sun/15', target: 'places' },
    { key: 'bookings', label: 'Đơn đặt phòng chờ xử lý', count: bookingsPending, icon: <CalendarCheck className="h-3.5 w-3.5" />, tone: 'text-primary-700 bg-accent/15', target: 'bookings' },
    { key: 'needsUpdate', label: 'Điểm đến chờ NCC bổ sung', count: data.needsUpdatePlaces, icon: <MapPin className="h-3.5 w-3.5" />, tone: 'text-amber-700 bg-sun/15', target: 'places' },
    { key: 'suspended', label: 'NCC đang bị đình chỉ', count: data.suspendedProviders, icon: <Building2 className="h-3.5 w-3.5" />, tone: 'text-danger bg-danger/10', target: 'providers' },
    { key: 'refunds', label: 'Hoàn tiền chờ duyệt', count: data.pendingRefundsCount, icon: <Undo2 className="h-3.5 w-3.5" />, tone: 'text-secondary-700 bg-secondary/10', target: 'finance' },
    { key: 'locked', label: 'Tài khoản khách bị khóa', count: data.lockedTravelers, icon: <UserX className="h-3.5 w-3.5" />, tone: 'text-muted bg-canvas', target: 'accounts' },
  ];
  const openItems = attention.filter((a) => a.count > 0);

  // ─── Biểu đồ: doanh thu đối soát, rơi về GMV khi = 0đ ───
  const revenue = data.revenueTrend ?? [];
  const gmv = data.gmvTrend ?? [];
  const revenueEmpty = revenue.every((t) => t.totalAmount === 0);
  const usingGmv = revenueEmpty && gmv.some((t) => t.totalAmount > 0);
  const series = usingGmv ? gmv : revenue;
  const seriesTotal = series.reduce((a, t) => a + t.totalAmount, 0);

  return (
    <div className={`flex flex-col gap-4 transition-opacity duration-300 ${loading ? 'opacity-60' : ''}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<MapPin className="h-4 w-4" />}
          iconTone="bg-primary-50 text-primary"
          label="Điểm đến toàn sàn"
          value={data.totalPlaces}
          badge={data.unverifiedPlaces > 0 ? { tone: 'warning', text: `${data.unverifiedPlaces} chờ duyệt` } : { tone: 'success', text: 'Đã duyệt hết' }}
          progress={{ value: pct(reviewed, data.totalPlaces), label: 'đã kiểm duyệt', bar: 'bg-primary' }}
          onClick={() => onNavigate('places')}
        />
        <KpiCard
          icon={<Building2 className="h-4 w-4" />}
          iconTone="bg-secondary/10 text-secondary-700"
          label="Đối tác / NCC"
          value={data.totalProviders}
          badge={stoppedProviders > 0 ? { tone: 'danger', text: `${stoppedProviders} ngừng hoạt động` } : { tone: 'success', text: 'Tất cả hoạt động' }}
          progress={{ value: pct(data.activeProviders, data.totalProviders), label: 'đang hoạt động', bar: 'bg-secondary' }}
          onClick={() => onNavigate('providers')}
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          iconTone="bg-accent/10 text-primary-700"
          label="Khách du lịch"
          value={data.totalTravelers}
          badge={data.newTravelers7d > 0 ? { tone: 'success', text: `+${data.newTravelers7d} tuần này`, up: true } : { tone: 'neutral', text: `+${data.newTravelers30d} trong 30 ngày` }}
          progress={{ value: pct(activeTravelers, data.totalTravelers), label: 'đang hoạt động', bar: 'bg-accent' }}
          onClick={() => onNavigate('accounts')}
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
          onClick={() => onNavigate('bookings')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Doanh thu / GMV 6 tháng */}
        <section className="rounded-lg border border-border bg-white shadow-sm xl:col-span-2" aria-label="Doanh thu 6 tháng gần nhất">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-ink-deep">
                  {usingGmv ? 'Giá trị đặt phòng (GMV) 6 tháng' : 'Doanh thu đối soát 6 tháng'}
                </h3>
                {usingGmv && <StatusBadge tone="warning">Chưa đối soát</StatusBadge>}
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                {usingGmv
                  ? 'Doanh thu đối soát đang là 0đ — hiển thị tổng giá trị các đơn chưa hủy để theo dõi xu hướng.'
                  : 'Tổng giao dịch thanh toán thành công theo tháng.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Tổng kỳ</div>
                <div className="font-display text-base font-bold tabular-nums text-ink-deep">{vnd.format(seriesTotal)}</div>
              </div>
              <button type="button" onClick={refreshAll} aria-label="Tải lại" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-primary/40 hover:text-primary">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </header>
          <div className="px-4 pb-3 pt-4">
            {seriesTotal === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center gap-2 text-center text-xs text-muted">
                <LineChart className="h-6 w-6 text-primary-300" />
                Chưa có doanh thu hay đơn đặt phòng trong 6 tháng qua.
              </div>
            ) : (
              <AreaChart points={series} tone={usingGmv ? 'sun' : 'primary'} unitLabel={usingGmv ? 'đơn' : 'giao dịch'} />
            )}
          </div>
        </section>

        {/* Cột phải: Cần xử lý + Live Audit Feed */}
        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-white shadow-sm" aria-label="Cần xử lý">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-display text-sm font-bold text-ink-deep">Cần xử lý</h3>
              <span className="rounded bg-canvas px-1.5 py-px text-[10px] font-bold tabular-nums text-muted">{openItems.length}</span>
            </header>
            {openItems.length === 0 ? (
              <p className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-muted">
                <Inbox className="h-4 w-4" /> Không có việc tồn đọng.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {openItems.map((a) => (
                  <li key={a.key}>
                    <button
                      type="button"
                      onClick={() => onNavigate(a.target)}
                      className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-200 hover:bg-canvas"
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${a.tone}`}>{a.icon}</span>
                      <span className="flex-1 text-xs text-ink">{a.label}</span>
                      <strong className="text-sm tabular-nums text-ink-deep">{a.count}</strong>
                      <ChevronRight className="h-4 w-4 text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-white shadow-sm" aria-label="Hoạt động gần đây">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-bold text-ink-deep">Hoạt động gần đây</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Trực tiếp
              </span>
            </header>
            {activityError && !activity ? (
              <p className="px-4 py-6 text-center text-xs text-danger">Không tải được nhật ký hoạt động.</p>
            ) : !activity ? (
              <div className="flex flex-col gap-2 p-4" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-9 animate-pulse rounded-md bg-canvas" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted">Chưa có thao tác nào được ghi nhận.</p>
            ) : (
              <ol className="relative flex flex-col px-4 py-3">
                {activity.map((e, i) => {
                  const meta = AUDIT_ACTION[e.action] ?? { label: e.action, tone: 'neutral' as StatusTone };
                  return (
                    <li key={e.id} className="relative flex gap-3 pb-3 last:pb-0 rise-in">
                      {i < activity.length - 1 && <span aria-hidden className="absolute left-[5px] top-3 h-full w-px bg-border" />}
                      <span className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full ring-2 ring-white ${DOT[meta.tone]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-snug text-ink">
                          <strong className="font-semibold text-ink-deep">{e.actorName}</strong> · {meta.label}
                          {e.entityType && e.entityId != null && (
                            <span className="text-muted"> — {AUDIT_ENTITY[e.entityType] ?? e.entityType} #{e.entityId}</span>
                          )}
                        </p>
                        {e.reason && <p className="truncate text-[11px] text-muted" title={e.reason}>“{e.reason}”</p>}
                        <p className="text-[10px] text-muted/80">{timeAgo(e.createdAt, now)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const DOT: Record<StatusTone, string> = {
  success: 'bg-accent',
  warning: 'bg-sun',
  danger: 'bg-danger',
  info: 'bg-secondary',
  brand: 'bg-primary',
  neutral: 'bg-muted/50',
};

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
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)]"
    >
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
    </button>
  );
}

/** Biểu đồ vùng SVG thuần (không thêm thư viện), co giãn theo chiều ngang. */
function AreaChart({ points, tone, unitLabel }: { points: MonthlyRevenuePoint[]; tone: 'primary' | 'sun'; unitLabel: string }) {
  const W = 600;
  const H = 180;
  const PAD_T = 18;
  const PAD_B = 6;
  const max = Math.max(1, ...points.map((p) => p.totalAmount));
  const step = points.length > 1 ? W / (points.length - 1) : W;
  const xy = points.map((p, i) => ({
    x: points.length > 1 ? i * step : W / 2,
    y: PAD_T + (1 - p.totalAmount / max) * (H - PAD_T - PAD_B),
    p,
  }));
  const line = xy.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const color = tone === 'sun' ? 'var(--color-sun)' : 'var(--color-primary)';
  const gradId = `area-${tone}`;

  return (
    <div>
      <div className="relative h-48">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Biểu đồ theo tháng">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.28 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1="0" x2={W} y1={PAD_T + (1 - f) * (H - PAD_T - PAD_B)} y2={PAD_T + (1 - f) * (H - PAD_T - PAD_B)} className="stroke-border" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill={`url(#${gradId})`} />
          <path d={line} fill="none" style={{ stroke: color }} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* Điểm + nhãn giá trị dạng HTML để không bị méo theo preserveAspectRatio */}
        {xy.map(({ x, y, p }) => (
          <div
            key={`${p.year}-${p.month}`}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
            title={`T${p.month}/${p.year}: ${vnd.format(p.totalAmount)} · ${p.transactionCount} ${unitLabel}`}
          >
            <span
              className="block h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm transition-transform duration-200 group-hover:scale-150"
              style={{ backgroundColor: color }}
            />
            {p.totalAmount > 0 && (
              <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums text-ink">
                {compactVnd(p.totalAmount)}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="relative mt-2 h-4 text-[11px] text-muted">
        {xy.map(({ x, p }, i) => (
          <span
            key={`${p.year}-${p.month}`}
            className={`absolute top-0 whitespace-nowrap ${i === 0 ? '' : i === xy.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: `${(x / W) * 100}%` }}
          >
            T{p.month}/{String(p.year).slice(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
