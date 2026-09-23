import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  User,
  MapPin,
  ExternalLink,
  Edit,
  CheckCircle2,
  Clock,
  Bed,
  Tag,
  Calendar,
  Layers,
  Phone,
  Compass,
  Car,
  ChevronRight,
  ShieldCheck,
  Info,
  Building,
  LocateFixed,
} from 'lucide-react';
import {
  PartnerHomestayDetailDto,
  PlaceVisibility,
  PlaceOperationStatus,
} from '../types/partner';
import {
  fetchPartnerHomestayDetail,
  updateHomestayStatus,
} from '../services/partnerHomestayService';

export default function PartnerHomestayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const homestayId = Number(id) || 1;

  const [homestay, setHomestay] = useState<PartnerHomestayDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [sandboxScenario, setSandboxScenario] = useState<number>(1);

  // Load detail data
  useEffect(() => {
    setIsLoading(true);
    fetchPartnerHomestayDetail(homestayId)
      .then((data) => {
        setHomestay(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load homestay detail', err);
        setIsLoading(false);
      });
  }, [homestayId]);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3000);
  };

  // Switch Visibility
  const handleChangeVisibility = async (newVis: PlaceVisibility) => {
    if (!homestay) return;
    try {
      await updateHomestayStatus(homestay.id, { visibility: newVis });
      setHomestay((prev) => (prev ? { ...prev, visibility: newVis } : null));
      const text =
        newVis === 'PUBLISHED'
          ? 'Đã bật Đang hiển thị trên Web'
          : newVis === 'DRAFT'
          ? 'Đã chuyển sang Bản nháp'
          : 'Đã ngừng hiển thị';
      showToast(text);
    } catch {
      showToast('Cập nhật trạng thái thất bại');
    }
  };

  // Switch Operation Status
  const handleChangeOperation = async (newOp: PlaceOperationStatus) => {
    if (!homestay) return;
    try {
      await updateHomestayStatus(homestay.id, { operationStatus: newOp });
      setHomestay((prev) => (prev ? { ...prev, operationStatus: newOp } : null));
      const text =
        newOp === 'OPERATING'
          ? 'Đã chuyển sang Đang hoạt động / Nhận khách'
          : 'Đã chuyển sang Tạm đóng cửa (Khóa cổng đặt phòng)';
      showToast(text);
    } catch {
      showToast('Cập nhật trạng thái thất bại');
    }
  };

  // QA Sandbox Scenarios
  const applySandboxScenario = (scenario: number) => {
    setSandboxScenario(scenario);
    if (!homestay) return;

    if (scenario === 1) {
      // 1. Chuẩn (Operate + Public)
      setHomestay((prev) =>
        prev
          ? {
              ...prev,
              visibility: 'PUBLISHED',
              operationStatus: 'OPERATING',
              heroStatusBadge: '🌿 Đang kinh doanh – Bật đầy đủ',
              alertNote: undefined,
            }
          : null
      );
      showToast('Sandbox 1: Đang hiển thị + Đang hoạt động (Kinh doanh đầy đủ)');
    } else if (scenario === 2) {
      // 2. Hiển thị + Tạm đóng
      setHomestay((prev) =>
        prev
          ? {
              ...prev,
              visibility: 'PUBLISHED',
              operationStatus: 'TEMP_CLOSED',
              heroStatusBadge: '⚠️ Đang hiển thị – Tạm ngưng đón khách',
              alertNote:
                'Đang hiển thị trang giới thiệu. Trên Customer Web ngừng tiếp nhận phòng do đang bảo trì mái gỗ Pơ Mu.',
            }
          : null
      );
      showToast('Sandbox 2: Đang hiển thị + Tạm đóng cửa (Khóa booking)');
    } else if (scenario === 3) {
      // 3. Nháp (Draft)
      setHomestay((prev) =>
        prev
          ? {
              ...prev,
              visibility: 'DRAFT',
              operationStatus: 'OPERATING',
              heroStatusBadge: '📝 Hồ sơ nháp – Chưa xuất bản',
              alertNote:
                'Chưa đủ điều kiện công khai: Thiếu ảnh đại diện mặt tiền và giấy đăng ký lưu trú cấp xã.',
            }
          : null
      );
      showToast('Sandbox 3: Hồ sơ Bản nháp (Chưa đủ điều kiện công khai)');
    }
  };

  const formatPrice = (p?: number) => {
    if (!p) return '';
    return new Intl.NumberFormat('vi-VN').format(p) + 'đ';
  };

  if (isLoading || !homestay) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-[#0c3828] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 mt-2 font-medium">Đang tải thông tin chi tiết quản trị...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#1e293b] flex flex-col items-center pb-24 font-sans">
      <div className="w-full max-w-[460px] flex flex-col gap-3.5 px-3 pt-3">
        {/* 1. Header Bar */}
        <header className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/partner')}
              aria-label="Về danh sách"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-extrabold text-[#b91c1c] tracking-wider uppercase">
                {homestay.cooperativeName || 'HTX DU LỊCH LÌM MÔNG'}
              </span>
              <h1 className="text-base font-black text-[#0c3828] leading-tight">
                Chi Tiết Quản Trị Homestay
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Thông báo"
              onClick={() => showToast('Không có thông báo mới.')}
              className="relative w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <button
              type="button"
              aria-label="Tài khoản"
              onClick={() => navigate('/portal/login')}
              className="w-9 h-9 rounded-full bg-[#0c3828] text-white flex items-center justify-center shadow-xs cursor-pointer"
            >
              <User className="w-4 h-4 text-white" />
            </button>
          </div>
        </header>

        {/* Action Toast */}
        {actionToast && (
          <div className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionToast}</span>
          </div>
        )}

        {/* 2. QA Sandbox (UC-10 Phase 1 Test Bench) */}
        <div className="bg-[#eef5fe] border border-[#d2e3fc] rounded-2xl p-2.5 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#d2e3fc]/60">
            <div className="flex items-center gap-1.5 text-[#0f2d3c]">
              <span className="text-xs">⚙️</span>
              <span className="text-[11px] font-bold tracking-tight">BỘ GIẢ LẬP QA (UC-10 PHASE 1)</span>
            </div>
            <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
              Test Bench
            </span>
          </div>

          <div className="flex gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <button
              type="button"
              onClick={() => applySandboxScenario(1)}
              className={`text-[11px] px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
                sandboxScenario === 1
                  ? 'bg-[#0a3828] text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              1. Chuẩn (Operate + Public)
            </button>
            <button
              type="button"
              onClick={() => applySandboxScenario(2)}
              className={`text-[11px] px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
                sandboxScenario === 2
                  ? 'bg-[#0a3828] text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              2. Hiển thị + Tạm đóng
            </button>
            <button
              type="button"
              onClick={() => applySandboxScenario(3)}
              className={`text-[11px] px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
                sandboxScenario === 3
                  ? 'bg-[#0a3828] text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              3. Nháp (Draft)
            </button>
          </div>
        </div>

        {/* 3. Breadcrumbs & Provider Info Banner */}
        <div className="flex flex-col gap-1 px-1">
          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <span
              onClick={() => navigate('/partner')}
              className="hover:underline cursor-pointer text-slate-600"
            >
              Quản lý Homestay
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-bold truncate">{homestay.name}</span>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#0c3828] font-bold">
                <Building className="w-3.5 h-3.5 text-emerald-700" />
                <span>{homestay.cooperativeName || 'HTX Du Lịch Cộng đồng Lìm Mông'}</span>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                {homestay.providerCode || 'NCC-TB-0824'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Phạm vi dữ liệu: Cố định theo Provider, không thể thay đổi giữa các hợp tác xã.
            </p>
          </div>
        </div>

        {/* 4. Hero Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-xs flex flex-col">
          <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
            <img
              src={homestay.coverImageUrl}
              alt={homestay.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span className="bg-emerald-950/80 backdrop-blur-xs text-[#a3e635] text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                <span>{homestay.heroStatusBadge || '🌿 Đang kinh doanh – Bật đầy đủ'}</span>
              </span>
              <span className="bg-white/80 backdrop-blur-xs text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                {homestay.code}
              </span>
            </div>

            {/* Bottom Title & Address in Hero */}
            <div className="absolute bottom-3 left-3 right-3 text-white flex flex-col gap-1">
              <h2 className="text-lg font-black leading-tight drop-shadow-sm">{homestay.name}</h2>
              <div className="flex items-center gap-1 text-[11px] text-white/90 drop-shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="line-clamp-1">{homestay.address}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons Under Hero */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/50">
            <button
              type="button"
              onClick={() => navigate(`/homestay/${homestay.slug}`)}
              className="py-2 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
              <span>Xem trang ngoài Web</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/partner/homestay/${homestay.id}/edit`)}
              className="py-2 px-2.5 rounded-xl bg-[#e6f0fa] border border-[#d2e3fc] text-[#1a56db] font-bold text-[11px] flex items-center justify-center gap-1.5 hover:bg-[#dbe8f8] transition-colors shadow-xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-[#1a56db]" />
              <span>Chỉnh sửa thông tin</span>
            </button>
          </div>
        </div>

        {/* 5. Section: Trạng thái hiển thị (Visibility) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <h3 className="font-bold text-sm text-slate-800">Trạng thái hiển thị</h3>
            </div>

            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                homestay.visibility === 'PUBLISHED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : homestay.visibility === 'DRAFT'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {homestay.visibility === 'PUBLISHED'
                ? 'Đang hiển thị (Published)'
                : homestay.visibility === 'DRAFT'
                ? 'Bản nháp (Draft)'
                : 'Ngừng hiển thị'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-100/70 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => handleChangeVisibility('DRAFT')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                homestay.visibility === 'DRAFT'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bản nháp
            </button>
            <button
              type="button"
              onClick={() => handleChangeVisibility('PUBLISHED')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                homestay.visibility === 'PUBLISHED'
                  ? 'bg-[#0c3828] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang hiển thị
            </button>
            <button
              type="button"
              onClick={() => handleChangeVisibility('UNPUBLISHED')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                homestay.visibility === 'UNPUBLISHED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ngừng hiển thị
            </button>
          </div>

          <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-2.5 flex items-start gap-2 text-[11px] text-rose-900 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span>
              <strong>Quy tắc UC-10:</strong> Chỉ được bật "Đang hiển thị" khi đã hoàn thành 100% các trường dữ liệu bắt
              buộc. Không có quy trình phê duyệt admin (No Approval Workflow).
            </span>
          </div>
        </div>

        {/* 6. Section: Vận hành lưu trú (Operation Status) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <h3 className="font-bold text-sm text-slate-800">Vận hành lưu trú</h3>
            </div>

            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                homestay.operationStatus === 'OPERATING'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {homestay.operationStatus === 'OPERATING' ? 'Đang đón khách' : 'Tạm ngưng đón khách'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleChangeOperation('OPERATING')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                homestay.operationStatus === 'OPERATING'
                  ? 'bg-[#0c3828] text-white border-[#0c3828] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Đang hoạt động</span>
            </button>

            <button
              type="button"
              onClick={() => handleChangeOperation('TEMP_CLOSED')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                homestay.operationStatus === 'TEMP_CLOSED'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                  : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
              }`}
            >
              <Clock className="w-4 h-4 text-rose-500" />
              <span>Tạm đóng cửa</span>
            </button>
          </div>

          <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-2.5 flex items-start gap-2 text-[11px] text-teal-900 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
            <span>
              <strong>Đặc tính độc lập:</strong> Khi "Tạm đóng", Homestay vẫn hiển thị cho khách xem nếu Visibility =
              Đang hiển thị, nhưng cổng đặt phòng sẽ tạm khóa. Không tự chuyển sang Ngừng hiển thị và không hủy booking
              cũ.
            </span>
          </div>
        </div>

        {/* 7. Section: Phân hệ nghiệp vụ phòng (Room Management Subsystems) */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex flex-col px-1">
            <h3 className="font-extrabold text-base text-[#0c3828]">Phân hệ nghiệp vụ phòng</h3>
            <span className="text-[11px] text-slate-500">
              Truy cập các phân hệ quản lý chi tiết loại phòng, giá, tình trạng phòng
            </span>
          </div>

          {/* Subsystem Card 1: UC-11 Loại phòng */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Bed className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <h4 className="font-extrabold text-sm text-slate-900">Quản lý Loại phòng</h4>
                  <span className="text-xs font-bold text-emerald-800">
                    {homestay.roomTypesCount || 3} loại phòng đang hoạt động
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                SCR-NCC-04 (UC-11)
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {homestay.roomTypesSummary ||
                'Phòng VIP View Ruộng Bậc Thang (x1) • Phòng Gia đình Nhà Sàn (x2) • Phòng Đơn Tiêu Chuẩn (x3)'}
            </p>

            <button
              type="button"
              onClick={() => navigate(`/homestay/${homestay.slug}/check-rooms`)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-between transition-colors border border-slate-200/80 cursor-pointer"
            >
              <span>Quản lý loại phòng</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Subsystem Card 2: UC-12 Bảng giá */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <h4 className="font-extrabold text-sm text-slate-900">Quản lý Bảng giá</h4>
                  <span className="text-xs font-extrabold text-[#b91c1c]">
                    {formatPrice(homestay.priceRefMin || 450000)} – {formatPrice(homestay.priceRefMax || 750000)}/đêm
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                SCR-NCC-06 (UC-12)
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {homestay.pricingSummary ||
                'Đang áp dụng: Base Price + Phụ thu Weekend (T6-T7 + 100.000đ/phòng)'}
            </p>

            <button
              type="button"
              onClick={() => showToast('Mở mô-đun Quản lý bảng giá phòng (UC-12)')}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-between transition-colors border border-slate-200/80 cursor-pointer"
            >
              <span>Quản lý giá phòng</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Subsystem Card 3: UC-13 Tình trạng phòng & Stop Sell */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <h4 className="font-extrabold text-sm text-slate-900">Tình trạng phòng & Stop Sell</h4>
                  <span className="text-xs font-bold text-slate-700">
                    {homestay.availabilitySummary || '11 phòng sẵn sàng / Lịch 30 ngày'}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                SCR-NCC-07 (UC-13)
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {homestay.stopSellSummary ||
                'Chặn bán (Stop Sell): 1 loại phòng đang đóng ngày hôm nay (bảo dưỡng)'}
            </p>

            <button
              type="button"
              onClick={() => navigate(`/homestay/${homestay.slug}/availability`)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-between transition-colors border border-slate-200/80 cursor-pointer"
            >
              <span>Quản lý lịch phòng & Stop Sell</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 8. Section: Hồ sơ thông tin cơ sở (Read-only Overview) */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-base text-[#0c3828]">Hồ sơ thông tin cơ sở</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Read-only Overview
            </span>
          </div>

          {/* Sub-block 1: Tiếp đón & Liên hệ */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Thông tin tiếp đón & Liên hệ</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {homestay.description}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#f0f4f9] rounded-2xl p-2.5 flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">Hotline công khai</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5">{homestay.contactPhone}</span>
              </div>
              <div className="bg-[#f0f4f9] rounded-2xl p-2.5 flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">Email nhận booking</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {homestay.contactEmail || 'booking@dulichso.vn'}
                </span>
              </div>
              <div className="bg-[#f0f4f9] rounded-2xl p-2.5 flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">Nhận phòng (Check-in)</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5">{homestay.checkInFrom || '14:00'}</span>
              </div>
              <div className="bg-[#f0f4f9] rounded-2xl p-2.5 flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">Trả phòng (Check-out)</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5">{homestay.checkOutUntil || '12:00'}</span>
              </div>
            </div>
          </div>

          {/* Sub-block 2: Tọa độ & Vị trí */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Compass className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tọa độ & Vị trí</span>
              </div>
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                MAP - CUS - 01 LINKED
              </span>
            </div>

            {/* Mini Map Preview Box */}
            <div
              onClick={() => navigate(`/homestay/${homestay.slug}/map`)}
              className="relative aspect-[16/7] rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-100"
            >
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80"
                alt="Map Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="bg-white/95 backdrop-blur-xs text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 group-hover:bg-white transition-colors">
                  <LocateFixed className="w-3.5 h-3.5 text-rose-600" />
                  <span>Xem trên bản đồ vệ tinh</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
              <span className="text-slate-500">Tọa độ GPS chuẩn:</span>
              <span className="font-bold text-slate-800 font-mono">
                {homestay.latitude.toFixed(6)} , {homestay.longitude.toFixed(6)}
              </span>
            </div>

            <div className="flex items-start gap-1.5 text-xs text-slate-600">
              <Car className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{homestay.accessNote || 'Đường bê tông nông thôn mới, xe 16 chỗ vào đến tận cổng sân nhà sàn.'}</span>
            </div>
          </div>

          {/* Sub-block 3: Tiện ích toàn khuôn viên */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tiện ích toàn khuôn viên</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {homestay.amenities.map((item) => (
                <span
                  key={item}
                  className="bg-[#eef5fe] text-[#0f2d3c] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#d2e3fc] flex items-center gap-1.5"
                >
                  <span className="text-emerald-600">✓</span>
                  <span>{item}</span>
                </span>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 italic">
              * Tiện ích giường ngủ, điều hòa và vệ sinh từng phòng được phân bổ chi tiết tại UC-11 (SCR-NCC-04).
            </p>
          </div>

          {/* Sub-block 4: Chính sách hủy phòng áp dụng */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Chính sách hủy phòng áp dụng</span>
            </div>

            <div className="bg-[#eef5fe] border border-[#d2e3fc] rounded-2xl p-3 flex flex-col gap-1 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-[#0c3828]">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Linh hoạt: Miễn phí hủy trước 3 ngày</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {homestay.cancellationPolicy}
              </p>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              <strong>Lưu ý Snapshot Rule:</strong> Chính sách hiển thị ở đây là phiên bản hiện hành, đơn đặt phòng sẽ
              lưu vào snapshot policy tại thời điểm đặt phòng (BR-37).
            </p>
          </div>
        </div>

        {/* 9. Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3 shadow-2xl">
          <div className="max-w-[460px] mx-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/partner')}
              className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về danh sách</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/partner/homestay/${homestay.id}/edit`)}
              className="flex-1 py-3 px-4 bg-[#0a3828] hover:bg-[#07281d] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
            >
              <Edit className="w-4 h-4 text-[#a3e635]" />
              <span>Chỉnh sửa Homestay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
