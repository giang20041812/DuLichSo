import { Bed, Users, Mountain, ArrowRight } from 'lucide-react';
import { RoomTypeItem } from '../../types/room';

interface HomestayRoomSectionProps {
  rooms: RoomTypeItem[];
  onSelectRoom?: (room: RoomTypeItem) => void;
}

export default function HomestayRoomSection({ rooms, onSelectRoom }: HomestayRoomSectionProps) {
  return (
    <section className="space-y-3.5 pt-2">
      <div className="space-y-0.5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          Các loại phòng tham khảo
        </h2>
        <p className="text-xs text-slate-500">
          Các loại phòng đang phục vụ tại homestay
        </p>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => {
          const formattedPrice = new Intl.NumberFormat('vi-VN').format(room.basePrice);
          const isAvailable = room.availableRooms > 0;

          return (
            <div
              key={room.id}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-shadow"
            >
              {/* Room Image */}
              <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-100">
                <img
                  src={room.coverImage || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'}
                  alt={room.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />

                {/* Badge overlay */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-xs shadow-xs ${
                      isAvailable
                        ? 'bg-black/70 text-white'
                        : 'bg-slate-700/85 text-slate-200'
                    }`}
                  >
                    {room.badgeText || (isAvailable ? `Còn ${room.availableRooms} phòng` : 'Hết phòng')}
                  </span>
                </div>
              </div>

              {/* Room Info Body */}
              <div className="p-4 space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {room.name}
                </h3>

                {/* Specs List */}
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                  {room.bedDescription && (
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{room.bedDescription}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Tối đa {room.maxOccupancy} người</span>
                  </div>

                  {room.features && room.features.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Mountain className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{room.features.join(' • ')}</span>
                    </div>
                  )}
                </div>

                {/* Price & Action Button */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-normal">Giá tham khảo</span>
                    <div className="flex items-baseline">
                      <span className="text-base sm:text-lg font-extrabold text-amber-900">
                        {formattedPrice}đ
                      </span>
                      <span className="text-xs text-slate-500 ml-1">
                        {room.unitNote || '/ đêm'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectRoom?.(room)}
                    className="py-2 px-3.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Xem loại phòng này <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
