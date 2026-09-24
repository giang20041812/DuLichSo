import React, { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { 
  Search, 
  Building2, 
  Landmark, 
  Sparkles, 
  LocateFixed, 
  Check, 
  Loader2,
  X
} from "lucide-react"

export interface AttractionItem {
  id: number;
  name: string;
  regionName?: string;
  address?: string;
  coverImageUrl?: string;
  priceRefMin?: number;
  ratingAvg?: number;
  latitude?: number;
  longitude?: number;
  isSuitableByTime?: boolean;
  suitableDateStart?: string;
  suitableDateEnd?: string;
}

export interface WardData {
  name: string;
}

export interface ProvinceData {
  province: string;
  wards: WardData[];
}

interface RawPlaceItem {
  id: number;
  name: string;
  regionName?: string;
  address?: string;
  coverImageUrl?: string;
  priceRefMin?: number;
  ratingAvg?: number;
  latitude?: number;
  longitude?: number;
  isSuitableByTime?: boolean;
  suitableDateStart?: string;
  suitableDateEnd?: string;
}

const VIETNAM_LOCATIONS: ProvinceData[] = [
  {
    province: "Yên Bái",
    wards: [
      { name: "La Pán Tẩn" },
      { name: "Mù Cang Chải" },
      { name: "Chế Cu Nha" },
      { name: "Dế Xu Phình" },
      { name: "Cao Phạ" },
      { name: "Nậm Có" },
      { name: "Tú Lệ" },
      { name: "Trạm Tấu" },
      { name: "Púng Luông" },
      { name: "Mồ Dề" },
      { name: "Kim Nọi" },
      { name: "Nậm Khắt" },
      { name: "Văn Chấn" },
      { name: "Nghĩa Lộ" }
    ]
  },
  {
    province: "Lào Cai",
    wards: [
      { name: "Sa Pa" },
      { name: "Tả Van" },
      { name: "San Sả Hồ" },
      { name: "Tả Phìn" },
      { name: "Y Tý" },
      { name: "Bắc Hà" },
      { name: "Mường Hoa" },
      { name: "Hàm Rồng" }
    ]
  },
  {
    province: "Hà Giang",
    wards: [
      { name: "Đồng Văn" },
      { name: "Mèo Vạc" },
      { name: "Lũng Cú" },
      { name: "Quản Bạ" },
      { name: "Hoàng Su Phì" },
      { name: "Yên Minh" }
    ]
  },
  {
    province: "Sơn La",
    wards: [
      { name: "Mộc Châu" },
      { name: "Tà Xùa" },
      { name: "Vân Hồ" },
      { name: "Bắc Yên" }
    ]
  },
  {
    province: "Hà Nội",
    wards: [
      { name: "Hoàn Kiếm" },
      { name: "Ba Vì" },
      { name: "Tây Hồ" },
      { name: "Sơn Tây" },
      { name: "Sóc Sơn" }
    ]
  },
  {
    province: "Đà Nẵng",
    wards: [
      { name: "Sơn Trà" },
      { name: "Hòa Vang" },
      { name: "Ngũ Hành Sơn" },
      { name: "Hải Châu" }
    ]
  },
  {
    province: "Ninh Bình",
    wards: [
      { name: "Hoa Lư" },
      { name: "Gia Viễn" },
      { name: "Nho Quan" },
      { name: "Tràng An" }
    ]
  },
  {
    province: "Lâm Đồng",
    wards: [
      { name: "Đà Lạt" },
      { name: "Lạc Dương" },
      { name: "Xuân Trường" },
      { name: "Bảo Lộc" }
    ]
  }
];

export default function SearchHub() {
  const navigate = useNavigate();
  // 3 distinct filter tabs: 'province' (Thành phố/Tỉnh), 'ward' (Phường/Xã), 'attractions' (Địa điểm vui chơi)
  const [activeTab, setActiveTab] = useState<'province' | 'ward' | 'attractions' | null>(null);
  const [mountedTab, setMountedTab] = useState<'province' | 'ward' | 'attractions' | null>(null);

  // Selected states
  const [selectedProvince, setSelectedProvince] = useState<string>("Yên Bái");
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedAttractions, setSelectedAttractions] = useState<AttractionItem[]>([]);
  
  // Search text inputs for each of the 3 sections
  const [provinceSearch, setProvinceSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [attractionSearch, setAttractionSearch] = useState("");

  // Loaded Attractions from Database
  const [dbAttractions, setDbAttractions] = useState<AttractionItem[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(false);

  // Near me geolocation loading
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // Load Attractions from DB on mount
  useEffect(() => {
    setIsLoadingAttractions(true);
    fetch('/api/public/places?kind=ATTRACTION&page=0&size=100')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch attractions');
        return res.json();
      })
      .then(data => {
        const rawList = (data.content || []) as RawPlaceItem[];
        const list: AttractionItem[] = rawList.map((item) => ({
          id: item.id,
          name: item.name,
          regionName: item.regionName || '',
          address: item.address || '',
          coverImageUrl: item.coverImageUrl,
          priceRefMin: item.priceRefMin,
          ratingAvg: item.ratingAvg,
          latitude: item.latitude,
          longitude: item.longitude,
          isSuitableByTime: Boolean(item.isSuitableByTime),
          suitableDateStart: item.suitableDateStart,
          suitableDateEnd: item.suitableDateEnd,
        }));
        setDbAttractions(list);
      })
      .catch(err => {
        console.error("Error loading attractions from DB:", err);
      })
      .finally(() => {
        setIsLoadingAttractions(false);
      });
  }, []);

  // Click outside to close popover
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

  // Mount/Unmount modal animation for mobile
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

  // Toggle selection for attractions (Multi-select)
  const toggleAttraction = (attraction: AttractionItem) => {
    setSelectedAttractions(prev => {
      const exists = prev.some(a => a.id === attraction.id);
      if (exists) {
        return prev.filter(a => a.id !== attraction.id);
      } else {
        return [...prev, attraction];
      }
    });
  };

  // Filtered lists for the 3 tabs
  const filteredProvinces = useMemo(() => {
    const q = provinceSearch.trim().toLowerCase();
    if (!q) return VIETNAM_LOCATIONS;
    return VIETNAM_LOCATIONS.filter(p => p.province.toLowerCase().includes(q));
  }, [provinceSearch]);

  const currentProvinceWards = useMemo(() => {
    const p = VIETNAM_LOCATIONS.find(item => item.province === selectedProvince) ?? VIETNAM_LOCATIONS[0];
    const q = wardSearch.trim().toLowerCase();
    const wards = p?.wards ?? [];
    if (!q) return wards;
    return wards.filter(w => w.name.toLowerCase().includes(q));
  }, [selectedProvince, wardSearch]);

  const filteredAttractions = useMemo(() => {
    let list = dbAttractions;
    // Nếu có chọn Phường/Xã thì ưu tiên hiển thị các điểm du lịch thuộc xã đó trước hoặc lọc
    if (selectedWard) {
      const wardClean = selectedWard.toLowerCase();
      const inWard = list.filter(a => 
        (a.regionName && a.regionName.toLowerCase().includes(wardClean)) ||
        (a.address && a.address.toLowerCase().includes(wardClean))
      );
      if (inWard.length > 0) {
        list = inWard;
      }
    }
    const q = attractionSearch.trim().toLowerCase();
    let result = list;
    if (q) {
      result = list.filter(a => 
        a.name.toLowerCase().includes(q) || 
        (a.regionName && a.regionName.toLowerCase().includes(q)) ||
        (a.address && a.address.toLowerCase().includes(q))
      );
    }
    // Ưu tiên các điểm đến thích hợp theo mùa (isSuitableByTime = true) lên trên đầu
    return [...result].sort((a, b) => {
      const aVal = a.isSuitableByTime ? 1 : 0;
      const bVal = b.isSuitableByTime ? 1 : 0;
      return bVal - aVal;
    });
  }, [dbAttractions, selectedWard, attractionSearch]);

  // "Gần tôi" Geolocation using OpenStreetMap Reverse Geocoding
  const handleNearMe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Đang lấy vị trí GPS...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          setLocationStatus("Đang định vị...");
          const response = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('OSM Reverse Geocoding failed');
          const data = await response.json();
          const props = data.features?.[0]?.properties || {};
          
          const osmState = props.state || props.province || props.city || "";
          const osmWard = props.district || props.suburb || props.county || props.city || "";

          // Tìm tỉnh tương ứng trong danh sách
          const matchedProv = VIETNAM_LOCATIONS.find(p => 
            p.province.toLowerCase().includes(osmState.toLowerCase()) || 
            osmState.toLowerCase().includes(p.province.toLowerCase())
          );

          if (matchedProv) {
            setSelectedProvince(matchedProv.province);
            const matchedWard = matchedProv.wards.find(w => 
              osmWard.toLowerCase().includes(w.name.toLowerCase()) || 
              w.name.toLowerCase().includes(osmWard.toLowerCase())
            );
            if (matchedWard) {
              setSelectedWard(matchedWard.name);
            }
          } else {
            setSelectedProvince("Yên Bái");
          }

          setLocationStatus(null);
          setIsLocating(false);
          setActiveTab('attractions');
        } catch (err) {
          console.warn("Geocoding fallback:", err);
          setSelectedProvince("Yên Bái");
          setSelectedWard("La Pán Tẩn");
          setLocationStatus(null);
          setIsLocating(false);
          setActiveTab('attractions');
        }
      },
      (error) => {
        console.warn("GPS error:", error);
        setIsLocating(false);
        setLocationStatus(null);
        setSelectedProvince("Yên Bái");
        setActiveTab('attractions');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Perform actual search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedProvince) params.append('province', selectedProvince);
    if (selectedWard) params.append('ward', selectedWard);
    if (selectedAttractions.length > 0) {
      params.append('attractions', selectedAttractions.map(a => a.id).join(','));
    }

    // Build human-friendly label for destination parameter
    const labelParts: string[] = [];
    if (selectedAttractions.length > 0) {
      if (selectedAttractions.length === 1 && selectedAttractions[0]) {
        labelParts.push(selectedAttractions[0].name);
      } else {
        labelParts.push(`${selectedAttractions.length} điểm vui chơi`);
      }
    }
    if (selectedWard) labelParts.push(selectedWard);
    if (selectedProvince) labelParts.push(selectedProvince);
    if (labelParts.length > 0) {
      params.append('destination', labelParts.join(', '));
    }

    navigate(`/homestays?${params.toString()}`);
    setActiveTab(null);
  };

  return (
    <div 
      ref={searchRef} 
      className="w-full relative z-30 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-2.5 p-2 sm:p-2.5 rounded-lg bg-white/95 backdrop-blur-md shadow-xl border border-white/80 transition-all text-left"
    >
      {/* ---------------- 1. BỘ LỌC ĐỊA ĐIỂM CHIA LÀM 3 (THÀNH PHỐ / PHƯỜNG XÃ / ĐỊA ĐIỂM VUI CHƠI) ---------------- */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Phần 1: Thành phố / Tỉnh */}
        <div 
          className={`bg-white rounded-md shadow-xs border px-3 sm:px-3.5 h-[52px] sm:h-[58px] flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all relative ${
            activeTab === 'province' 
              ? 'border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/20 z-40' 
              : 'border-gray-200 hover:border-[#048c73] z-20'
          }`}
          onClick={() => setActiveTab(activeTab === 'province' ? null : 'province')}
        >
          <Building2 className="text-[#048c73] w-5 h-5 shrink-0" />
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[10px] font-bold text-[#66716c] uppercase tracking-wider mb-0.5 truncate">
              Thành phố / Tỉnh
            </span>
            <span className="text-sm font-bold text-[#0a2e26] truncate">
              {selectedProvince || "Chọn tỉnh/TP"}
            </span>
          </div>
        </div>

        {/* Phần 2: Phường / Xã */}
        <div 
          className={`bg-white rounded-md shadow-xs border px-3 sm:px-3.5 h-[52px] sm:h-[58px] flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all relative ${
            activeTab === 'ward' 
              ? 'border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/20 z-40' 
              : 'border-gray-200 hover:border-[#048c73] z-20'
          }`}
          onClick={() => setActiveTab(activeTab === 'ward' ? null : 'ward')}
        >
          <Landmark className="text-[#048c73] w-5 h-5 shrink-0" />
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[10px] font-bold text-[#66716c] uppercase tracking-wider mb-0.5 truncate">
              Phường / Xã
            </span>
            <span className="text-sm font-bold text-[#0a2e26] truncate">
              {selectedWard || "Tất cả phường/xã"}
            </span>
          </div>
        </div>

        {/* Phần 3: Địa điểm vui chơi */}
        <div 
          className={`bg-white rounded-md shadow-xs border px-3 sm:px-3.5 h-[52px] sm:h-[58px] flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all relative ${
            activeTab === 'attractions' 
              ? 'border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/20 z-40' 
              : 'border-gray-200 hover:border-[#048c73] z-20'
          }`}
          onClick={() => setActiveTab(activeTab === 'attractions' ? null : 'attractions')}
        >
          <Sparkles className="text-[#f59e0b] w-5 h-5 shrink-0" />
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[10px] font-bold text-[#66716c] uppercase tracking-wider mb-0.5 truncate flex items-center gap-1">
              Địa điểm vui chơi
              {selectedAttractions.length > 0 && (
                <span className="bg-[#f59e0b] text-white text-[9px] px-1.5 py-0.2 rounded-xs font-bold leading-none">
                  {selectedAttractions.length}
                </span>
              )}
            </span>
            <span className="text-sm font-bold text-[#0a2e26] truncate">
              {selectedAttractions.length === 0
                ? "Chọn điểm vui chơi"
                : selectedAttractions.length === 1
                  ? (selectedAttractions[0]?.name ?? '')
                  : `${selectedAttractions.length} điểm đã chọn`}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- 2. NÚT ĐỊNH VỊ GẦN TÔI & TÌM KIẾM ---------------- */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleNearMe}
          disabled={isLocating}
          className="h-[52px] sm:h-[58px] px-3 sm:px-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-teal-200 hover:border-[#048c73] hover:bg-teal-100/60 text-[#048c73] rounded-md transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 group shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
          title="Tự động nhận diện Tỉnh / Xã hiện tại của bạn qua OpenStreetMap"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#048c73] animate-spin shrink-0" />
          ) : (
            <LocateFixed className="w-4 h-4 sm:w-5 sm:h-5 text-[#048c73] group-hover:scale-110 transition-transform shrink-0" />
          )}
          <div className="flex flex-col text-left">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-teal-700">Định vị</span>
            <span className="text-[11px] sm:text-xs font-bold text-[#0a2e26] whitespace-nowrap">
              {locationStatus ? locationStatus : (isLocating ? "Đang tìm..." : "Gần tôi")}
            </span>
          </div>
        </button>

        <Button 
          onClick={handleSearch}
          className="h-[52px] sm:h-[58px] px-6 sm:px-8 bg-gradient-to-r from-[#048c73] to-[#03725e] hover:from-[#03725e] hover:to-[#025a4a] text-white font-bold rounded-md shadow-md shadow-teal-900/20 hover:shadow-teal-900/35 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 text-[15px] sm:text-[16px] cursor-pointer"
        >
          <Search className="w-5 h-5 text-[#7ef2dd]" strokeWidth={2.5} />
          Tìm kiếm
        </Button>
      </div>

      {/* ---------------- DESKTOP UNIFIED 3-PHẦN POPOVER ---------------- */}
      {activeTab && (
        <div 
          className="hidden md:flex absolute top-[110%] left-0 w-full max-w-[720px] bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-[100] flex-col gap-3.5 animate-in fade-in slide-in-from-top-2 duration-200"
          onClick={stopPropagation}
        >
          {/* Header Switcher: 3 Tabs */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-md">
              <button
                onClick={() => setActiveTab('province')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                  activeTab === 'province' 
                    ? 'bg-white text-[#048c73] shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                1. Thành phố / Tỉnh
                {selectedProvince && <span className="text-[10px] text-[#048c73] font-normal">({selectedProvince})</span>}
              </button>

              <button
                onClick={() => setActiveTab('ward')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                  activeTab === 'ward' 
                    ? 'bg-white text-[#048c73] shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                2. Phường / Xã
                {selectedWard && <span className="text-[10px] text-[#048c73] font-normal">({selectedWard})</span>}
              </button>

              <button
                onClick={() => setActiveTab('attractions')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${
                  activeTab === 'attractions' 
                    ? 'bg-white text-[#048c73] shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                3. Địa điểm vui chơi
                {selectedAttractions.length > 0 && (
                  <span className="bg-[#f59e0b] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {selectedAttractions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Nút đặt lại lựa chọn nếu có */}
            {(selectedWard || selectedAttractions.length > 0) && (
              <button
                onClick={() => {
                  setSelectedWard(null);
                  setSelectedAttractions([]);
                }}
                className="text-xs text-gray-400 hover:text-red-500 font-semibold cursor-pointer"
              >
                Bỏ chọn lọc
              </button>
            )}
          </div>

          {/* TAB 1: THÀNH PHỐ / TỈNH */}
          {activeTab === 'province' && (
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nhanh thành phố, tỉnh..."
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#048c73] focus:bg-white text-gray-800"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-4 gap-2 max-h-[230px] overflow-y-auto p-1">
                {filteredProvinces.map(p => {
                  const isSelected = selectedProvince === p.province;
                  return (
                    <button
                      key={p.province}
                      onClick={() => {
                        setSelectedProvince(p.province);
                        setSelectedWard(null);
                        setActiveTab('ward');
                      }}
                      className={`p-2.5 rounded-md text-xs font-bold border transition-all text-left flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#edfbf7] border-[#048c73] text-[#048c73] shadow-xs'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-[#048c73] hover:bg-gray-50'
                      }`}
                    >
                      <span>{p.province}</span>
                      <span className="text-[10px] text-gray-400 font-normal mt-1">{p.wards.length} xã/phường</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PHƯỜNG / XÃ */}
          {activeTab === 'ward' && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Tìm nhanh phường, xã tại ${selectedProvince}...`}
                    value={wardSearch}
                    onChange={(e) => setWardSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#048c73] focus:bg-white text-gray-800"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setSelectedWard(null);
                    setActiveTab('attractions');
                  }}
                  className="text-xs font-bold text-[#048c73] hover:underline shrink-0 px-2 cursor-pointer"
                >
                  Tất cả xã → Chọn điểm vui chơi
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-[230px] overflow-y-auto p-1">
                {currentProvinceWards.map(w => {
                  const isSelected = selectedWard === w.name;
                  return (
                    <button
                      key={w.name}
                      onClick={() => {
                        setSelectedWard(isSelected ? null : w.name);
                        setActiveTab('attractions');
                      }}
                      className={`p-2.5 rounded-md text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#048c73] text-white border-[#048c73] shadow-xs'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-[#048c73] hover:bg-[#edfbf7]'
                      }`}
                    >
                      <span className="truncate">{w.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ĐỊA ĐIỂM VUI CHƠI */}
          {activeTab === 'attractions' && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm địa điểm vui chơi, tham quan..."
                    value={attractionSearch}
                    onChange={(e) => setAttractionSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#048c73] focus:bg-white text-gray-800"
                    autoFocus
                  />
                </div>
                <span className="text-[11px] text-gray-500 shrink-0">
                  Đã chọn: <strong className="text-[#048c73]">{selectedAttractions.length}</strong> điểm
                </span>
              </div>

              {isLoadingAttractions ? (
                <div className="flex items-center justify-center p-8 text-xs text-[#048c73] font-bold gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách địa điểm vui chơi...
                </div>
              ) : filteredAttractions.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">
                  Không tìm thấy địa điểm vui chơi nào khớp.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[230px] overflow-y-auto p-1">
                  {filteredAttractions.map(att => {
                    const isChecked = selectedAttractions.some(a => a.id === att.id);
                    const isSeasonal = Boolean(att.isSuitableByTime);
                    const formatDate = (dStr?: string) => {
                      if (!dStr) return '';
                      const parts = dStr.split('-');
                      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                      return dStr;
                    };
                    const startFmt = formatDate(att.suitableDateStart);
                    const endFmt = formatDate(att.suitableDateEnd);

                    return (
                      <div
                        key={att.id}
                        onClick={() => toggleAttraction(att)}
                        className={`p-2 rounded-md border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isChecked
                            ? 'border-[#048c73] bg-[#edfbf7] text-[#048c73]'
                            : isSeasonal
                              ? 'border-[#048c73]/30 bg-[#f4faf7] text-gray-800 hover:border-[#048c73] hover:bg-[#edfbf7]'
                              : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-[#048c73]' : isSeasonal ? 'text-amber-500 fill-amber-400' : 'text-gray-400'}`} />
                          <div className="flex flex-col truncate min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold truncate">{att.name}</span>
                              {isSeasonal && (
                                <span className="shrink-0 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-xs leading-tight">
                                  Mùa đẹp
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 truncate">
                              <span className="truncate">{att.regionName || att.address || 'Điểm vui chơi'}</span>
                              {(startFmt || endFmt) && (
                                <span className="shrink-0 text-[#048c73] font-semibold bg-white/80 px-1 rounded-xs border border-[#048c73]/20">
                                  {startFmt && endFmt ? `${startFmt} - ${endFmt}` : (endFmt ? `Đến ${endFmt}` : 'Đang vào mùa')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-[#048c73] border-[#048c73] text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  {selectedAttractions.length > 0 
                    ? `Sẽ tìm homestay quanh ${selectedAttractions.length} điểm vui chơi đã chọn.` 
                    : 'Có thể chọn nhiều địa điểm vui chơi cùng lúc.'}
                </span>
                <Button
                  className="bg-[#048c73] hover:bg-[#03725e] text-white text-xs font-bold px-4 py-1.5 h-auto rounded-md"
                  onClick={() => setActiveTab(null)}
                >
                  Xác nhận điểm đến
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- MOBILE MODAL (3 PHẦN: THÀNH PHỐ, PHƯỜNG XÃ, ĐỊA ĐIỂM VUI CHƠI) ---------------- */}
      {mountedTab && typeof window !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex justify-center items-end search-modal-portal">
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${activeTab ? 'fade-in-overlay' : 'fade-out-overlay'}`} 
            onClick={closeModal} 
          />
          <div 
            className={`relative w-full h-[85vh] bg-white rounded-t-xl flex flex-col shadow-2xl ${activeTab ? 'modal-slide-in' : 'modal-slide-out'}`} 
            onClick={stopPropagation}
          >
            <div className="flex justify-center pt-2.5 pb-1.5">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base text-gray-900">Lọc Địa Điểm Du Lịch</h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Tab Selector */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-gray-100 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('province')}
                className={`py-1.5 text-xs font-bold rounded text-center transition-all ${
                  activeTab === 'province' ? 'bg-white text-[#048c73] shadow-xs' : 'text-gray-600'
                }`}
              >
                1. Thành phố
              </button>
              <button
                onClick={() => setActiveTab('ward')}
                className={`py-1.5 text-xs font-bold rounded text-center transition-all ${
                  activeTab === 'ward' ? 'bg-white text-[#048c73] shadow-xs' : 'text-gray-600'
                }`}
              >
                2. Phường/Xã
              </button>
              <button
                onClick={() => setActiveTab('attractions')}
                className={`py-1.5 text-xs font-bold rounded text-center transition-all ${
                  activeTab === 'attractions' ? 'bg-white text-[#048c73] shadow-xs' : 'text-gray-600'
                }`}
              >
                3. Điểm vui chơi ({selectedAttractions.length})
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {activeTab === 'province' && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Tìm thành phố, tỉnh..."
                    value={provinceSearch}
                    onChange={(e) => setProvinceSearch(e.target.value)}
                    className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {filteredProvinces.map(p => (
                      <button
                        key={p.province}
                        onClick={() => {
                          setSelectedProvince(p.province);
                          setSelectedWard(null);
                          setActiveTab('ward');
                        }}
                        className={`p-2.5 rounded-md text-xs font-bold border text-left cursor-pointer ${
                          selectedProvince === p.province ? 'bg-[#edfbf7] border-[#048c73] text-[#048c73]' : 'bg-white border-gray-200'
                        }`}
                      >
                        {p.province}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'ward' && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder={`Tìm phường, xã tại ${selectedProvince}...`}
                    value={wardSearch}
                    onChange={(e) => setWardSearch(e.target.value)}
                    className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none"
                  />
                  <button
                    onClick={() => {
                      setSelectedWard(null);
                      setActiveTab('attractions');
                    }}
                    className="text-xs text-[#048c73] font-bold text-left underline py-1 cursor-pointer"
                  >
                    Bỏ qua xã → Đến chọn địa điểm vui chơi
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    {currentProvinceWards.map(w => (
                      <button
                        key={w.name}
                        onClick={() => {
                          setSelectedWard(selectedWard === w.name ? null : w.name);
                          setActiveTab('attractions');
                        }}
                        className={`p-2.5 rounded-md text-xs font-bold border text-left flex justify-between items-center cursor-pointer ${
                          selectedWard === w.name ? 'bg-[#048c73] text-white border-[#048c73]' : 'bg-white border-gray-200'
                        }`}
                      >
                        <span>{w.name}</span>
                        {selectedWard === w.name && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'attractions' && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Tìm địa điểm vui chơi..."
                    value={attractionSearch}
                    onChange={(e) => setAttractionSearch(e.target.value)}
                    className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none"
                  />
                  <div className="flex flex-col gap-1.5">
                    {filteredAttractions.map(att => {
                      const isChecked = selectedAttractions.some(a => a.id === att.id);
                      return (
                        <div
                          key={att.id}
                          onClick={() => toggleAttraction(att)}
                          className={`p-2.5 rounded-md border text-xs font-bold flex justify-between items-center cursor-pointer ${
                            isChecked ? 'bg-[#edfbf7] border-[#048c73] text-[#048c73]' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                            <span>{att.name}</span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-[#048c73] border-[#048c73] text-white' : 'border-gray-300'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {selectedAttractions.length} điểm đã chọn
              </span>
              <Button
                className="bg-[#048c73] hover:bg-[#03725e] text-white text-xs font-bold px-4 py-2 rounded-md"
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
