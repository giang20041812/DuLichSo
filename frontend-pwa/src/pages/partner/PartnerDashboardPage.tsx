import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarCheck,
  Clock,
  Home,
  LineChart,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Star,
  TrendingUp,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { partnerDashboardService, type PartnerDashboardSummaryDto, type MonthlyRevenuePoint } from '@/services/partnerDashboardService';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral';

const BADGE_TONE: Record<StatusTone, string> = {
  success: 'bg-accent/10 text-primary-700',
  warning: 'bg-sun/15 text-amber-700',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-secondary/10 text-secondary-700',
  brand: 'bg-primary-50 text-primary',
  neutral: 'bg-canvas text-muted',
};

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const compactVnd = (n: number) =>
  n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)} tỷ` : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} tr` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : `${n}`;

export default function PartnerDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PartnerDashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    const fetch = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await partnerDashboardService.getSummary();
        if (alive) setData(res);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void fetch();
    return () => { alive = false; };
  }, [refreshKey]);

  if (error && !data) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 p-10 text-center shadow-[var(--shadow-card)]">
        <AlertTriangle className="h-6 w-6 text-danger" />
        <p className="text-sm text-danger">Không tải được số liệu tổng quan. Vui lòng kiểm tra kết nối máy chủ.</p>
        <button type="button" onClick={() => setRefreshKey(k => k + 1)} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-teal)] hover:bg-primary-600">
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

  const seriesTotal = data.revenueTrend.reduce((acc, pt) => acc + pt.totalAmount, 0);
  const bookingsTotal = data.completedBookings + data.pendingBookings + data.cancelledBookings;
  const PIE_DATA = [
    { name: 'Hoàn thành', value: data.completedBookings, color: '#10B981' }, // success/accent
    { name: 'Chờ xử lý', value: data.pendingBookings, color: '#F59E0B' }, // warning/sun
    { name: 'Đã hủy', value: data.cancelledBookings, color: '#EF4444' }, // danger
  ].filter(d => d.value > 0);

  return (
    <div className={`flex flex-col gap-4 transition-opacity duration-300 ${loading ? 'opacity-60' : ''}`}>
      {/* KPI Cards (Giống Admin) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Banknote className="h-4 w-4" />}
          iconTone="bg-primary-50 text-primary"
          label="Doanh thu tháng này"
          value={vnd.format(data.monthlyRevenue)}
          badge={{ tone: 'success', text: `Tăng trưởng ổn định`, up: true }}
          progress={null}
          onClick={() => {}}
        />
        <KpiCard
          icon={<CalendarCheck className="h-4 w-4" />}
          iconTone="bg-secondary/10 text-secondary-700"
          label="Đơn đặt tháng này"
          value={data.monthlyBookingsCount}
          badge={data.pendingBookings > 0 ? { tone: 'warning', text: `${data.pendingBookings} đơn chờ xử lý` } : { tone: 'success', text: 'Đã xử lý hết' }}
          progress={{ value: bookingsTotal > 0 ? Math.round((data.completedBookings / bookingsTotal) * 100) : 0, label: 'hoàn thành', bar: 'bg-secondary' }}
          onClick={() => navigate('/partner/bookings')}
        />
        <KpiCard
          icon={<Star className="h-4 w-4" />}
          iconTone="bg-sun/15 text-amber-700"
          label="Điểm đánh giá"
          value={`${data.averageRating}/5`}
          badge={{ tone: 'neutral', text: `Dựa trên ${data.totalReviews} đánh giá` }}
          progress={{ value: (data.averageRating / 5) * 100, label: 'sự hài lòng', bar: 'bg-sun' }}
          onClick={() => navigate('/partner/reviews')}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          iconTone="bg-accent/10 text-primary-700"
          label="Tỷ lệ lấp đầy"
          value={`${data.occupancyRate}%`}
          badge={{ tone: 'brand', text: 'Dự kiến tháng này' }}
          progress={{ value: data.occupancyRate, label: 'công suất', bar: 'bg-accent' }}
          onClick={() => navigate('/partner/homestays')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Doanh thu 12 tháng */}
        <section className="rounded-lg border border-primary/10 bg-surface shadow-[var(--shadow-card)] xl:col-span-2" aria-label="Doanh thu 12 tháng">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-primary/10 px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-ink-deep">Doanh thu 12 tháng gần nhất</h3>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                Tổng doanh thu từ các đơn đặt phòng đã hoàn thành theo tháng.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Tổng 12 tháng</div>
                <div className="font-display text-base font-bold tabular-nums text-ink-deep">{vnd.format(seriesTotal)}</div>
              </div>
              <button type="button" onClick={() => setRefreshKey(k => k + 1)} aria-label="Tải lại" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-primary/40 hover:text-primary">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </header>
          <div className="px-4 pb-3 pt-4">
            {seriesTotal === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center gap-2 text-center text-xs text-muted">
                <LineChart className="h-6 w-6 text-primary-300" />
                Chưa có doanh thu trong 12 tháng qua.
              </div>
            ) : (
              <AreaChart points={data.revenueTrend} tone="primary" unitLabel="đơn" />
            )}
          </div>
        </section>

        {/* Trạng thái đơn */}
        <section className="rounded-lg border border-primary/10 bg-surface shadow-[var(--shadow-card)]">
          <header className="flex items-center justify-between border-b border-primary/10 px-5 py-4">
            <h3 className="font-display text-sm font-bold text-ink-deep">Trạng thái đơn (YTD)</h3>
          </header>
          <div className="px-4 py-6">
            <div className="h-40 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {PIE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent"></span> Hoàn thành</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sun"></span> Chờ xử lý</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-danger"></span> Đã hủy</div>
            </div>
            <div className="mt-5 border-t border-border pt-4 text-center">
              <p className="text-sm font-semibold text-ink-deep">Tổng số: {bookingsTotal} đơn</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Đơn đặt phòng mới */}
        <section className="rounded-lg border border-primary/10 bg-surface shadow-[var(--shadow-card)] xl:col-span-2 overflow-hidden">
          <header className="flex items-center justify-between border-b border-primary/10 px-5 py-4">
            <h3 className="font-display text-sm font-bold text-ink-deep">Đơn đặt phòng mới nhất</h3>
            <button onClick={() => navigate('/partner/bookings')} className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </button>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5">Mã đơn</th>
                  <th className="px-4 py-2.5">Khách hàng</th>
                  <th className="px-4 py-2.5">Homestay</th>
                  <th className="px-4 py-2.5">Nhận phòng</th>
                  <th className="px-4 py-2.5 text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {data.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-muted">Chưa có đơn đặt phòng nào gần đây.</td>
                  </tr>
                ) : (
                  data.recentBookings.map((booking) => (
                    <tr key={booking.bookingCode} className="transition-colors duration-150 hover:bg-canvas">
                      <td className="px-4 py-2.5 font-mono font-semibold text-primary">{booking.bookingCode}</td>
                      <td className="px-4 py-2.5 font-semibold text-ink-deep">{booking.guestName}</td>
                      <td className="max-w-[180px] truncate px-4 py-2.5 text-muted" title={booking.homestayName}>{booking.homestayName}</td>
                      <td className="px-4 py-2.5 text-ink">{new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-ink-deep">{vnd.format(booking.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Hành động nhanh */}
        <section className="rounded-lg border border-primary/10 bg-surface shadow-[var(--shadow-card)]">
          <header className="border-b border-primary/10 px-5 py-4">
            <h3 className="font-display text-sm font-bold text-ink-deep">Lối tắt thao tác</h3>
          </header>
          <div className="p-4 flex flex-col gap-3">
            <QuickActionBtn icon={Home} title="Quản lý Homestay" desc="Cập nhật thông tin, tiện nghi" onClick={() => navigate('/partner/homestays')} />
            <QuickActionBtn icon={PlusCircle} title="Thêm Homestay mới" desc="Tạo cơ sở lưu trú mới" onClick={() => navigate('/partner/homestay/create')} />
            <QuickActionBtn icon={Clock} title="Cập nhật Lịch phòng" desc="Đóng/mở phòng, tùy chỉnh giá" onClick={() => navigate('/partner/homestays')} />
            <QuickActionBtn icon={MessageSquare} title="Đánh giá của khách" desc="Đọc và phản hồi đánh giá" onClick={() => navigate('/partner/reviews')} />
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ icon, iconTone, label, value, badge, progress, onClick }: {
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
      className="group flex flex-col gap-3 rounded-lg border border-primary/10 bg-surface p-5 text-left shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)]"
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

function QuickActionBtn({ icon: Icon, title, desc, onClick }: { icon: any, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="group flex items-start gap-3 rounded-md border border-primary/10 p-3 text-left transition-all hover:border-primary/40 hover:bg-primary-50/50 hover:shadow-sm"
    >
      <div className="rounded-md bg-primary-50 p-2 text-primary shadow-sm border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-bold text-ink-deep">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted">{desc}</p>
      </div>
    </button>
  );
}

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
