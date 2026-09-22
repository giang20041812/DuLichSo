import { ShieldCheck, Leaf, Compass } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

export default function Footer() {
  return (
    <footer className="bg-[#f8f9fa] border-t border-[#66716c]/10 text-[#0f2d3c] py-10 md:py-16 px-4 md:px-8 mt-auto">
      <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-6 md:mb-12">
        
        {/* Column 1: Brand & Info (Luôn hiển thị cả trên mobile & desktop) */}
        <div className="md:col-span-3">
          <div className="flex flex-col mb-3 md:mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#048c73] flex items-center justify-center text-white shadow-sm">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold font-display text-[#048c73] leading-none tracking-tight">VietJourney</span>
            </div>
            <span className="text-[10px] font-bold text-[#66716c] tracking-widest uppercase mt-1">Khám Phá Việt Nam</span>
          </div>
          <p className="text-[#66716c] text-sm leading-relaxed mb-0 md:mb-6">
            Sứ mệnh đồng hành cùng du khách khám phá vẻ đẹp thuần khiết, bảo tồn di sản văn hóa bản địa và thúc đẩy du lịch sinh thái bền vững trên dải đất hình chữ S.
          </p>

          {/* Chứng chỉ - Chỉ hiển thị trên desktop (ẩn khi responsive) */}
          <div className="hidden md:flex gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-[#048c73]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-[#66716c]">ISO</span>
                <span className="text-[10px] font-bold">9001:2015</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-[#048c73]" />
              <div className="flex flex-col text-[#048c73]">
                <span className="text-[9px] font-bold uppercase">Green Travel</span>
                <span className="text-[10px] font-bold">Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Điểm đến - Ẩn khi responsive */}
        <div className="hidden md:block md:col-span-2">
          <h4 className="font-bold font-display text-base mb-4">Điểm Đến Hấp Dẫn</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-[#66716c]">
            <li><a href="/destinations" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Vịnh Hạ Long</a></li>
            <li><a href="/destinations" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Sapa mây ngàn</a></li>
            <li><a href="/destinations" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Phố cổ Hội An</a></li>
            <li><a href="/destinations" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Đảo ngọc Phú Quốc</a></li>
            <li><a href="/destinations" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Ninh Bình non nước</a></li>
          </ul>
        </div>

        {/* Column 3: Dịch vụ - Ẩn khi responsive */}
        <div className="hidden md:block md:col-span-2">
          <h4 className="font-bold font-display text-base mb-4">Dịch Vụ Nổi Bật</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-[#66716c]">
            <li><a href="/tours" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Tour trọn gói cao cấp</a></li>
            <li><a href="/homestays" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Homestay sinh thái</a></li>
            <li><a href="/explore" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Trải nghiệm bản địa</a></li>
            <li><a href="/transport" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Xe đưa đón tiện nghi</a></li>
            <li><a href="/services" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Tiện ích du lịch</a></li>
          </ul>
        </div>

        {/* Column 4: Hỗ trợ - Ẩn khi responsive */}
        <div className="hidden md:block md:col-span-2">
          <h4 className="font-bold font-display text-base mb-4">Trợ Giúp & Pháp Lý</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-[#66716c]">
            <li><a href="#" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Trung tâm trợ giúp</a></li>
            <li><a href="#" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Chính sách hoàn hủy</a></li>
            <li><a href="#" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Bảo hiểm du lịch</a></li>
            <li><a href="#" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Điều khoản sử dụng</a></li>
            <li><a href="#" className="hover:text-[#048c73] flex items-center gap-2"><span className="text-[#048c73] text-xs">›</span> Bảo mật thông tin</a></li>
          </ul>
        </div>

        {/* Column 5: Newsletter - Ẩn khi responsive */}
        <div className="hidden md:block md:col-span-3">
          <h3 className="font-bold text-[15px] mb-4 text-[#0f2d3c]">Nhận ưu đãi 25%</h3>
          <p className="text-[#66716c] text-sm mb-4">Đăng ký bản tin để nhận mã giảm giá 25% cho chuyến du ngoạn đầu tiên và cẩm nang hành trình độc quyền.</p>
          <div className="flex gap-2">
            <Input placeholder="Email của bạn..." className="bg-white rounded-md" />
            <Button variant="primary" className="rounded-md">Gửi ngay</Button>
          </div>
          <p className="text-[10px] text-[#66716c] mt-2">Cam kết không gửi thư rác, hủy nhận bất kỳ lúc nào.</p>
        </div>
      </div>

      {/* Bottom Bar - Chỉ hiển thị đầy đủ trên desktop, trên responsive chỉ cần dòng bản quyền gọn gàng */}
      <div className="max-w-[1280px] mx-auto w-full pt-4 md:pt-6 border-t border-[#66716c]/10 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
          <div className="hidden md:flex bg-[#fce5e6] text-[#d04648] px-3 py-1.5 rounded-md text-[10px] font-bold items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Đã Đăng Ký Bộ Công Thương
          </div>
          <p className="text-[11px] text-[#66716c]">
            &copy; {new Date().getFullYear()} VietJourney. Bảo lưu mọi quyền.
          </p>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <span className="text-[11px] text-[#66716c]">Cổng thanh toán an toàn:</span>
          <div className="flex items-center gap-3 text-[10px] font-bold text-[#0f2d3c]">
            <span>VNPAY</span>
            <span>MOMO</span>
            <span>VISA</span>
            <span>MASTERCARD</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
