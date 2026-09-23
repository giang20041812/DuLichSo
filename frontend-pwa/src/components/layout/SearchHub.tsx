import { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { MapPin, Calendar, Search, ChevronLeft, ChevronRight, X, ChevronRight as BreadcrumbArrow, Sparkles, Building2, Landmark } from "lucide-react"

// Cấu trúc phân cấp dữ liệu: Tỉnh/Thành -> Phường/Xã -> Địa điểm du lịch theo phường/xã
export interface WardData {
  name: string;
  attractions: string[];
}

export interface ProvinceData {
  province: string;
  wards: WardData[];
}

export const VIETNAM_LOCATIONS: ProvinceData[] = [
  {
    province: "Yên Bái",
    wards: [
      {
        name: "La Pán Tẩn",
        attractions: ["Đồi Mâm Xôi", "Ruộng bậc thang La Pán Tẩn", "Bản Lìm Mông", "Đồi Mâm Xôi Lớn"]
      },
      {
        name: "Mù Cang Chải (Thị trấn)",
        attractions: ["Đồi Móng Ngựa", "Chợ phiên Mù Cang Chải", "Cầu Ba Nhà", "Bản Thái"]
      },
      {
        name: "Chế Cu Nha",
        attractions: ["Ruộng bậc thang Chế Cu Nha", "Đỉnh Mũi Giày", "Bản Chế Cu Nha"]
      },
      {
        name: "Dế Xu Phình",
        attractions: ["Rừng Trúc Dế Xu Phình", "Thung lũng ruộng Dế Xu Phình"]
      },
      {
        name: "Cao Phạ",
        attractions: ["Đèo Khau Phạ", "Điểm bay dù lượn Khau Phạ", "Bản Lìm Thái"]
      },
      {
        name: "Nậm Có",
        attractions: ["Bản Nậm Có", "Suối khoáng nóng Nậm Có"]
      },
      {
        name: "Tú Lệ",
        attractions: ["Thung lũng Tú Lệ", "Suối khoáng nóng Tú Lệ", "Cốm xanh Tú Lệ"]
      },
      {
        name: "Trạm Tấu",
        attractions: ["Suối khoáng nóng Trạm Tấu", "Bản Cu Vai", "Đỉnh Tà Xùa Trạm Tấu"]
      }
    ]
  },
  {
    province: "Lào Cai",
    wards: [
      {
        name: "Sa Pa (Phường Trung tâm)",
        attractions: ["Nhà thờ Đá Sa Pa", "Quảng trường Sa Pa", "Núi Hàm Rồng", "Hồ Sa Pa"]
      },
      {
        name: "Tả Van",
        attractions: ["Bản Tả Van", "Thung lũng Mường Hoa", "Cầu Mây Tả Van"]
      },
      {
        name: "San Sả Hồ",
        attractions: ["Bản Cát Cát", "Thác Cát Cát", "Đỉnh Fansipan Legend"]
      },
      {
        name: "Tả Phìn",
        attractions: ["Bản Tả Phìn", "Tu viện cổ Tả Phìn", "Hang động Tả Phìn"]
      },
      {
        name: "Y Tý",
        attractions: ["Biển mây Y Tý", "Công viên Choản Thèn", "Ngôi nhà nấm Trình Tường", "Cột mốc Lũng Pô"]
      },
      {
        name: "Bắc Hà",
        attractions: ["Chợ phiên Bắc Hà", "Dinh thự Hoàng A Tưởng", "Thung lũng hoa Bắc Hà"]
      }
    ]
  },
  {
    province: "Hà Giang",
    wards: [
      {
        name: "Đồng Văn",
        attractions: ["Phố cổ Đồng Văn", "Dinh thự họ Vương", "Thị trấn Phó Bảng"]
      },
      {
        name: "Mèo Vạc",
        attractions: ["Đèo Mã Pí Lèng", "Hẻm vực Tu Sản", "Sông Nho Quế", "Làng văn hóa du lịch Pả Vi"]
      },
      {
        name: "Lũng Cú",
        attractions: ["Cột cờ Lũng Cú", "Điểm cực Bắc", "Bản người Lô Lô Chải"]
      },
      {
        name: "Quản Bạ",
        attractions: ["Cổng trời Quản Bạ", "Núi Đôi Cô Tiên", "Làng du lịch Nặm Đăm"]
      },
      {
        name: "Hoàng Su Phì",
        attractions: ["Ruộng bậc thang Bản Phùng", "Bản Luốc", "Đỉnh Tây Côn Lĩnh"]
      }
    ]
  },
  {
    province: "Sơn La",
    wards: [
      {
        name: "Mộc Châu",
        attractions: ["Rừng thông Bản Áng", "Thác Dải Yếm", "Đồi chè Trái Tim", "Cầu kính Bạch Long"]
      },
      {
        name: "Tà Xùa",
        attractions: ["Sống lưng Khủng Long", "Mỏm cá heo", "Cây cô đơn Tà Xùa", "Đỉnh Gió"]
      },
      {
        name: "Vân Hồ",
        attractions: ["Thác Chiềng Khoa", "Rừng thông Hua Tạt"]
      }
    ]
  },
  {
    province: "Hà Nội",
    wards: [
      {
        name: "Hoàn Kiếm",
        attractions: ["Hồ Hoàn Kiếm (Hồ Gươm)", "Phố Cổ Hà Nội", "Nhà hát Lớn Hà Nội"]
      },
      {
        name: "Ba Vì",
        attractions: ["Vườn Quốc gia Ba Vì", "Làng cổ Đường Lâm", "Khoang Xanh Suối Tiên"]
      },
      {
        name: "Tây Hồ",
        attractions: ["Hồ Tây", "Chùa Trấn Quốc", "Phủ Tây Hồ"]
      }
    ]
  },
  {
    province: "Đà Nẵng",
    wards: [
      {
        name: "Sơn Trà",
        attractions: ["Bán đảo Sơn Trà", "Chùa Linh Ứng", "Bãi biển Mỹ Khê"]
      },
      {
        name: "Hòa Vang",
        attractions: ["Bà Nà Hills & Cầu Vàng", "Suối khoáng nóng Núi Thần Tài"]
      },
      {
        name: "Ngũ Hành Sơn",
        attractions: ["Quần thể Ngũ Hành Sơn", "Làng đá mỹ nghệ Non Nước"]
      }
    ]
  },
  {
    province: "Ninh Bình",
    wards: [
      {
        name: "Hoa Lư",
        attractions: ["Quần thể danh thắng Tràng An", "Hang Múa", "Cố đô Hoa Lư", "Tuyệt Tịnh Cốc"]
      },
      {
        name: "Gia Viễn",
        attractions: ["Chùa Bái Đính", "Khu bảo tồn đất ngập nước Vân Long"]
      },
      {
        name: "Nho Quan",
        attractions: ["Vườn quốc gia Cúc Phương", "Động Thiên Hà"]
      }
    ]
  },
  {
    province: "Lâm Đồng",
    wards: [
      {
        name: "Đà Lạt (Trung tâm)",
        attractions: ["Hồ Xuân Hương", "Quảng trường Lâm Viên", "Vườn hoa thành phố", "Chợ đêm Đà Lạt"]
      },
      {
        name: "Lạc Dương",
        attractions: ["Đỉnh Langbiang", "Làng Cù Lần", "Thung lũng Vàng"]
      },
      {
        name: "Xuân Trường",
        attractions: ["Đồi Chè Cầu Đất", "Tua bin gió Cầu Đất"]
      }
    ]
  }
];

export default function SearchHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'destination' | 'dates' | null>(null);
  const [mountedTab, setMountedTab] = useState<'destination' | 'dates' | null>(null);
  
  // Destination selection state
  const [destination, setDestination] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string | null>("Yên Bái");
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [destinationSearchText, setDestinationSearchText] = useState("");
  
  // Dates state
  const [dates, setDates] = useState("");
  const [startDate, setStartDate] = useState<{ day: number, month: number, year?: number } | null>(null);
  const [endDate, setEndDate] = useState<{ day: number, month: number, year?: number } | null>(null);
  const [hoverDate, setHoverDate] = useState<{ day: number, month: number, year?: number } | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

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
    setSelectedProvince("Yên Bái");
    setSelectedWard(null);
    setDestinationSearchText("");
    setDates("");
    setStartDate(null);
    setEndDate(null);
  };

  // Selection handlers
  const handleSelectProvince = (provinceName: string) => {
    setSelectedProvince(provinceName);
    setSelectedWard(null);
  };

  const handleSelectAllProvince = (provinceName: string) => {
    setDestination(provinceName);
    setActiveTab('dates');
  };

  const handleSelectWard = (wardName: string) => {
    setSelectedWard(wardName);
  };

  const handleSelectAllWard = (wardName: string) => {
    const text = selectedProvince ? `${wardName}, ${selectedProvince}` : wardName;
    setDestination(text);
    setActiveTab('dates');
  };

  const handleSelectAttraction = (attractionName: string) => {
    const locationParts = [attractionName];
    if (selectedWard) locationParts.push(selectedWard);
    if (selectedProvince) locationParts.push(selectedProvince);
    setDestination(locationParts.join(', '));
    setActiveTab('dates');
  };

  // Search filter across all 3 levels
  const searchResults = useMemo(() => {
    const query = destinationSearchText.trim().toLowerCase();
    if (!query) return null;

    const results: { type: 'province' | 'ward' | 'attraction', label: string, fullText: string, province?: string, ward?: string }[] = [];

    VIETNAM_LOCATIONS.forEach(prov => {
      if (prov.province.toLowerCase().includes(query)) {
        results.push({
          type: 'province',
          label: prov.province,
          fullText: prov.province,
          province: prov.province
        });
      }

      prov.wards.forEach(ward => {
        if (ward.name.toLowerCase().includes(query)) {
          results.push({
            type: 'ward',
            label: ward.name,
            fullText: `${ward.name}, ${prov.province}`,
            province: prov.province,
            ward: ward.name
          });
        }

        ward.attractions.forEach(att => {
          if (att.toLowerCase().includes(query)) {
            results.push({
              type: 'attraction',
              label: att,
              fullText: `${att}, ${ward.name}, ${prov.province}`,
              province: prov.province,
              ward: ward.name
            });
          }
        });
      });
    });

    return results.slice(0, 8);
  }, [destinationSearchText]);

  // Current selected province object
  const currentProvinceData = useMemo(() => {
    return VIETNAM_LOCATIONS.find(p => p.province === selectedProvince) || VIETNAM_LOCATIONS[0];
  }, [selectedProvince]);

  // Current selected ward object
  const currentWardData = useMemo(() => {
    if (!selectedWard || !currentProvinceData) return null;
    return currentProvinceData.wards.find(w => w.name === selectedWard) || null;
  }, [selectedWard, currentProvinceData]);

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
    if (destination) {
      params.append('destination', destination);
      if (selectedProvince) params.append('province', selectedProvince);
      if (selectedWard) params.append('ward', selectedWard);
    }
    
    if (finalStartDate) {
      const startStr = `${finalStartDate.year || new Date().getFullYear()}-${String(finalStartDate.month).padStart(2, '0')}-${String(finalStartDate.day).padStart(2, '0')}`;
      params.append('checkIn', startStr);
    }
    if (finalEndDate) {
      const endStr = `${finalEndDate.year || new Date().getFullYear()}-${String(finalEndDate.month).padStart(2, '0')}-${String(finalEndDate.day).padStart(2, '0')}`;
      params.append('checkOut', endStr);
    }

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
      className="hidden md:flex absolute top-[110%] right-0 w-[640px] bg-white rounded-lg shadow-2xl border border-[#59766e]/20 p-4 md:p-6 z-[100] flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={stopPropagation}
    >
      <div className="flex border-b border-[#59766e]/20 w-full pb-2">
        <span className="text-sm font-bold text-[#048c73]">Chọn khoảng thời gian lưu trú</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6" onMouseLeave={() => setHoverDate(null)}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-[#0a2e26] text-sm">Tháng {startDate?.month || 9}, 2026</h4>
            <button className="p-1 hover:bg-[#f0fbf7] rounded-md text-[#0a2e26]"><ChevronLeft className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-xs font-semibold text-[#59766e]">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({length: 30}, (_, i) => i + 1).map(d => renderDay(d, startDate?.month || 9))}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-[#0a2e26] text-sm">Tháng {(startDate?.month || 9) + 1}, 2026</h4>
            <button className="p-1 hover:bg-[#f0fbf7] rounded-md text-[#0a2e26]"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-xs font-semibold text-[#59766e]">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({length: 31}, (_, i) => i + 1).map(d => renderDay(d, (startDate?.month || 9) + 1))}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">{dates ? `Đã chọn: ${dates}` : 'Chưa chọn ngày'}</span>
        <Button 
          className="bg-[#048c73] hover:bg-[#03725e] text-white text-xs font-bold px-5 py-2 rounded-md"
          onClick={() => setActiveTab(null)}
        >
          Xác nhận ngày
        </Button>
      </div>
    </div>
  );

  return (
    <div ref={searchRef} className="w-full relative z-30 flex flex-col md:flex-row items-center gap-2 md:gap-2.5 p-2.5 md:p-3 rounded-lg bg-white/95 backdrop-blur-md shadow-xl border border-white/80 transition-all text-left">
      
      {/* ---------------- 1. ĐỊA ĐIỂM (TỈNH / PHƯỜNG XÃ / ĐIỂM ĐẾN THEO PHƯỜNG XÃ) ---------------- */}
      <div 
        className={`flex-[1.5] w-full min-w-0 bg-white rounded-md shadow-xs border px-3.5 h-[58px] flex items-center gap-3 cursor-pointer transition-all relative ${
          activeTab === 'destination' 
            ? 'z-40 border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/20' 
            : 'z-20 border-gray-200 hover:border-[#048c73]'
        }`}
        onClick={() => setActiveTab('destination')}
      >
        <MapPin className="text-[#048c73] w-5 h-5 ml-0.5 shrink-0" />
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[#66716c] uppercase tracking-wider mb-0.5">
            Địa điểm · Tỉnh · Phường/Xã · Điểm đến
          </span>
          <span className="text-sm font-bold text-[#0a2e26] truncate">
            {destination || "Chọn tỉnh, phường xã hoặc điểm đến"}
          </span>
        </div>

        {/* DESKTOP HIERARCHICAL DESTINATION POPOVER */}
        {activeTab === 'destination' && (
          <div 
            className="hidden md:flex absolute top-[110%] left-0 w-[580px] bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-[100] flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
            onClick={stopPropagation}
          >
            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Gõ tìm nhanh tỉnh, phường xã hoặc điểm du lịch..."
                value={destinationSearchText}
                onChange={(e) => setDestinationSearchText(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#048c73] focus:bg-white text-gray-800"
                autoFocus
              />
              {destinationSearchText && (
                <button 
                  onClick={() => setDestinationSearchText("")} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* If Search Query Exists: Show Filtered Results Across Levels */}
            {searchResults ? (
              <div className="max-h-[320px] overflow-y-auto flex flex-col gap-1 py-1">
                {searchResults.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    Không tìm thấy địa điểm khớp với "{destinationSearchText}"
                  </div>
                ) : (
                  searchResults.map((res, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setDestination(res.fullText);
                        if (res.province) setSelectedProvince(res.province);
                        if (res.ward) setSelectedWard(res.ward);
                        setActiveTab('dates');
                      }}
                      className="flex items-center justify-between p-2.5 hover:bg-[#edfbf7] rounded-md cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {res.type === 'province' && <Building2 className="w-4 h-4 text-[#048c73] shrink-0" />}
                        {res.type === 'ward' && <Landmark className="w-4 h-4 text-[#06b6d4] shrink-0" />}
                        {res.type === 'attraction' && <Sparkles className="w-4 h-4 text-[#f59e0b] shrink-0" />}
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-bold text-gray-900 truncate">{res.label}</span>
                          <span className="text-xs text-gray-500 truncate">{res.fullText}</span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-gray-100 text-gray-600 shrink-0">
                        {res.type === 'province' ? 'Tỉnh/Thành' : res.type === 'ward' ? 'Xã/Phường' : 'Điểm đến'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* 3-Tier Progressive Navigation */
              <div className="flex flex-col gap-3">
                {/* Breadcrumb Steps */}
                <div className="flex items-center gap-1.5 text-xs pb-2 border-b border-gray-100 text-gray-500">
                  <button 
                    onClick={() => { setSelectedWard(null); }}
                    className={`font-bold transition-colors ${!selectedWard ? 'text-[#048c73]' : 'text-gray-600 hover:text-[#048c73]'}`}
                  >
                    1. {selectedProvince || "Chọn Tỉnh"}
                  </button>
                  <BreadcrumbArrow className="w-3 h-3 text-gray-400" />
                  <span className={`font-bold ${selectedWard ? 'text-[#048c73]' : 'text-gray-400'}`}>
                    2. {selectedWard || "Chọn Phường/Xã"}
                  </span>
                  <BreadcrumbArrow className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400 font-medium">
                    3. Điểm tham quan
                  </span>
                </div>

                {/* Main 2-column view: Left = Provinces, Right = Wards & Attractions */}
                <div className="grid grid-cols-12 gap-3 h-[280px]">
                  {/* Cột 1: Tỉnh / Thành phố */}
                  <div className="col-span-4 border-r border-gray-100 pr-2 overflow-y-auto flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Tỉnh / Thành</span>
                    {VIETNAM_LOCATIONS.map(p => {
                      const isSelected = selectedProvince === p.province;
                      return (
                        <button
                          key={p.province}
                          onClick={() => handleSelectProvince(p.province)}
                          className={`text-left px-2.5 py-2 rounded-md text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected 
                              ? 'bg-[#048c73] text-white shadow-xs' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{p.province}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                            {p.wards.length} xã
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cột 2: Phường/Xã & Điểm đến của Tỉnh đang chọn */}
                  <div className="col-span-8 pl-1 overflow-y-auto flex flex-col gap-3">
                    {/* Header bar cho Tỉnh: Chọn toàn bộ tỉnh */}
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-bold text-gray-800">
                        {selectedProvince}: {selectedWard ? selectedWard : 'Các Phường/Xã'}
                      </span>
                      <button
                        onClick={() => selectedProvince && handleSelectAllProvince(selectedProvince)}
                        className="text-[11px] font-bold text-[#048c73] hover:underline"
                      >
                        ✓ Chọn cả tỉnh {selectedProvince}
                      </button>
                    </div>

                    {!selectedWard ? (
                      /* Danh sách Phường / Xã */
                      <div className="grid grid-cols-2 gap-2">
                        {currentProvinceData?.wards.map(w => (
                          <div
                            key={w.name}
                            onClick={() => handleSelectWard(w.name)}
                            className="p-2 border border-gray-100 hover:border-[#048c73] hover:bg-[#edfbf7] rounded-md cursor-pointer transition-all flex flex-col justify-between"
                          >
                            <span className="text-xs font-bold text-[#0a2e26]">{w.name}</span>
                            <span className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-[#f59e0b]" />
                              {w.attractions.length} điểm tham quan
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Danh sách Điểm đến theo Phường / Xã đã chọn */
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <button 
                            onClick={() => setSelectedWard(null)} 
                            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-semibold"
                          >
                            ← Quay lại danh sách xã
                          </button>
                          <button
                            onClick={() => handleSelectAllWard(selectedWard)}
                            className="text-xs font-bold text-[#048c73] hover:underline"
                          >
                            ✓ Chọn cả xã {selectedWard}
                          </button>
                        </div>

                        <span className="text-[11px] font-bold text-gray-500 mt-1">
                          Các điểm du lịch nổi tiếng tại {selectedWard}:
                        </span>

                        <div className="flex flex-col gap-1.5">
                          {currentWardData?.attractions.map(att => (
                            <button
                              key={att}
                              onClick={() => handleSelectAttraction(att)}
                              className="w-full text-left p-2.5 rounded-md border border-gray-100 hover:border-[#048c73] hover:bg-[#edfbf7] transition-all flex items-center gap-2 group cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4 text-[#f59e0b] shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-bold text-gray-800 group-hover:text-[#048c73]">{att}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* ---------------- 2. NGÀY ĐI ---------------- */}
      <div 
        className={`flex-1 w-full min-w-0 bg-white rounded-md shadow-xs border px-3.5 h-[58px] flex items-center gap-3 cursor-pointer transition-all relative ${
          activeTab === 'dates' 
            ? 'z-40 border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/20' 
            : 'z-20 border-gray-200 hover:border-[#048c73]'
        }`}
        onClick={() => setActiveTab('dates')}
      >
        <Calendar className="text-[#048c73] w-5 h-5 ml-0.5 shrink-0" />
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[#66716c] uppercase tracking-wider mb-0.5">Ngày đi & về</span>
          <span className="text-sm font-bold text-[#0a2e26] truncate">
            {dates || "Thêm ngày"}
          </span>
        </div>

        {activeTab === 'dates' && renderDesktopCalendar()}
      </div>
      
      {/* ---------------- 3. BUTTONS: BỎ LỌC & TÌM CHUYẾN ĐI ---------------- */}
      <div className="flex items-center gap-2 w-full md:w-auto mt-1 md:mt-0 shrink-0">
        <button 
          onClick={handleClear}
          className="h-[58px] w-[54px] flex items-center justify-center bg-white border border-gray-200 hover:border-[#048c73] text-gray-400 hover:text-[#048c73] rounded-md transition-colors shrink-0 shadow-xs"
          title="Bỏ lọc / Đặt lại"
        >
          <X className="w-5 h-5" strokeWidth={2.2} />
        </button>

        <Button 
          onClick={handleSearch}
          className="h-[58px] flex-1 md:flex-none md:px-8 bg-gradient-to-r from-[#048c73] to-[#03725e] hover:from-[#03725e] hover:to-[#025a4a] text-white font-bold rounded-md shadow-md shadow-teal-900/20 hover:shadow-teal-900/35 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 text-[16px]"
        >
          <Search className="w-5 h-5 text-[#7ef2dd]" strokeWidth={2.5} />
          Tìm Chuyến Đi
        </Button>
      </div>

      {/* ---------------- MOBILE DESTINATION MODAL ---------------- */}
      {mountedTab === 'destination' && typeof window !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex justify-center items-end search-modal-portal">
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${activeTab === 'destination' ? 'fade-in-overlay' : 'fade-out-overlay'}`} 
            onClick={closeModal} 
          />
          <div 
            className={`relative w-full h-[88vh] bg-white rounded-t-xl flex flex-col shadow-2xl ${activeTab === 'destination' ? 'modal-slide-in' : 'modal-slide-out'}`} 
            onClick={stopPropagation}
          >
            <div className="flex justify-center pt-2.5 pb-1.5">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base text-gray-900">Chọn Tỉnh · Xã · Điểm đến</h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Gõ tìm nhanh tỉnh, xã hoặc điểm đến..." 
                  className="bg-transparent border-none outline-none w-full text-sm font-semibold text-gray-800 placeholder:text-gray-400"
                  value={destinationSearchText}
                  onChange={(e) => setDestinationSearchText(e.target.value)}
                />
                {destinationSearchText && (
                  <button onClick={() => setDestinationSearchText("")}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {searchResults ? (
                <div className="flex flex-col gap-1.5">
                  {searchResults.map((res, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setDestination(res.fullText);
                        if (res.province) setSelectedProvince(res.province);
                        if (res.ward) setSelectedWard(res.ward);
                        closeModal();
                      }}
                      className="p-2.5 bg-gray-50 rounded-md flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-[#048c73] shrink-0" />
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-bold text-gray-900 truncate">{res.label}</span>
                          <span className="text-xs text-gray-500 truncate">{res.fullText}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {res.type === 'province' ? 'Tỉnh' : res.type === 'ward' ? 'Xã' : 'Điểm đến'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Chọn nhanh Tỉnh */}
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Chọn Tỉnh/Thành</span>
                    <div className="flex flex-wrap gap-1.5">
                      {VIETNAM_LOCATIONS.map(p => (
                        <button
                          key={p.province}
                          onClick={() => handleSelectProvince(p.province)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                            selectedProvince === p.province 
                              ? 'bg-[#048c73] text-white shadow-xs' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {p.province}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nút chọn cả tỉnh */}
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-800">Tỉnh {selectedProvince}</span>
                    <button
                      onClick={() => { selectedProvince && handleSelectAllProvince(selectedProvince); closeModal(); }}
                      className="text-xs font-bold text-[#048c73] underline"
                    >
                      Chọn toàn tỉnh {selectedProvince}
                    </button>
                  </div>

                  {/* Danh sách Phường / Xã */}
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">2. Chọn Xã / Phường</span>
                    <div className="grid grid-cols-2 gap-2">
                      {currentProvinceData?.wards.map(w => (
                        <button
                          key={w.name}
                          onClick={() => handleSelectWard(w.name)}
                          className={`text-left p-2.5 rounded-md border text-xs font-bold transition-all ${
                            selectedWard === w.name 
                              ? 'border-[#048c73] bg-[#edfbf7] text-[#048c73]' 
                              : 'border-gray-200 bg-white text-gray-800'
                          }`}
                        >
                          {w.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Danh sách điểm đến nếu đã chọn Xã */}
                  {selectedWard && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-800">3. Điểm tham quan tại {selectedWard}</span>
                        <button
                          onClick={() => { handleSelectAllWard(selectedWard); closeModal(); }}
                          className="text-xs font-bold text-[#048c73] underline"
                        >
                          Chọn cả {selectedWard}
                        </button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {currentWardData?.attractions.map(att => (
                          <button
                            key={att}
                            onClick={() => { handleSelectAttraction(att); closeModal(); }}
                            className="w-full text-left p-2.5 rounded-md border border-gray-100 bg-[#edfbf7]/50 hover:bg-[#edfbf7] text-xs font-bold text-gray-800 flex items-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                            {att}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ---------------- MOBILE DATES MODAL ---------------- */}
      {mountedTab === 'dates' && typeof window !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex justify-center items-end search-modal-portal">
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${activeTab === 'dates' ? 'fade-in-overlay' : 'fade-out-overlay'}`} 
            onClick={closeModal} 
          />
          <div 
            className={`relative w-full h-[88vh] bg-white rounded-t-xl flex flex-col shadow-2xl ${activeTab === 'dates' ? 'modal-slide-in' : 'modal-slide-out'}`} 
            onClick={stopPropagation}
          >
            <div className="flex justify-center pt-2.5 pb-1.5">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base text-gray-900">Chọn ngày lưu trú</h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              <div>
                <h4 className="font-bold text-center text-[#0a2e26] mb-3 text-sm">Tháng 9, 2026</h4>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-400 py-1">{d}</div>
                  ))}
                  {[...Array(1)].map((_, i) => <div key={`empty-${i}`} className="py-2"></div>)}
                  {[...Array(30)].map((_, i) => renderDay(i + 1, 9))}
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-center text-[#0a2e26] mb-3 text-sm">Tháng 10, 2026</h4>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-400 py-1">{d}</div>
                  ))}
                  {[...Array(3)].map((_, i) => <div key={`empty2-${i}`} className="py-2"></div>)}
                  {[...Array(31)].map((_, i) => renderDay(i + 1, 10))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white flex flex-col gap-2">
               <div className="text-center font-bold text-gray-800 text-sm">{dates || 'Chưa chọn ngày'}</div>
               <Button 
                 className="w-full bg-[#048c73] hover:bg-[#03725e] text-white py-3.5 text-base rounded-md font-bold" 
                 onClick={closeModal}
               >
                 Xác nhận
               </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
