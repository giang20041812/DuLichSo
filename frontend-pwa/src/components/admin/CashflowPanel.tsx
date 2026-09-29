import { useCallback, useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/lib/apiError';
import type { CashflowLevel, CashflowReport } from '@/types/cashflow';
import type { BookingsPreset } from './BookingsPanel';
import { CompactDateRange, CompactSelect, FilterSearch, RefreshButton, SortSelect, TableFooter, type SelectOption, type SortOption } from './AdminFilters';

const PAGE_SIZE = 10;
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const LEVEL_OPTIONS: SelectOption<CashflowLevel>[] = [
  { value: 'PROVIDER', label: 'Theo nhà cung cấp' },
  { value: 'PLACE', label: 'Theo Homestay' },
];
const SORT_OPTIONS: SortOption[] = [
  { value: 'net:desc', label: 'Ròng cao nhất' },
  { value: 'net:asc', label: 'Ròng thấp nhất' },
  { value: 'paid:desc', label: 'Thu nhiều nhất' },
  { value: 'refunded:desc', label: 'Hoàn nhiều nhất' },
  { value: 'pending:desc', label: 'Chờ hoàn nhiều nhất' },
  { value: 'name:asc', label: 'Tên A → Z' },
];

/** Dòng tiền của từng nhà cung cấp / Homestay: tiền thu (thanh toán thành công), tiền hoàn, chờ hoàn và số dư ròng theo kỳ. */
interface CashflowPanelProps {
  /** Bấm một dòng để mở danh sách đơn đặt phòng của NCC/Homestay đó (FR-AD-14). */
  onDrill?: (preset: BookingsPreset) => void;
}

export default function CashflowPanel({ onDrill }: CashflowPanelProps) {
  const [level, setLevel] = useState<CashflowLevel | ''>('PROVIDER');
  const [keyword, setKeyword] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('net:desc');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<CashflowReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);

  const debouncedKeyword = useDebouncedValue(keyword);
  const activeLevel: CashflowLevel = level || 'PROVIDER';
  const activeCount = [debouncedKeyword, from || to].filter(Boolean).length;

  /** Nút tải lại: đưa màn hình về trạng thái ban đầu (bỏ mọi điều kiện tìm kiếm / lọc / sắp xếp, về tab mặc định, trang 1) rồi tải lại dữ liệu mới nhất. */
  const reloadFromStart = () => {
    setLevel('PROVIDER');
    setKeyword('');
    setFrom('');
    setTo('');
    setSort('net:desc');
    setPage(0);
    setReload((n) => n + 1);
  };

  const load = useCallback(async () => {
    const [sortBy, sortDir] = sort.split(':') as [string, 'asc' | 'desc'];
    setLoading(true);
    setLoadError('');
    try {
      setData(
        await adminService.getCashflow({
          level: activeLevel,
          keyword: debouncedKeyword.trim() || undefined,
          from: from || undefined,
          to: to || undefined,
          sortBy,
          sortDir,
          page,
          size: PAGE_SIZE,
        }),
      );
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Không tải được dữ liệu dòng tiền. Vui lòng kiểm tra kết nối máy chủ và thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [activeLevel, debouncedKeyword, from, to, sort, page]);

  useEffect(() => {
    void load();
  }, [load, reload]);

  const rows = data?.rows.content ?? [];
  const totals = data?.totals;
  const th = 'px-4 py-2.5';
  const td = 'px-4 py-2.5';

  return (
    <section className="rounded-lg border border-border bg-white shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-bold text-ink-deep">Dòng tiền nhà cung cấp / Homestay</h3>
        {data && (
          <span className="text-[11px] text-muted">
            Kỳ {new Date(data.from).toLocaleDateString('vi-VN')} – {new Date(data.to).toLocaleDateString('vi-VN')} · thu theo ngày thanh toán, hoàn theo ngày xử lý
          </span>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <FilterSearch
          value={keyword}
          onChange={(v) => {
            setKeyword(v);
            setPage(0);
          }}
          placeholder="Tìm theo tên nhà cung cấp hoặc Homestay..."
        />
        <CompactSelect
          label="Nhóm theo"
          value={level}
          options={LEVEL_OPTIONS}
          onChange={(v) => {
            setLevel(v);
            setPage(0);
          }}
        />
        <CompactDateRange
          label="Kỳ báo cáo"
          from={from}
          to={to}
          onChange={(f, t) => {
            setFrom(f);
            setTo(t);
            setPage(0);
          }}
        />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <SortSelect
            value={sort}
            options={SORT_OPTIONS}
            onChange={(v) => {
              setSort(v);
              setPage(0);
            }}
          />
          <RefreshButton loading={loading} onClick={reloadFromStart} />
        </div>
      </div>

      {loadError && (
        <div role="alert" className="border-b border-danger/20 bg-danger/5 px-4 py-2.5 text-xs text-danger">
          {loadError}
        </div>
      )}

      {totals && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-border bg-canvas/60 px-4 py-2.5 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Booking đã thu</dt>
            <dd className="font-semibold tabular-nums text-ink-deep">{totals.paidBookings}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Tổng thu</dt>
            <dd className="font-semibold tabular-nums text-ink-deep">{vnd.format(totals.paidAmount)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Ròng</dt>
            <dd className="font-semibold tabular-nums text-primary">{vnd.format(totals.netAmount)}</dd>
          </div>
        </dl>
      )}

      <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas/60 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className={th}>{activeLevel === 'PLACE' ? 'Homestay' : 'Nhà cung cấp'}</th>
              {activeLevel === 'PLACE' && <th className={th}>Nhà cung cấp</th>}
              <th className={`${th} text-right`}>Booking đã thu</th>
              <th className={`${th} text-right`}>Thu</th>
              <th className={`${th} text-right`}>Ròng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((row) => (
              <tr
                key={`${activeLevel}-${row.id}`}
                onClick={() =>
                  onDrill?.(
                    activeLevel === 'PLACE'
                      ? { placeId: row.id, label: `Dòng tiền · ${row.name}` }
                      : { providerId: row.id, label: `Dòng tiền · ${row.name}` },
                  )
                }
                title={onDrill ? 'Xem các đơn đặt phòng' : undefined}
                className={`transition-colors duration-150 hover:bg-canvas ${onDrill ? 'cursor-pointer' : ''}`}
              >
                <td className={td}>
                  <div className="max-w-[260px] truncate font-semibold text-ink-deep" title={row.name}>{row.name}</div>
                  <div className="font-mono text-[11px] text-muted">#{row.id}</div>
                </td>
                {activeLevel === 'PLACE' && (
                  <td className={`${td} text-ink`}>
                    <div className="max-w-[200px] truncate">{row.providerName || '—'}</div>
                  </td>
                )}
                <td className={`${td} text-right tabular-nums text-ink`}>{row.paidBookings}</td>
                <td className={`${td} text-right tabular-nums text-ink-deep`}>{vnd.format(row.paidAmount)}</td>
                <td className={`${td} text-right font-semibold tabular-nums ${row.netAmount < 0 ? 'text-danger' : 'text-primary'}`}>{vnd.format(row.netAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !loadError && <div className="py-12 text-center text-xs text-muted">Không có giao dịch nào trong kỳ đã chọn.</div>}
      </div>

      <TableFooter
        total={data?.rows.totalElements ?? 0}
        activeCount={activeCount}
        onClear={() => {
          setKeyword('');
          setFrom('');
          setTo('');
          setPage(0);
        }}
        page={page}
        totalPages={data?.rows.totalPages ?? 0}
        onPage={setPage}
      />
    </section>
  );
}
