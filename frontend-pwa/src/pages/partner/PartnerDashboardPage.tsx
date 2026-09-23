import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  PlusCircle,
  Search,
  X,
  MapPin,
  Bed,
  Tag,
  Calendar,
  FileText,
  Edit,
  Eye,
  EyeOff,
  ChevronUp,
  AlertTriangle,
  Info,
  ShieldCheck,
  Wrench,
  Clock,
  Home,
  CheckCircle2,
  Smartphone,
  BarChart3,
  XCircle,
  Building,
} from 'lucide-react';
import {
  PartnerHomestaySummaryDto,
  PartnerHomestayStatsDto,
  PlaceVisibility,
  PlaceOperationStatus,
} from '../types/partner';
import {
  fetchPartnerHomestays,
  updateHomestayStatus,
  createQuickHomestay,
} from '../services/partnerHomestayService';

export default function PartnerDashboardPage() {
  const navigate = useNavigate();

  // Data State
  const [homestays, setHomestays] = useState<PartnerHomestaySummaryDto[]>([]);
  const [stats, setStats] = useState<PartnerHomestayStatsDto>({
    totalCount: 3,
    publishedCount: 2,
    draftCount: 1,
    unpublishedCount: 0,
    operatingCount: 2,
    tempClosedCount: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  // QA Sandbox State
  const [sandboxScenario, setSandboxScenario] = useState<'DEFAULT' | 'EMPTY' | 'SUSPENDED'>('DEFAULT');

  // Filters State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState<'ALL' | PlaceVisibility>('ALL');
  const [selectedOperation, setSelectedOperation] = useState<'ALL' | PlaceOperationStatus>('ALL');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newHomestayName, setNewHomestayName] = useState('');
  const [newHomestayAddress, setNewHomestayAddress] = useState('');
  const [newPriceMin, setNewPriceMin] = useState('450000');
  const [newPriceMax, setNewPriceMax] = useState('700000');

  // Active Bottom Tab
  const [activeBottomTab, setActiveBottomTab] = useState<'homestays' | 'bookings' | 'reports'>('homestays');

  // Toast / Notification
  const [actionToast, setActionToast] = useState<string | null>(null);

  const loadData = async (scenario = sandboxScenario, kw = searchKeyword, vis = selectedVisibility, op = selectedOperation) => {
    setIsLoading(true);
    try {
      const res = await fetchPartnerHomestays(scenario, kw, vis === 'ALL' ? undefined : vis, op === 'ALL' ? undefined : op);
      setHomestays(res.homestays);
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to load partner homestays', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(sandboxScenario, searchKeyword, selectedVisibility, selectedOperation);
  }, [sandboxScenario, searchKeyword, selectedVisibility, selectedOperation]);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3000);
  };

  // Toggle Visibility between PUBLISHED and UNPUBLISHED / DRAFT
  const handleToggleVisibility = async (homestay: PartnerHomestaySummaryDto) => {
    if (sandboxScenario === 'SUSPENDED') {
      showToast('Tài khoản bị đình chỉ: Không có quyền thay đổi trạng thái Homestay.');
      return;
    }

    const nextVis: PlaceVisibility = homestay.visibility === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    try {
      const updated = await updateHomestayStatus(homestay.id, { visibility: nextVis });
      setHomestays((prev) => prev.map((h) => (h.id === homestay.id ? updated : h)));
      showToast(
        nextVis === 'PUBLISHED'
          ? `Đã xuất bản "${homestay.name}" lên trang chủ!`
          : `Đã ngừng hiển thị "${homestay.name}" khỏi web.`
      );
    } catch {
      showToast('Cập nhật trạng thái thất bại.');
    }
  };

  const handleCreateHomestay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomestayName.trim()) return;

    try {
      const created = await createQuickHomestay({
        name: newHomestayName.trim(),
        address: newHomestayAddress.trim() || 'Xã Cao Phạ, Huyện Mù Cang Chải',
        priceRefMin: Number(newPriceMin) || 450000,
        priceRefMax: Number(newPriceMax) || 700000,
      });

      setHomestays((prev) => [created, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalCount: prev.totalCount + 1,
        draftCount: prev.draftCount + 1,
      }));

      setIsCreateModalOpen(false);
      setNewHomestayName('');
      setNewHomestayAddress('');
      showToast(`Tạo thành công "${created.name}" ở trạng thái Bản Nháp!`);
    } catch {
      showToast('Tạo Homestay mới thất bại.');
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#1e293b] flex flex-col items-center pb-20 font-sans">
      <div className="w-full max-w-[460px] flex flex-col gap-3.5 px-3 pt-3">
        {/* 1. Header Cổng NCC */}
        <header className="flex items-center justify-between px-1">
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-[#b91c1c] tracking-tight uppercase">
              CỔNG NCC – HỢP TÁC XÃ BẢN LÌM MÔNG
            </span>
            <h1 className="text-lg font-black text-[#0c3828] tracking-tight">Homestay Của Tôi</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Thông báo"
              className="relative w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/portal/login')}
              aria-label="Tài khoản"
              className="w-9 h-9 rounded-full bg-[#0c3828] text-white flex items-center justify-center shadow-xs"
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

        {/* 2. QA Sandbox (UC-10 Nghiệm Thu) */}
        <div className="bg-[#eef5fe] border border-[#d2e3fc] rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🧪</span>
              <span className="text-xs font-bold text-[#0f2d3c]">QA SANDBOX (UC-10 NGHIỆM THU)</span>
            </div>
            <span className="text-[11px] font-bold text-[#0f2d3c]">Mã NCC: NCC-TB-0824</span>
          </div>

          <div className="flex gap-1.5 mt-2.5">
            <button
              type="button"
              onClick={() => setSandboxScenario('DEFAULT')}
              className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                sandboxScenario === 'DEFAULT'
                  ? 'bg-[#0a3828] text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              1. Chuẩn (3 Homestay)
            </button>

            <button
              type="button"
              onClick={() => setSandboxScenario('EMPTY')}
              className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                sandboxScenario === 'EMPTY'
                  ? 'bg-[#0a3828] text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              2. Chưa có Homestay
            </button>

            <button
              type="button"
              onClick={() => setSandboxScenario('SUSPENDED')}
              className={`text-[11px] px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                sandboxScenario === 'SUSPENDED'
                  ? 'bg-rose-700 text-white shadow-xs font-semibold'
                  : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
              }`}
            >
              3. NCC Đình Chỉ
            </button>
          </div>
        </div>

        {/* Suspended Alert if Scenario 3 */}
        {sandboxScenario === 'SUSPENDED' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">Nhà cung cấp đang bị Đình Chỉ (ProviderStatus: SUSPENDED)</span>
              <span className="text-rose-700 text-[11px] leading-relaxed">
                Theo tiêu chuẩn UC-10 / BV-08: Hệ thống khóa toàn bộ quyền tạo mới, chỉnh sửa thông tin hoặc xuất bản
                Homestay. Vui lòng liên hệ Hotline 1900 88 99 để được hỗ trợ.
              </span>
            </div>
          </div>
        )}

        {/* 3. Summary Section (Cooperative & Stats) */}
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 tracking-wider uppercase block">
                HỢP TÁC XÃ DU LỊCH CỘNG ĐỒNG LÌM MÔNG
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#0c3828] mt-0.5">Danh sách Homestay</h2>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-[#e6f4ea] text-[#0a3828] flex items-center justify-center shrink-0"
              title="Thu gọn thông tin"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#526071] leading-relaxed">
            Homestay tạo mới có trạng thái hiển thị mặc định là <strong>Nháp</strong>. Hệ thống không yêu cầu phê duyệt,
            homestay tự động hiển thị ra bên ngoài khi đã hoàn thiện đủ thông tin bắt buộc.
          </p>

          {/* 3 Stat Boxes */}
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div className="bg-[#f0f4f9] rounded-2xl p-2.5 flex flex-col text-left">
              <span className="text-[11px] text-slate-500 font-medium">Tổng số</span>
              <span className="text-lg font-black text-slate-900 mt-0.5">{stats.totalCount}</span>
            </div>

            <div className="bg-[#f0f4f9] rounded-2xl p-2.5 flex flex-col text-left">
              <span className="text-[11px] text-slate-500 font-medium">Đang hiển thị</span>
              <span className="text-lg font-black text-emerald-800 mt-0.5">{stats.publishedCount}</span>
            </div>

            <div className="bg-[#f0f4f9] rounded-2xl p-2.5 flex flex-col text-left">
              <span className="text-[11px] text-slate-500 font-medium">Bản nháp</span>
              <span className="text-lg font-black text-amber-800 mt-0.5">{stats.draftCount}</span>
            </div>
          </div>
        </div>

        {/* 4. CTA: Tạo Homestay Mới Button */}
        <button
          type="button"
          disabled={sandboxScenario === 'SUSPENDED'}
          onClick={() => navigate('/partner/homestay/create')}
          className="w-full py-3.5 px-4 bg-[#0a3828] hover:bg-[#07281d] disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-[#a3e635]" />
          <span>Tạo Homestay mới</span>
        </button>

        {/* 5. Search & Filters */}
        <div className="flex flex-col gap-2.5 bg-white rounded-2xl p-3 shadow-xs border border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo tên Homestay..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[#f8fafc] border border-slate-200 text-slate-800 focus:outline-none focus:border-[#0a3828]"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Row 1: Visibility */}
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5 scrollbar-hide">
            <span className="text-slate-500 font-medium shrink-0 mr-1">Hiển thị:</span>
            <button
              type="button"
              onClick={() => setSelectedVisibility('ALL')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedVisibility === 'ALL'
                  ? 'bg-[#0a3828] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({stats.totalCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedVisibility('PUBLISHED')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedVisibility === 'PUBLISHED'
                  ? 'bg-[#0a3828] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Đang hiển thị ({stats.publishedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedVisibility('DRAFT')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedVisibility === 'DRAFT'
                  ? 'bg-[#0a3828] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Nháp ({stats.draftCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedVisibility('UNPUBLISHED')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedVisibility === 'UNPUBLISHED'
                  ? 'bg-[#0a3828] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ngừng hiển thị ({stats.unpublishedCount})
            </button>
          </div>

          {/* Filter Row 2: Operation Status */}
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5 scrollbar-hide">
            <span className="text-slate-500 font-medium shrink-0 mr-1">Vận hành:</span>
            <button
              type="button"
              onClick={() => setSelectedOperation('ALL')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedOperation === 'ALL'
                  ? 'bg-[#0a3828] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setSelectedOperation('OPERATING')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedOperation === 'OPERATING'
                  ? 'bg-[#0a3828] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Đang đón khách ({stats.operatingCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedOperation('TEMP_CLOSED')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedOperation === 'TEMP_CLOSED'
                  ? 'bg-[#0a3828] text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tạm đóng ({stats.tempClosedCount})
            </button>
          </div>
        </div>

        {/* 6. Homestays List */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Đang tải danh sách Homestay...</span>
          </div>
        ) : homestays.length === 0 ? (
          /* Empty State (Scenario 2 or No search results) */
          <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-100 flex flex-col items-center justify-center text-center gap-3 my-2">
            <div className="w-16 h-16 rounded-full bg-[#f0f4f9] text-[#0a3828] flex items-center justify-center shadow-inner">
              <Home className="w-8 h-8 text-emerald-800" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Chưa có Homestay nào</h3>
            <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed">
              Bạn chưa đăng ký homestay nào trong hệ thống hoặc không có homestay khớp với điều kiện lọc.
            </p>
            <button
              type="button"
              disabled={sandboxScenario === 'SUSPENDED'}
              onClick={() => navigate('/partner/homestay/create')}
              className="mt-2 text-xs bg-[#0a3828] hover:bg-[#08281d] text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#a3e635]" />
              <span>Tạo Homestay đầu tiên</span>
            </button>
          </div>
        ) : (
          /* Homestay Cards */
          <div className="flex flex-col gap-4">
            {homestays.map((homestay) => (
              <div
                key={homestay.id}
                className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-100 flex flex-col transition-all hover:shadow-md"
              >
                {/* Card Image with Badges */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={homestay.coverImageUrl}
                    alt={homestay.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Top Left: Category Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                      <Building className="w-3 h-3 text-emerald-700" />
                      Lưu trú / Homestay
                    </span>
                  </div>

                  {/* Bottom Badges */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    {/* Visibility Tag */}
                    {homestay.visibility === 'PUBLISHED' && (
                      <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Đang hiển thị Web
                      </span>
                    )}
                    {homestay.visibility === 'DRAFT' && (
                      <span className="bg-[#78350f]/90 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-300" />
                        Bản nháp (Chưa lên Web)
                      </span>
                    )}
                    {homestay.visibility === 'UNPUBLISHED' && (
                      <span className="bg-slate-800/90 backdrop-blur-xs text-slate-300 text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <XCircle className="w-2.5 h-2.5 text-slate-400" />
                        Ngừng hiển thị
                      </span>
                    )}

                    {/* Operation Tag */}
                    {homestay.operationStatus === 'OPERATING' ? (
                      homestay.visibility === 'DRAFT' ? (
                        <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sẵn sàng phòng
                        </span>
                      ) : (
                        <span className="bg-white/90 backdrop-blur-xs text-emerald-800 text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          Đang nhận khách
                        </span>
                      )
                    ) : (
                      <span className="bg-rose-600/95 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                        <AlertTriangle className="w-3 h-3 text-white" />
                        Tạm ngưng đón khách
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col gap-2.5">
                  {/* Title & Code */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-[#0c3828] leading-snug">
                      {homestay.name}
                    </h3>
                    <span className="text-xs font-bold text-slate-400 shrink-0">{homestay.code}</span>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="line-clamp-1">{homestay.address}</span>
                  </div>

                  {/* Callout alert note if present */}
                  {homestay.alertNote && (
                    <div
                      className={`rounded-xl p-2.5 text-xs flex items-start gap-2 leading-relaxed ${
                        homestay.visibility === 'DRAFT'
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-blue-50 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {homestay.visibility === 'DRAFT' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                      <span>{homestay.alertNote}</span>
                    </div>
                  )}

                  {/* Specs Row */}
                  <div className="flex items-center justify-between text-xs py-1 border-y border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Bed className="w-4 h-4 text-slate-400" />
                      <span>{homestay.roomTypesCount} loại phòng</span>
                    </div>

                    <div className="flex items-center gap-1 text-[#b91c1c] font-bold">
                      <Tag className="w-3.5 h-3.5 text-[#b91c1c]" />
                      <span>
                        {formatPrice(homestay.priceRefMin)}
                        {homestay.priceRefMax > homestay.priceRefMin && ` – ${formatPrice(homestay.priceRefMax)}`}
                      </span>
                    </div>
                  </div>

                  {/* Update Status Sub-row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Cập nhật: {homestay.lastUpdatedText}</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        homestay.auditStatus === 'STANDARD'
                          ? 'text-emerald-700'
                          : homestay.auditStatus === 'MAINTENANCE'
                          ? 'text-rose-600'
                          : 'text-amber-700'
                      }`}
                    >
                      {homestay.auditStatus === 'STANDARD' && <ShieldCheck className="w-3.5 h-3.5" />}
                      {homestay.auditStatus === 'MAINTENANCE' && <Wrench className="w-3.5 h-3.5" />}
                      {homestay.auditStatus === 'NEEDS_DATA' && <Clock className="w-3.5 h-3.5" />}
                      {homestay.auditStatusText}
                    </span>
                  </div>

                  {/* Quick Action Buttons Row */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/homestay/${homestay.slug}/check-rooms`)}
                      className="py-2 px-1 rounded-xl bg-[#f0f4f9] hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Bed className="w-3.5 h-3.5 text-slate-500" />
                      <span>Loại phòng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => showToast(`Quản lý giá cho "${homestay.name}" (UC-12)`)}
                      className="py-2 px-1 rounded-xl bg-[#f0f4f9] hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5 text-slate-500" />
                      <span>Giá phòng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/homestay/${homestay.slug}/availability`)}
                      className="py-2 px-1 rounded-xl bg-[#f0f4f9] hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lịch phòng</span>
                    </button>
                  </div>

                  {/* Main Action Buttons Row */}
                  <div className="flex items-center gap-2 pt-1">
                    {homestay.visibility === 'DRAFT' && !homestay.isReadyToPublish ? (
                      /* Draft Button: Hoàn thiện để xuất bản */
                      <button
                        type="button"
                        onClick={() => navigate(`/partner/homestay/${homestay.id}/edit`)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#5c2d16] hover:bg-[#4a2310] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-amber-300" />
                        <span>Hoàn thiện để xuất bản</span>
                      </button>
                    ) : (
                      /* Published / Ready Button: Chi tiết & Quản trị */
                      <button
                        type="button"
                        onClick={() => navigate(`/partner/homestay/${homestay.id}`)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#e6f0fa] hover:bg-[#d9e8f8] text-[#1a56db] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#1a56db]" />
                        <span>Chi tiết & Quản trị</span>
                      </button>
                    )}

                    {/* Edit Pencil Icon */}
                    <button
                      type="button"
                      onClick={() => navigate(`/partner/homestay/${homestay.id}/edit`)}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa thông tin Homestay"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Visibility Eye Icon Button (Toggle on/off) */}
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(homestay)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        homestay.visibility === 'PUBLISHED'
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'border-amber-300 bg-amber-50 text-amber-800'
                      }`}
                      title={homestay.visibility === 'PUBLISHED' ? 'Ngừng hiển thị lên Web' : 'Xuất bản lên Web'}
                    >
                      {homestay.visibility === 'PUBLISHED' ? (
                        <Eye className="w-4 h-4 text-slate-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-amber-700" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Quick Create Homestay Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#0c3828] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Tạo Cơ Sở Homestay Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHomestay} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-semibold text-slate-700">Tên cơ sở Homestay *</label>
                <input
                  type="text"
                  required
                  value={newHomestayName}
                  onChange={(e) => setNewHomestayName(e.target.value)}
                  placeholder="Ví dụ: Homestay Nậm Khắt View..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0c3828]"
                />
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <label className="font-semibold text-slate-700">Địa chỉ cụ thể *</label>
                <input
                  type="text"
                  required
                  value={newHomestayAddress}
                  onChange={(e) => setNewHomestayAddress(e.target.value)}
                  placeholder="Bản..., Xã..., Mù Cang Chải"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0c3828]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Giá sàn (VNĐ)</label>
                  <input
                    type="number"
                    value={newPriceMin}
                    onChange={(e) => setNewPriceMin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0c3828]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Giá trần (VNĐ)</label>
                  <input
                    type="number"
                    value={newPriceMax}
                    onChange={(e) => setNewPriceMax(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#0c3828]"
                  />
                </div>
              </div>

              <div className="bg-[#f0f6fd] border border-[#d2e3fc] rounded-xl p-2.5 text-[11px] text-slate-600 leading-relaxed">
                ℹ️ Theo chuẩn UC-10: Homestay mới tạo sẽ có trạng thái <strong>Bản nháp</strong>. Bạn có thể xuất bản
                ngay khi bổ sung đủ giấy phép và ảnh đại diện.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#0a3828] text-white text-xs font-bold shadow-xs hover:bg-[#08281d]"
                >
                  Lưu bản nháp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-2 shadow-lg">
        <div className="max-w-[460px] mx-auto grid grid-cols-3 text-center">
          {/* Tab 1: Homestay của tôi */}
          <button
            type="button"
            onClick={() => setActiveBottomTab('homestays')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors cursor-pointer ${
              activeBottomTab === 'homestays' ? 'text-[#0a3828] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px]">Homestay của tôi</span>
          </button>

          {/* Tab 2: Đơn đặt phòng */}
          <button
            type="button"
            onClick={() => {
              setActiveBottomTab('bookings');
              showToast('Cổng quản lý Đơn đặt phòng (UC-14/17)');
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors cursor-pointer ${
              activeBottomTab === 'bookings' ? 'text-[#0a3828] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-[11px]">Đơn đặt phòng</span>
          </button>

          {/* Tab 3: Báo cáo & Tài khoản */}
          <button
            type="button"
            onClick={() => {
              setActiveBottomTab('reports');
              showToast('Cổng Báo cáo doanh thu & Hồ sơ NCC (UC-09)');
            }}
            className={`flex flex-col items-center gap-1 py-1 transition-colors cursor-pointer ${
              activeBottomTab === 'reports' ? 'text-[#0a3828] font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px]">Báo cáo & Tài khoản</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
