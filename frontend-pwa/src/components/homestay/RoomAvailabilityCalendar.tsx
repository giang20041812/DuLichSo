import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Ban, Check, Calendar as CalendarIcon } from 'lucide-react';
import { BookedDateRangeDto } from '@/types/booking';

interface RoomAvailabilityCalendarProps {
  bookedDates: BookedDateRangeDto[];
  totalRoomCount?: number;
  requestedRoomCount?: number; // Số lượng phòng khách đang chọn
  selectedCheckIn?: string; // YYYY-MM-DD
  selectedCheckOut?: string; // YYYY-MM-DD
  onSelectDates?: (checkIn: string, checkOut: string) => void;
  className?: string;
}

export default function RoomAvailabilityCalendar({
  bookedDates = [],
  totalRoomCount = 1,
  requestedRoomCount = 1,
  selectedCheckIn,
  selectedCheckOut,
  onSelectDates,
  className = '',
}: RoomAvailabilityCalendarProps) {
  // Calendar base month navigation (start with current month)
  const [currentBaseDate, setCurrentBaseDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const nextBaseDate = useMemo(() => {
    return new Date(currentBaseDate.getFullYear(), currentBaseDate.getMonth() + 1, 1);
  }, [currentBaseDate]);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Compute daily booked room counts map: { "2026-09-24": 2 }
  const occupiedCountPerDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of bookedDates) {
      if (!b.checkIn || !b.checkOut) continue;
      // Loop from checkIn up to (exclusive) checkOut
      const cur = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      while (cur < end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;
        map[key] = (map[key] || 0) + (b.roomCount || 1);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [bookedDates]);

  // Temporary selection state for range picking
  const [pickingStart, setPickingStart] = useState<string | null>(null);

  const totalRooms = Math.max(1, totalRoomCount);
  const neededRooms = Math.max(1, requestedRoomCount);

  const getDayAvailability = (dateStr: string) => {
    const occupied = occupiedCountPerDate[dateStr] || 0;
    const available = Math.max(0, totalRooms - occupied);
    const isPast = dateStr < todayStr;
    const isFullyBooked = available <= 0;
    const isNotEnough = !isFullyBooked && available < neededRooms;
    const isBooked = isFullyBooked || isNotEnough;
    return { occupied, available, isPast, isFullyBooked, isNotEnough, isBooked };
  };

  const handleDateClick = (dateStr: string) => {
    const { isPast, isBooked, isFullyBooked, isNotEnough, available } = getDayAvailability(dateStr);
    if (isPast || isBooked) {
      if (isFullyBooked) {
        alert(`Ngày ${dateStr} đã kín toàn bộ ${totalRooms} phòng.`);
      } else if (isNotEnough) {
        alert(`Ngày ${dateStr} chỉ còn ${available} phòng trống, không đủ ${neededRooms} phòng bạn đang chọn.`);
      }
      return;
    }

    if (!pickingStart) {
      // Start picking
      setPickingStart(dateStr);
    } else {
      // Picked end date
      if (dateStr > pickingStart) {
        // Check if any date in between is booked or does not have enough rooms
        let hasConflict = false;
        let conflictDate = '';
        let conflictAvailable = 0;
        const cur = new Date(pickingStart);
        const end = new Date(dateStr);
        while (cur < end) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const d = String(cur.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${d}`;
          const check = getDayAvailability(key);
          if (check.isBooked) {
            hasConflict = true;
            conflictDate = key;
            conflictAvailable = check.available;
            break;
          }
          cur.setDate(cur.getDate() + 1);
        }

        if (!hasConflict) {
          onSelectDates?.(pickingStart, dateStr);
        } else {
          alert(`Đêm ${conflictDate} chỉ còn ${conflictAvailable}/${totalRooms} phòng trống (bạn đang chọn ${neededRooms} phòng). Vui lòng chọn khoảng ngày khác!`);
          setPickingStart(dateStr);
          return;
        }
      } else {
        // Clicked date is earlier or same as start, make it new start
        setPickingStart(dateStr);
        return;
      }
      setPickingStart(null);
    }
  };

  const renderMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthName = `Tháng ${month + 1}, ${year}`;

    // Days in month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // First day of week: Sunday = 0, Monday = 1, ...
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const days = [];
    // Padding before first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`pad-${i}`} className="h-9 md:h-10" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const { isPast, isBooked, isFullyBooked, isNotEnough, available, occupied } = getDayAvailability(dayStr);
      const isToday = dayStr === todayStr;

      // Selection state check
      const isSelectedStart = pickingStart ? dayStr === pickingStart : (selectedCheckIn === dayStr);
      const isSelectedEnd = !pickingStart && selectedCheckOut === dayStr;
      const isInSelectedRange = !pickingStart && selectedCheckIn && selectedCheckOut 
        ? (dayStr >= selectedCheckIn && dayStr <= selectedCheckOut) 
        : (pickingStart && dayStr === pickingStart);

      let cellStyle = "text-gray-800 hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary)] font-semibold cursor-pointer";
      let cellBadge = null;

      if (isPast) {
        cellStyle = "text-gray-300 line-through cursor-not-allowed bg-gray-50/50 font-normal";
      } else if (isFullyBooked) {
        cellStyle = "bg-rose-50 text-rose-400 font-bold cursor-not-allowed border border-rose-200 line-through";
        cellBadge = <span className="absolute bottom-0.5 text-[9px] md:text-[10px] text-rose-600 font-extrabold leading-none">Kín</span>;
      } else if (isNotEnough) {
        cellStyle = "bg-amber-50 text-amber-700 font-semibold cursor-not-allowed border border-amber-200";
        cellBadge = <span className="absolute bottom-0.5 text-[9px] md:text-[10px] text-amber-700 font-bold leading-none">Còn {available}</span>;
      } else if (isSelectedStart || isSelectedEnd) {
        cellStyle = "bg-[var(--color-coral)] text-white font-extrabold shadow-sm scale-105 z-10";
      } else if (isInSelectedRange) {
        cellStyle = "bg-[var(--color-coral)]/15 text-[var(--color-coral)] font-bold";
      } else if (totalRooms > 1 && !isPast) {
        cellBadge = <span className="absolute bottom-0.5 text-[9px] md:text-[10px] text-emerald-700/80 font-medium leading-none">Còn {available}</span>;
      }

      const cellTitle = isPast
        ? 'Ngày trong quá khứ'
        : isFullyBooked
        ? `Đã kín toàn bộ ${totalRooms} phòng (${occupied} đã đặt)`
        : isNotEnough
        ? `Chỉ còn ${available} phòng trống, không đủ ${neededRooms} phòng bạn chọn`
        : `Còn ${available}/${totalRooms} phòng trống · Bấm để chọn`;

      days.push(
        <button
          key={dayStr}
          type="button"
          disabled={isPast || isBooked}
          onClick={() => handleDateClick(dayStr)}
          className={`h-9 md:h-10 w-full flex flex-col items-center justify-center rounded-md relative text-sm md:text-base transition-all ${cellStyle} ${isToday && !isSelectedStart && !isBooked ? 'ring-2 ring-[var(--color-primary)] font-bold text-[var(--color-primary)]' : ''}`}
          title={cellTitle}
        >
          <span>{d}</span>
          {cellBadge}
        </button>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 flex-1 shadow-2xs">
        <h5 className="text-center font-bold text-base md:text-lg text-[var(--color-ink-deep)] mb-3 flex items-center justify-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-[var(--color-primary)]" />
          {monthName}
        </h5>
        
        {/* Day header */}
        <div className="grid grid-cols-7 text-center text-xs md:text-sm font-bold text-[var(--color-muted)] mb-2">
          <span>CN</span><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {days}
        </div>
      </div>
    );
  };

  const handlePrevMonth = () => {
    setCurrentBaseDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentBaseDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Check if prev button should be disabled (cannot go before current month)
  const isPrevDisabled = useMemo(() => {
    const today = new Date();
    return (
      currentBaseDate.getFullYear() < today.getFullYear() ||
      (currentBaseDate.getFullYear() === today.getFullYear() && currentBaseDate.getMonth() <= today.getMonth())
    );
  }, [currentBaseDate]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Calendar Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-sm md:text-base font-bold text-[var(--color-ink-deep)] flex flex-wrap items-center gap-2">
          <span>Lịch trống & Tình trạng đặt</span>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-sm">
            Đang đối soát: {neededRooms} phòng
          </span>
          {pickingStart && (
            <span className="text-xs md:text-sm font-semibold text-[var(--color-coral)] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-md">
              Đã chọn nhận phòng: {pickingStart} · Bấm ngày trả phòng
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={isPrevDisabled}
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
            aria-label="Tháng tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2 Month side-by-side or stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {renderMonth(currentBaseDate)}
        {renderMonth(nextBaseDate)}
      </div>

      {/* Legends */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs md:text-sm text-[var(--color-muted)] font-medium">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-white border border-gray-300"></div>
            <span>Còn trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-rose-50 border border-rose-300 text-rose-500 flex items-center justify-center">
              <Ban className="w-2.5 h-2.5" />
            </div>
            <span>Đã kín phòng</span>
          </div>
          {neededRooms > 1 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-amber-50 border border-amber-300 text-amber-700 flex items-center justify-center text-[9px] font-bold">
                !
              </div>
              <span>Không đủ {neededRooms} phòng</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-[var(--color-coral)] text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5" />
            </div>
            <span>Khoảng ngày chọn</span>
          </div>
        </div>

        <span className="text-xs text-gray-400">
          * Bấm ngày nhận phòng và ngày trả phòng trực tiếp trên lịch
        </span>
      </div>
    </div>
  );
}
