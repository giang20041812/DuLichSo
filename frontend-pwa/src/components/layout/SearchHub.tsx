import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { MapPin, Calendar, Users, ChevronDown, Search, History, ChevronLeft, ChevronRight, Minus, Plus, ArrowLeft, Navigation, Plane } from "lucide-react"

export default function SearchHub() {
  const [activeTab, setActiveTab] = useState<'destination' | 'dates' | 'occupancy' | null>(null);
  const [mountedTab, setMountedTab] = useState<'destination' | 'dates' | 'occupancy' | null>(null);
  
  // Use a ref to detect click outside
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (
        searchRef.current && 
        !searchRef.current.contains(target) &&
        !target.closest('.search-modal-portal')
      ) {
        setActiveTab(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle animation delay
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (activeTab) {
      setMountedTab(activeTab);
    } else {
      timer = setTimeout(() => setMountedTab(null), 300);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeTab]);

  const closeModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveTab(null);
  };

  // Helper to stop event propagation for modals
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // Desktop Calendar rendering logic
  const renderDesktopCalendar = () => (
    <div 
      className="hidden md:flex absolute top-[110%] left-0 md:-left-[20%] w-full md:w-[700px] bg-white rounded-xl shadow-lg border border-[#66716c]/10 p-4 md:p-6 z-50 flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={stopPropagation}
    >
      {/* Tabs */}
      <div className="flex border-b border-[#66716c]/20 w-full mb-2">
        <button className="flex-1 py-3 text-sm font-bold text-[#16709a] border-b-2 border-[#16709a]">Theo Lịch</button>
        <button className="flex-1 py-3 text-sm font-medium text-[#66716c] hover:text-[#0f2d3c] transition-colors">Linh Hoạt</button>
      </div>

      {/* Calendars Container */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Month 1 */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <button className="p-1 hover:bg-[#f8f9fa] rounded-full text-[#0f2d3c]"><ChevronLeft className="w-5 h-5" /></button>
            <h4 className="font-bold text-[#0f2d3c] text-[15px]">Tháng 9 2026</h4>
            <div className="w-7"></div>
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="text-[#66716c] text-xs font-medium pb-2">{d}</div>)}
            
            <div className="py-2 text-[#66716c]/30 text-sm"></div>
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(d => (
              <div key={d} className="py-2 text-[#66716c]/30 text-sm">{d}</div>
            ))}
            
            <div className="py-2 text-white font-bold bg-[#16709a] rounded-l-lg text-sm cursor-pointer hover:bg-[#125a7a]">18</div>
            <div className="py-2 text-[#0f2d3c] font-bold bg-[#ebf6fa] text-sm cursor-pointer hover:bg-[#dceff0]">19</div>
            <div className="py-2 text-[#0f2d3c] font-bold bg-[#ebf6fa] text-sm cursor-pointer hover:bg-[#dceff0]">20</div>
            <div className="py-2 text-[#0f2d3c] font-bold bg-[#ebf6fa] text-sm cursor-pointer hover:bg-[#dceff0]">21</div>
            <div className="py-2 text-[#0f2d3c] font-bold bg-[#ebf6fa] text-sm cursor-pointer hover:bg-[#dceff0]">22</div>
            <div className="py-2 text-[#0f2d3c] font-bold bg-[#ebf6fa] text-sm cursor-pointer hover:bg-[#dceff0]">23</div>
            <div className="py-2 text-[#0f2d3c] font-bold bg-[#ebf6fa] text-sm cursor-pointer hover:bg-[#dceff0]">24</div>
            <div className="py-2 text-[#0f2d3c] font-bold bg-[#ebf6fa] text-sm cursor-pointer hover:bg-[#dceff0]">25</div>
            <div className="py-2 text-[#0f2d3c] font-bold bg-[#ebf6fa] text-sm cursor-pointer hover:bg-[#dceff0]">26</div>
            <div className="py-2 text-white font-bold bg-[#16709a] rounded-r-lg text-sm cursor-pointer hover:bg-[#125a7a]">27</div>
            
            {[28,29,30].map(d => (
              <div key={d} className="py-2 text-[#0f2d3c] text-sm hover:bg-[#f8f9fa] rounded-full cursor-pointer transition-colors">{d}</div>
            ))}
          </div>
        </div>

        {/* Month 2 */}
        <div className="flex-1 hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <div className="w-7"></div>
            <h4 className="font-bold text-[#0f2d3c] text-[15px]">Tháng 10 2026</h4>
            <button className="p-1 hover:bg-[#f8f9fa] rounded-full text-[#0f2d3c]"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="text-[#66716c] text-xs font-medium pb-2">{d}</div>)}
            
            {[1,2,3].map(d => <div key={`empty-${d}`} className="py-2 text-[#0f2d3c] text-sm hover:bg-[#f8f9fa] rounded-full cursor-pointer transition-colors"></div>)}
            
            {Array.from({length: 31}, (_, i) => i + 1).map(d => (
              <div key={d} className="py-2 text-[#0f2d3c] text-sm hover:bg-[#f8f9fa] rounded-full cursor-pointer transition-colors">{d}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Flexible Date Options */}
      <div>
        <h4 className="text-sm font-bold text-[#0f2d3c] mb-3">Tùy chọn ngày linh hoạt</h4>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-1.5 rounded-full border-2 border-[#16709a] bg-[#ebf6fa] text-[#16709a] text-sm font-semibold">Ngày chính xác</button>
          <button className="px-4 py-1.5 rounded-full border border-[#66716c]/30 text-[#0f2d3c] hover:border-[#0f2d3c] text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4"/> 1 ngày</button>
          <button className="px-4 py-1.5 rounded-full border border-[#66716c]/30 text-[#0f2d3c] hover:border-[#0f2d3c] text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4"/> 2 ngày</button>
          <button className="px-4 py-1.5 rounded-full border border-[#66716c]/30 text-[#0f2d3c] hover:border-[#0f2d3c] text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4"/> 3 ngày</button>
          <button className="px-4 py-1.5 rounded-full border border-[#66716c]/30 text-[#0f2d3c] hover:border-[#0f2d3c] text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4"/> 7 ngày</button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={searchRef} className="w-full relative flex flex-col md:flex-row items-center gap-2.5 md:gap-3 p-3 md:p-3.5 rounded-2xl bg-white/85 backdrop-blur-md shadow-xl border border-white/50 transition-all">
      
      {/* ---------------- DESTINATION ---------------- */}
      <div 
        className={`flex-1 w-full bg-white rounded-xl shadow-sm border px-3.5 h-[58px] flex items-center gap-3 cursor-pointer transition-colors relative z-20 ${activeTab === 'destination' ? 'border-[#e5a33d] ring-2 ring-[#e5a33d]/20' : 'border-[var(--color-muted)]/20 hover:border-[#16709a]'}`}
        onClick={() => setActiveTab('destination')}
      >
        <MapPin className="text-[var(--color-muted)] w-5 h-5 ml-0.5 shrink-0" />
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-0.5">Điểm đến</span>
          <span className="text-sm font-medium text-[var(--color-ink)] truncate">Bạn muốn đi đâu?</span>
        </div>
        
        {/* Desktop Destination Dropdown */}
        {activeTab === 'destination' && (
          <div 
            className="hidden md:flex absolute top-[110%] left-0 w-[380px] bg-white rounded-xl shadow-lg border border-[#66716c]/10 p-4 z-50 flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
            onClick={stopPropagation}
          >
            <div>
              <h4 className="text-sm font-bold text-[#0f2d3c] mb-2">Tìm kiếm gần đây</h4>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 p-2 hover:bg-[#f8f9fa] rounded-lg cursor-pointer">
                  <History className="w-5 h-5 text-[#66716c]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0f2d3c]">TP Hồ Chí Minh</span>
                    <span className="text-[11px] text-[#66716c]">2 người lớn, 1 trẻ em</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-[#f8f9fa] rounded-lg cursor-pointer">
                  <History className="w-5 h-5 text-[#66716c]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0f2d3c]">Hà Nội</span>
                    <span className="text-[11px] text-[#66716c]">2 người lớn</span>
                  </div>
                </div>
              </div>
            </div>
            
            <hr className="border-[#66716c]/10" />
            
            <div>
              <h4 className="text-sm font-bold text-[#0f2d3c] mb-2">Điểm đến nổi bật</h4>
              <div className="flex flex-col gap-1">
                {['Hà Nội', 'Đà Nẵng', 'Hạ Long', 'TP Hồ Chí Minh', 'Ninh Bình'].map((dest, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 hover:bg-[#f8f9fa] rounded-lg cursor-pointer">
                    <MapPin className="w-5 h-5 text-[#66716c]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#0f2d3c]">{dest}</span>
                      <span className="text-[11px] text-[#66716c]">Việt Nam</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* ---------------- DATES ---------------- */}
      <div 
        className={`flex-1 w-full bg-white rounded-xl shadow-sm border px-3.5 h-[58px] flex items-center gap-3 cursor-pointer transition-colors relative z-20 ${activeTab === 'dates' ? 'border-[#e5a33d] ring-2 ring-[#e5a33d]/20' : 'border-[var(--color-muted)]/20 hover:border-[#16709a]'}`}
        onClick={() => setActiveTab('dates')}
      >
        <Calendar className="text-[var(--color-muted)] w-5 h-5 ml-0.5 shrink-0" />
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-0.5">Ngày đi</span>
          <span className="text-sm font-medium text-[var(--color-ink)] truncate">Thứ 6, 18 Th9 &mdash; CN, 20 Th9</span>
        </div>

        {/* Desktop Dates Dropdown */}
        {activeTab === 'dates' && renderDesktopCalendar()}
      </div>
      
      {/* ---------------- OCCUPANCY ---------------- */}
      <div 
        className={`flex-1 w-full bg-white rounded-xl shadow-sm border px-3.5 h-[58px] flex items-center justify-between cursor-pointer transition-colors relative z-20 ${activeTab === 'occupancy' ? 'border-[#e5a33d] ring-2 ring-[#e5a33d]/20' : 'border-[var(--color-muted)]/20 hover:border-[#16709a]'}`}
        onClick={() => setActiveTab('occupancy')}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Users className="text-[var(--color-accent)] w-5 h-5 ml-0.5 shrink-0" />
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-0.5">Hành khách</span>
            <span className="text-sm font-medium text-[var(--color-ink)] truncate">2 người lớn &middot; 1 trẻ em &middot; 1 phòng</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center text-[var(--color-muted)] opacity-60 mr-1 shrink-0">
            <ChevronDown className="w-3.5 h-3.5 rotate-180 -mb-1" />
            <ChevronDown className="w-3.5 h-3.5" />
        </div>

        {/* Desktop Occupancy Dropdown */}
        {activeTab === 'occupancy' && (
          <div 
            className="hidden md:flex absolute top-[110%] right-0 w-[360px] bg-white rounded-xl shadow-lg border border-[#66716c]/10 p-5 z-50 flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-200"
            onClick={stopPropagation}
          >
            {/* Spinners */}
            <div className="flex flex-col gap-4">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0f2d3c]">Người lớn</span>
                <div className="flex items-center gap-4 border border-[#66716c]/30 rounded-lg p-1">
                  <button className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-4 text-center font-medium">2</span>
                  <button className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0f2d3c]">Trẻ em</span>
                <div className="flex items-center gap-4 border border-[#66716c]/30 rounded-lg p-1">
                  <button className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-4 text-center font-medium">1</span>
                  <button className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <select className="border border-[#66716c]/30 rounded-lg p-2 text-sm w-32 outline-none focus:border-[#16709a]">
                  <option>5 tuổi</option>
                  <option>6 tuổi</option>
                </select>
                <p className="text-[11px] text-[#66716c]">Để tìm chỗ nghỉ phù hợp cho cả nhóm và hiển thị giá chính xác, chúng tôi cần biết tuổi của trẻ tại thời điểm trả phòng.</p>
              </div>

              {/* Rooms */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0f2d3c]">Số phòng</span>
                <div className="flex items-center gap-4 border border-[#66716c]/30 rounded-lg p-1">
                  <button className="w-8 h-8 rounded-md text-[#66716c] flex items-center justify-center hover:text-[#16709a] transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-4 text-center font-medium">1</span>
                  <button className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            <hr className="border-[#66716c]/10" />

            {/* Toggles */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#0f2d3c]">Đi công tác?</span>
                <Switch />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0f2d3c]">Đi cùng thú cưng?</span>
                  <Switch />
                </div>
                <p className="text-[11px] text-[#66716c]">Vật nuôi hỗ trợ người khuyết tật không được coi là thú cưng. <a href="#" className="text-[#16709a] hover:underline">Đọc thêm về chính sách mang theo vật nuôi hỗ trợ</a></p>
              </div>
            </div>

            {/* Done Button */}
            <Button 
              className="w-full bg-[#16709a] text-white hover:bg-[#125a7a] font-bold mt-2 rounded-xl py-6" 
              onClick={closeModal}
            >
              Áp dụng
            </Button>
          </div>
        )}
      </div>
      
      {/* Search Button */}
      <div className="w-full md:w-auto shrink-0 flex items-center">
        <Button size="lg" className="rounded-xl w-full md:w-auto px-8 h-[58px] shadow-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-600)] text-base font-semibold flex items-center justify-center gap-2.5 transition-all">
          <Search className="w-5 h-5" />
          Tìm Chuyến Đi
        </Button>
      </div>

      {/* ========================================================= */}
      {/* MOBILE MODALS (Rendered as bottom sheets)                 */}
      {/* ========================================================= */}
      
      {/* Mobile Destination Modal */}
      {mountedTab === 'destination' && typeof window !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex justify-center items-end search-modal-portal">
          <div 
            className={`absolute inset-0 bg-[#0f2d3c]/60 backdrop-blur-sm ${activeTab === 'destination' ? 'fade-in-overlay' : 'fade-out-overlay'}`} 
            onClick={closeModal} 
          />
          <div 
            className={`relative w-full max-h-[90vh] bg-white rounded-t-2xl flex flex-col shadow-2xl ${activeTab === 'destination' ? 'modal-slide-in' : 'modal-slide-out'}`} 
            onClick={stopPropagation}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-[#66716c]/20 rounded-full"></div>
            </div>
            
            <div className="flex items-center gap-3 px-4 pb-4 border-b border-[#66716c]/10 bg-white">
              <button onClick={closeModal} className="p-1"><ArrowLeft className="w-6 h-6 text-[#0f2d3c]" /></button>
              <div className="flex-1 bg-white border-2 border-[#e5a33d] rounded-lg p-2.5 flex items-center shadow-sm">
                 <input autoFocus type="text" placeholder="Nhập điểm đến" className="w-full outline-none text-[#0f2d3c] text-base" />
              </div>
            </div>
            
            <div className="flex flex-col p-4 gap-4 bg-white flex-1 overflow-y-auto">
               <div className="flex items-center gap-4 cursor-pointer hover:bg-[#f8f9fa] p-2 rounded-lg">
                 <div className="p-2 bg-[#ebf6fa] rounded-full text-[#16709a]"><Navigation className="w-5 h-5"/></div>
                 <span className="font-bold text-[#16709a] text-base">Xung quanh vị trí hiện tại</span>
               </div>
               <hr className="border-[#66716c]/10" />
               <div className="flex items-center gap-4 cursor-pointer hover:bg-[#f8f9fa] p-2 rounded-lg">
                 <div className="p-2 bg-[#ebf6fa] rounded-full text-[#16709a]"><Plane className="w-5 h-5"/></div>
                 <span className="font-bold text-[#0f2d3c] text-base">Tìm vé máy bay rẻ</span>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Dates Modal */}
      {mountedTab === 'dates' && typeof window !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex justify-center items-end search-modal-portal">
          <div 
            className={`absolute inset-0 bg-[#0f2d3c]/60 backdrop-blur-sm ${activeTab === 'dates' ? 'fade-in-overlay' : 'fade-out-overlay'}`} 
            onClick={closeModal} 
          />
          <div 
            className={`relative w-full max-h-[90vh] bg-white rounded-t-2xl flex flex-col shadow-2xl ${activeTab === 'dates' ? 'modal-slide-in' : 'modal-slide-out'}`} 
            onClick={stopPropagation}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-[#66716c]/20 rounded-full"></div>
            </div>
            
            <div className="px-4 pb-4 border-b border-[#66716c]/10 flex flex-col gap-4 bg-white shadow-sm z-10 shrink-0">
              <h3 className="font-bold text-xl text-[#0f2d3c]">Chọn ngày</h3>
              <div className="flex w-full">
                <button className="flex-1 pb-3 border-b-2 border-[#16709a] text-[#16709a] font-bold">Lịch</button>
                <button className="flex-1 pb-3 border-b-2 border-transparent text-[#66716c] font-medium">Ngày linh hoạt</button>
              </div>
              <div className="grid grid-cols-7 text-center">
                {['T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7', 'CN'].map(d => <span key={d} className="text-xs font-medium text-[#66716c]">{d}</span>)}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-8 bg-white pb-[200px]">
              <div>
                <h4 className="font-bold text-[#0f2d3c] mb-4 text-center">Tháng 9 2026</h4>
                <div className="grid grid-cols-7 gap-y-4 text-center">
                   <div className="py-2"></div>
                   {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(d => (
                     <div key={d} className="py-2 text-[#66716c]/40 text-base">{d}</div>
                   ))}
                   <div className="py-2 bg-[#16709a] text-white font-bold rounded-l-md text-base">18</div>
                   <div className="py-2 bg-[#16709a] text-white font-bold text-base">19</div>
                   <div className="py-2 bg-[#16709a] text-white font-bold rounded-r-md text-base">20</div>
                   
                   {[21,22,23,24,25,26,27,28,29,30].map(d => (
                     <div key={d} className="py-2 text-[#0f2d3c] text-base">{d}</div>
                   ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[#0f2d3c] mb-4 text-center">Tháng 10 2026</h4>
                <div className="grid grid-cols-7 gap-y-4 text-center">
                   {[1,2,3].map(d => <div key={`empty-${d}`} className="py-2"></div>)}
                   {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                     <div key={d} className="py-2 text-[#0f2d3c] text-base">{d}</div>
                   ))}
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#66716c]/10 bg-white flex flex-col gap-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] rounded-b-2xl">
               <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                 <button className="px-5 py-2 rounded-full border-2 border-[#16709a] bg-white text-[#16709a] font-bold whitespace-nowrap text-sm">Ngày chính xác</button>
                 <button className="px-5 py-2 rounded-full border border-[#66716c]/30 text-[#0f2d3c] whitespace-nowrap text-sm">± 1 ngày</button>
                 <button className="px-5 py-2 rounded-full border border-[#66716c]/30 text-[#0f2d3c] whitespace-nowrap text-sm">± 2 ngày</button>
                 <button className="px-5 py-2 rounded-full border border-[#66716c]/30 text-[#0f2d3c] whitespace-nowrap text-sm">± 3 ngày</button>
               </div>
               <div className="text-center font-bold text-[#0f2d3c] text-sm">18 Th9 - 20 Th9 <span className="font-normal text-[#66716c]">(2 đêm)</span></div>
               <Button className="w-full bg-[#16709a] text-white py-6 text-lg rounded-xl font-bold" onClick={closeModal}>Chọn</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Occupancy Modal */}
      {mountedTab === 'occupancy' && typeof window !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex justify-center items-end search-modal-portal">
          <div 
            className={`absolute inset-0 bg-[#0f2d3c]/60 backdrop-blur-sm ${activeTab === 'occupancy' ? 'fade-in-overlay' : 'fade-out-overlay'}`} 
            onClick={closeModal} 
          />
          <div 
            className={`relative w-full max-h-[90vh] bg-white rounded-t-2xl flex flex-col shadow-2xl ${activeTab === 'occupancy' ? 'modal-slide-in' : 'modal-slide-out'}`} 
            onClick={stopPropagation}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-[#66716c]/20 rounded-full"></div>
            </div>
            
            <div className="px-4 pb-4 border-b border-[#66716c]/10 bg-white shadow-sm flex items-center shrink-0">
              <h3 className="font-bold text-xl text-[#0f2d3c] mx-auto">Chọn phòng và khách</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-8 bg-white">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0f2d3c] text-lg">Phòng</span>
                  <div className="flex items-center gap-5 border border-[#66716c]/30 rounded-lg p-1.5">
                    <button className="text-[#66716c] p-1"><Minus className="w-6 h-6"/></button>
                    <span className="w-6 text-center font-bold text-[#0f2d3c] text-lg">1</span>
                    <button className="text-[#16709a] p-1"><Plus className="w-6 h-6"/></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0f2d3c] text-lg">Người lớn</span>
                  <div className="flex items-center gap-5 border border-[#66716c]/30 rounded-lg p-1.5">
                    <button className="text-[#16709a] p-1"><Minus className="w-6 h-6"/></button>
                    <span className="w-6 text-center font-bold text-[#0f2d3c] text-lg">2</span>
                    <button className="text-[#16709a] p-1"><Plus className="w-6 h-6"/></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#0f2d3c] text-lg">Trẻ em</span>
                    <span className="text-sm text-[#66716c]">0 - 17 tuổi</span>
                  </div>
                  <div className="flex items-center gap-5 border border-[#66716c]/30 rounded-lg p-1.5">
                    <button className="text-[#66716c] p-1"><Minus className="w-6 h-6"/></button>
                    <span className="w-6 text-center font-bold text-[#0f2d3c] text-lg">0</span>
                    <button className="text-[#16709a] p-1"><Plus className="w-6 h-6"/></button>
                  </div>
                </div>
              </div>
              
              <hr className="border-[#66716c]/10" />
              
              <div className="flex flex-col gap-6 pb-4">
                <div className="flex items-center justify-between">
                   <span className="font-bold text-[#0f2d3c] text-base">Đi công tác?</span>
                   <Switch className="scale-125 origin-right" />
                </div>
                <div className="flex flex-col gap-2">
                   <div className="flex items-center justify-between">
                     <span className="font-bold text-[#0f2d3c] text-base">Mang thú cưng đi cùng</span>
                     <Switch className="scale-125 origin-right" />
                   </div>
                   <p className="text-sm text-[#66716c] mt-2">Động vật trợ giúp không được xem là vật nuôi. <a href="#" className="text-[#16709a] hover:underline">Đọc thêm về chủ đề đi du lịch cùng động vật trợ giúp</a></p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#66716c]/10 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.05)] shrink-0 rounded-b-2xl">
               <Button className="w-full bg-[#16709a] hover:bg-[#125a7a] text-white py-7 font-bold text-lg rounded-xl" onClick={closeModal}>Áp dụng</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
