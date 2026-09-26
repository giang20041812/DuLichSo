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

function getRoomImage(room: RoomTypeDto, homestay: HomestayDetailDto): string {
  if (room.images && room.images.length > 0 && room.images[0]?.trim()) {
    return room.images[0];
  }
  if (homestay.images && homestay.images.length > 0 && homestay.images[0]?.trim()) {
    return homestay.images[0];
  }
  return '';
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

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Khởi tạo ngày riêng độc lập cho từng phòng
  const initialIn = useMemo(() => {
    if (defaultCheckIn) return defaultCheckIn;
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, [defaultCheckIn]);

  const initialOut = useMemo(() => {
    if (defaultCheckOut) return defaultCheckOut;
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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

  // Helper: chuyển string YYYY-MM-DD sang YYYY-MM-DD an toàn theo giờ địa phương
  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    const y = Number(parts[0]) || 2026;
    const m = Number(parts[1]) || 1;
    const d = Number(parts[2]) || 1;
    return new Date(y, m - 1, d);
  };

  // Bản đồ phòng đã đặt từng ngày
  const occupiedMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of roomBookedDates) {
      if (!b.checkIn || !b.checkOut) continue;
      const cur = parseLocalDate(b.checkIn);
      const end = parseLocalDate(b.checkOut);
      while (cur < end) {
        const key = formatDateKey(cur);
        map[key] = (map[key] || 0) + (b.roomCount || 1);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [roomBookedDates]);

  // Kiểm tra tính khả dụng của khoảng ngày đã chọn đối với số lượng phòng yêu cầu
  const validation = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return { isValid: false, availableRooms: 0, message: 'Vui lòng chọn ngày nhận phòng và ngày trả phòng hợp lệ.' };
    }

    const cur = parseLocalDate(checkIn);
    const end = parseLocalDate(checkOut);
    let minAvail = maxRooms;

    while (cur < end) {
      const key = formatDateKey(cur);
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
      cur.setDate(cur.getDate() + 1);
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
        bedInfo: room.bedType || '',
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
          <div className="h-[210px] rounded-md overflow-hidden relative border border-slate-200 bg-slate-100 flex items-center justify-center">
            {(() => {
              const imgUrl = getRoomImage(room, homestay);
              if (imgUrl) {
                return (
                  <>
                    <img
                      src={imgUrl}
                      alt={room.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 rounded-sm">
                      {room.images && room.images.length > 0 ? `${room.images.length} ảnh thực tế` : 'Ảnh phòng'}
                    </div>
                  </>
                );
              }
              return (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <BedDouble className="w-10 h-10 opacity-30 mb-1" />
                  <span className="text-xs">Chưa có ảnh phòng</span>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs md:text-sm text-[var(--color-muted)] font-medium">
            <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
              <Users className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <span>Tối đa {room.maxOccupancy} khách/phòng</span>
            </div>
            {room.areaSqm ? (
              <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
                <Maximize className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                <span>{room.areaSqm} m²</span>
              </div>
            ) : null}
            {room.bedType ? (
              <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-md border border-slate-100 col-span-2">
                <BedDouble className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                <span className="truncate">{room.bedType}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Cột 2: Tiêu đề, Chọn số phòng/khách, Lịch trống độc lập & Nút Đặt phòng */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Header phòng & Giá niêm yết */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-xl md:text-2xl text-[var(--color-ink-deep)]">{room.name}</h3>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-2xl md:text-3xl font-black text-[var(--color-coral)]">
                  {new Intl.NumberFormat('vi-VN').format(room.basePrice)}đ
                </span>
                <span className="text-sm text-[var(--color-muted)] font-medium"> /đêm</span>
              </div>
            </div>

            {/* Thanh chọn thông số phòng gọn gàng, rõ ràng */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-md p-3 mb-3.5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Chọn số phòng */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-sm shadow-2xs">
                  <span className="font-semibold text-slate-700">Phòng:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRoomCountChange(roomCount - 1)}
                      disabled={roomCount <= 1}
                      className="w-6 h-6 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-[var(--color-primary)] w-6 text-center text-sm">
                      {roomCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRoomCountChange(roomCount + 1)}
                      disabled={roomCount >= maxRooms}
                      className="w-6 h-6 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Chọn số khách */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-sm shadow-2xs">
                  <span className="font-semibold text-slate-700">Khách:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                      disabled={guestCount <= 1}
                      className="w-6 h-6 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-slate-800 w-6 text-center text-sm">
                      {guestCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => Math.min(maxGuests, prev + 1))}
                      disabled={guestCount >= maxGuests}
                      className="w-6 h-6 rounded-xs bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Chọn khoảng ngày trực tiếp */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-sm shadow-2xs">
                  <Calendar className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <input
                    type="date"
                    min={todayStr}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="border-0 p-0 text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer bg-transparent w-[125px]"
                  />
                  <span className="text-slate-400 font-bold">→</span>
                  <input
                    type="date"
                    min={checkIn || todayStr}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="border-0 p-0 text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer bg-transparent w-[125px]"
                  />
                  {/* Badge tình trạng phòng kế bên số đêm */}
                  {validation.isValid ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Còn phòng</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-xs flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Hết phòng</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lịch phòng độc lập - Luôn luôn hiển thị */}
            <div className="bg-slate-50/70 p-3 md:p-4 rounded-md border border-slate-200 mb-3.5">
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

            {/* Chỉ hiện cảnh báo khi hết phòng hoặc chọn ngày không hợp lệ */}
            {!validation.isValid && (
              <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs md:text-sm text-rose-700 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validation.message}</span>
              </div>
            )}
          </div>

          {/* Footer CTA: Tóm tắt chi phí & Nút Đặt phòng */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3.5 border-t border-slate-100 gap-3">
            <div className="text-xs md:text-sm text-slate-700 space-y-1">
              <div>
                Tạm tính: <strong>{new Intl.NumberFormat('vi-VN').format(room.basePrice)}đ</strong> ×{' '}
                {nights} đêm × {roomCount} phòng ={' '}
                <strong className="text-base md:text-lg font-extrabold text-[var(--color-coral)]">
                  {new Intl.NumberFormat('vi-VN').format(totalPrice)}đ
                </strong>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {room.hasBreakfast ? 'Đã bao gồm bữa sáng' : 'Không kèm bữa sáng'}
                  {homestay.homestayProfile?.currentPolicy?.name
                    ? ` · ${homestay.homestayProfile.currentPolicy.name}`
                    : homestay.homestayProfile?.currentPolicy?.description
                    ? ` · ${homestay.homestayProfile.currentPolicy.description}`
                    : ''}
                </span>
              </div>
            </div>

            <Button
              disabled={!validation.isValid}
              onClick={handleBooking}
              className={`w-full sm:w-auto font-bold rounded-md py-3 px-6 transition-colors text-sm md:text-base cursor-pointer shadow-2xs ${
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
