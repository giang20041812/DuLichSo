import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Building,
  MapPin,
  Camera,
  Check,
  Clock,
  Info,
  Sparkles,
  Phone,
  Mail,
  LocateFixed,
  Wifi,
  Car,
  Utensils,
  Flame,
  Mountain,
  Waves,
  FileText,
  Save,
  HelpCircle,
} from 'lucide-react';
import { PartnerHomestayDetailDto } from '../types/partner';
import { fetchPartnerHomestayDetail, savePartnerHomestayDetail } from '../services/partnerHomestayService';

const AVAILABLE_AMENITIES = [
  { id: 'wifi', name: 'Wifi tốc độ cao', icon: Wifi },
  { id: 'parking', name: 'Chỗ đỗ ô tô miễn phí', icon: Car },
  { id: 'food', name: 'Phục vụ ẩm thực bản địa', icon: Utensils },
  { id: 'bbq', name: 'Sân lửa trại / BBQ', icon: Flame },
  { id: 'view', name: 'View ruộng bậc thang', icon: Mountain },
  { id: 'bath', name: 'Tắm lá thuốc dân tộc', icon: Waves },
];

export default function PartnerHomestayEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const homestayId = Number(id) || 1;
  const isCreatingNew = !id;

  // Form State
  const [formData, setFormData] = useState<PartnerHomestayDetailDto>({
    id: homestayId,
    code: 'ID: #LM-01',
    slug: 'ban-lim-mong-eco-lodge',
    name: 'Bản Lìm Mông Eco Lodge',
    description:
      'Nằm ôm trọn vách núi Lìm Mông hùng vĩ, Bản Lìm Mông Eco Lodge gìn giữ trọn vẹn nét văn hóa của người Thái Trắng với nếp nhà sàn pơ mu thơm lừng. Từ hiên nhà, bạn có thể phóng tầm mắt ngắm trọn thung lũng Tú Lệ trập trùng ruộng bậc thang ngát hương lúa mới.',
    contactPhone: '0912 345 678',
    contactEmail: 'limmongecolodge@taybactrails.vn',
    regionName: 'Xã Cao Phạ, Huyện Mù Cang Chải, Tỉnh Yên Bái',
    address: 'Bản Lìm Mông, Dưới chân đèo Khau Phạ',
    latitude: 21.751214,
    longitude: 104.31842,
    accessNote:
      'Đường bê tông liên thôn, dốc vừa phải, ô tô 16 chỗ vào tận sân. Có biển chỉ dẫn từ đường QL32 vào 2km.',
    coverImageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    ],
    amenities: [
      'Wifi tốc độ cao',
      'Chỗ đỗ ô tô miễn phí',
      'Phục vụ ẩm thực bản địa',
      'Sân lửa trại / BBQ',
      'View ruộng bậc thang',
      'Tắm lá thuốc dân tộc',
    ],
    checkInFrom: '14:00',
    checkOutUntil: '12:00',
    houseRules:
      "Tuyệt đối không hút thuốc trong phòng ngủ bằng gỗ. Tôn trọng không gian tập quán bản địa của người H'Mông, Thái; giữ trật tự sau 22h đêm.",
    cancellationPolicy: 'Miễn phí hủy trước 48h (Chính sách Tiêu chuẩn)',
    visibility: 'PUBLISHED',
    operationStatus: 'OPERATING',
    isReadyToPublish: true,
    cooperativeName: 'HTX Du Lịch Cộng Đồng Lìm Mông',
    providerCode: 'NCC-TB-0824',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [sandboxScenario, setSandboxScenario] = useState<number>(1);

  // Load detail data on mount
  useEffect(() => {
    if (!isCreatingNew) {
      setIsLoading(true);
      fetchPartnerHomestayDetail(homestayId)
        .then((data) => {
          setFormData(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      // Initialize blank create form
      setFormData((prev) => ({
        ...prev,
        id: 99,
        code: 'ID: #HM-MỚI',
        name: '',
        description: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        visibility: 'DRAFT',
        operationStatus: 'OPERATING',
        isReadyToPublish: false,
      }));
    }
  }, [homestayId, isCreatingNew]);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // QA Sandbox Scenario Presets
  const applySandboxScenario = (scenario: number) => {
    setSandboxScenario(scenario);
    if (scenario === 1) {
      // 1. Đầy đủ dữ liệu (Đạt chuẩn xuất bản)
      setFormData((prev) => ({
        ...prev,
        name: 'Bản Lìm Mông Eco Lodge',
        description:
          'Nằm ôm trọn vách núi Lìm Mông hùng vĩ, Bản Lìm Mông Eco Lodge gìn giữ trọn vẹn nét văn hóa của người Thái Trắng với nếp nhà sàn pơ mu thơm lừng.',
        contactPhone: '0912 345 678',
        address: 'Bản Lìm Mông, Dưới chân đèo Khau Phạ',
        coverImageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        visibility: 'PUBLISHED',
        operationStatus: 'OPERATING',
        isReadyToPublish: true,
        alertNote: undefined,
      }));
      showToast('Kịch bản 1: Hồ sơ đầy đủ dữ liệu, sẵn sàng công khai lên Web!');
    } else if (scenario === 2) {
      // 2. Thiếu dữ liệu (Chưa đủ chuẩn xuất bản)
      setFormData((prev) => ({
        ...prev,
        visibility: 'DRAFT',
        operationStatus: 'OPERATING',
        isReadyToPublish: false,
        alertNote:
          'Chưa đủ điều kiện công khai: Thiếu ảnh đại diện mặt tiền và giấy đăng ký lưu trú cấp xã. Bổ sung để hiển thị ngay lập tức (không cần duyệt).',
      }));
      showToast('Kịch bản 2: Giả lập thiếu dữ liệu, hiển thị cảnh báo nghiệp vụ.');
    } else if (scenario === 3) {
      // 3. Đang bảo trì / Tạm ngưng đón khách
      setFormData((prev) => ({
        ...prev,
        visibility: 'PUBLISHED',
        operationStatus: 'TEMP_CLOSED',
        isReadyToPublish: true,
        alertNote:
          'Đang hiển thị trang giới thiệu. Trên Customer Web ngừng tiếp nhận phòng do đang bảo trì mái gỗ Pơ Mu.',
      }));
      showToast('Kịch bản 3: Tạm ngưng đón khách nhưng vẫn hiển thị giới thiệu.');
    }
  };

  // Amenity Toggle
  const toggleAmenity = (name: string) => {
    setFormData((prev) => {
      const current = prev.amenities || [];
      const updated = current.includes(name) ? current.filter((a) => a !== name) : [...current, name];
      return { ...prev, amenities: updated };
    });
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên Homestay');
      return;
    }

    setIsSaving(true);
    try {
      await savePartnerHomestayDetail(formData.id, formData);
      showToast('Lưu thông tin Homestay thành công!');
      setTimeout(() => {
        navigate('/partner');
      }, 800);
    } catch {
      showToast('Lưu thông tin thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#1e293b] flex flex-col items-center pb-24 font-sans">
      <div className="w-full max-w-[460px] flex flex-col gap-3.5 px-3 pt-3">
        {/* Header Bar */}
        <header className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/partner')}
              aria-label="Quay lại danh sách"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col text-left">
              <h1 className="text-base font-black text-[#0c3828] leading-tight">
                {isCreatingNew ? 'Tạo Homestay Mới' : 'Tạo / Chỉnh Sửa'}
              </h1>
              <span className="text-xs text-slate-500 font-medium leading-tight line-clamp-1">
                {formData.name || 'Cơ sở lưu trú'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/portal/login')}
            aria-label="Tài khoản"
            className="w-9 h-9 rounded-full bg-[#0c3828] text-white flex items-center justify-center shadow-xs"
          >
            <User className="w-4 h-4 text-white" />
          </button>
        </header>

        {/* Action Toast */}
        {saveToast && (
          <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-500 border border-slate-200">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Đang nạp dữ liệu homestay...</span>
          </div>
        )}

        {/* QA Sandbox (UC-10 Nghiệm Thu) */}
        <div className="bg-[#eef5fe] border border-[#d2e3fc] rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🧪</span>
              <span className="text-xs font-bold text-[#0f2d3c]">QA SANDBOX (UC-10 NGHIỆM THU)</span>
            </div>
            <span className="text-[11px] font-bold bg-[#0c3828] text-white px-2 py-0.5 rounded-md">
              Chế độ: {isCreatingNew ? 'Tạo mới' : 'Chỉnh sửa'}
            </span>
          </div>

          <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <button
              type="button"
              onClick={() => applySandboxScenario(1)}
              className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                sandboxScenario === 1
                  ? 'bg-[#0a3828] text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              1. Đầy đủ dữ liệu (Đạt chuẩn xuất bản)
            </button>

            <button
              type="button"
              onClick={() => applySandboxScenario(2)}
              className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                sandboxScenario === 2
                  ? 'bg-amber-800 text-white shadow-xs font-semibold'
                  : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              2. Thiếu dữ liệu
            </button>

            <button
              type="button"
              onClick={() => applySandboxScenario(3)}
              className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap cursor-pointer ${
                sandboxScenario === 3
                  ? 'bg-rose-700 text-white shadow-xs font-semibold'
                  : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
              }`}
            >
              3. Tạm ngưng đón khách
            </button>
          </div>
        </div>

        {/* Ownership Badge Card */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Đơn vị chủ quản
                </span>
                <span className="text-xs font-extrabold text-[#0c3828]">{formData.cooperativeName}</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              MÃ: {formData.code}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Phân quyền: Nhà cung ứng (NCC)
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
            ℹ️ Homestay này gắn liền với hồ sơ pháp lý của HTX. Mọi thông tin cập nhật sẽ có hiệu lực tức thì trên toàn
            hệ thống.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-[#0c3828]">1. Thông tin cơ bản</h2>
            </div>

            {/* Tên Homestay */}
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <label htmlFor="name-input" className="font-semibold text-slate-700">
                  Tên Homestay <span className="text-rose-600">*</span>
                </label>
                <span className="text-slate-400 text-[10px]">{formData.name.length}/100</span>
              </div>
              <input
                id="name-input"
                type="text"
                required
                maxLength={100}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Bản Lìm Mông Eco Lodge"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0c3828]"
              />
            </div>

            {/* Giới thiệu / Câu chuyện bản địa */}
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <label htmlFor="desc-input" className="font-semibold text-slate-700">
                  Giới thiệu / Câu chuyện bản địa <span className="text-rose-600">*</span>
                </label>
                <span className="text-slate-400 text-[10px]">{formData.description.length}/500</span>
              </div>
              <textarea
                id="desc-input"
                rows={4}
                required
                maxLength={500}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Chia sẻ về nét đẹp văn hóa, phong cảnh, lịch sử nếp nhà sàn..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs text-slate-800 focus:outline-none focus:border-[#0c3828] leading-relaxed"
              />
            </div>

            {/* SĐT Public */}
            <div className="flex flex-col gap-1 text-xs">
              <label htmlFor="phone-input" className="font-semibold text-slate-700">
                Số điện thoại tiếp đón du khách (Public) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="phone-input"
                  type="text"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="0912 345 678"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0c3828]"
                />
              </div>
            </div>

            {/* Email đặt phòng */}
            <div className="flex flex-col gap-1 text-xs">
              <label htmlFor="email-input" className="font-semibold text-slate-700">
                Email tiếp nhận thông tin đặt phòng (Tùy chọn)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="email-input"
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="limmongecolodge@taybactrails.vn"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs text-slate-800 focus:outline-none focus:border-[#0c3828]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: VỊ TRÍ & TỌA ĐỘ BẢN ĐỒ */}
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-[#0c3828]">2. Vị trí & Tọa độ bản đồ</h2>
            </div>

            {/* Khu vực hành chính */}
            <div className="flex flex-col gap-1 text-xs">
              <label htmlFor="region-select" className="font-semibold text-slate-700">
                Khu vực hành chính (Master Data) <span className="text-rose-600">*</span>
              </label>
              <select
                id="region-select"
                value={formData.regionName}
                onChange={(e) => setFormData({ ...formData, regionName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0c3828]"
              >
                <option value="Xã Cao Phạ, Huyện Mù Cang Chải, Tỉnh Yên Bái">
                  Xã Cao Phạ, Huyện Mù Cang Chải, Tỉnh Yên Bái
                </option>
                <option value="Thị trấn Mù Cang Chải, Huyện Mù Cang Chải, Tỉnh Yên Bái">
                  Thị trấn Mù Cang Chải, Huyện Mù Cang Chải, Tỉnh Yên Bái
                </option>
                <option value="Xã La Pán Tẩn, Huyện Mù Cang Chải, Tỉnh Yên Bái">
                  Xã La Pán Tẩn, Huyện Mù Cang Chải, Tỉnh Yên Bái
                </option>
                <option value="Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái">
                  Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái
                </option>
              </select>
            </div>

            {/* Địa chỉ chi tiết */}
            <div className="flex flex-col gap-1 text-xs">
              <label htmlFor="address-input" className="font-semibold text-slate-700">
                Địa chỉ chi tiết (Bản/Thôn) <span className="text-rose-600">*</span>
              </label>
              <input
                id="address-input"
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Bản Lìm Mông, Dưới chân đèo Khau Phạ"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs text-slate-800 focus:outline-none focus:border-[#0c3828]"
              />
            </div>

            {/* Tọa độ GPS Card */}
            <div className="bg-[#f0f6fd] border border-[#d2e3fc] rounded-2xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0f2d3c] flex items-center gap-1">
                  <LocateFixed className="w-3.5 h-3.5 text-[#1a73e8]" />
                  Tọa độ GPS chuẩn xác (MAP-CU-01)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, latitude: 21.751214, longitude: 104.31842 }));
                    showToast('Đã lấy tọa độ định vị GPS hiện tại!');
                  }}
                  className="text-[10px] font-bold text-[#1a73e8] bg-white border border-[#c3d9fb] px-2.5 py-1 rounded-full hover:bg-blue-50 cursor-pointer"
                >
                  Tự động lấy GPS
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="lat-input" className="text-[10px] font-medium text-slate-500 block mb-0.5">
                    Vĩ độ (Latitude)
                  </label>
                  <input
                    id="lat-input"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="lng-input" className="text-[10px] font-medium text-slate-500 block mb-0.5">
                    Kinh độ (Longitude)
                  </label>
                  <input
                    id="lng-input"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Map Preview Mockup Box */}
              <div className="relative h-24 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80"
                  alt="Bản đồ định vị"
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className="bg-[#0c3828] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-bounce">
                    <MapPin className="w-3.5 h-3.5 text-[#a3e635]" />
                    <span>{formData.latitude.toFixed(6)} - {formData.longitude.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                ℹ️ Tọa độ này được đồng bộ trực tiếp lên hệ thống bản đồ Google Maps/Leaflet phục vụ điều hướng cho du
                khách và thuật toán tìm kiếm theo bán kính.
              </p>
            </div>

            {/* Chỉ dẫn đường vào */}
            <div className="flex flex-col gap-1 text-xs">
              <label htmlFor="access-input" className="font-semibold text-slate-700">
                Chỉ dẫn đường vào cho du khách
              </label>
              <textarea
                id="access-input"
                rows={2}
                value={formData.accessNote || ''}
                onChange={(e) => setFormData({ ...formData, accessNote: e.target.value })}
                placeholder="Đường bê tông liên thôn, dốc vừa phải, ô tô 16 chỗ vào tận sân..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs text-slate-800 focus:outline-none focus:border-[#0c3828]"
              />
            </div>
          </div>

          {/* SECTION 3: HÌNH ẢNH HOMESTAY */}
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-[#0c3828]">3. Hình ảnh Homestay</h2>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                Đã tải 4/10
              </span>
            </div>

            {/* Ảnh bìa chính */}
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-slate-700">
                Ảnh bìa / Ảnh đại diện chính <span className="text-rose-600">*</span>
              </label>
              <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-200 group">
                <img
                  src={formData.coverImageUrl}
                  alt="Ảnh đại diện chính"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-[#0a3828]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    ⭐ Ảnh đại diện chính
                  </span>
                </div>
                <div className="absolute bottom-2.5 right-2.5">
                  <button
                    type="button"
                    onClick={() => showToast('Mở trình tải ảnh lên Cloudflare Images (Direct Creator Upload)')}
                    className="bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1.5 rounded-xl hover:bg-black/80 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Thay đổi ảnh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bộ sưu tập ảnh */}
            <div className="flex flex-col gap-1.5 text-xs mt-1">
              <label className="font-semibold text-slate-700">
                Bộ sưu tập khu vực & Trải nghiệm (Tối thiểu 3 ảnh)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {formData.galleryUrls?.map((url, idx) => (
                  <div key={idx} className="relative h-18 rounded-xl overflow-hidden border border-slate-200">
                    <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => showToast('Thêm ảnh trải nghiệm mới')}
                  className="h-18 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-bold mt-0.5">+ Thêm ảnh</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                Dung lượng tối đa 10MB/ảnh (Định dạng: JPG, PNG, WEBP). Khuyến nghị kích thước tối thiểu 1200 x 800px.
              </p>
            </div>
          </div>

          {/* SECTION 4: TIỆN ÍCH & KHUÔN VIÊN */}
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-[#0c3828]">4. Tiện ích & Khuôn viên Homestay</h2>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Áp dụng cho toàn bộ khuôn viên homestay (không bao gồm tiện ích riêng của từng phòng).
            </p>

            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_AMENITIES.map((am) => {
                const IconComponent = am.icon;
                const isChecked = formData.amenities?.includes(am.name);
                return (
                  <button
                    key={am.id}
                    type="button"
                    onClick={() => toggleAmenity(am.name)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <IconComponent className={`w-3.5 h-3.5 ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span className="truncate">{am.name}</span>
                    </div>
                    {isChecked && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: QUY ĐỊNH & CHÍNH SÁCH */}
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-[#0c3828]">5. Quy định & Chính sách</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1">
                <label htmlFor="checkin-input" className="font-semibold text-slate-700">
                  Giờ nhận phòng
                </label>
                <input
                  id="checkin-input"
                  type="text"
                  value={formData.checkInFrom}
                  onChange={(e) => setFormData({ ...formData, checkInFrom: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs font-bold text-center text-slate-800"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="checkout-input" className="font-semibold text-slate-700">
                  Giờ trả phòng
                </label>
                <input
                  id="checkout-input"
                  type="text"
                  value={formData.checkOutUntil}
                  onChange={(e) => setFormData({ ...formData, checkOutUntil: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs font-bold text-center text-slate-800"
                />
              </div>
            </div>

            {/* Nội quy Homestay */}
            <div className="flex flex-col gap-1 text-xs">
              <label htmlFor="rules-input" className="font-semibold text-slate-700">
                Nội quy Homestay
              </label>
              <textarea
                id="rules-input"
                rows={2}
                value={formData.houseRules}
                onChange={(e) => setFormData({ ...formData, houseRules: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#f8fafc] text-xs text-slate-800 focus:outline-none focus:border-[#0c3828]"
              />
            </div>

            {/* Chính sách hủy phòng */}
            <div className="bg-[#f0f6fd] border border-[#d2e3fc] rounded-2xl p-3 flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#0f2d3c]">Chính sách hủy phòng hiện hành</span>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800">
                {formData.cancellationPolicy}
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                ℹ️ Áp dụng theo Business Rule BR-37: Khi khách tạo Booking, chính sách này sẽ được snapshot vào đơn đặt
                phòng. NCC chỉnh sửa chính sách sau này không hồi tố đơn đặt phòng cũ.
              </p>
            </div>
          </div>

          {/* SECTION 6: QUẢN TRỊ TRẠNG THÁI HOMESTAY (UC-10) */}
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-[#0c3828]">6. Quản trị trạng thái Homestay</h2>
              </div>
              <span className="text-[10px] font-bold text-[#1a73e8] bg-blue-50 px-2 py-0.5 rounded-md">
                Theo chuẩn UC-10
              </span>
            </div>

            {/* Group 1: Visibility */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">1. Trạng thái Hiển thị (Visibility)</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  BẮT BUỘC THEO UC-10
                </span>
              </div>

              {/* Radio 1: Bản nháp */}
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="DRAFT"
                  checked={formData.visibility === 'DRAFT'}
                  onChange={() => setFormData({ ...formData, visibility: 'DRAFT' })}
                  className="mt-0.5 accent-[#0c3828]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Bản nháp (Draft)</span>
                  <span className="text-[11px] text-slate-500">
                    Chỉ NCC & Admin xem thấy, không xuất hiện trên Customer App / Web.
                  </span>
                </div>
              </label>

              {/* Radio 2: Đang hiển thị */}
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="PUBLISHED"
                  checked={formData.visibility === 'PUBLISHED'}
                  onChange={() => setFormData({ ...formData, visibility: 'PUBLISHED' })}
                  className="mt-0.5 accent-[#0c3828]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Đang hiển thị (Published)
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Hiển thị công khai trên website cho du khách xem và tìm kiếm.
                  </span>
                </div>
              </label>

              {/* Radio 3: Ngừng hiển thị */}
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="UNPUBLISHED"
                  checked={formData.visibility === 'UNPUBLISHED'}
                  onChange={() => setFormData({ ...formData, visibility: 'UNPUBLISHED' })}
                  className="mt-0.5 accent-[#0c3828]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Ngừng hiển thị (Unpublished)</span>
                  <span className="text-[11px] text-slate-500">
                    Tạm thời ẩn khỏi danh sách tìm kiếm của khách nhưng giữ nguyên toàn bộ dữ liệu.
                  </span>
                </div>
              </label>
            </div>

            {/* Group 2: Operation Status */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">2. Trạng thái Vận hành (Operation Status)</span>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                  ĐỘC LẬP VỚI VISIBILITY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, operationStatus: 'OPERATING' })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.operationStatus === 'OPERATING'
                      ? 'bg-[#0c3828] text-white border-[#0c3828] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Đang nhận khách</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, operationStatus: 'TEMP_CLOSED' })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.operationStatus === 'TEMP_CLOSED'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                      : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-white" />
                  <span>Tạm ngưng đón khách</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                * Lưu ý: Hai trạng thái này hoàn toàn độc lập theo chuẩn UC-10. Khi chọn "Đang hiển thị" + "Tạm ngưng đón
                khách", khách vẫn xem được trang giới thiệu nhưng Booking Gate sẽ chặn đặt phòng.
              </p>
            </div>

            {/* Policy Info Card */}
            <div className="bg-[#eef5fe] border border-[#d2e3fc] rounded-2xl p-3 flex flex-col gap-1 text-xs">
              <span className="font-bold text-[#0f2d3c]">Chính sách Phase 1: Không phê duyệt (No Approval)</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Hệ thống tin cậy NCC địa phương, không yêu cầu bước duyệt chờ Admin. Homestay tự động hiển thị ra bên
                ngoài khi đã hoàn thiện đủ thông tin bắt buộc (UC-10).
              </p>
            </div>
          </div>

          {/* Reminder Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-3.5 flex items-start gap-2 text-xs text-amber-900 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý:</strong> Để hoàn tất điều kiện xuất bản và mở bán homestay, bạn cần tiếp tục thiết lập danh
              mục <strong>Loại phòng (UC-11)</strong>, <strong>Bảng giá (UC-12)</strong> và{' '}
              <strong>Lịch phòng khả dụng (UC-13)</strong>.
            </span>
          </div>

          {/* Bottom Fixed Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3 shadow-2xl">
            <div className="max-w-[460px] mx-auto flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/partner')}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Hủy / Quay lại
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 bg-[#0a3828] hover:bg-[#07281d] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                >
                  {isSaving ? (
                    <span>Đang lưu dữ liệu...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#a3e635]" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 text-center">
                Dữ liệu sẽ được lưu tự động vào cơ sở dữ liệu và áp dụng ngay lập tức.
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
