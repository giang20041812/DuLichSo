import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Maximize,
  Minus,
  Plus,
  AlertTriangle,
  Calendar,
  Sparkles,
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
}

export default function RoomBookingCard({
  room,
  homestay,
  bookedDates,
  defaultCheckIn,
  defaultCheckOut,
}: RoomBookingCardProps) {
  const navigate = useNavigate();

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

  // Số lượng phòng người dùng chọn (mặc định 1 phòng, tối đa là totalRoomCount của loại phòng)
  const maxRooms = Math.max(1, room.totalRoomCount || 1);
  const [roomCount, setRoomCount] = useState<number>(1);

  // Số lượng khách (mặc định 2, tối đa theo sức chứa của số phòng đã chọn)
  const maxGuests = Math.max(1, (room.maxOccupancy || 2) * roomCount);
  const [guestCount, setGuestCount] = useState<number>(() => Math.min(2, room.maxOccupancy || 2));

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

  // Lọc danh sách booking riêng của loại phòng này
  const roomBookedDates = useMemo(() => {
    return bookedDates.filter((b) => b.roomTypeId === Number(room.id));
  }, [bookedDates, room.id]);

  // Kiểm tra tính khả dụng của khoảng ngày đã chọn đối với số lượng phòng yêu cầu
  const validation = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return { isValid: false, message: 'Vui lòng chọn ngày nhận phòng và ngày trả phòng hợp lệ.' };
    }

    const occupiedMap: Record<string, number> = {};
    for (const b of roomBookedDates) {
      if (!b.checkIn || !b.checkOut) continue;
      const cur = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      while (cur < end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;
        occupiedMap[key] = (occupiedMap[key] || 0) + (b.roomCount || 1);
        cur.setDate(cur.getDate() + 1);
      }
    }

    const cur = new Date(checkIn);
    const end = new Date(checkOut);
    while (cur < end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      const occupied = occupiedMap[key] || 0;
      const available = Math.max(0, maxRooms - occupied);

      if (available <= 0) {
        return {
          isValid: false,
          message: `Đêm ${key} đã kín toàn bộ phòng. Vui lòng chọn khoảng ngày khác.`,
        };
      }
      if (available < roomCount) {
        return {
          isValid: false,
          message: `Đêm ${key} chỉ còn ${available}/${maxRooms} phòng trống, không đủ ${roomCount} phòng bạn đang chọn.`,
        };
      }
      cur.setDate(cur.getDate() + 1);
    }

    return { isValid: true, message: '' };
  }, [checkIn, checkOut, roomBookedDates, maxRooms, roomCount]);

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
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-2xs hover:shadow-xs transition-shadow p-4 md:p-5">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Cột 1: Ảnh & Thông số chi tiết phòng */}
        <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-3">
          <div className="h-[210px] rounded-md overflow-hidden relative border border-gray-200 bg-gray-100">
            <img
              src={room.images[0] || homestay.images[0]}
              alt={room.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 rounded-sm">
              {room.images.length || 1} ảnh
            </div>
            <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-xs">
              Có sẵn {maxRooms} phòng
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-muted)] font-medium">
            <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-md border border-gray-100">
              <Users className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
              <span>Tối đa {room.maxOccupancy} khách/phòng</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-md border border-gray-100">
              <Maximize className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
              <span>{room.areaSqm || 25} m²</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-md border border-gray-100 col-span-2">
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
                <h3 className="font-bold text-lg text-[var(--color-ink-deep)]">{room.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
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

            {/* Thanh điều khiển: CHỌN SỐ PHÒNG & SỐ KHÁCH CHO PHÒNG NÀY */}
            <div className="bg-[#f8faf9] border border-gray-200 rounded-md p-3 mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Chọn số lượng phòng */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-2xs">
                  <span className="text-xs font-bold text-[var(--color-ink-deep)]">Số lượng phòng:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRoomCountChange(roomCount - 1)}
                      disabled={roomCount <= 1}
                      className="w-6 h-6 rounded-sm bg-gray-50 border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                      className="w-6 h-6 rounded-sm bg-gray-50 border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Tăng số phòng"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    (Tối đa {maxRooms} phòng)
                  </span>
                </div>

                {/* Chọn số lượng khách */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-2xs">
                  <span className="text-xs font-bold text-[var(--color-ink-deep)]">Số khách:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                      disabled={guestCount <= 1}
                      className="w-6 h-6 rounded-sm bg-gray-50 border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                      className="w-6 h-6 rounded-sm bg-gray-50 border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Tăng số khách"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    (Tối đa {maxGuests} khách)
                  </span>
                </div>
              </div>

              {/* Thông tin chọn ngày hiện tại của phòng */}
              <div className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                <span>
                  Khoảng ngày: <strong className="text-[var(--color-ink-deep)]">{checkIn}</strong> →{' '}
                  <strong className="text-[var(--color-ink-deep)]">{checkOut}</strong> ({nights} đêm)
                </span>
              </div>
            </div>

            {/* Lịch phòng độc lập của phòng này (check các booking & disable các ngày không đủ số phòng chọn) */}
            <div className="bg-gray-50/70 p-3.5 rounded-md border border-gray-200 mb-3.5">
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

            {/* Thông báo lỗi nếu khoảng ngày đã chọn không hợp lệ / không đủ số phòng */}
            {!validation.isValid && (
              <div className="mb-3.5 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validation.message}</span>
              </div>
            )}
          </div>

          {/* Footer CTA: Tóm tắt chi phí & Nút Đặt phòng */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-gray-100 gap-3">
            <div className="text-xs text-gray-700 space-y-0.5">
              <div>
                Tạm tính: <strong>{new Intl.NumberFormat('vi-VN').format(room.basePrice)}đ</strong> ×{' '}
                {nights} đêm × {roomCount} phòng ={' '}
                <strong className="text-sm font-extrabold text-[var(--color-coral)]">
                  {new Intl.NumberFormat('vi-VN').format(totalPrice)}đ
                </strong>
              </div>
              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {room.hasBreakfast ? 'Đã bao gồm bữa sáng' : 'Không kèm bữa sáng'} · Miễn phí hủy
                phòng trước 48h
              </div>
            </div>

            <Button
              disabled={!validation.isValid}
              onClick={handleBooking}
              className="w-full sm:w-auto font-bold rounded-md py-2.5 px-6 bg-[var(--color-coral)] hover:bg-[var(--color-coral-hover)] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white shadow-2xs transition-colors text-sm cursor-pointer"
            >
              Đặt {roomCount} phòng ({new Intl.NumberFormat('vi-VN').format(totalPrice)}đ)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
