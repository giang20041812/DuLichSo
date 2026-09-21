import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Minus,
  Plus,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  ArrowRight,
  User,
  FlaskConical,
  Star,
  Users,
  Bed,
  Mountain,
  Bath
} from 'lucide-react';
import { RoomAvailabilityItem } from '../types/room';

export default function RoomAvailabilityPage() {
  const { slug = 'ban-lim-mong-eco-lodge' } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [activeScenario, setActiveScenario] = useState<'standard' | 'all_booked' | 'dorm_only'>('standard');
  const [guestsCount, setGuestsCount] = useState(2);
  const [roomsCount, setRoomsCount] = useState(1);
  const [checkInDate, setCheckInDate] = useState('2026-10-15');
  const [checkOutDate, setCheckOutDate] = useState('2026-10-17');

  const standardRooms: RoomAvailabilityItem[] = [
    {
      id: 1,
      placeId: 1,
      name: 'Phòng riêng Đồi View Ruộng Bậc Thang',
      description: 'Không gian riêng tư, view trọn lòng chảo thung lũng Tú Lệ thơ mộng.',
      maxOccupancy: 2,
      totalRoomCount: 3,
      privateBathroom: 'YES',
      basePrice: 450000,
      status: 'ACTIVE',
      availableRooms: 1,
      availabilityStatus: 'AVAILABLE',
      statusBadgeText: 'ĐÃ CÓ THỂ ĐẶT',
      coverImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      imagesCount: 6,
      bedDescription: '1 giường đôi cỡ lớn',
      features: ['Tối đa 2 khách', 'Ban công ngắm view lúa', 'Vệ sinh khép kín'],
      nightlyPrices: [
        { nightIndex: 1, dateStr: 'Đêm 1 (15/10)', priceLabel: 'Base Price', price: 450000 },
        { nightIndex: 2, dateStr: 'Đêm 2 (16/10)', priceLabel: 'Mùa gặt cao điểm 📈', price: 550000, isSpecialRate: true }
      ],
      totalPrice: 1000000
    },
    {
      id: 2,
      placeId: 1,
      name: 'Gian ngủ tập thể Nhà Sàn truyền thống',
      description: 'Không gian đệm ngủ nhà sàn tập thể chuẩn phong tục người Thái Mường Lò.',
      maxOccupancy: 12,
      totalRoomCount: 1,
      privateBathroom: 'NO',
      basePrice: 180000,
      status: 'ACTIVE',
      availableRooms: 0,
      availabilityStatus: 'NOT_ENOUGH_ROOMS',
      statusBadgeText: 'KHÔNG ĐỦ PHÒNG',
      coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
      imagesCount: 4,
      bedDescription: 'Đệm bông gạo đơn',
      features: ['Sức chứa: 12 khách', 'Rèm che để đảm bảo riêng tư', 'WC dùng chung sạch sẽ'],
      unavailabilityReason: 'Đêm 15/10: còn 7 đệm | Đêm 16/10: còn 0 đệm.\nSố phòng/chỗ trống không đủ cho toàn bộ kỳ lưu trú yêu cầu (2 đêm liên tiếp).'
    },
    {
      id: 3,
      placeId: 1,
      name: 'Phòng Gia Đình Căn Góc Ban Công Kép',
      description: 'Căn góc yên tĩnh nhất khu nghỉ với bồn tắm gỗ pơ-mu ngắm lá thảo dược bản địa.',
      maxOccupancy: 4,
      totalRoomCount: 2,
      privateBathroom: 'YES',
      basePrice: 750000,
      status: 'ACTIVE',
      availableRooms: 0,
      availabilityStatus: 'ONLINE_BOOKING_PAUSED',
      statusBadgeText: 'TẠM NGỪNG NHẬN ĐẶT ONLINE',
      coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      imagesCount: 8,
      bedDescription: '2 giường đôi lớn',
      features: ['Sức chứa: 4 khách', 'Ban công góc kép', 'Bồn tắm gỗ Pơ mu'],
      pausedNotice: 'Homestay kích hoạt tạm dừng nhận đặt trực tuyến cho loại phòng này trong khoảng thời gian đã chọn (Ưu tiên đón đoàn định kỳ & Dành riêng phục vụ sự kiện lễ hội Mùa Cốm Tú Lệ).\n(Quy chế nghiệp vụ: Trạng thái này không đồng nghĩa với tình trạng hết phòng do số lượng khách đặt).'
    }
  ];

  const getFilteredRooms = () => {
    if (activeScenario === 'all_booked') {
      return standardRooms.map((r) => ({
        ...r,
        availabilityStatus: 'NOT_ENOUGH_ROOMS' as const,
        statusBadgeText: 'KHÔNG ĐỦ PHÒNG',
        unavailabilityReason: 'Tất cả các phòng đã được lấp đầy trong khoảng thời gian đã chọn.'
      }));
    }
    if (activeScenario === 'dorm_only') {
      return standardRooms.map((r, idx) => {
        if (idx === 1) {
          return {
            ...r,
            availabilityStatus: 'AVAILABLE' as const,
            statusBadgeText: 'ĐÃ CÓ THỂ ĐẶT',
            unavailabilityReason: undefined,
            nightlyPrices: [
              { nightIndex: 1, dateStr: 'Đêm 1 (15/10)', priceLabel: 'Giá tiêu chuẩn', price: 180000 },
              { nightIndex: 2, dateStr: 'Đêm 2 (16/10)', priceLabel: 'Giá tiêu chuẩn', price: 180000 }
            ],
            totalPrice: 360000
          };
        }
        return {
          ...r,
          availabilityStatus: 'NOT_ENOUGH_ROOMS' as const,
          statusBadgeText: 'KHÔNG ĐỦ PHÒNG',
          unavailabilityReason: 'Đã hết phòng cho kỳ lưu trú này.'
        };
      });
    }
    return standardRooms;
  };

  const rooms = getFilteredRooms();

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-20 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/homestay/${slug}`)}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-semibold text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Chi tiết Homestay
          </button>

          <div className="text-center">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
              TÂY BẮC HERITAGE
            </span>
            <span className="text-xs font-bold text-slate-900 block">
              Kiểm Tra Phòng Và Giá
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#0F3E2E] text-white flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
        </div>

        {/* QA SCENARIO SIMULATOR Bar */}
        <div className="max-w-xl mx-auto mt-2 pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
              QA SCENARIO SIMULATOR (UC-05)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-900 text-[10px] font-bold">
              3 Trạng thái
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'standard', label: '1. Kịch bản chuẩn (3 trạng thái)' },
              { id: 'all_booked', label: '2. Tất cả hết phòng' },
              { id: 'dorm_only', label: '3. Chỉ còn phòng tập thể' }
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setActiveScenario(sc.id as 'standard' | 'all_booked' | 'dorm_only')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeScenario === sc.id
                    ? 'bg-[#0F3E2E] text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 pt-3 space-y-4">
        {/* Compact Homestay Reference Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2 shadow-xs">
          <button
            type="button"
            onClick={() => navigate(`/homestay/${slug}`)}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-3 h-3" />
            Quay lại Chi tiết Homestay (Bản Lìm Mông Eco Lodge)
          </button>

          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=200&q=80"
              alt="Homestay"
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-semibold">
                  Homestay cộng đồng
                </span>
                <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-500" /> 4.9
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                Bản Lìm Mông Eco Lodge
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                Bản Lìm Mông, Xã Tú Lệ, Huyện Văn Chấn, Yên Bái
              </p>
            </div>
          </div>
        </div>

        {/* Stay Criteria Filter Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Nhu cầu lưu trú
            </h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-900">
              2 đêm (Đêm 15, Đêm 16)
            </span>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                NHẬN PHÒNG
              </span>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 block">Từ 14:00</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                TRẢ PHÒNG
              </span>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 block">Trước 12:00</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Check-in từ ngày hiện tại, Check-out sau Check-in. Ngày Check-out không tính đêm lưu trú.
          </p>

          {/* Guests and Rooms Stepper */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">Số khách lưu trú</span>
                <span className="text-xs font-bold text-slate-900">{guestsCount} khách</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGuestsCount((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setGuestsCount((prev) => prev + 1)}
                  className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">Số lượng phòng</span>
                <span className="text-xs font-bold text-slate-900">{roomsCount} phòng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRoomsCount((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setRoomsCount((prev) => prev + 1)}
                  className="w-6 h-6 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            * Số khách dùng để kiểm tra sức chứa tối đa của phòng. Số phòng dùng để đối soát lượng phòng trống khả dụng theo từng đêm.
          </p>

          <button
            type="button"
            className="w-full py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#16503c] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            Kiểm tra phòng khả dụng
          </button>
        </div>

        {/* Business Rule Notice */}
        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200/80 text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
          <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <p>
            <strong>Lưu ý nghiệp vụ:</strong> Kết quả phản ánh tính khả dụng tại thời điểm kiểm tra. Hệ thống <strong>KHÔNG giữ chỗ</strong> hay khóa giá tạm thời cho đến khi hoàn tất thanh toán ở bước Đặt phòng (UC-05).
          </p>
        </div>

        {/* Room List Section */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Danh sách loại phòng</h3>
            <span className="text-xs text-slate-500">{rooms.length} loại phòng phù hợp</span>
          </div>

          {rooms.map((room) => {
            const isAvailable = room.availabilityStatus === 'AVAILABLE';
            const isPaused = room.availabilityStatus === 'ONLINE_BOOKING_PAUSED';

            return (
              <div
                key={room.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Room Image with Badge */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img src={room.coverImage} alt={room.name} className="h-full w-full object-cover" />

                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-xs ${
                        isAvailable
                          ? 'bg-[#0F3E2E] text-white'
                          : isPaused
                          ? 'bg-rose-700 text-white'
                          : 'bg-orange-600 text-white'
                      }`}
                    >
                      {room.statusBadgeText}
                    </span>
                  </div>

                  {room.imagesCount && (
                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                        Xem {room.imagesCount} ảnh thực tế phòng
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{room.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{room.description}</p>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Tối đa {room.maxOccupancy} khách
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bed className="w-3.5 h-3.5 text-slate-400" /> {room.bedDescription}
                    </span>
                    {room.features?.slice(1).map((feat, idx) => (
                      <span key={idx} className="flex items-center gap-1.5">
                        {idx === 0 ? <Mountain className="w-3.5 h-3.5 text-slate-400" /> : <Bath className="w-3.5 h-3.5 text-slate-400" />}
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* Status 1: AVAILABLE breakdown */}
                  {isAvailable && room.nightlyPrices && (
                    <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 space-y-2 text-xs">
                      <span className="font-semibold text-slate-700 block">Chi tiết đơn giá từng đêm:</span>
                      {room.nightlyPrices.map((np, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-600">
                          <span>• {np.dateStr} ({np.priceLabel})</span>
                          <span className="font-bold text-slate-900">
                            {new Intl.NumberFormat('vi-VN').format(np.price)}đ
                          </span>
                        </div>
                      ))}

                      <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            Tổng tiền (2 đêm x 1 phòng):
                          </span>
                          <span className="text-[10px] text-slate-500">Đã tính theo giá từng đêm</span>
                        </div>
                        <span className="text-base font-extrabold text-amber-900">
                          {new Intl.NumberFormat('vi-VN').format(room.totalPrice || 0)}đ
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status 2: NOT_ENOUGH_ROOMS */}
                  {!isAvailable && !isPaused && room.unavailabilityReason && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5" /> Lý do không khả dụng:
                      </div>
                      <p className="whitespace-pre-line leading-relaxed text-[11px] text-slate-700">
                        {room.unavailabilityReason}
                      </p>
                    </div>
                  )}

                  {/* Status 3: ONLINE_BOOKING_PAUSED */}
                  {isPaused && room.pausedNotice && (
                    <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-950 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-rose-900">
                        <Lock className="w-3.5 h-3.5" /> Thông báo ngưng nhận đặt trực tuyến:
                      </div>
                      <p className="whitespace-pre-line leading-relaxed text-[11px] text-slate-700">
                        {room.pausedNotice}
                      </p>
                    </div>
                  )}

                  {/* Action Button depending on status */}
                  {isAvailable ? (
                    <button
                      type="button"
                      className="w-full py-3 rounded-xl bg-[#0F3E2E] hover:bg-[#16503c] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      Tiếp tục đặt phòng (UC-05) <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : isPaused ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" /> Tạm ngừng nhận đặt
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs flex items-center justify-center gap-1 cursor-not-allowed"
                    >
                      Không đủ phòng cho kỳ lưu trú này
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
