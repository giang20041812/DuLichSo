import { BookOpen } from 'lucide-react';

interface HomestayStorySectionProps {
  description?: string;
}

export default function HomestayStorySection({ description }: HomestayStorySectionProps) {
  const content = description || `Nằm ôm trọn vách núi Lìm Mông hùng vĩ, Bản Lìm Mông Eco Lodge gìn giữ trọn vẹn nét văn hóa của người Thái Trắng với nếp nhà sàn pơ mu thơm lừng. Từ hiên nhà, bạn có thể phóng tầm mắt ngắm trọn thung lũng Tú Lệ trập trùng ruộng bậc thang ngát hương lúa mới.

Homestay cam kết du lịch sinh thái bền vững, phục vụ các món ăn bản địa nấu từ nông sản tự cung tự cấp, nước sinh hoạt từ mạch nguồn tự nhiên mát lành. Không gian yên tĩnh, hòa mình cùng nếp sống mộc mạc và thân thiện của đồng bào vùng cao.`;

  return (
    <section className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
        <BookOpen className="w-5 h-5 text-emerald-700" />
        <h2>Giới thiệu Homestay</h2>
      </div>

      <div className="text-sm leading-relaxed text-slate-700 space-y-2.5 font-normal whitespace-pre-line">
        {content}
      </div>
    </section>
  );
}
