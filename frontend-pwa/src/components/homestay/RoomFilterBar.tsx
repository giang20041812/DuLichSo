import { Calendar, Users, Filter, RotateCcw, CheckCircle2, XCircle, ArrowUpDown, Coffee, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RoomFilterState {
  checkIn: string;
  checkOut: string;
  guestCount: number;
  roomCount: number;
  statusTab: 'ALL' | 'AVAILABLE' | 'BOOKED';
  priceSort: 'NONE' | 'ASC' | 'DESC';
  hasBreakfastOnly: boolean;
  freeCancelOnly: boolean;
}

interface RoomFilterBarProps {
  filters: RoomFilterState;
  onChange: (newFilters: RoomFilterState) => void;
  totalRoomsCount: number;
  availableRoomsCount: number;
  bookedRoomsCount: number;
}

export default function RoomFilterBar({
  filters,
  onChange,
  totalRoomsCount,
  availableRoomsCount,
  bookedRoomsCount,
}: RoomFilterBarProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Quick preset helper
  const applyDatePreset = (preset: 'THIS_WEEKEND' | 'NEXT_WEEKEND' | 'NEXT_3_DAYS') => {
    const now = new Date();
    let inDate = new Date();
    let outDate = new Date();

    if (preset === 'NEXT_3_DAYS') {
      inDate.setDate(now.getDate() + 1);
      outDate.setDate(now.getDate() + 3);
    } else if (preset === 'THIS_WEEKEND') {
      // Find this coming Friday
      const day = now.getDay();
      const diffToFriday = (5 - day + 7) % 7;
      inDate.setDate(now.getDate() + (diffToFriday === 0 ? 7 : diffToFriday));
      outDate.setDate(inDate.getDate() + 2); // Friday to Sunday
    } else if (preset === 'NEXT_WEEKEND') {
      const day = now.getDay();
      const diffToFriday = (5 - day + 7) % 7;
      inDate.setDate(now.getDate() + (diffToFriday === 0 ? 7 : diffToFriday) + 7);
      outDate.setDate(inDate.getDate() + 2);
    }

    onChange({
      ...filters,
      checkIn: inDate.toISOString().slice(0, 10),
      checkOut: outDate.toISOString().slice(0, 10),
    });
  };

  const handleReset = () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() + 2);
    const d2 = new Date();
    d2.setDate(d2.getDate() + 3);

    onChange({
      checkIn: d1.toISOString().slice(0, 10),
      checkOut: d2.toISOString().slice(0, 10),
      guestCount: 2,
      roomCount: 1,
      statusTab: 'ALL',
      priceSort: 'NONE',
      hasBreakfastOnly: false,
      freeCancelOnly: false,
    });
  };

  const hasActiveFilters =
    filters.statusTab !== 'ALL' ||
    filters.guestCount > 2 ||
    filters.roomCount > 1 ||
    filters.priceSort !== 'NONE' ||
    filters.hasBreakfastOnly ||
    filters.freeCancelOnly;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 mb-5 shadow-2xs">
      {/* Hàng 1: Tiêu đề bộ lọc & Nút reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-xs bg-emerald-50 text-[#10b981] flex items-center justify-center">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Bộ Lọc & Kiểm Tra Phòng Trống
          </span>
          <span className="text-[11px] text-slate-400">· Tự động kiểm tra lịch kín từng phòng</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-slate-500 hover:text-[#10b981] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}
      </div>

      {/* Hàng 2: Chọn ngày đến - về & Số lượng khách / phòng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        {/* Check-in date */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#10b981]" />
            <span>Ngày nhận phòng:</span>
          </label>
          <input
            type="date"
            min={todayStr}
            value={filters.checkIn}
            onChange={(e) => {
              const val = e.target.value;
              let nextOut = filters.checkOut;
              if (val >= nextOut) {
                const nextDay = new Date(val);
                nextDay.setDate(nextDay.getDate() + 1);
                nextOut = nextDay.toISOString().slice(0, 10);
              }
              onChange({ ...filters, checkIn: val, checkOut: nextOut });
            }}
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] bg-white shadow-2xs"
          />
        </div>

        {/* Check-out date */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#10b981]" />
            <span>Ngày trả phòng:</span>
          </label>
          <input
            type="date"
            min={filters.checkIn || todayStr}
            value={filters.checkOut}
            onChange={(e) => onChange({ ...filters, checkOut: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] bg-white shadow-2xs"
          />
        </div>

        {/* Guest count */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Users className="w-3 h-3 text-[#10b981]" />
            <span>Số lượng khách:</span>
          </label>
          <select
            value={filters.guestCount}
            onChange={(e) => onChange({ ...filters, guestCount: Number(e.target.value) })}
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] bg-white shadow-2xs"
          >
            <option value={1}>1 khách</option>
            <option value={2}>2 khách</option>
            <option value={3}>3 khách</option>
            <option value={4}>4 khách</option>
            <option value={6}>5 - 6 khách</option>
            <option value={10}>7 - 10 khách (Đoàn)</option>
          </select>
        </div>

        {/* Room count requested */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-[#10b981]" />
            <span>Sắp xếp theo giá:</span>
          </label>
          <select
            value={filters.priceSort}
            onChange={(e) =>
              onChange({ ...filters, priceSort: e.target.value as 'NONE' | 'ASC' | 'DESC' })
            }
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981] bg-white shadow-2xs"
          >
            <option value="NONE">Mặc định (Tiêu chuẩn)</option>
            <option value="ASC">Giá: Thấp đến cao</option>
            <option value="DESC">Giá: Cao đến thấp</option>
          </select>
        </div>
      </div>

      {/* Hàng 3: Phím tắt chọn ngày nhanh */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
        <span className="text-slate-500 font-medium">Chọn nhanh:</span>
        <button
          type="button"
          onClick={() => applyDatePreset('NEXT_3_DAYS')}
          className="px-2 py-0.5 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
        >
          3 ngày tới
        </button>
        <button
          type="button"
          onClick={() => applyDatePreset('THIS_WEEKEND')}
          className="px-2 py-0.5 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
        >
          Cuối tuần này (T6-CN)
        </button>
        <button
          type="button"
          onClick={() => applyDatePreset('NEXT_WEEKEND')}
          className="px-2 py-0.5 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
        >
          Cuối tuần sau
        </button>
      </div>

      {/* Hàng 4: Tab lọc trạng thái phòng & Checkboxes tiện ích */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
        {/* Status tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...filters, statusTab: 'ALL' })}
            className={`h-7 px-2.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
              filters.statusTab === 'ALL'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả phòng ({totalRoomsCount})
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...filters, statusTab: 'AVAILABLE' })}
            className={`h-7 px-2.5 text-xs font-semibold rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
              filters.statusTab === 'AVAILABLE'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Còn trống ({availableRoomsCount})</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...filters, statusTab: 'BOOKED' })}
            className={`h-7 px-2.5 text-xs font-semibold rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
              filters.statusTab === 'BOOKED'
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Đã kín lịch ({bookedRoomsCount})</span>
          </Button>
        </div>

        {/* Checkbox tiện ích */}
        <div className="flex items-center gap-3 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.hasBreakfastOnly}
              onChange={(e) => onChange({ ...filters, hasBreakfastOnly: e.target.checked })}
              className="rounded-xs text-[#10b981] focus:ring-[#10b981] accent-[#10b981]"
            />
            <Coffee className="w-3 h-3 text-amber-600" />
            <span>Bao gồm bữa sáng</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.freeCancelOnly}
              onChange={(e) => onChange({ ...filters, freeCancelOnly: e.target.checked })}
              className="rounded-xs text-[#10b981] focus:ring-[#10b981] accent-[#10b981]"
            />
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Miễn phí hủy</span>
          </label>
        </div>
      </div>
    </div>
  );
}
