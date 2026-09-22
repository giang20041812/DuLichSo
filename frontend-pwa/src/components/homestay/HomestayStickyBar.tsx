import { Calendar } from 'lucide-react';

interface HomestayStickyBarProps {
  price?: number;
  unitNote?: string;
  onCheckAvailability?: () => void;
}

export default function HomestayStickyBar({
  price = 450000,
  unitNote = 'đêm',
  onCheckAvailability
}: HomestayStickyBarProps) {
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(price);

  return (
    <aside aria-label="Thanh đặt phòng nhanh" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 shadow-lg">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Giá tham khảo từ
          </span>
          <div className="flex items-baseline">
            <span className="text-lg font-extrabold text-amber-900">
              {formattedPrice}đ
            </span>
            <span className="text-xs text-slate-500 font-medium ml-1">
              / {unitNote}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCheckAvailability}
          className="py-3 px-5 rounded-xl bg-[#0F3E2E] hover:bg-[#16503c] text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Calendar className="w-4 h-4" />
          Kiểm tra phòng & giá
        </button>
      </div>
    </aside>
  );
}
