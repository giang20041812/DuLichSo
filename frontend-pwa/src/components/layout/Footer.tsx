import { ShieldCheck, Leaf } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

export default function Footer() {
  return (
    <footer className="bg-[#f8f9fa] border-t border-[#66716c]/10 text-[#0f2d3c] py-16 px-4 md:px-8 mt-auto">
      <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-12">
        
        {/* Column 1: Brand & Info */}
        <div className="md:col-span-3">
          <div className="flex flex-col mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#16709a] flex items-center justify-center text-white font-bold text-sm">V</span>
              <span className="text-2xl font-bold font-display text-[#16709a] leading-none tracking-tight">VietJourney</span>
            </div>
            <span className="text-[9px] font-bold text-[#66716c] tracking-widest uppercase mt-1">Khám Phá Việt Nam</span>
          </div>
          <p className="text-[#66716c] text-sm leading-relaxed mb-6">
            Sứ mệnh đồng hành cùng du khách khám phá vẻ đẹp thuần khiết, bảo tồn di sản văn hóa bản địa và thúc đẩy du lịch sinh thái bền vững trên dải đất hình chữ S.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-[#16709a]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-[#66716c]">ISO</span>
                <span className="text-[10px] font-bold">9001:2015</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-[#3f7656]" />
              <div className="flex flex-col text-[#3f7656]">
                <span className="text-[9px] font-bold uppercase">Green Travel</span>
                <span className="text-[10px] font-bold">Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Điểm đến */}
        <div className="md:col-span-2">
          <h3 className="font-bold text-[15px] mb-6 text-[#0f2d3c]">Điểm đến nổi bật</h3>
          <ul className="space-y-3 text-sm text-[#66716c]">
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Vịnh Hạ Long</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Sapa mây ngàn</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Phố cổ Hội An</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Đảo ngọc Phú Quốc</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Ninh Bình non nước</a></li>
          </ul>
        </div>

        {/* Column 3: Dịch vụ */}
        <div className="md:col-span-2">
          <h3 className="font-bold text-[15px] mb-6 text-[#0f2d3c]">Dịch vụ VietJourney</h3>
          <ul className="space-y-3 text-sm text-[#66716c]">
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Tour trọn gói cao cấp</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Homestay sinh thái</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Trải nghiệm bản địa</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Xe đưa đón tiện nghi</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Tour đoàn theo yêu cầu</a></li>
          </ul>
        </div>

        {/* Column 4: Hỗ trợ */}
        <div className="md:col-span-2">
          <h3 className="font-bold text-[15px] mb-6 text-[#0f2d3c]">Hỗ trợ khách hàng</h3>
          <ul className="space-y-3 text-sm text-[#66716c]">
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Trung tâm trợ giúp</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Chính sách hoàn hủy</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Bảo hiểm du lịch</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Điều khoản sử dụng</a></li>
            <li><a href="#" className="hover:text-[#16709a] flex items-center gap-2"><span className="text-[#16709a] text-xs">›</span> Bảo mật thông tin</a></li>
          </ul>
        </div>

        {/* Column 5: Newsletter */}
        <div className="md:col-span-3">
          <h3 className="font-bold text-[15px] mb-4 text-[#0f2d3c]">Nhận ưu đãi 25%</h3>
          <p className="text-[#66716c] text-sm mb-4">Đăng ký bản tin để nhận mã giảm giá 25% cho chuyến du ngoạn đầu tiên và cẩm nang hành trình độc quyền.</p>
          <div className="flex gap-2">
            <Input placeholder="Email của bạn..." className="bg-white" />
            <Button variant="primary">Gửi ngay</Button>
          </div>
          <p className="text-[10px] text-[#66716c] mt-2">Cam kết không gửi thư rác, hủy nhận bất kỳ lúc nào.</p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto w-full pt-6 border-t border-[#66716c]/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#fce5e6] text-[#d04648] px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Đã Đăng Ký Bộ Công Thương
          </div>
          <p className="text-[11px] text-[#66716c]">
            &copy; {new Date().getFullYear()} VietJourney Corp. Bảo lưu mọi quyền. Giấy phép lữ hành quốc tế số 01-2048/TCDL-GP LHQT.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
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
