import { MapPin, ShieldCheck, Calendar } from 'lucide-react';

interface HomestayHeaderInfoProps {
  name: string;
  address?: string;
  verifiedGpsText?: string;
  priceRefMin?: number;
  priceUnitNote?: string;
  onCheckAvailability?: () => void;
}

export default function HomestayHeaderInfo({
  name,
  address = 'Bản Lìm Mông, Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái',
  verifiedGpsText = '21.751214 - 104.318420',
  priceRefMin = 450000,
  priceUnitNote = 'đêm',
  onCheckAvailability
}: HomestayHeaderInfoProps) {
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(priceRefMin);

  return (
    <div className="space-y-4 pt-1">
      {/* Title & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {name}
        </h1>
        <div className="self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang mở đón khách
          </span>
        </div>
      </div>

      {/* Address & Verified GPS */}
      <div className="space-y-1.5 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>{address}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 pl-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Tọa độ kiểm chứng: <strong className="font-medium text-slate-700">{verifiedGpsText}</strong></span>
        </div>
      </div>

      {/* Pricing & CTA Card */}
      <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-baseline justify-between">
          <span className="text-xs sm:text-sm font-medium text-slate-600">
            Giá cơ bản tham khảo:
          </span>
          <div className="text-right">
            <span className="text-xs font-semibold text-amber-900 mr-1.5 uppercase">TỪ</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900">
              {formattedPrice}đ
            </span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium ml-1">
              / {priceUnitNote}
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          * Giá có thể thay đổi tùy theo mùa vụ và thời điểm đặt phòng. Vui lòng kiểm tra phòng trống để có giá chính xác theo ngày cụ thể.
        </p>

        <button
          type="button"
          onClick={onCheckAvailability}
          className="w-full py-3.5 px-4 rounded-xl bg-[#0F3E2E] hover:bg-[#16503c] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99]"
        >
          <Calendar className="w-4 h-4" />
          Kiểm tra phòng & giá
        </button>
      </div>
    </div>
  );
}
