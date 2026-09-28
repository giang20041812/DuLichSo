import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  LineChart,
  RefreshCw,
  Star,
  Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { fetchPartnerHomestays } from '@/services/partnerHomestayService';
import { fetchPartnerChangeRequests } from '@/services/changeRequestService';
import { partnerDashboardService, type PartnerDashboardSummaryDto, type MonthlyRevenuePoint } from '@/services/partnerDashboardService';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE } from '@/lib/bookingStatus';
import type { PartnerHomestaySummaryDto } from '@/types/partner';
import type { ChangeRequestSummary } from '@/types/changeRequest';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const compactVnd = (n: number) =>
  n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)} tỷ` : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} tr` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : `${n}`;

export default function PartnerDashboardPage() {
  const navigate = useNavigate();
  
  // Global filter
  const [filterHomestayId, setFilterHomestayId] = useState<number | undefined>(undefined);
  const [homestays, setHomestays] = useState<PartnerHomestaySummaryDto[]>([]);

  // Separate filters
  const [chartYear, setChartYear] = useState<number>(2026);
  const [kpiMonth, setKpiMonth] = useState<number>(new Date().getMonth() + 1);
  const [kpiYear, setKpiYear] = useState<number>(2026);

  // Separate data states to ensure independent loading
  const [chartData, setChartData] = useState<PartnerDashboardSummaryDto | null>(null);
  const [kpiData, setKpiData] = useState<PartnerDashboardSummaryDto | null>(null);

  const [loadingChart, setLoadingChart] = useState(true);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pending change requests
  const [pendingRequests, setPendingRequests] = useState<ChangeRequestSummary[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchH = async () => {
      try {
        const res = await fetchPartnerHomestays();
        if (alive) setHomestays(res.homestays || []);
      } catch (err) {
        console.error(err);
      }
    };
    void fetchH();

    const fetchReq = async () => {
      try {
        setLoadingRequests(true);
        const reqs = await fetchPartnerChangeRequests('PENDING', 0, 5); // Fetch top 5 pending
        if (alive) setPendingRequests(reqs.content || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoadingRequests(false);
      }
    };
    void fetchReq();
    
    return () => { alive = false; };
  }, []);

  // Fetch Chart Data (depends on chartYear and filterHomestayId)
  useEffect(() => {
    let alive = true;
    const fetch = async () => {
      try {
        setLoadingChart(true);
        const res = await partnerDashboardService.getSummary(chartYear, undefined, filterHomestayId);
        if (alive) setChartData(res);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoadingChart(false);
      }
    };
    void fetch();
    return () => { alive = false; };
  }, [refreshKey, chartYear, filterHomestayId]);

  // Fetch KPI Data (depends on kpiMonth, kpiYear, and filterHomestayId)
  useEffect(() => {
    let alive = true;
    const fetch = async () => {
      try {
        setLoadingKpi(true);
        const res = await partnerDashboardService.getSummary(kpiYear, kpiMonth, filterHomestayId);
        if (alive) setKpiData(res);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoadingKpi(false);
      }
    };
    void fetch();
    return () => { alive = false; };
  }, [refreshKey, kpiMonth, kpiYear, filterHomestayId]);

  if (error && !kpiData && !chartData) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10 text-center">
        <AlertTriangle className="h-6 w-6 text-danger" />
        <p className="text-sm text-danger">Không tải được số liệu tổng quan. Vui lòng kiểm tra kết nối máy chủ.</p>
        <button type="button" onClick={() => setRefreshKey(k => k + 1)} className="rounded-md bg-ink px-4 py-2 text-xs font-semibold text-white">
          Thử lại
        </button>
      </div>
    );
  }

  if (!kpiData || !chartData) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[132px] animate-pulse rounded-lg border border-border bg-white" />
        ))}
      </div>
    );
  }

  const seriesTotal = chartData.revenueTrend.reduce((acc, pt) => acc + pt.totalAmount, 0);

  const pieData = [
    { name: 'Hoàn thành', value: kpiData.completedBookings, color: 'var(--color-accent)' },
    { name: 'Bị hủy', value: kpiData.cancelledBookings, color: 'var(--color-danger)' },
    { name: 'Từ chối', value: kpiData.rejectedBookings, color: 'var(--color-sun)' }
  ].filter(d => d.value > 0);
  
  const totalProcessedBookings = kpiData.completedBookings + kpiData.cancelledBookings + kpiData.rejectedBookings;

  const actionableBookings = kpiData.recentBookings.filter(b => ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'].includes(b.status));

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header: Filter & Rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        {/* Filter Form */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <select 
            value={filterHomestayId || ''} 
            onChange={(e) => setFilterHomestayId(e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 px-3 text-sm border border-border rounded-md bg-white focus:outline-none focus:border-primary font-semibold min-w-[200px]"
          >
            <option value="">Tất cả homestay</option>
            {homestays.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        {/* Rating Button */}
        <div 
          className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity pl-2 sm:border-l sm:border-border" 
          onClick={() => navigate('/partner/reviews')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-sun/30 bg-sun/10 text-sun-700">
            <Star className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold leading-none text-ink-deep">{kpiData.averageRating}/5</span>
            <span className="text-sm text-muted font-medium">({kpiData.totalReviews} đánh giá)</span>
          </div>
        </div>
      </div>



      {/* Charts Section */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Doanh thu */}
        <div className={`rounded-lg border border-border bg-surface xl:col-span-2 transition-opacity duration-300 ${loadingChart ? 'opacity-60' : ''}`} aria-label="Doanh thu">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-ink-deep">Doanh thu năm:</h3>
                <select 
                  value={chartYear} 
                  onChange={(e) => setChartYear(Number(e.target.value))}
                  className="h-8 px-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:border-primary font-semibold"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Tổng doanh thu từ các đơn đặt phòng đã hoàn thành theo tháng.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Tổng doanh thu năm</div>
                <div className="text-base font-bold tabular-nums text-primary">{vnd.format(seriesTotal)}</div>
              </div>
              <button type="button" onClick={() => setRefreshKey(k => k + 1)} aria-label="Tải lại" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-primary/5 hover:border-primary/30 hover:text-primary-700">
                <RefreshCw className={`h-3.5 w-3.5 ${loadingChart ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </header>
          <div className="px-4 pb-3 pt-4">
            {seriesTotal === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center gap-2 text-center text-xs text-muted">
                <LineChart className="h-6 w-6 text-muted" />
                Chưa có doanh thu trong năm này.
              </div>
            ) : (
              <AreaChart points={chartData.revenueTrend} />
            )}
          </div>
        </div>

        {/* Trạng thái đơn tháng */}
        <div className={`rounded-lg border border-border bg-surface flex flex-col transition-opacity duration-300 ${loadingKpi ? 'opacity-60' : ''}`}>
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h3 className="text-sm font-bold text-ink-deep">Trạng thái đơn:</h3>
            <div className="flex items-center gap-2">
              <select 
                value={kpiMonth} 
                onChange={(e) => setKpiMonth(Number(e.target.value))}
                className="h-8 px-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:border-primary font-semibold"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <select 
                value={kpiYear} 
                onChange={(e) => setKpiYear(Number(e.target.value))}
                className="h-8 px-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:border-primary font-semibold"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </header>
          <div className="flex-1 px-4 py-6 flex flex-col">
            {totalProcessedBookings === 0 ? (
              <div className="mb-4 flex flex-1 flex-col items-center justify-center gap-2 text-center text-xs text-muted">
                <CalendarCheck className="h-6 w-6 text-muted" />
                Chưa có dữ liệu xử lý trong tháng này.
              </div>
            ) : (
            <div className="mb-4 flex-1 w-full min-h-[160px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', fontSize: '12px', background: 'var(--color-surface)', padding: '6px 10px' }}
                    itemStyle={{ color: 'var(--color-ink-deep)', fontWeight: 600, padding: 0 }}
                    formatter={(value: any, name: any) => [
                      `${value} đơn (${((value / totalProcessedBookings) * 100).toFixed(1)}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            )}
            <div className="flex justify-center flex-wrap gap-4 text-[11px] font-semibold text-ink-deep">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent"></span> Hoàn thành: {kpiData.completedBookings}</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-danger"></span> Bị hủy: {kpiData.cancelledBookings}</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-sun"></span> Từ chối: {kpiData.rejectedBookings}</div>
            </div>
            <div className="mt-5 border-t border-border pt-4 text-center">
              <p className="text-sm font-semibold text-ink-deep">
                Tổng cộng: {totalProcessedBookings + kpiData.pendingBookings} đơn
                {kpiData.pendingBookings > 0 && <span className="text-muted ml-1 font-normal">({kpiData.pendingBookings} đơn chờ xử lý)</span>}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Row: Bookings and Change Requests */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Đơn đặt phòng mới */}
        <div className={`rounded-lg border border-border bg-surface overflow-hidden transition-opacity duration-300 xl:col-span-2 flex flex-col ${loadingKpi ? 'opacity-60' : ''}`}>
          <header className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
            <h3 className="text-sm font-bold text-ink-deep">Đơn đặt phòng cần xử lý</h3>
            <button onClick={() => navigate('/partner/bookings')} className="text-[11px] font-semibold text-primary-700 hover:text-primary-800 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </button>
          </header>
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 whitespace-nowrap">Mã đơn</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Khách hàng</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Homestay</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Nhận phòng</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Trạng thái</th>
                  <th className="px-4 py-2.5 text-right whitespace-nowrap">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {actionableBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted">Không có đơn đặt phòng nào cần xử lý.</td>
                  </tr>
                ) : (
                  actionableBookings.map((booking) => (
                    <tr key={booking.bookingCode} className="transition-colors duration-150 hover:bg-canvas">
                      <td className="px-4 py-2.5 font-mono font-semibold text-primary-700">{booking.bookingCode}</td>
                      <td className="px-4 py-2.5 font-semibold text-ink-deep whitespace-nowrap">{booking.guestName}</td>
                      <td className="max-w-[150px] truncate px-4 py-2.5 text-muted" title={booking.homestayName}>{booking.homestayName}</td>
                      <td className="px-4 py-2.5 text-ink whitespace-nowrap">{new Date(booking.checkInDate).toLocaleDateString('vi-VN')}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap"><span className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold ${BOOKING_STATUS_TONE[booking.status as keyof typeof BOOKING_STATUS_TONE]}`}>{BOOKING_STATUS_LABEL[booking.status as keyof typeof BOOKING_STATUS_LABEL]}</span></td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-ink-deep whitespace-nowrap">{vnd.format(booking.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Yêu cầu chưa duyệt */}
        <div className="rounded-lg border border-warning/50 bg-warning/5 overflow-hidden flex flex-col h-full xl:col-span-1">
          <header className="flex items-center justify-between border-b border-warning/30 px-5 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-bold text-ink-deep">Yêu cầu chưa được duyệt</h3>
            </div>
            <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-bold text-warning-700">
              {pendingRequests.length} yêu cầu
            </span>
          </header>
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-warning/20 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-2">Loại</th>
                  <th className="px-5 py-2">Mục tiêu</th>
                  <th className="px-5 py-2">HĐ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warning/10">
                {loadingRequests ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-muted">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto text-warning" />
                    </td>
                  </tr>
                ) : pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-muted">
                      Không có.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map(req => (
                    <tr key={req.id}>
                      <td className="px-5 py-3 font-semibold text-ink-deep whitespace-nowrap">
                        {req.targetType === 'HOMESTAY' ? 'Homestay' : req.targetType === 'ROOM_TYPE' ? 'Phòng' : 'Giá'}
                      </td>
                      <td className="px-5 py-3 text-muted max-w-[120px] truncate" title={req.targetName}>{req.targetName}</td>
                      <td className="px-5 py-3 font-medium text-ink whitespace-nowrap">
                        {req.operation === 'CREATE' ? 'Tạo' : req.operation === 'UPDATE' ? 'Sửa' : 'Xóa'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}



function AreaChart({ points }: { points: MonthlyRevenuePoint[] }) {
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
  const color = 'var(--color-primary)';
  const gradId = `area-chart-fill`;

  return (
    <div>
      <div className="relative h-48">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Biểu đồ theo tháng">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.15 }} />
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
            title={`T${p.month}/${p.year}: ${vnd.format(p.totalAmount)} · ${p.transactionCount} đơn hoàn thành`}
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
            T{p.month}
          </span>
        ))}
      </div>
    </div>
  );
}
