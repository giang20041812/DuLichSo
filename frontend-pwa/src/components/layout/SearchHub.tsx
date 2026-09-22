import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { MapPin, Calendar, Users, ChevronDown, Search, History, ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react"

export default function SearchHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'destination' | 'dates' | 'occupancy' | null>(null);
  const [mountedTab, setMountedTab] = useState<'destination' | 'dates' | 'occupancy' | null>(null);
  
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [occupancy, setOccupancy] = useState({ adults: 2, children: 0, rooms: 1 });
  
  const [startDate, setStartDate] = useState<{ day: number, month: number, year?: number } | null>(null);
  const [endDate, setEndDate] = useState<{ day: number, month: number, year?: number } | null>(null);
  const [hoverDate, setHoverDate] = useState<{ day: number, month: number, year?: number } | null>(null);

  const handleDateClick = (day: number, month: number) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate({ day, month });
      setEndDate(null);
      setDates(`${day} Th${month}`);
    } else {
      const startNum = startDate.month * 100 + startDate.day;
      const currentNum = month * 100 + day;
      if (currentNum > startNum) {
        setEndDate({ day, month });
        setDates(`${startDate.day} Th${startDate.month} - ${day} Th${month}`);
      } else {
        setStartDate({ day, month });
        setEndDate(null);
        setDates(`${day} Th${month}`);
      }
    }
  };
  
  const hasFilters = destination !== "" || dates !== "" || occupancy.adults !== 2 || occupancy.children !== 0 || occupancy.rooms !== 1;
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const defaultStart = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
    const defaultEnd = { day: tomorrow.getDate(), month: tomorrow.getMonth() + 1, year: tomorrow.getFullYear() };
    
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setDates(`${defaultStart.day} Th${defaultStart.month} - ${defaultEnd.day} Th${defaultEnd.month}`);
  }, []);

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

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDestination("");
    setDates("");
    setStartDate(null);
    setEndDate(null);
    setOccupancy({ adults: 2, children: 0, rooms: 1 });
  }

  const handleSearch = () => {
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    // Auto-select today and tomorrow if dates are not selected
    if (!finalStartDate) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      finalStartDate = { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
      finalEndDate = { day: tomorrow.getDate(), month: tomorrow.getMonth() + 1, year: tomorrow.getFullYear() };
      
      setStartDate(finalStartDate);
      setEndDate(finalEndDate);
      setDates(`${finalStartDate.day} Th${finalStartDate.month} - ${finalEndDate.day} Th${finalEndDate.month}`);
    }

    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);
    
    if (finalStartDate) {
      const startStr = `${finalStartDate.year || new Date().getFullYear()}-${String(finalStartDate.month).padStart(2, '0')}-${String(finalStartDate.day).padStart(2, '0')}`;
      params.append('checkIn', startStr);
    }
    if (finalEndDate) {
      const endStr = `${finalEndDate.year || new Date().getFullYear()}-${String(finalEndDate.month).padStart(2, '0')}-${String(finalEndDate.day).padStart(2, '0')}`;
      params.append('checkOut', endStr);
    }

    params.append('adults', occupancy.adults.toString());
    params.append('children', occupancy.children.toString());
    params.append('rooms', occupancy.rooms.toString());

    navigate(`/homestays?${params.toString()}`);
    setActiveTab(null);
  };

  const renderDay = (d: number, month: number, disabled = false) => {
    if (disabled) {
      return <div key={`empty-${d}`} className="py-2 text-[#66716c]/30 text-sm">{d}</div>;
    }
    
    const current = month * 100 + d;
    const start = startDate ? startDate.month * 100 + startDate.day : null;
    const end = endDate ? endDate.month * 100 + endDate.day : null;
    const hover = hoverDate ? hoverDate.month * 100 + hoverDate.day : null;

    let isStart = start === current;
    let isEnd = end === current;
    
    let actualEnd = end || (hover && start !== null && hover > start ? hover : null);
    
    let inRange = start !== null && actualEnd !== null && current > start && current < actualEnd;
    let isTempEnd = !end && hover === current && start !== null && hover > start;
    if (isTempEnd) isEnd = true;

    let bgClass = "bg-transparent";
    let textClass = "text-[#0a2e26]";
    let roundClass = "rounded-md";

    if (isStart && isEnd) {
      bgClass = "bg-[#048c73]";
      textClass = "text-white font-bold";
      roundClass = "rounded-md";
    } else if (isStart) {
      bgClass = "bg-[#048c73]";
      textClass = "text-white font-bold";
      roundClass = "rounded-l-md";
    } else if (isEnd) {
      bgClass = "bg-[#048c73]";
      textClass = "text-white font-bold";
      roundClass = "rounded-r-md";
    } else if (inRange) {
      bgClass = "bg-[#edfbf7]";
      roundClass = "rounded-none";
    } else {
      bgClass = "hover:bg-[#f0fbf7]";
    }

    return (
      <div 
        key={d} 
        onMouseEnter={() => startDate && !endDate && setHoverDate({day: d, month})}
        onMouseLeave={() => setHoverDate(null)}
        onClick={() => handleDateClick(d, month)}
        className={`py-2 text-sm cursor-pointer transition-colors ${bgClass} ${textClass} ${roundClass}`}
      >
        {d}
      </div>
    );
  };

  const renderDesktopCalendar = () => (
    <div 
      className="hidden md:flex absolute top-[110%] left-0 md:-left-[20%] w-full md:w-[700px] bg-white rounded-lg shadow-2xl border border-[#59766e]/20 p-4 md:p-6 z-[100] flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={stopPropagation}
    >
      <div className="flex border-b border-[#59766e]/20 w-full mb-2">
        <button className="flex-1 py-3 text-sm font-bold text-[#048c73] border-b-2 border-[#048c73]">Theo Lịch</button>
        <button className="flex-1 py-3 text-sm font-medium text-[#59766e] hover:text-[#0a2e26] transition-colors">Linh Hoạt</button>
      </div>

      <div className="flex flex-col md:flex-row gap-8" onMouseLeave={() => setHoverDate(null)}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-[#0a2e26] text-base">Tháng {startDate?.month || 9}, 2026</h4>
            <button className="p-1 hover:bg-[#f0fbf7] rounded-md text-[#0a2e26]"><ChevronLeft className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-semibold text-[#59766e]">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({length: 30}, (_, i) => i + 1).map(d => renderDay(d, startDate?.month || 9))}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-[#0a2e26] text-base">Tháng {(startDate?.month || 9) + 1}, 2026</h4>
            <button className="p-1 hover:bg-[#f0fbf7] rounded-md text-[#0a2e26]"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-semibold text-[#59766e]">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({length: 31}, (_, i) => i + 1).map(d => renderDay(d, (startDate?.month || 9) + 1))}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-[#0a2e26] mb-3">Tùy chọn ngày linh hoạt</h4>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setDates("Ngày chính xác"); }} className="px-4 py-1.5 rounded-md border-2 border-[#048c73] bg-[#edfbf7] text-[#048c73] text-sm font-semibold">Ngày chính xác</button>
          <button onClick={() => { setDates("± 1 ngày"); }} className="px-4 py-1.5 rounded-md border border-[#59766e]/30 text-[#0a2e26] hover:border-[#048c73] text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4"/> 1 ngày</button>
          <button onClick={() => { setDates("± 2 ngày"); }} className="px-4 py-1.5 rounded-md border border-[#59766e]/30 text-[#0a2e26] hover:border-[#048c73] text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4"/> 2 ngày</button>
          <button onClick={() => { setDates("± 3 ngày"); }} className="px-4 py-1.5 rounded-md border border-[#59766e]/30 text-[#0a2e26] hover:border-[#048c73] text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4"/> 3 ngày</button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={searchRef} className="w-full relative z-30 flex flex-col md:flex-row items-center gap-2.5 md:gap-3 p-3 md:p-3.5 rounded-lg bg-white/90 backdrop-blur-md shadow-xl border border-white/60 transition-all text-left">
      
      {/* ---------------- DESTINATION ---------------- */}
      <div 
        className={`flex-1 w-full min-w-0 bg-white rounded-md shadow-sm border px-3.5 h-[58px] flex items-center gap-3 cursor-pointer transition-colors relative ${activeTab === 'destination' ? 'z-40 border-[#3dc9d9] ring-2 ring-[#3dc9d9]/20' : 'z-20 border-[var(--color-muted)]/20 hover:border-[#048c73]'}`}
        onClick={() => setActiveTab('destination')}
      >
        <MapPin className="text-[var(--color-primary)] w-5 h-5 ml-0.5 shrink-0" />
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-0.5">Địa điểm</span>
          <span className="text-sm font-semibold text-[var(--color-ink-deep)] truncate">
            {destination || "Bạn muốn đi đâu?"}
          </span>
        </div>
        
        {activeTab === 'destination' && (
          <div 
            className="hidden md:flex absolute top-[110%] left-0 w-[420px] bg-white rounded-xl shadow-2xl border border-[#66716c]/10 p-4 z-[100] flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
            onClick={stopPropagation}
          >
            <div>
              <h4 className="text-sm font-bold text-[#0f2d3c] mb-2">Tìm kiếm gần đây</h4>
              <div className="flex flex-col gap-1">
                <div onClick={() => { setDestination("TP Hồ Chí Minh"); setActiveTab('dates'); }} className="flex items-center gap-3 p-2 hover:bg-[#f8f9fa] rounded-lg cursor-pointer">
                  <History className="w-5 h-5 text-[#66716c]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0f2d3c]">TP Hồ Chí Minh</span>
                    <span className="text-[11px] text-[#66716c]">2 người lớn, 1 trẻ em</span>
                  </div>
                </div>
                <div onClick={() => { setDestination("Hà Nội"); setActiveTab('dates'); }} className="flex items-center gap-3 p-2 hover:bg-[#f8f9fa] rounded-lg cursor-pointer">
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
                  <div key={i} onClick={() => { setDestination(dest); setActiveTab('dates'); }} className="flex items-center gap-3 p-2 hover:bg-[#f8f9fa] rounded-lg cursor-pointer">
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
        className={`flex-1 w-full min-w-0 bg-white rounded-md shadow-sm border px-3.5 h-[58px] flex items-center gap-3 cursor-pointer transition-colors relative ${activeTab === 'dates' ? 'z-40 border-[#048c73] ring-2 ring-[#048c73]/20' : 'z-20 border-[var(--color-muted)]/20 hover:border-[#048c73]'}`}
        onClick={() => setActiveTab('dates')}
      >
        <Calendar className="text-[var(--color-primary)] w-5 h-5 ml-0.5 shrink-0" />
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-0.5">Ngày đi</span>
          <span className="text-sm font-semibold text-[var(--color-ink-deep)] truncate">
            {dates || "Thêm ngày"}
          </span>
        </div>

        {activeTab === 'dates' && renderDesktopCalendar()}
      </div>
      
      {/* ---------------- OCCUPANCY ---------------- */}
      <div 
        className={`flex-1 w-full min-w-0 bg-white rounded-md shadow-sm border px-3.5 h-[58px] flex items-center justify-between cursor-pointer transition-colors relative ${activeTab === 'occupancy' ? 'z-40 border-[#048c73] ring-2 ring-[#048c73]/20' : 'z-20 border-[var(--color-muted)]/20 hover:border-[#048c73]'}`}
        onClick={() => setActiveTab('occupancy')}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Users className="text-[var(--color-primary)] w-5 h-5 ml-0.5 shrink-0" />
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-0.5">Hành khách</span>
            <span className="text-sm font-semibold text-[var(--color-ink-deep)] truncate">
              {hasFilters || destination || dates || occupancy.adults !== 2 ? `${occupancy.adults} người lớn · ${occupancy.children} trẻ em · ${occupancy.rooms} phòng` : "Thêm khách"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center text-[var(--color-muted)] opacity-60 mr-1 shrink-0">
            <ChevronDown className="w-3.5 h-3.5 rotate-180 -mb-1" />
            <ChevronDown className="w-3.5 h-3.5" />
        </div>

        {activeTab === 'occupancy' && (
          <div 
            className="hidden md:flex absolute top-[110%] right-0 w-[360px] bg-white rounded-lg shadow-2xl border border-[#66716c]/10 p-5 z-[100] flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-200"
            onClick={stopPropagation}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0f2d3c]">Người lớn</span>
                <div className="flex items-center gap-4 border border-[#66716c]/30 rounded-lg p-1">
                  <button onClick={() => setOccupancy(p => ({...p, adults: Math.max(1, p.adults - 1)}))} className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-4 text-center font-medium">{occupancy.adults}</span>
                  <button onClick={() => setOccupancy(p => ({...p, adults: p.adults + 1}))} className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0f2d3c]">Trẻ em</span>
                <div className="flex items-center gap-4 border border-[#66716c]/30 rounded-lg p-1">
                  <button onClick={() => setOccupancy(p => ({...p, children: Math.max(0, p.children - 1)}))} className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-4 text-center font-medium">{occupancy.children}</span>
                  <button onClick={() => setOccupancy(p => ({...p, children: p.children + 1}))} className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0f2d3c]">Số phòng</span>
                <div className="flex items-center gap-4 border border-[#66716c]/30 rounded-lg p-1">
                  <button onClick={() => setOccupancy(p => ({...p, rooms: Math.max(1, p.rooms - 1)}))} className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-4 text-center font-medium">{occupancy.rooms}</span>
                  <button onClick={() => setOccupancy(p => ({...p, rooms: p.rooms + 1}))} className="w-8 h-8 rounded-md text-[#16709a] flex items-center justify-center hover:bg-[#ebf6fa] transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            <hr className="border-[#66716c]/10" />

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
              </div>
            </div>

            <Button 
              className="w-full bg-[#048c73] text-white hover:bg-[#03725e] font-bold mt-2 rounded-md py-6" 
              onClick={closeModal}
            >
              Áp dụng
            </Button>
          </div>
        )}
      </div>
      
      {/* ---------------- SEARCH BUTTON ---------------- */}
      <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
        <button 
          onClick={handleClear}
          className="h-[58px] w-[58px] flex items-center justify-center bg-white border border-[var(--color-muted)]/20 hover:border-[#048c73] text-[var(--color-muted)] hover:text-[#048c73] rounded-md transition-colors shrink-0 shadow-sm"
          title="Bỏ lọc"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <Button 
          onClick={handleSearch}
          className="h-[58px] flex-1 md:flex-none md:px-8 bg-gradient-to-r from-[#048c73] to-[#03725e] hover:from-[#03725e] hover:to-[#025a4a] text-white font-bold rounded-md shadow-md shadow-teal-900/20 hover:shadow-teal-900/35 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 text-[17px]"
        >
          <Search className="w-5 h-5 text-[#7ef2dd]" strokeWidth={2.5} />
          Tìm Chuyến Đi
        </Button>
      </div>

      {/* MOBILE MODALS */}
      
      {/* Mobile Destination Modal */}
      {mountedTab === 'destination' && typeof window !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex justify-center items-end search-modal-portal">
          <div 
            className={`absolute inset-0 bg-[#0f2d3c]/60 backdrop-blur-sm ${activeTab === 'destination' ? 'fade-in-overlay' : 'fade-out-overlay'}`} 
            onClick={closeModal} 
          />
          <div 
            className={`relative w-full h-[90vh] bg-white rounded-t-2xl flex flex-col shadow-2xl ${activeTab === 'destination' ? 'modal-slide-in' : 'modal-slide-out'}`} 
            onClick={stopPropagation}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-[#66716c]/20 rounded-full"></div>
            </div>
            
            <div className="px-4 pb-4 border-b border-[#66716c]/10 bg-white shadow-sm flex items-center shrink-0">
              <h3 className="font-bold text-xl text-[#0f2d3c] mx-auto">Chọn điểm đến</h3>
            </div>
            
            <div className="p-4 border-b border-[#66716c]/10 bg-white shrink-0">
              <div className="flex items-center gap-3 bg-[#f8f9fa] border border-[#66716c]/20 rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-[#66716c]" />
                <input 
                  type="text" 
                  placeholder="Bạn muốn đi đâu?" 
                  className="bg-transparent border-none outline-none w-full text-base font-semibold text-[#0f2d3c] placeholder:text-[#66716c]/60"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-white">
              <div>
                <h4 className="text-sm font-bold text-[#0f2d3c] mb-3">Tìm kiếm gần đây</h4>
                <div className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-xl cursor-pointer" onClick={() => { setDestination('Hà Nội'); closeModal(); }}>
                  <History className="w-5 h-5 text-[#66716c]" />
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-[#0f2d3c]">Hà Nội</span>
                    <span className="text-xs text-[#66716c]">2 người lớn</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-[#0f2d3c] mb-3">Điểm đến nổi bật</h4>
                <div className="flex flex-col gap-2">
                  {['Hà Nội', 'Đà Nẵng', 'Hạ Long', 'TP Hồ Chí Minh', 'Ninh Bình', 'Sa Pa', 'Phú Quốc'].map((dest, i) => (
                    <div key={i} onClick={() => { setDestination(dest); closeModal(); }} className="flex items-center gap-3 p-3 hover:bg-[#f8f9fa] rounded-xl cursor-pointer">
                      <MapPin className="w-5 h-5 text-[#048c73]" />
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-[#0f2d3c]">{dest}</span>
                        <span className="text-xs text-[#66716c]">Việt Nam</span>
                      </div>
                    </div>
                  ))}
                </div>
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
            className={`relative w-full h-[90vh] bg-white rounded-t-2xl flex flex-col shadow-2xl ${activeTab === 'dates' ? 'modal-slide-in' : 'modal-slide-out'}`} 
            onClick={stopPropagation}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-[#66716c]/20 rounded-full"></div>
            </div>
            
            <div className="px-4 pb-4 border-b border-[#66716c]/10 bg-white shadow-sm flex items-center shrink-0">
              <h3 className="font-bold text-xl text-[#0f2d3c] mx-auto">Chọn ngày</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-white">
              {/* Month 1 */}
              <div>
                <h4 className="font-bold text-center text-[#0f2d3c] mb-4">Tháng 9 2026</h4>
                <div className="grid grid-cols-7 gap-y-2 text-center">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="text-xs font-bold text-[#66716c] py-1">{d}</div>
                  ))}
                  {[...Array(1)].map((_, i) => <div key={`empty-${i}`} className="py-2"></div>)}
                  {[...Array(30)].map((_, i) => renderDay(i + 1, 9))}
                </div>
              </div>
              
              {/* Month 2 */}
              <div>
                <h4 className="font-bold text-center text-[#0f2d3c] mb-4">Tháng 10 2026</h4>
                <div className="grid grid-cols-7 gap-y-2 text-center">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="text-xs font-bold text-[#66716c] py-1">{d}</div>
                  ))}
                  {[...Array(3)].map((_, i) => <div key={`empty2-${i}`} className="py-2"></div>)}
                  {[...Array(31)].map((_, i) => renderDay(i + 1, 10))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#66716c]/10 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.05)] shrink-0 flex flex-col gap-3 rounded-b-2xl">
               <div className="text-center font-bold text-[#0f2d3c] text-sm">{dates || 'Chưa chọn ngày'}</div>
               <Button className="w-full bg-[#048c73] hover:bg-[#03725e] text-white py-6 text-lg rounded-xl font-bold" onClick={() => { if(!dates) setDates("18 Th9"); closeModal(); }}>Chọn</Button>
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
                    <button onClick={() => setOccupancy(p => ({...p, rooms: Math.max(1, p.rooms - 1)}))} className="text-[#66716c] p-1"><Minus className="w-6 h-6"/></button>
                    <span className="w-6 text-center font-bold text-[#0f2d3c] text-lg">{occupancy.rooms}</span>
                    <button onClick={() => setOccupancy(p => ({...p, rooms: p.rooms + 1}))} className="text-[#048c73] p-1"><Plus className="w-6 h-6"/></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0f2d3c] text-lg">Người lớn</span>
                  <div className="flex items-center gap-5 border border-[#66716c]/30 rounded-lg p-1.5">
                    <button onClick={() => setOccupancy(p => ({...p, adults: Math.max(1, p.adults - 1)}))} className="text-[#048c73] p-1"><Minus className="w-6 h-6"/></button>
                    <span className="w-6 text-center font-bold text-[#0f2d3c] text-lg">{occupancy.adults}</span>
                    <button onClick={() => setOccupancy(p => ({...p, adults: p.adults + 1}))} className="text-[#048c73] p-1"><Plus className="w-6 h-6"/></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#0f2d3c] text-lg">Trẻ em</span>
                  </div>
                  <div className="flex items-center gap-5 border border-[#66716c]/30 rounded-lg p-1.5">
                    <button onClick={() => setOccupancy(p => ({...p, children: Math.max(0, p.children - 1)}))} className="text-[#66716c] p-1"><Minus className="w-6 h-6"/></button>
                    <span className="w-6 text-center font-bold text-[#0f2d3c] text-lg">{occupancy.children}</span>
                    <button onClick={() => setOccupancy(p => ({...p, children: p.children + 1}))} className="text-[#048c73] p-1"><Plus className="w-6 h-6"/></button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#66716c]/10 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.05)] shrink-0 rounded-b-2xl">
               <Button className="w-full bg-[#048c73] hover:bg-[#03725e] text-white py-7 font-bold text-lg rounded-xl" onClick={closeModal}>Áp dụng</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
