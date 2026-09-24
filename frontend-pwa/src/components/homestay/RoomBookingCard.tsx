import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Maximize,
  Minus,
  Plus,
  AlertTriangle,
  Calendar,
  BedDouble,
  CheckCircle2,
  CalendarX,
  XCircle,
} from 'lucide-react';
import { RoomTypeDto, HomestayDetailDto } from '@/types/homestay';
import { BookedDateRangeDto } from '@/types/booking';
import { Button } from '@/components/ui/button';
import RoomAvailabilityCalendar from '@/components/homestay/RoomAvailabilityCalendar';

interface RoomBookingCardProps {
  room: RoomTypeDto;
  homestay: HomestayDetailDto;
  bookedDates: BookedDateRangeDto[];
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  filterGuestCount?: number;
  filterRoomCount?: number;
}

export default function RoomBookingCard({
  room,
  homestay,
  bookedDates,
  defaultCheckIn,
  defaultCheckOut,
  filterGuestCount,
  filterRoomCount,
}: RoomBookingCardProps) {
  const navigate = useNavigate();

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Khởi tạo ngày riêng độc lập cho từng phòng
  const initialIn = useMemo(() => {
    if (defaultCheckIn) return defaultCheckIn;
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, [defaultCheckIn]);

  const initialOut = useMemo(() => {
    if (defaultCheckOut) return defaultCheckOut;
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  }, [defaultCheckOut]);

  const [checkIn, setCheckIn] = useState<string>(initialIn);
  const [checkOut, setCheckOut] = useState<string>(initialOut);

  // Đồng bộ khi bộ lọc ngoài thay đổi ngày
  useEffect(() => {
    if (defaultCheckIn) setCheckIn(defaultCheckIn);
  }, [defaultCheckIn]);

  useEffect(() => {
    if (defaultCheckOut) setCheckOut(defaultCheckOut);
  }, [defaultCheckOut]);

  // Số lượng phòng người dùng chọn (mặc định 1 phòng, tối đa là totalRoomCount của loại phòng)
  const maxRooms = Math.max(1, room.totalRoomCount || 1);
  const [roomCount, setRoomCount] = useState<number>(() =>
    filterRoomCount ? Math.max(1, Math.min(maxRooms, filterRoomCount)) : 1
  );

  // Số lượng khách (mặc định 2, tối đa theo sức chứa của số phòng đã chọn)
  const maxGuests = Math.max(1, (room.maxOccupancy || 2) * roomCount);
  const [guestCount, setGuestCount] = useState<number>(() => {
    if (filterGuestCount) {
      return Math.max(1, Math.min(maxGuests, filterGuestCount));
    }
    return Math.min(2, room.maxOccupancy || 2);
  });

  // Đồng bộ khi bộ lọc ngoài thay đổi số khách hoặc số phòng
  useEffect(() => {
    if (filterRoomCount) {
      setRoomCount(Math.max(1, Math.min(maxRooms, filterRoomCount)));
    }
  }, [filterRoomCount, maxRooms]);

  useEffect(() => {
    if (filterGuestCount) {
      setGuestCount(Math.max(1, Math.min(maxGuests, filterGuestCount)));
    }
  }, [filterGuestCount, maxGuests]);

  // Tự động điều chỉnh số khách khi số phòng thay đổi
  const handleRoomCountChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(maxRooms, newCount));
    setRoomCount(clamped);
    const updatedMaxGuests = Math.max(1, (room.maxOccupancy || 2) * clamped);
    if (guestCount > updatedMaxGuests) {
      setGuestCount(updatedMaxGuests);
    }
  };

  // Tính số đêm
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const diff = Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 1;
  }, [checkIn, checkOut]);

  // Tổng tiền phòng = đơn giá * số đêm * số phòng
  const totalPrice = useMemo(() => {
    return room.basePrice * nights * roomCount;
  }, [room.basePrice, nights, roomCount]);

  // Lọc danh sách booking riêng của loại phòng này (hoặc booking chung không chỉ định roomTypeId)
  const roomBookedDates = useMemo(() => {
    return bookedDates.filter(
      (b) => !b.roomTypeId || Number(b.roomTypeId) === 0 || Number(b.roomTypeId) === Number(room.id)
    );
  }, [bookedDates, room.id]);

  // Bản đồ phòng đã đặt từng ngày
  const occupiedMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of roomBookedDates) {
      if (!b.checkIn || !b.checkOut) continue;
      const startMs = new Date(b.checkIn).getTime();
      const endMs = new Date(b.checkOut).getTime();
      for (let t = startMs; t < endMs; t += 86400000) {
        const d = new Date(t);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${day}`;
        map[key] = (map[key] || 0) + (b.roomCount || 1);
      }
    }
    return map;
  }, [roomBookedDates]);

  // Gom các ngày đã kín thành các khoảng ngày hiển thị trực quan (VD: 26/09 → 28/09/2026: Kín 100%)
  const bookedRangesList = useMemo(() => {
    const dates = Object.keys(occupiedMap)
      .filter((d) => d >= todayStr && (occupiedMap[d] ?? 0) > 0)
      .sort();

    if (dates.length === 0) return [];

    const ranges: { start: string; end: string; maxOccupied: number; isFull: boolean }[] = [];
    const firstDate = dates[0];
    if (!firstDate) return [];

    let currentStart = firstDate;
    let prevDate = firstDate;
    let maxOcc = occupiedMap[firstDate] ?? 0;
    let isFull = maxOcc >= maxRooms;

    for (let i = 1; i < dates.length; i++) {
      const d = dates[i];
      if (!d) continue;
      const prevMs = new Date(prevDate).getTime();
      const currMs = new Date(d).getTime();
      const diffDays = Math.round((currMs - prevMs) / 86400000);
      const currOcc = occupiedMap[d] ?? 0;

      if (diffDays === 1) {
        prevDate = d;
        maxOcc = Math.max(maxOcc, currOcc);
        if (currOcc >= maxRooms) isFull = true;
      } else {
        const outDate = new Date(new Date(prevDate).getTime() + 86400000).toISOString().slice(0, 10);
        ranges.push({ start: currentStart, end: outDate, maxOccupied: maxOcc, isFull });
        currentStart = d;
        prevDate = d;
        maxOcc = currOcc;
        isFull = maxOcc >= maxRooms;
      }
    }
    const lastOut = new Date(new Date(prevDate).getTime() + 86400000).toISOString().slice(0, 10);
    ranges.push({ start: currentStart, end: lastOut, maxOccupied: maxOcc, isFull });

    return ranges;
  }, [occupiedMap, todayStr, maxRooms]);

  // Kiểm tra tính khả dụng của khoảng ngày đã chọn đối với số lượng phòng yêu cầu
  const validation = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return { isValid: false, availableRooms: 0, message: 'Vui lòng chọn ngày nhận phòng và ngày trả phòng hợp lệ.' };
    }

    const startMs = new Date(checkIn).getTime();
    const endMs = new Date(checkOut).getTime();
    let minAvail = maxRooms;

    for (let t = startMs; t < endMs; t += 86400000) {
      const d = new Date(t);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const occupied = occupiedMap[key] || 0;
      const available = Math.max(0, maxRooms - occupied);
      if (available < minAvail) minAvail = available;

      if (available <= 0) {
        return {
          isValid: false,
          availableRooms: 0,
          message: `Đêm ${key} đã kín toàn bộ ${maxRooms} phòng. Vui lòng chọn khoảng ngày khác.`,
        };
      }
      if (available < roomCount) {
        return {
          isValid: false,
          availableRooms: available,
          message: `Đêm ${key} chỉ còn ${available}/${maxRooms} phòng trống, không đủ ${roomCount} phòng bạn đang chọn.`,
        };
      }
    }

    return { isValid: true, availableRooms: minAvail, message: '' };
  }, [checkIn, checkOut, occupiedMap, maxRooms, roomCount]);

  const handleBooking = () => {
    if (!validation.isValid) return;

    navigate('/booking', {
      state: {
        placeId: homestay.id,
        placeName: homestay.name,
        placeAddress: homestay.address || homestay.district,
        placeRating: homestay.ratingAvg,
        placeReviewCount: homestay.ratingCount,
        coverImageUrl: homestay.images?.[0] || '',
        latitude: homestay.latitude,
        longitude: homestay.longitude,
        roomTypeId: Number(room.id),
        roomTypeName: room.name,
        basePrice: room.basePrice,
        originalPrice: Math.round(room.basePrice * 1.25),
        totalRoomCount: maxRooms,
        maxOccupancy: room.maxOccupancy,
        bedInfo: room.bedType || '1 giường đôi lớn',
        hasBreakfast: room.hasBreakfast || false,
        freeCancellation: room.freeCancellation ?? true,
        checkIn: checkIn,
        checkOut: checkOut,
        nights: nights,
        guestCount: guestCount,
        roomCount: roomCount,
      },
    });
  };

  return (
    <div
      className={`border rounded-lg overflow-hidden bg-white shadow-2xs hover:shadow-xs transition-shadow p-4 md:p-5 ${
        validation.isValid ? 'border-slate-200' : 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
      }`}
    >
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Cột 1: Ảnh & Thông số chi tiết phòng */}
        <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-3">
          <div className="h-[210px] rounded-md overflow-hidden relative border border-slate-200 bg-slate-100">
            <img
              src={room.images[0] || homestay.images[0]}
              alt={room.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 rounded-sm">
              {room.images.length || 1} ảnh
            </div>

            {/* Availability Badge */}
            {validation.isValid ? (
              <div className="absolute top-2 right-2 bg-emerald-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Còn {validation.availableRooms}/{maxRooms} phòng</span>
              </div>
            ) : (
              <div className="absolute top-2 right-2 bg-rose-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-xs flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                <span>Kín lịch ngày chọn</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-muted)] font-medium">
            <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
              <Users className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
              <span>Tối đa {room.maxOccupancy} khách/phòng</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
              <Maximize className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
              <span>{room.areaSqm || 25} m²</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-md border border-slate-100 col-span-2">
              <BedDouble className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
              <span className="truncate">{room.bedType || '1 giường đôi lớn cao cấp'}</span>
            </div>
          </div>
        </div>

        {/* Cột 2: Tiêu đề, Chọn số phòng/khách, Lịch trống độc lập & Nút Đặt phòng */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Header phòng & Giá niêm yết */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-[var(--color-ink-deep)]">{room.name}</h3>
                  {validation.isValid ? (
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Sẵn sàng nhận khách
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Hết phòng ngày chọn
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {room.description || 'Không gian ấm cúng, thiết kế bản địa hài hòa'}
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xl md:text-2xl font-black text-[var(--color-coral)]">
                  {new Intl.NumberFormat('vi-VN').format(room.basePrice)}đ
                </span>
                <span className="text-xs text-[var(--color-muted)] font-medium"> /đêm</span>
              </div>
            </div>

            {/* PHẦN HIỂN THỊ CÁC LỊCH ĐÃ KÍN PHÒNG (BẮT BUỘC THEO YÊU CẦU) */}
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-md p-3 mb-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <CalendarX className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Lịch các ngày đã kín chỗ của hạng phòng này:</span>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/60 px-2 py-0.2 rounded-xs">
                  {bookedRangesList.length > 0
                    ? `${bookedRangesList.length} khoảng ngày đã có khách đặt`
                    : 'Tất cả các ngày đều còn phòng trống'}
                </span>
              </div>

              {bookedRangesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {bookedRangesList.map((range, idx) => (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[11px] font-medium ${
                        range.isFull
                          ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                          : 'bg-white border-amber-200 text-amber-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          range.isFull ? 'bg-rose-600' : 'bg-amber-500'
                        }`}
                      />
                      <span>
                        {range.start} → {range.end}
                      </span>
                      <span className="text-[10px] opacity-80">
                        {range.isFull
                          ? '(Hết 100% phòng)'
                          : `(Đã đặt ${range.maxOccupied}/${maxRooms} phòng)`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-amber-800 italic mt-0.5">
                  Chưa có lịch đặt kín nào trong thời gian tới. Bạn có thể chọn bất kỳ ngày nào để đặt phòng.
                </p>
              )}
            </div>

            {/* Thanh điều khiển: CHỌN SỐ PHÒNG & SỐ KHÁCH CHO PHÒNG NÀY */}
            <div className="bg-[#f8faf9] border border-slate-200 rounded-md p-3 mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Chọn số lượng phòng */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-2xs">
                  <span className="text-xs font-bold text-[var(--color-ink-deep)]">Số lượng phòng:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRoomCountChange(roomCount - 1)}
                      disabled={roomCount <= 1}
                      className="w-6 h-6 rounded-sm bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Giảm số phòng"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-[var(--color-primary)] w-7 text-center">
                      {roomCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRoomCountChange(roomCount + 1)}
                      disabled={roomCount >= maxRooms}
                      className="w-6 h-6 rounded-sm bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Tăng số phòng"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (Tối đa {maxRooms} phòng)
                  </span>
                </div>

                {/* Chọn số lượng khách */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-2xs">
                  <span className="text-xs font-bold text-[var(--color-ink-deep)]">Số khách:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                      disabled={guestCount <= 1}
                      className="w-6 h-6 rounded-sm bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Giảm số khách"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-800 w-7 text-center">
                      {guestCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => Math.min(maxGuests, prev + 1))}
                      disabled={guestCount >= maxGuests}
                      className="w-6 h-6 rounded-sm bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Tăng số khách"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (Tối đa {maxGuests} khách)
                  </span>
                </div>
              </div>

              {/* Thông tin chọn ngày hiện tại của phòng */}
              <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                <span>
                  Khoảng ngày: <strong className="text-[var(--color-ink-deep)]">{checkIn}</strong> →{' '}
                  <strong className="text-[var(--color-ink-deep)]">{checkOut}</strong> ({nights} đêm)
                </span>
              </div>
            </div>

            {/* Lịch phòng độc lập của phòng này (check các booking & disable các ngày không đủ số phòng chọn) */}
            <div className="bg-slate-50/70 p-3.5 rounded-md border border-slate-200 mb-3.5">
              <RoomAvailabilityCalendar
                bookedDates={roomBookedDates}
                totalRoomCount={maxRooms}
                requestedRoomCount={roomCount}
                selectedCheckIn={checkIn}
                selectedCheckOut={checkOut}
                onSelectDates={(inDate, outDate) => {
                  setCheckIn(inDate);
                  setCheckOut(outDate);
                }}
              />
            </div>

            {/* Thông báo tình trạng phòng cho khoảng ngày đã chọn */}
            {validation.isValid ? (
              <div className="mb-3.5 p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  Khoảng ngày <strong>{checkIn}</strong> đến <strong>{checkOut}</strong> còn{' '}
                  <strong>{validation.availableRooms}/{maxRooms}</strong> phòng trống sẵn sàng đón bạn!
                </span>
              </div>
            ) : (
              <div className="mb-3.5 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validation.message}</span>
              </div>
            )}
          </div>

          {/* Footer CTA: Tóm tắt chi phí & Nút Đặt phòng */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 gap-3">
            <div className="text-xs text-slate-700 space-y-0.5">
              <div>
                Tạm tính: <strong>{new Intl.NumberFormat('vi-VN').format(room.basePrice)}đ</strong> ×{' '}
                {nights} đêm × {roomCount} phòng ={' '}
                <strong className="text-sm font-extrabold text-[var(--color-coral)]">
                  {new Intl.NumberFormat('vi-VN').format(totalPrice)}đ
                </strong>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {room.hasBreakfast ? 'Đã bao gồm bữa sáng' : 'Không kèm bữa sáng'} · Miễn phí hủy
                phòng trước 48h
              </div>
            </div>

            <Button
              disabled={!validation.isValid}
              onClick={handleBooking}
              className={`w-full sm:w-auto font-bold rounded-md py-2.5 px-6 transition-colors text-sm cursor-pointer shadow-2xs ${
                validation.isValid
                  ? 'bg-[var(--color-coral)] hover:bg-[var(--color-coral-hover)] text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {validation.isValid
                ? `Đặt ${roomCount} phòng (${new Intl.NumberFormat('vi-VN').format(totalPrice)}đ)`
                : 'Đã kín phòng ngày này'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
