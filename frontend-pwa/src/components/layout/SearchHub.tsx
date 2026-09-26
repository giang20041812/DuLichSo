import React, { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "../ui/button"
import { 
  Search, 
  MapPin,
  Sparkles, 
  Check, 
  X,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

import { fetchPublicRegions, PublicRegionDto } from "@/services/homestayService"

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
  id?: number;
  name: string;
}

export interface DistrictData {
  id?: number;
  name: string;
  wards: WardData[];
}

export interface ProvinceData {
  id?: number;
  province: string;
  districts?: DistrictData[];
  wards?: WardData[];
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

const DEFAULT_LOCATIONS: ProvinceData[] = [
  {
    province: "Yên Bái",
    districts: [
      {
        name: "Huyện Mù Cang Chải",
        wards: [
          { name: "La Pán Tẩn" },
          { name: "Thị trấn Mù Cang Chải" },
          { name: "Chế Cu Nha" },
          { name: "Dế Xu Phình" },
          { name: "Cao Phạ" },
          { name: "Nậm Có" },
          { name: "Púng Luông" },
          { name: "Mồ Dề" },
          { name: "Kim Nọi" },
          { name: "Nậm Khắt" },
          { name: "Chế Tạo" }
        ]
      },
      {
        name: "Huyện Văn Chấn",
        wards: [
          { name: "Tú Lệ" },
          { name: "Nghĩa Sơn" },
          { name: "Suối Giàng" }
        ]
      },
      {
        name: "Huyện Trạm Tấu",
        wards: [
          { name: "Bản Mù" },
          { name: "Bản Công" },
          { name: "Tà Si Láng" }
        ]
      },
      {
        name: "Thị xã Nghĩa Lộ",
        wards: [
          { name: "Trung Tâm" },
          { name: "Tân An" }
        ]
      }
    ]
  },
  {
    province: "Lào Cai",
    districts: [
      {
        name: "Thị xã Sa Pa",
        wards: [
          { name: "Sa Pa" },
          { name: "Tả Van" },
          { name: "San Sả Hồ" },
          { name: "Tả Phìn" },
          { name: "Mường Hoa" },
          { name: "Hàm Rồng" }
        ]
      },
      {
        name: "Huyện Bát Xát",
        wards: [
          { name: "Y Tý" },
          { name: "Mường Hum" }
        ]
      },
      {
        name: "Huyện Bắc Hà",
        wards: [
          { name: "Bắc Hà" },
          { name: "Bản Phố" }
        ]
      }
    ]
  },
  {
    province: "Hà Giang",
    districts: [
      {
        name: "Huyện Đồng Văn",
        wards: [
          { name: "Đồng Văn" },
          { name: "Lũng Cú" },
          { name: "Sà Phìn" }
        ]
      },
      {
        name: "Huyện Mèo Vạc",
        wards: [
          { name: "Mèo Vạc" },
          { name: "Pải Lủng" }
        ]
      },
      {
        name: "Huyện Hoàng Su Phì",
        wards: [
          { name: "Bản Phùng" },
          { name: "Thông Nguyên" }
        ]
      }
    ]
  },
  {
    province: "Sơn La",
    districts: [
      {
        name: "Huyện Mộc Châu",
        wards: [
          { name: "Mộc Châu" },
          { name: "Đông Sang" }
        ]
      },
      {
        name: "Huyện Bắc Yên",
        wards: [
          { name: "Tà Xùa" },
          { name: "Háng Đồng" }
        ]
      }
    ]
  },
  {
    province: "Hà Nội",
    districts: [
      {
        name: "Quận Hoàn Kiếm",
        wards: [
          { name: "Hàng Trống" },
          { name: "Tràng Tiền" }
        ]
      },
      {
        name: "Huyện Ba Vì",
        wards: [
          { name: "Tản Lĩnh" },
          { name: "Ba Trại" }
        ]
      }
    ]
  },
  {
    province: "Đà Nẵng",
    districts: [
      {
        name: "Quận Sơn Trà",
        wards: [
          { name: "An Hải Bắc" },
          { name: "Phước Mỹ" }
        ]
      },
      {
        name: "Quận Ngũ Hành Sơn",
        wards: [
          { name: "Mỹ An" },
          { name: "Khuê Mỹ" }
        ]
      }
    ]
  },
  {
    province: "Lâm Đồng",
    districts: [
      {
        name: "Thành phố Đà Lạt",
        wards: [
          { name: "Phường 1" },
          { name: "Phường 2" },
          { name: "Xuân Trường" }
        ]
      },
      {
        name: "Huyện Lạc Dương",
        wards: [
          { name: "Lạc Dương" },
          { name: "Đạ Sar" }
        ]
      }
    ]
  }
];

export default function SearchHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 3 distinct filter tabs: 'location' (province+district+ward), 'attractions', 'dates'
  const [activeTab, setActiveTab] = useState<'location' | 'attractions' | 'dates' | null>(null);
  const [mountedTab, setMountedTab] = useState<'location' | 'attractions' | 'dates' | null>(null);

  // Sub-step inside mobile 'location' panel: 'province' or 'area'
  const [locationMobileStep, setLocationMobileStep] = useState<'province' | 'area'>('province');

  // Sticky state for responsive mobile view
  const [isSticky, setIsSticky] = useState(false);

  // Date state: Ngày đi mong muốn
  const [checkInDate, setCheckInDate] = useState<{ day: number, month: number, year: number } | null>(() => {
    const today = new Date();
    return {
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear()
    };
  });
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());

  // Dynamic regions from DB (fallbacks to DEFAULT_LOCATIONS)
  const [locations, setLocations] = useState<ProvinceData[]>(DEFAULT_LOCATIONS);

  // Selected states (District và Ward mặc định là "Tất cả")
  const [selectedProvince, setSelectedProvince] = useState<string>("Yên Bái");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedAttractions, setSelectedAttractions] = useState<AttractionItem[]>([]);
  
  // Search text inputs for each section
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [attractionSearch, setAttractionSearch] = useState("");

  // Loaded Attractions from Database
  const [dbAttractions, setDbAttractions] = useState<AttractionItem[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Sync state with URL params
  useEffect(() => {
    const prov = searchParams.get('province');
    const dist = searchParams.get('district');
    const wrd = searchParams.get('ward');
    const checkIn = searchParams.get('checkIn');

    if (prov) setSelectedProvince(prov);
    if (dist) setSelectedDistrict(dist);
    if (wrd) setSelectedWard(wrd);
    if (checkIn) {
      const parts = checkIn.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setCheckInDate({ year: y, month: m, day: d });
        }
      }
    }
  }, [searchParams]);

  // Chiều cao thực tế của thanh Navigation Header để ghim thanh tìm kiếm nằm chính xác ở dưới
  const [headerHeight, setHeaderHeight] = useState<number>(112);

  // Đo chiều cao Header và theo dõi cuộn trang
  useEffect(() => {
    const handleScrollAndResize = () => {
      const headerEl = document.querySelector('header');
      const hHeight = headerEl ? headerEl.offsetHeight : 112;
      setHeaderHeight(hHeight);

      if (!searchRef.current) return;
      const rect = searchRef.current.getBoundingClientRect();
      // Tự động sticky thu gọn ngay khi vị trí thanh tìm kiếm cuộn chạm vào đáy navigation
      const shouldStick = rect.top <= hHeight || window.scrollY > 140;
      setIsSticky(shouldStick);
    };

    window.addEventListener('scroll', handleScrollAndResize, { passive: true });
    window.addEventListener('resize', handleScrollAndResize, { passive: true });
    handleScrollAndResize();
    return () => {
      window.removeEventListener('scroll', handleScrollAndResize);
      window.removeEventListener('resize', handleScrollAndResize);
    };
  }, []);

  // Display helpers for compact / collapsed responsive view
  const displayLocation = useMemo(() => {
    if (selectedWard) {
      return `${selectedWard}, ${selectedDistrict || selectedProvince}`;
    }
    if (selectedDistrict) {
      return `${selectedDistrict}, ${selectedProvince}`;
    }
    return selectedProvince || "Chọn điểm đến";
  }, [selectedWard, selectedDistrict, selectedProvince]);

  const displayDate = useMemo(() => {
    if (!checkInDate) return "Chọn ngày";
    return `${checkInDate.day} Th${checkInDate.month}`;
  }, [checkInDate]);

  const displayAttractions = useMemo(() => {
    if (selectedAttractions.length === 0) return "Điểm vui chơi";
    if (selectedAttractions.length === 1) return selectedAttractions[0]?.name ?? '';
    return `${selectedAttractions.length} điểm chơi`;
  }, [selectedAttractions]);

  // Load Regions from API on mount
  useEffect(() => {
    fetchPublicRegions()
      .then((data: PublicRegionDto[]) => {
        if (data && data.length > 0) {
          // Normalize data
          const mapped: ProvinceData[] = data.map((d) => ({
            id: d.id,
            province: d.province || d.name || "Yên Bái",
            districts: d.districts || [],
            wards: d.wards || []
          }));
          setLocations(mapped);
          setSelectedProvince(prev => !mapped.some(d => d.province === prev) ? (mapped[0]?.province ?? "Yên Bái") : prev);
        }
      })
      .catch((err) => {
        console.warn("Using default locations, region API error:", err);
      });
  }, []);

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
      const target = event.target as Element | null;
      if (!target) return;
      if (
        target.closest('.search-popover-panel') ||
        target.closest('.search-modal-portal') ||
        target.closest('.search-sticky-bar') ||
        (searchRef.current && searchRef.current.contains(target))
      ) {
        return;
      }
      setActiveTab(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tự động chuyển tab sang 'attractions' khi chọn xong Xã/Phường
  const handleSelectWard = (wardName: string | null) => {
    if (!wardName) {
      setSelectedWard(null);
    } else {
      setSelectedWard(wardName);
      // Tự động suy ra Huyện nếu người dùng tìm/chọn thẳng Xã
      if (!selectedDistrict && currentProvinceObj?.districts) {
        const parentDist = currentProvinceObj.districts.find(d => 
          d.wards.some(w => w.name.toLowerCase() === wardName.toLowerCase())
        );
        if (parentDist) {
          setSelectedDistrict(parentDist.name);
        }
      }
    }
    setActiveTab('attractions');
  };

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

  // Filtered Provinces
  const filteredProvinces = useMemo(() => {
    const q = provinceSearch.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(p => p.province.toLowerCase().includes(q));
  }, [provinceSearch, locations]);

  // Current Province Object
  const currentProvinceObj = useMemo(() => {
    return locations.find(item => item.province.toLowerCase() === selectedProvince.toLowerCase()) ?? locations[0];
  }, [selectedProvince, locations]);

  // Filtered Districts in Selected Province
  const currentDistricts = useMemo(() => {
    const districts = currentProvinceObj?.districts ?? [];
    const q = districtSearch.trim().toLowerCase();
    if (!q) return districts;
    return districts.filter(d => d.name.toLowerCase().includes(q));
  }, [currentProvinceObj, districtSearch]);

  // Filtered Wards: If district selected -> wards of that district; else all wards of the province
  const currentWards = useMemo(() => {
    let rawWards: WardData[] = [];
    if (selectedDistrict) {
      const dist = (currentProvinceObj?.districts ?? []).find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());
      rawWards = dist?.wards ?? [];
    } else {
      // Gather all wards across all districts of current province
      const allDistricts = currentProvinceObj?.districts ?? [];
      if (allDistricts.length > 0) {
        rawWards = allDistricts.flatMap(d => d.wards);
      } else {
        rawWards = currentProvinceObj?.wards ?? [];
      }
    }

    const q = wardSearch.trim().toLowerCase();
    if (!q) return rawWards;
    return rawWards.filter(w => w.name.toLowerCase().includes(q));
  }, [currentProvinceObj, selectedDistrict, wardSearch]);

  // Filtered Attractions (Liên kết phân cấp ngược: Xã -> Huyện -> Tỉnh)
  const filteredAttractions = useMemo(() => {
    let list = dbAttractions;

    if (selectedWard) {
      // 1. Nếu chọn Phường/Xã cụ thể -> LỌC CHẶT THEO PHƯỜNG/XÃ ĐÓ
      const wardClean = selectedWard.toLowerCase().trim();
      list = list.filter(a => {
        const inRegion = a.regionName && a.regionName.toLowerCase().includes(wardClean);
        const inAddress = a.address && a.address.toLowerCase().includes(wardClean);
        const inName = a.name && a.name.toLowerCase().includes(wardClean);
        return inRegion || inAddress || inName;
      });
    } else if (selectedDistrict) {
      // 2. Nếu chọn Huyện cụ thể (và Xã = Tất cả) -> LỌC THEO HUYỆN & TẤT CẢ XÃ THUỘC HUYỆN ĐÓ
      const distClean = selectedDistrict.toLowerCase().trim();
      const currentDist = (currentProvinceObj?.districts ?? []).find(d => d.name.toLowerCase() === distClean);
      const wardNamesInDist = (currentDist?.wards || []).map(w => w.name.toLowerCase());

      list = list.filter(a => {
        const inRegion = a.regionName && (
          a.regionName.toLowerCase().includes(distClean) ||
          wardNamesInDist.some(w => a.regionName!.toLowerCase().includes(w))
        );
        const inAddress = a.address && (
          a.address.toLowerCase().includes(distClean) ||
          wardNamesInDist.some(w => a.address!.toLowerCase().includes(w))
        );
        const inName = a.name && (
          a.name.toLowerCase().includes(distClean) ||
          wardNamesInDist.some(w => a.name.toLowerCase().includes(w))
        );
        return inRegion || inAddress || inName;
      });
    } else if (selectedProvince) {
      // 3. Nếu chọn Tỉnh (Huyện = Tất cả, Xã = Tất cả) -> LỌC THEO TỈNH VÀ MỌI HUYỆN/XÃ THUỘC TỈNH
      const provClean = selectedProvince.toLowerCase().trim();
      const allDistricts = currentProvinceObj?.districts ?? [];
      const distNames = allDistricts.map(d => d.name.toLowerCase());
      const wardNames = allDistricts.flatMap(d => d.wards.map(w => w.name.toLowerCase()));

      list = list.filter(a => {
        const inRegion = a.regionName && (
          a.regionName.toLowerCase().includes(provClean) ||
          distNames.some(d => a.regionName!.toLowerCase().includes(d)) ||
          wardNames.some(w => a.regionName!.toLowerCase().includes(w))
        );
        const inAddress = a.address && (
          a.address.toLowerCase().includes(provClean) ||
          distNames.some(d => a.address!.toLowerCase().includes(d)) ||
          wardNames.some(w => a.address!.toLowerCase().includes(w))
        );
        return inRegion || inAddress;
      });
    }

    // 4. Lọc theo từ khóa tìm kiếm ô input (nếu người dùng gõ tìm kiếm)
    const q = attractionSearch.trim().toLowerCase();
    let result = list;
    if (q) {
      result = list.filter(a => 
        a.name.toLowerCase().includes(q) || 
        (a.regionName && a.regionName.toLowerCase().includes(q)) ||
        (a.address && a.address.toLowerCase().includes(q))
      );
    }

    // 5. Ưu tiên các điểm đến thích hợp theo mùa (isSuitableByTime = true) lên trên đầu
    return [...result].sort((a, b) => {
      const aVal = a.isSuitableByTime ? 1 : 0;
      const bVal = b.isSuitableByTime ? 1 : 0;
      return bVal - aVal;
    });
  }, [dbAttractions, selectedProvince, selectedDistrict, selectedWard, currentProvinceObj, attractionSearch]);

  // Perform actual search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedProvince) params.append('province', selectedProvince);
    if (selectedDistrict) params.append('district', selectedDistrict);
    if (selectedWard) params.append('ward', selectedWard);
    if (selectedAttractions.length > 0) {
      params.append('attractions', selectedAttractions.map(a => a.id).join(','));
    }
    if (checkInDate) {
      const startStr = `${checkInDate.year}-${String(checkInDate.month).padStart(2, '0')}-${String(checkInDate.day).padStart(2, '0')}`;
      params.append('checkIn', startStr);
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
    if (selectedDistrict) labelParts.push(selectedDistrict);
    if (selectedProvince) labelParts.push(selectedProvince);
    if (labelParts.length > 0) {
      params.append('destination', labelParts.join(', '));
    }

    navigate(`/homestays?${params.toString()}`);
    setActiveTab(null);
  };

  // Render bộ chọn ngày đi mong muốn
  const renderCalendar = () => {
    const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
    const rawFirstDay = new Date(calendarYear, calendarMonth - 1, 1).getDay();
    const firstDayIndex = (rawFirstDay + 6) % 7;

    const handlePrevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (calendarMonth === 1) {
        setCalendarMonth(12);
        setCalendarYear(prev => prev - 1);
      } else {
        setCalendarMonth(prev => prev - 1);
      }
    };

    const handleNextMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (calendarMonth === 12) {
        setCalendarMonth(1);
        setCalendarYear(prev => prev + 1);
      } else {
        setCalendarMonth(prev => prev + 1);
      }
    };

    const setQuickDate = (offsetDays: number, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      setCheckInDate({ day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() });
      setCalendarMonth(d.getMonth() + 1);
      setCalendarYear(d.getFullYear());
    };

    return (
      <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        {/* Quick select buttons */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={(e) => setQuickDate(0, e)}
            className="px-2.5 py-1 text-base font-bold rounded-lg border-2 border-slate-200 hover:border-[#048C73] text-slate-700 hover:text-[#048C73] bg-slate-50 transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={(e) => setQuickDate(1, e)}
            className="px-2.5 py-1 text-base font-bold rounded-lg border-2 border-slate-200 hover:border-[#048C73] text-slate-700 hover:text-[#048C73] bg-slate-50 transition-colors cursor-pointer"
          >
            Ngày mai
          </button>
          <button
            type="button"
            onClick={(e) => {
              const d = new Date();
              const day = d.getDay();
              const diff = day === 6 ? 0 : (6 - day);
              setQuickDate(diff, e);
            }}
            className="px-2.5 py-1 text-base font-bold rounded-lg border-2 border-amber-200 hover:border-amber-400 text-amber-800 bg-amber-50 transition-colors cursor-pointer"
          >
            Thứ Bảy tuần này
          </button>
        </div>

        {/* Month selector header */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-lg border border-slate-200 hover:border-[#048C73] flex items-center justify-center text-slate-600 hover:text-[#048C73] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-base text-[#0a2e26]">
            Tháng {calendarMonth}, {calendarYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-7 h-7 rounded-lg border border-slate-200 hover:border-[#048C73] flex items-center justify-center text-slate-600 hover:text-[#048C73] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="py-1.5" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
            const isSelected = checkInDate?.day === d && checkInDate?.month === calendarMonth && checkInDate?.year === calendarYear;
            const isToday = new Date().getDate() === d && (new Date().getMonth() + 1) === calendarMonth && new Date().getFullYear() === calendarYear;
            return (
              <button
                key={d}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCheckInDate({ day: d, month: calendarMonth, year: calendarYear });
                }}
                className={`py-1.5 text-base font-bold rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#048C73] text-white border-2 border-[#025a4a] shadow-xs scale-105'
                    : isToday
                      ? 'border-2 border-[#048c73] text-[#048c73] hover:bg-[#edfbf7]'
                      : 'border-transparent text-slate-700 hover:bg-[#edfbf7] hover:border-slate-200'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={searchRef} 
      className="w-full relative z-30 transition-all text-left"
    >
      {/* ---------------- KHU VỰC TÌM KIẾM GỐC TRÊN TRANG (GIỮ NGUYÊN KHI CHƯA CUỘN) ---------------- */}
      <div className={`w-full flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-2.5 p-2 sm:p-2.5 rounded-xl bg-white/95 backdrop-blur-md shadow-xl border border-white/80 transition-opacity duration-200 text-left ${isSticky ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* BỘ LỌC ĐỊA ĐIỂM & NGÀY ĐI (3 CỘT GỘP) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Cột 1: Thành phố & Khu vực (GỘP) */}
          <div 
            className={`bg-white rounded-lg shadow-xs border-2 px-3 sm:px-3.5 h-[52px] sm:h-[58px] flex items-center gap-2.5 cursor-pointer transition-all relative ${
              activeTab === 'location' 
                ? 'border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/20 z-40' 
                : 'border-slate-200 hover:border-[#048c73] z-20'
            }`}
            onClick={() => setActiveTab(activeTab === 'location' ? null : 'location')}
          >
            <MapPin className="text-[#048c73] w-5 h-5 shrink-0" />
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <span className="text-xs font-bold text-[#66716c] uppercase tracking-wider mb-0.5 truncate">
                Thành phố &amp; Khu vực
              </span>
              <span className="text-base font-bold text-[#0a2e26] truncate">
                {selectedWard
                  ? `${selectedWard}, ${selectedDistrict || selectedProvince}`
                  : selectedDistrict
                    ? `${selectedDistrict}, ${selectedProvince}`
                    : (selectedProvince || "Chọn điểm đến / tỉnh thành")}
              </span>
            </div>
          </div>

          {/* Cột 2: Địa điểm vui chơi */}
          <div 
            className={`bg-white rounded-lg shadow-xs border-2 px-3 sm:px-3.5 h-[52px] sm:h-[58px] flex items-center gap-2.5 cursor-pointer transition-all relative ${
              activeTab === 'attractions' 
                ? 'border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/20 z-40' 
                : 'border-slate-200 hover:border-[#048c73] z-20'
            }`}
            onClick={() => setActiveTab(activeTab === 'attractions' ? null : 'attractions')}
          >
            <Sparkles className="text-[#f59e0b] w-5 h-5 shrink-0" />
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <span className="text-xs font-bold text-[#66716c] uppercase tracking-wider mb-0.5 truncate flex items-center gap-1">
                Điểm vui chơi
                {selectedAttractions.length > 0 && (
                  <span className="bg-[#f59e0b] text-white text-[11px] px-1.5 py-0.2 rounded-xs font-bold leading-none">
                    {selectedAttractions.length}
                  </span>
                )}
              </span>
              <span className="text-base font-bold text-[#0a2e26] truncate">
                {selectedAttractions.length === 0
                  ? "Chọn điểm đến"
                  : selectedAttractions.length === 1
                    ? (selectedAttractions[0]?.name ?? '')
                    : `${selectedAttractions.length} điểm đã chọn`}
              </span>
            </div>
          </div>

          {/* Cột 3: Ngày đi mong muốn */}
          <div 
            className={`bg-white rounded-lg shadow-xs border-2 px-3 sm:px-3.5 h-[52px] sm:h-[58px] flex items-center gap-2.5 cursor-pointer transition-all relative ${
              activeTab === 'dates' 
                ? 'border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/20 z-40' 
                : 'border-slate-200 hover:border-[#048c73] z-20'
            }`}
            onClick={() => setActiveTab(activeTab === 'dates' ? null : 'dates')}
          >
            <Calendar className="text-[#048c73] w-5 h-5 shrink-0" />
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <span className="text-xs font-bold text-[#66716c] uppercase tracking-wider mb-0.5 truncate">
                Ngày đi mong muốn
              </span>
              <span className="text-base font-bold text-[#0a2e26] truncate">
                {checkInDate ? `${checkInDate.day} Th${checkInDate.month}, ${checkInDate.year}` : "Chọn ngày đi"}
              </span>
            </div>
          </div>
        </div>

        {/* Nút Tìm kiếm */}
        <div className="flex items-center shrink-0">
          <Button 
            onClick={handleSearch}
            className="h-[52px] sm:h-[58px] px-7 sm:px-8 bg-[#048c73] hover:bg-[#03725e] text-white font-bold rounded-lg border-2 border-[#025a4a] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 text-[15px] sm:text-[16px] cursor-pointer w-full md:w-auto"
          >
            <Search className="w-5 h-5 text-[#7ef2dd]" strokeWidth={2.5} />
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* ---------------- THANH TÌM KIẾM STICKY THEO WEB KHI LƯỚT XUỐNG ---------------- */}
      {isSticky && typeof window !== 'undefined' && createPortal(
        <div 
          style={{ top: `${headerHeight}px` }}
          className="search-sticky-bar fixed inset-x-0 z-40 px-3 sm:px-6 py-2 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200/90 transition-all duration-200 animate-in slide-in-from-top-2"
        >
          <div className="max-w-5xl mx-auto w-full">
            {/* 1. KHI RESPONSIVE (MOBILE < md): THU GỌN THÔNG TIN LẠI THÀNH 1 Ô */}
            <div 
              onClick={() => setActiveTab('location')}
              className="md:hidden w-full bg-[#f6faf8] hover:bg-white rounded-lg border border-[#048c73]/35 shadow-xs px-3 py-1.5 flex items-center justify-between gap-2.5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-md bg-[#048c73] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Search className="w-3.5 h-3.5 text-[#7ef2dd]" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-xs font-bold text-[#0a2e26] truncate">
                    {displayLocation}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate">
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('dates');
                      }}
                      className="hover:text-[#048c73]"
                    >
                      {displayDate}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('attractions');
                      }}
                      className="text-amber-700 font-semibold hover:underline"
                    >
                      {displayAttractions}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSearch();
                }}
                className="h-8 px-3 bg-[#048c73] hover:bg-[#03725e] text-white font-bold rounded-md border border-[#025a4a] shadow-xs active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5 text-[#7ef2dd]" strokeWidth={2.5} />
                <span>Tìm</span>
              </Button>
            </div>

            {/* 2. KHI KHÔNG RESPONSIVE (DESKTOP >= md): VẪN HIỆN ĐẦY ĐỦ 3 THẺ THÔNG TIN NHƯ CŨ */}
            <div className="hidden md:flex items-center gap-2.5">
              <div className="flex-1 grid grid-cols-3 gap-2">
                {/* Cột 1: Thành phố & Khu vực */}
                <div 
                  onClick={() => setActiveTab(activeTab === 'location' ? null : 'location')}
                  className={`bg-white rounded-lg shadow-2xs border-2 px-3 h-[48px] flex items-center gap-2.5 cursor-pointer transition-all ${
                    activeTab === 'location' 
                      ? 'border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/30' 
                      : 'border-slate-200 hover:border-[#048c73]'
                  }`}
                >
                  <MapPin className="text-[#048c73] w-4.5 h-4.5 shrink-0" />
                  <div className="flex flex-col justify-center min-w-0 flex-1 text-left">
                    <span className="text-[10px] font-bold text-[#66716c] uppercase tracking-wider leading-none mb-0.5 truncate">
                      Thành phố &amp; Khu vực
                    </span>
                    <span className="text-sm font-bold text-[#0a2e26] truncate">
                      {selectedWard
                        ? `${selectedWard}, ${selectedDistrict || selectedProvince}`
                        : selectedDistrict
                          ? `${selectedDistrict}, ${selectedProvince}`
                          : (selectedProvince || "Chọn điểm đến")}
                    </span>
                  </div>
                </div>

                {/* Cột 2: Điểm vui chơi */}
                <div 
                  onClick={() => setActiveTab(activeTab === 'attractions' ? null : 'attractions')}
                  className={`bg-white rounded-lg shadow-2xs border-2 px-3 h-[48px] flex items-center gap-2.5 cursor-pointer transition-all ${
                    activeTab === 'attractions' 
                      ? 'border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/30' 
                      : 'border-slate-200 hover:border-[#048c73]'
                  }`}
                >
                  <Sparkles className="text-[#f59e0b] w-4.5 h-4.5 shrink-0" />
                  <div className="flex flex-col justify-center min-w-0 flex-1 text-left">
                    <span className="text-[10px] font-bold text-[#66716c] uppercase tracking-wider leading-none mb-0.5 truncate flex items-center gap-1">
                      Điểm vui chơi
                      {selectedAttractions.length > 0 && (
                        <span className="bg-[#f59e0b] text-white text-[10px] px-1.5 py-0.2 rounded-xs font-bold leading-none">
                          {selectedAttractions.length}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-bold text-[#0a2e26] truncate">
                      {selectedAttractions.length === 0
                        ? "Chọn điểm đến"
                        : selectedAttractions.length === 1
                          ? (selectedAttractions[0]?.name ?? '')
                          : `${selectedAttractions.length} điểm đã chọn`}
                    </span>
                  </div>
                </div>

                {/* Cột 3: Ngày đi mong muốn */}
                <div 
                  onClick={() => setActiveTab(activeTab === 'dates' ? null : 'dates')}
                  className={`bg-white rounded-lg shadow-2xs border-2 px-3 h-[48px] flex items-center gap-2.5 cursor-pointer transition-all ${
                    activeTab === 'dates' 
                      ? 'border-[#048c73] ring-2 ring-[#048c73]/20 bg-[#edfbf7]/30' 
                      : 'border-slate-200 hover:border-[#048c73]'
                  }`}
                >
                  <Calendar className="text-[#048c73] w-4.5 h-4.5 shrink-0" />
                  <div className="flex flex-col justify-center min-w-0 flex-1 text-left">
                    <span className="text-[10px] font-bold text-[#66716c] uppercase tracking-wider leading-none mb-0.5 truncate">
                      Ngày đi mong muốn
                    </span>
                    <span className="text-sm font-bold text-[#0a2e26] truncate">
                      {checkInDate ? `${checkInDate.day} Th${checkInDate.month}, ${checkInDate.year}` : "Chọn ngày đi"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút Tìm kiếm */}
              <Button 
                onClick={handleSearch}
                className="h-[48px] px-7 bg-[#048c73] hover:bg-[#03725e] text-white font-bold rounded-lg border-2 border-[#025a4a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2 text-sm cursor-pointer shrink-0"
              >
                <Search className="w-4.5 h-4.5 text-[#7ef2dd]" strokeWidth={2.5} />
                <span>Tìm kiếm</span>
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ---------------- DESKTOP UNIFIED 3-PHẦN POPOVER ---------------- */}
      {activeTab && (
        <div 
          style={isSticky ? { top: `${headerHeight + 66}px` } : undefined}
          className={`search-popover-panel hidden md:flex ${
            isSticky 
              ? 'fixed left-1/2 -translate-x-1/2 w-[820px] max-w-[calc(100vw-32px)] shadow-2xl' 
              : 'absolute top-[110%] left-0 w-full max-w-[820px] shadow-2xl'
          } bg-white rounded-lg border border-gray-200 p-4 z-[100] flex-col gap-3.5 animate-in fade-in slide-in-from-top-2 duration-200`}
          onClick={stopPropagation}
        >
          {/* Header Switcher: 3 Tabs (Chia đều 3 thẻ chọn 1/3 - 1/3 - 1/3) */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 gap-3">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-md flex-1">
              <button
                type="button"
                onClick={() => setActiveTab('location')}
                className={`py-2 px-2.5 text-xs sm:text-sm font-bold rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center truncate ${
                  activeTab === 'location' 
                    ? 'bg-white text-[#048c73] shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                <MapPin className="w-4 h-4 text-[#048c73] shrink-0" />
                <span className="truncate">1. Thành phố &amp; Khu vực</span>
                {selectedWard ? (
                  <span className="text-[11px] text-[#048c73] font-normal shrink-0">({selectedWard})</span>
                ) : selectedDistrict ? (
                  <span className="text-[11px] text-[#048c73] font-normal shrink-0">({selectedDistrict})</span>
                ) : selectedProvince ? (
                  <span className="text-[11px] text-[#048c73] font-normal shrink-0">({selectedProvince})</span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('attractions')}
                className={`py-2 px-2.5 text-xs sm:text-sm font-bold rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center truncate ${
                  activeTab === 'attractions' 
                    ? 'bg-white text-[#048c73] shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#f59e0b] shrink-0" />
                <span className="truncate">2. Điểm vui chơi</span>
                {selectedAttractions.length > 0 && (
                  <span className="bg-[#f59e0b] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0">
                    {selectedAttractions.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dates')}
                className={`py-2 px-2.5 text-xs sm:text-sm font-bold rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center truncate ${
                  activeTab === 'dates' 
                    ? 'bg-white text-[#048c73] shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                <Calendar className="w-4 h-4 text-[#048c73] shrink-0" />
                <span className="truncate">3. Ngày đi</span>
                {checkInDate && (
                  <span className="text-[11px] text-[#048c73] font-normal shrink-0">
                    ({checkInDate.day}/{checkInDate.month})
                  </span>
                )}
              </button>
            </div>

            {/* Nút đặt lại lựa chọn nếu có */}
            {(selectedDistrict || selectedWard || selectedAttractions.length > 0 || checkInDate) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDistrict(null);
                  setSelectedWard(null);
                  setSelectedAttractions([]);
                  setCheckInDate(null);
                }}
                className="text-xs font-semibold text-gray-400 hover:text-red-500 cursor-pointer shrink-0 whitespace-nowrap"
              >
                Bỏ chọn lọc
              </button>
            )}
          </div>

          {/* TAB 1: THÀNH PHỐ & KHU VỰC (GỘP THÀNH 1 PANEL ĐA NĂNG) */}
          {activeTab === 'location' && (
            <div className="flex gap-4">
              {/* Cột trái (38%): Thành phố / Tỉnh */}
              <div className="flex flex-col gap-2 w-[38%] border-r border-gray-100 pr-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">1. Chọn Tỉnh / Thành phố</span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tỉnh, TP..."
                    value={provinceSearch}
                    onChange={(e) => setProvinceSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#048c73] focus:bg-white text-gray-800"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {filteredProvinces.map(p => {
                    const isSelected = selectedProvince === p.province;
                    const districtCount = p.districts?.length || 0;
                    return (
                      <button
                        key={p.province}
                        onClick={() => {
                          setSelectedProvince(p.province);
                          setSelectedDistrict(null);
                          setSelectedWard(null);
                          setSelectedAttractions([]);
                        }}
                        className={`p-2 rounded-md text-sm font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#edfbf7] border-[#048c73] text-[#048c73] shadow-xs'
                            : 'bg-white border-gray-200 text-gray-800 hover:border-[#048c73] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col truncate">
                          <span className="truncate">{p.province}</span>
                          <span className="text-[11px] text-gray-400 font-normal">
                            {districtCount > 0 ? `${districtCount} quận/huyện` : 'Toàn tỉnh'}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#048c73] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cột phải (62%): Khu vực (Quận/Huyện & Phường/Xã) */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    2. Khu vực tại <span className="text-[#048c73]">{selectedProvince}</span>
                  </span>
                  <button
                    onClick={() => { setSelectedDistrict(null); handleSelectWard(null); }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                      selectedDistrict === null && selectedWard === null
                        ? 'bg-[#048c73] text-white border-[#048c73] shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-[#edfbf7] hover:border-[#048c73]'
                    }`}
                  >
                    ✓ Toàn tỉnh {selectedProvince}
                  </button>
                </div>

                <div className="flex gap-3 pt-1">
                  {/* Sub-column 1: Quận / Huyện */}
                  <div className="flex flex-col gap-2 w-1/2">
                    <span className="text-xs font-semibold text-gray-500">Quận / Huyện:</span>
                    <div className="relative">
                      <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm huyện..."
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#048c73] focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1 max-h-[190px] overflow-y-auto pr-1">
                      <button
                        onClick={() => { setSelectedDistrict(null); setSelectedWard(null); }}
                        className={`p-1.5 rounded-md text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          selectedDistrict === null
                            ? 'bg-[#048c73] text-white border-[#048c73] font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#048c73] hover:bg-[#edfbf7]'
                        }`}
                      >
                        <span>Tất cả quận/huyện</span>
                        {selectedDistrict === null && <Check className="w-3 h-3 text-white shrink-0" />}
                      </button>
                      {currentDistricts.map(d => {
                        const isSelected = selectedDistrict === d.name;
                        return (
                          <button
                            key={d.name}
                            onClick={() => { setSelectedDistrict(d.name); setSelectedWard(null); }}
                            className={`p-1.5 rounded-md text-xs border transition-all text-left flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#048c73] text-white border-[#048c73] font-bold shadow-xs'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-[#048c73] hover:bg-[#edfbf7]'
                            }`}
                          >
                            <span className="truncate">{d.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-column 2: Phường / Xã */}
                  <div className="flex flex-col gap-2 w-1/2">
                    <span className="text-xs font-semibold text-gray-500">
                      Phường / Xã {selectedDistrict ? `(${selectedDistrict})` : ''}:
                    </span>
                    <div className="relative">
                      <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={selectedDistrict ? 'Tìm xã...' : 'Tìm xã toàn tỉnh...'}
                        value={wardSearch}
                        onChange={(e) => setWardSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#048c73] focus:bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1 max-h-[190px] overflow-y-auto pr-1">
                      <button
                        onClick={() => handleSelectWard(null)}
                        className={`p-1.5 rounded-md text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          selectedWard === null
                            ? 'bg-[#048c73] text-white border-[#048c73] shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#048c73] hover:bg-[#edfbf7]'
                        }`}
                      >
                        <span>Tất cả xã/phường</span>
                        {selectedWard === null && <Check className="w-3 h-3 text-white shrink-0" />}
                      </button>
                      {currentWards.map(w => {
                        const isSelected = selectedWard === w.name;
                        return (
                          <button
                            key={w.name}
                            onClick={() => handleSelectWard(w.name)}
                            className={`p-1.5 rounded-md text-xs border transition-all text-left flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#048c73] text-white border-[#048c73] font-bold shadow-xs'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-[#048c73] hover:bg-[#edfbf7]'
                            }`}
                          >
                            <span className="truncate">{w.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setActiveTab('attractions')}
                    className="text-xs font-bold text-[#048c73] hover:text-[#03725e] flex items-center gap-1 cursor-pointer"
                  >
                    Tiếp tục: Chọn điểm vui chơi &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ĐỊA ĐIỂM VUI CHƠI */}
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
                    className="w-full pl-8 pr-3 py-1.5 text-base bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-[#048c73] focus:bg-white text-gray-800"
                    autoFocus
                  />
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  Đã chọn: <strong className="text-[#048c73]">{selectedAttractions.length}</strong> điểm
                </span>
              </div>

              {isLoadingAttractions ? (
                <div className="flex items-center justify-center p-8 text-base text-[#048c73] font-bold gap-2">
                  <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang tải danh sách địa điểm vui chơi...</span>
                </div>
              ) : filteredAttractions.length === 0 ? (
                <div className="text-center py-6 text-base text-gray-500">
                  Không tìm thấy địa điểm vui chơi nào khớp với khu vực đã chọn.
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
                        className={`p-2 rounded-md border text-base font-semibold cursor-pointer transition-all flex items-center justify-between gap-2 ${
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
                                <span className="shrink-0 bg-amber-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-xs leading-tight">
                                  Mùa đẹp
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
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
                <span className="text-xs text-gray-500">
                  {selectedAttractions.length > 0 
                    ? `Sẽ tìm homestay quanh ${selectedAttractions.length} điểm vui chơi đã chọn.` 
                    : 'Có thể chọn nhiều địa điểm vui chơi cùng lúc.'}
                </span>
                <Button
                  className="bg-[#048c73] hover:bg-[#03725e] text-white text-base font-bold px-4 py-1.5 h-auto rounded-md border-2 border-[#025a4a] cursor-pointer"
                  onClick={() => setActiveTab(null)}
                >
                  Xác nhận điểm đến
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: NGÀY ĐI MONG MUỐN */}
          {activeTab === 'dates' && (
            <div className="flex flex-col gap-2.5">
              {renderCalendar()}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {checkInDate ? `Ngày đã chọn: ${checkInDate.day}/${checkInDate.month}/${checkInDate.year}` : 'Chọn một ngày mong muốn để tìm phòng sẵn sàng.'}
                </span>
                <Button
                  className="bg-[#048c73] hover:bg-[#03725e] text-white text-base font-bold px-4 py-1.5 h-auto rounded-md border-2 border-[#025a4a] cursor-pointer"
                  onClick={() => setActiveTab(null)}
                >
                  Xong
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- MOBILE MODAL (THÀNH PHỐ & KHU VỰC, ĐIỂM VUI CHƠI, NGÀY ĐI) ---------------- */}
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
              <h3 className="font-bold text-base text-gray-900">Lọc Địa Điểm & Ngày Đi</h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Tab Selector: 3 Tabs */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-gray-100 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('location')}
                className={`py-1.5 text-xs font-bold rounded text-center transition-all ${
                  activeTab === 'location' ? 'bg-white text-[#048c73] shadow-xs' : 'text-gray-600'
                }`}
              >
                1. Điểm đến &amp; Khu vực
              </button>
              <button
                onClick={() => setActiveTab('attractions')}
                className={`py-1.5 text-xs font-bold rounded text-center transition-all ${
                  activeTab === 'attractions' ? 'bg-white text-[#048c73] shadow-xs' : 'text-gray-600'
                }`}
              >
                2. Vui chơi
              </button>
              <button
                onClick={() => setActiveTab('dates')}
                className={`py-1.5 text-xs font-bold rounded text-center transition-all ${
                  activeTab === 'dates' ? 'bg-white text-[#048c73] shadow-xs' : 'text-gray-600'
                }`}
              >
                3. Ngày đi
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {/* Tab 1: Thành phố & Khu vực gộp */}
              {activeTab === 'location' && (
                <div className="flex flex-col gap-3">
                  {/* Sub-step switcher */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLocationMobileStep('province')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded border-2 transition-all ${
                        locationMobileStep === 'province' ? 'bg-[#048c73] text-white border-[#025a4a]' : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      1. Tỉnh/TP: {selectedProvince}
                    </button>
                    <button
                      onClick={() => setLocationMobileStep('area')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded border-2 transition-all ${
                        locationMobileStep === 'area' ? 'bg-[#048c73] text-white border-[#025a4a]' : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      2. Huyện/Xã
                    </button>
                  </div>

                  {locationMobileStep === 'province' && (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Tìm thành phố, tỉnh..."
                        value={provinceSearch}
                        onChange={(e) => setProvinceSearch(e.target.value)}
                        className="p-2 text-base bg-gray-50 border border-gray-200 rounded-md outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {filteredProvinces.map(p => (
                          <button
                            key={p.province}
                            onClick={() => {
                              setSelectedProvince(p.province);
                              setSelectedDistrict(null);
                              setSelectedWard(null);
                              setLocationMobileStep('area');
                            }}
                            className={`p-2.5 rounded-md text-base font-bold border text-left cursor-pointer ${
                              selectedProvince === p.province ? 'bg-[#edfbf7] border-[#048c73] text-[#048c73]' : 'bg-white border-gray-200'
                            }`}
                          >
                            {p.province}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {locationMobileStep === 'area' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">Khu vực tại {selectedProvince}:</span>
                        <button
                          onClick={() => { 
                            setSelectedDistrict(null); 
                            handleSelectWard(null);
                          }}
                          className={`px-2 py-1 text-xs font-bold rounded border ${
                            selectedDistrict === null && selectedWard === null ? 'bg-[#048c73] text-white border-[#048c73]' : 'bg-white text-gray-700 border-gray-200'
                          }`}
                        >
                          Toàn tỉnh
                        </button>
                      </div>

                      {/* District Search & List */}
                      <input
                        type="text"
                        placeholder={`Tìm huyện tại ${selectedProvince}...`}
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="p-2 text-sm bg-gray-50 border border-gray-200 rounded-md outline-none"
                      />
                      <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto">
                        <button
                          onClick={() => { setSelectedDistrict(null); setSelectedWard(null); }}
                          className={`p-2 rounded-md text-xs font-bold border text-left flex justify-between items-center cursor-pointer ${
                            selectedDistrict === null ? 'bg-[#048c73] text-white border-[#048c73]' : 'bg-white border-gray-200'
                          }`}
                        >
                          <span>Tất cả quận/huyện</span>
                          {selectedDistrict === null && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                        {currentDistricts.map(d => (
                          <button
                            key={d.name}
                            onClick={() => { setSelectedDistrict(d.name); setSelectedWard(null); }}
                            className={`p-2 rounded-md text-xs font-bold border text-left flex justify-between items-center cursor-pointer ${
                              selectedDistrict === d.name ? 'bg-[#048c73] text-white border-[#048c73]' : 'bg-white border-gray-200'
                            }`}
                          >
                            <span className="truncate">{d.name}</span>
                            {selectedDistrict === d.name && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>

                      {/* Ward section */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-700">
                          {selectedDistrict ? `Xã / Phường tại ${selectedDistrict}:` : `Xã / Phường toàn ${selectedProvince}:`}
                        </span>
                        <input
                          type="text"
                          placeholder={selectedDistrict ? `Tìm xã tại ${selectedDistrict}...` : `Tìm xã toàn ${selectedProvince}...`}
                          value={wardSearch}
                          onChange={(e) => setWardSearch(e.target.value)}
                          className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none"
                        />
                        <div className="grid grid-cols-2 gap-1.5 max-h-[150px] overflow-y-auto">
                          <button
                            onClick={() => handleSelectWard(null)}
                            className={`p-2 rounded-md text-xs font-bold border text-left flex justify-between items-center cursor-pointer ${
                              selectedWard === null ? 'bg-[#048c73] text-white border-[#048c73]' : 'bg-white border-gray-200'
                            }`}
                          >
                            <span>Tất cả</span>
                            {selectedWard === null && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                          {currentWards.map(w => (
                            <button
                              key={w.name}
                              onClick={() => handleSelectWard(w.name)}
                              className={`p-2 rounded-md text-xs font-bold border text-left flex justify-between items-center cursor-pointer ${
                                selectedWard === w.name ? 'bg-[#048c73] text-white border-[#048c73]' : 'bg-white border-gray-200'
                              }`}
                            >
                              <span className="truncate">{w.name}</span>
                              {selectedWard === w.name && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Điểm vui chơi */}
              {activeTab === 'attractions' && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Tìm địa điểm vui chơi..."
                    value={attractionSearch}
                    onChange={(e) => setAttractionSearch(e.target.value)}
                    className="p-2 text-base bg-gray-50 border border-gray-200 rounded-md outline-none"
                  />
                  <div className="flex flex-col gap-1.5">
                    {filteredAttractions.map(att => {
                      const isChecked = selectedAttractions.some(a => a.id === att.id);
                      return (
                        <div
                          key={att.id}
                          onClick={() => toggleAttraction(att)}
                          className={`p-2.5 rounded-md border text-base font-bold flex justify-between items-center cursor-pointer ${
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
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 5: Ngày đi */}
              {activeTab === 'dates' && (
                <div className="flex flex-col gap-2">
                  <span className="text-base font-bold text-gray-700">Chọn ngày bạn dự định khởi hành:</span>
                  {renderCalendar()}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0 bg-white">
              <span className="text-xs sm:text-sm text-gray-600 truncate flex-1">
                {selectedAttractions.length > 0 ? `${selectedAttractions.length} điểm đã chọn` : (checkInDate ? `Ngày: ${checkInDate.day}/${checkInDate.month}/${checkInDate.year}` : 'Toàn bộ địa điểm')}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  className="text-xs font-semibold px-3 py-1.5 h-9 rounded-md border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={closeModal}
                >
                  Đóng
                </Button>
                <Button
                  className="bg-[#048c73] hover:bg-[#03725e] text-white text-xs font-bold px-4 py-1.5 h-9 rounded-md border-2 border-[#025a4a] shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  onClick={handleSearch}
                >
                  <Search className="w-3.5 h-3.5 text-[#7ef2dd]" />
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
