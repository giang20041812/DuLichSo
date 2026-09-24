import type { ReactNode } from 'react';
import { AlertTriangle, Building2, ChevronRight, MapPin, RefreshCw, Undo2, UserPlus, Users, Wallet } from 'lucide-react';
import type { AdminDashboardSummaryDto } from '@/types/admin';

export type OverviewTarget = 'accounts' | 'providers' | 'places' | 'finance';

interface OverviewPanelProps {
  data: AdminDashboardSummaryDto | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onNavigate: (tab: OverviewTarget) => void;
}

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const compactVnd = (n: number) =>
  n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)} tỷ` : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} tr` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : `${n}`;

export default function OverviewPanel({ data, loading, error, onRetry, onNavigate }: OverviewPanelProps) {
  if (error && !data) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 p-8 text-center">
        <AlertTriangle className="h-6 w-6 text-danger" />
        <p className="text-sm text-danger">Không tải được số liệu tổng quan. Vui lòng kiểm tra kết nối máy chủ.</p>
        <button type="button" onClick={onRetry} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600">
          Thử lại
        </button>
      </div>
    );
  }
  if (!data) {
    return <div className="rounded-lg border border-border bg-white p-10 text-center text-sm text-muted">Đang tải số liệu...</div>;
  }

  const attention: { key: string; label: string; count: number; icon: ReactNode; tone: string; target: OverviewTarget }[] = [
    { key: 'unverified', label: 'Điểm đến chờ duyệt', count: data.unverifiedPlaces, icon: <MapPin className="h-4 w-4" />, tone: 'text-amber-700 bg-amber-50', target: 'places' },
    { key: 'needsUpdate', label: 'Điểm đến cần NCC bổ sung', count: data.needsUpdatePlaces, icon: <MapPin className="h-4 w-4" />, tone: 'text-amber-700 bg-amber-50', target: 'places' },
    { key: 'suspended', label: 'NCC đang bị đình chỉ', count: data.suspendedProviders, icon: <Building2 className="h-4 w-4" />, tone: 'text-coral bg-coral-light', target: 'providers' },
    { key: 'refunds', label: 'Yêu cầu hoàn tiền chờ xử lý', count: data.pendingRefundsCount, icon: <Undo2 className="h-4 w-4" />, tone: 'text-secondary-700 bg-secondary-50', target: 'finance' },
  ];
  const openItems = attention.filter((a) => a.count > 0);

  const trend = data.revenueTrend ?? [];
  const maxRevenue = Math.max(1, ...trend.map((t) => t.totalAmount));

  return (
    <div className={`flex flex-col gap-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      {/* Chỉ số chính */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<MapPin className="h-5 w-5" />} tone="bg-primary-50 text-primary" label="Điểm đến toàn sàn" value={data.totalPlaces} sub={`${data.unverifiedPlaces} chờ duyệt`} onClick={() => onNavigate('places')} />
        <StatCard icon={<Building2 className="h-5 w-5" />} tone="bg-secondary-50 text-secondary-700" label="Đối tác / NCC" value={data.totalProviders} sub={`${data.activeProviders} hoạt động · ${data.suspendedProviders} đình chỉ · ${data.terminatedProviders} chấm dứt`} onClick={() => onNavigate('providers')} />
        <StatCard icon={<Users className="h-5 w-5" />} tone="bg-purple-50 text-purple-700" label="Khách du lịch" value={data.totalTravelers} sub={`+${data.newTravelers7d} tuần này · +${data.newTravelers30d} trong 30 ngày`} onClick={() => onNavigate('accounts')} />
        <StatCard icon={<Wallet className="h-5 w-5" />} tone="bg-sun-light text-sun" label="Đặt phòng tháng này" value={`${data.monthlyBookingsCount} lượt`} sub={vnd.format(data.monthlyRevenue ?? 0)} onClick={() => onNavigate('finance')} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Doanh thu 6 tháng */}
        <section className="rounded-lg border border-border bg-white p-4 shadow-xs lg:col-span-2" aria-label="Doanh thu 6 tháng gần nhất">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink-deep">Doanh thu 6 tháng gần nhất</h3>
            <button type="button" onClick={onRetry} aria-label="Tải lại" className="text-muted hover:text-primary">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {trend.every((t) => t.totalAmount === 0) ? (
            <p className="py-10 text-center text-xs text-muted">Chưa có doanh thu trong 6 tháng qua.</p>
          ) : (
            <div className="flex h-44 items-end gap-3">
              {trend.map((t) => (
                <div key={`${t.year}-${t.month}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${t.month}/${t.year}: ${vnd.format(t.totalAmount)} (${t.transactionCount} giao dịch)`}>
                  <span className="text-[10px] font-semibold text-muted">{compactVnd(t.totalAmount)}</span>
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-primary to-primary-400 transition-all duration-300"
                    style={{ height: `${Math.max(4, (t.totalAmount / maxRevenue) * 100)}%` }}
                  />
                  <span className="text-[11px] text-muted">T{t.month}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cần xử lý */}
        <section className="rounded-lg border border-border bg-white p-4 shadow-xs" aria-label="Cần xử lý">
          <h3 className="mb-3 font-display text-sm font-bold text-ink-deep">Cần xử lý</h3>
          {openItems.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">Không có việc tồn đọng. 🎉</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {openItems.map((a) => (
                <li key={a.key}>
                  <button
                    type="button"
                    onClick={() => onNavigate(a.target)}
                    className="flex w-full items-center gap-3 rounded-md border border-border p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-hover"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${a.tone}`}>{a.icon}</span>
                    <span className="flex-1 text-xs text-ink">{a.label}</span>
                    <strong className="text-sm text-ink-deep">{a.count}</strong>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data.lockedTravelers > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
              <UserPlus className="h-3.5 w-3.5" /> {data.lockedTravelers} tài khoản khách đang bị khóa
            </p>
          )}
        </section>
      </div>

      <p className="rounded-lg border border-border bg-white p-4 text-xs leading-relaxed text-muted shadow-xs">
        Mọi thao tác đổi trạng thái, duyệt điểm đến và hoàn tiền đều được ghi vào <strong className="text-ink">Audit Log</strong> để truy vết.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  tone,
  label,
  value,
  sub,
  onClick,
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: number | string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3.5 rounded-lg border border-border bg-white p-4 text-left shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${tone}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
        <span className="block font-display text-xl font-extrabold text-ink-deep">{value}</span>
        <span className="block text-[11px] leading-snug text-muted">{sub}</span>
      </span>
    </button>
  );
}
