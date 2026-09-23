import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, ArrowLeft, Users, Home, BarChart3, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const rawUser = localStorage.getItem('portal_user');
  const user = rawUser ? JSON.parse(rawUser) : null;

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-6 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
              title="Về trang đăng nhập"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#0f2d3c] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Cổng Quản Trị Hệ Thống Tây Bắc Trails
              </h1>
              <p className="text-xs text-slate-500">
                Phiên làm việc: {user?.fullName || 'Quản trị viên'} ({user?.email || 'admin@taybactrails.vn'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 px-3.5 py-2 rounded-xl font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500">Nhà cung cấp / Homestay</span>
              <p className="text-xl font-bold text-slate-800">42 cơ sở</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500">Tài khoản nội bộ & NCC</span>
              <p className="text-xl font-bold text-slate-800">58 người dùng</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500">Lượt đặt phòng tháng này</span>
              <p className="text-xl font-bold text-slate-800">1,280 lượt</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Settings className="w-4 h-4 text-emerald-700" />
            <span>Chức năng Quản trị (UC-08 Verified)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn đang đăng nhập với quyền <strong>ADMIN</strong>. Hệ thống tự động xác thực và cấp quyền điều phối dữ liệu
            danh mục, phê duyệt hồ sơ NCC (UC-09) và kiểm soát an toàn vận hành hệ thống du lịch số Tây Bắc Trails.
          </p>
        </div>
      </div>
    </div>
  );
}
