import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Camera,
  Headphones,
  User,
  Check,
  Mountain,
  RefreshCw,
} from 'lucide-react';
import { portalLogin } from '@/services/authService';
import { PortalLoginResponse, AuthErrorResponse } from '@/types/user';

interface ScenarioDef {
  id: number;
  label: string;
  style: 'default' | 'danger-outline' | 'success-solid' | 'danger-solid';
  description: string;
  identifier: string;
  password: string;
  simulate500?: boolean;
}

const QA_SCENARIOS: ScenarioDef[] = [
  {
    id: 1,
    label: '1. Mặc định',
    style: 'default',
    description: 'Xoá trắng biểu mẫu và đặt lại trạng thái ban đầu.',
    identifier: '',
    password: '',
  },
  {
    id: 2,
    label: '2. Sai thông tin (Security)',
    style: 'danger-outline',
    description: 'Kiểm thử quy tắc BV-08: Sai mật khẩu trả về 401 với thông báo chung (không tiết lộ tài khoản tồn tại).',
    identifier: 'admin@taybactrails.vn',
    password: 'wrong_password_999',
  },
  {
    id: 3,
    label: '3. TK Vô hiệu hoá',
    style: 'danger-outline',
    description: 'Kiểm thử UC-08: Tài khoản có AccountStatus = INACTIVE bị từ chối 403.',
    identifier: 'inactive_user@taybactrails.vn',
    password: 'Pass@123456',
  },
  {
    id: 4,
    label: '4. NCC Đình chỉ',
    style: 'danger-outline',
    description: 'Kiểm thử UC-08: Tài khoản NCC có ProviderStatus = SUSPENDED bị từ chối 403.',
    identifier: 'ncc_suspended@taybactrails.vn',
    password: 'Pass@123456',
  },
  {
    id: 5,
    label: '5. OK - Admin',
    style: 'success-solid',
    description: 'Kiểm thử UC-08: Đăng nhập Admin thành công (200 OK), cấp JWT và chuyển hướng /admin.',
    identifier: 'admin@taybactrails.vn',
    password: 'Admin@123456',
  },
  {
    id: 6,
    label: '6. OK - NCC',
    style: 'success-solid',
    description: 'Kiểm thử UC-08: Đăng nhập NCC thành công (200 OK), cấp JWT và chuyển hướng /partner.',
    identifier: 'ncc@taybactrails.vn',
    password: 'Ncc@123456',
  },
  {
    id: 7,
    label: '7. Lỗi 500',
    style: 'danger-solid',
    description: 'Kiểm thử khả năng xử lý ngoại lệ khi máy chủ trả về lỗi 500 Internal Server Error.',
    identifier: 'sim_500@taybactrails.vn',
    password: 'SystemFail@123',
    simulate500: true,
  },
];

export default function PortalLoginPage() {
  const navigate = useNavigate();

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // QA Simulator State
  const [isQaSimulatorOpen, setIsQaSimulatorOpen] = useState(true);
  const [activeScenario, setActiveScenario] = useState<ScenarioDef | null>(null);

  // Response Feedback State
  const [loginSuccess, setLoginSuccess] = useState<PortalLoginResponse | null>(null);
  const [loginError, setLoginError] = useState<AuthErrorResponse | null>(null);

  const handleSelectScenario = (scenario: ScenarioDef) => {
    setActiveScenario(scenario);
    setIdentifier(scenario.identifier);
    setPassword(scenario.password);
    setLoginSuccess(null);
    setLoginError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setLoginError({
        status: 400,
        errorCode: 'VALIDATION_ERROR',
        message: 'Vui lòng nhập Email hoặc Số điện thoại đã được cấp phép.',
      });
      return;
    }

    if (!password.trim()) {
      setLoginError({
        status: 400,
        errorCode: 'VALIDATION_ERROR',
        message: 'Vui lòng nhập mật khẩu được cấp.',
      });
      return;
    }

    setIsLoading(true);
    setLoginSuccess(null);
    setLoginError(null);

    try {
      const isSimulate500 = activeScenario?.simulate500 || identifier.includes('sim_500');
      const res = await portalLogin({
        identifier: identifier.trim(),
        password: password.trim(),
        simulateError500: isSimulate500,
      });

      setLoginSuccess(res);

      // Lưu token vào localStorage để tiện phiên làm việc
      if (res.token) {
        localStorage.setItem('portal_token', res.token);
        localStorage.setItem('portal_user', JSON.stringify(res));
      }
    } catch (err: unknown) {
      const errorObj = err as AuthErrorResponse;
      setLoginError(errorObj);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-[#1e293b] flex flex-col items-center py-4 px-3 sm:px-4 font-sans">
      <div className="w-full max-w-[460px] flex flex-col gap-4">
        {/* Top App Header */}
        <header className="flex items-center justify-between px-1 py-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#1e293b] hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c3828] flex items-center justify-center text-white shadow-sm">
              <Mountain className="w-4 h-4 text-[#a3e635]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-[#0c3828] tracking-wider text-sm leading-tight">TÂY BẮC</span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight">Nội Bộ & Đối Tác</span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tài khoản"
            className="w-9 h-9 rounded-full bg-[#0c3828] text-white flex items-center justify-center shadow-sm"
          >
            <User className="w-4 h-4 text-white" />
          </button>
        </header>

        {/* 1. QA Simulator & Kiểm Thử UC-08 Card */}
        <div className="bg-[#eef5fe] border border-[#d2e3fc] rounded-2xl p-4 shadow-sm transition-all">
          <button
            type="button"
            onClick={() => setIsQaSimulatorOpen(!isQaSimulatorOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#0f2d3c] flex items-center gap-1.5">
                <span className="text-lg">🧪</span> QA Simulator & Kiểm Thử UC-08
              </span>
            </div>
            {isQaSimulatorOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          <p className="text-xs text-[#5f6d7e] mt-1.5 leading-relaxed">
            Công cụ mô phỏng 7 kịch bản phản hồi logic server cho Product & QA.
          </p>

          {isQaSimulatorOpen && (
            <div className="mt-3.5 pt-3 border-t border-[#d8e7fc] flex flex-col gap-3">
              {/* Scenario Pills */}
              <div className="flex flex-wrap gap-2">
                {QA_SCENARIOS.map((sc) => {
                  const isSelected = activeScenario?.id === sc.id;
                  let btnClass = 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50';

                  if (sc.style === 'danger-outline') {
                    btnClass = isSelected
                      ? 'bg-rose-50 text-rose-700 border-2 border-rose-600 font-semibold'
                      : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50';
                  } else if (sc.style === 'success-solid') {
                    btnClass = isSelected
                      ? 'bg-[#0a3828] text-white ring-2 ring-[#a3e635] font-semibold'
                      : 'bg-[#0f4432] text-white hover:bg-[#0a3828]';
                  } else if (sc.style === 'danger-solid') {
                    btnClass = isSelected
                      ? 'bg-rose-200 text-rose-800 border-2 border-rose-600 font-semibold'
                      : 'bg-[#fed7d7] text-rose-800 hover:bg-rose-200';
                  } else if (isSelected) {
                    btnClass = 'bg-slate-200 text-slate-900 border-2 border-slate-600 font-semibold';
                  }

                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleSelectScenario(sc)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-xs ${btnClass}`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      {sc.label}
                    </button>
                  );
                })}
              </div>

              {/* Active Scenario Info Box */}
              {activeScenario && (
                <div className="bg-white/80 rounded-xl p-2.5 text-xs border border-blue-100 flex items-start gap-2">
                  <span className="font-semibold text-blue-900 shrink-0">Kịch bản {activeScenario.id}:</span>
                  <span className="text-slate-600">{activeScenario.description}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Main Login Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
          {/* Top Logo Badge Graphic */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute -right-4 -top-2 w-16 h-16 bg-[#e6f4ea] rounded-full opacity-80 pointer-events-none" />
            <div className="relative w-14 h-14 bg-[#0a3828] rounded-2xl flex items-center justify-center shadow-md text-white">
              <Mountain className="w-7 h-7 text-[#a3e635]" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#e8f0fe] text-[#1a73e8] px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>Hệ Thống Phân Quyền Tự Động</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d3c] mt-3 text-center">
            Đăng nhập Cổng Quản Trị
          </h1>
          <p className="text-xs sm:text-sm text-[#5f6d7e] text-center mt-1 max-w-[340px] leading-relaxed">
            Dành cho Nhà cung cấp dịch vụ (NCC) và Ban quản trị hệ thống Tây Bắc Trails.
          </p>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="w-full mt-6 flex flex-col gap-4">
            {/* Input 1: Email hoặc Số điện thoại */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="identifier-input" className="font-semibold text-slate-800">
                  Email hoặc số điện thoại
                </label>
                <span className="text-rose-600 font-medium">* Bắt buộc</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="identifier-input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nhap@email.com hoặc 09xxxxxxxx"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#f8fafc] border border-slate-200 text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-[#0a3828] focus:ring-1 focus:ring-[#0a3828] transition-all"
                  autoComplete="username"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Hệ thống hỗ trợ đăng nhập bằng Email hoặc Số điện thoại đã được cấp phép.
              </p>
            </div>

            {/* Input 2: Mật khẩu */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="password-input" className="font-semibold text-slate-800">
                  Mật khẩu
                </label>
                <span className="text-rose-600 font-medium">* Bắt buộc</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu được cấp"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#f8fafc] border border-slate-200 text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-[#0a3828] focus:ring-1 focus:ring-[#0a3828] transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Policy Info Box */}
            <div className="bg-[#f0f6fd] border border-[#d2e3fc] rounded-xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Vai trò người dùng (Admin hoặc NCC) được hệ thống tự động xác thực và điều hướng theo hồ sơ nghiệp vụ.
              </p>
            </div>

            {/* Response Alerts */}
            {loginSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col gap-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Xác thực thành công (HTTP 200 OK)</span>
                </div>
                <div className="text-[11px] text-emerald-700 flex flex-col gap-0.5 pl-6">
                  <span>
                    • Tài khoản: <strong>{loginSuccess.fullName || loginSuccess.email}</strong>
                  </span>
                  <span>
                    • Phân quyền hệ thống: <strong className="uppercase">{loginSuccess.role}</strong>
                  </span>
                  {loginSuccess.provider && (
                    <span>
                      • Cơ sở NCC: <strong>{loginSuccess.provider.name}</strong>
                    </span>
                  )}
                  <span>• {loginSuccess.message}</span>
                </div>
                <div className="mt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (loginSuccess.role === 'ADMIN') {
                        navigate('/admin');
                      } else {
                        navigate('/partner');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <span>Vào {loginSuccess.role === 'ADMIN' ? 'Cổng Admin' : 'Cổng NCC'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col gap-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                  {loginError.status === 500 ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    Mã phản hồi: {loginError.status} ({loginError.errorCode || 'AUTHENTICATION_FAILED'})
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 pl-6 leading-relaxed">{loginError.message}</p>
                {loginError.status === 403 && (
                  <p className="text-[10px] text-rose-500 pl-6 italic">
                    Ghi chú BV-08: Tài khoản bị chặn truy cập theo tiêu chuẩn kiểm soát trạng thái UC-08.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-3.5 px-4 bg-[#0a3828] hover:bg-[#07281d] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực hệ thống...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 3. Không gian Bản địa Tây Bắc Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0f2d3c]">
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>Không gian Bản địa Tây Bắc</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Di sản mùa gặt
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Photo 1: Mù Cang Chải */}
            <div className="relative rounded-2xl overflow-hidden shadow-xs group h-28 sm:h-32">
              <img
                src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
                alt="Mù Cang Chải"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <span className="bg-black/50 backdrop-blur-xs text-white text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-md inline-block">
                  Mù Cang Chải
                </span>
              </div>
            </div>

            {/* Photo 2: Bản Lìm Mông */}
            <div className="relative rounded-2xl overflow-hidden shadow-xs group h-28 sm:h-32">
              <img
                src="https://images.unsplash.com/photo-1542159040-3b03f0b2f059?auto=format&fit=crop&w=600&q=80"
                alt="Bản Lìm Mông"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <span className="bg-black/50 backdrop-blur-xs text-white text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-md inline-block">
                  Bản Lìm Mông
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Kênh Hỗ Trợ Đối Tác & Quản Trị Card */}
        <div className="bg-[#f0f6fe] border border-[#d6e5fb] rounded-3xl p-5 flex flex-col gap-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <Headphones className="w-3 h-3 text-rose-600" />
            </div>
            <h2 className="text-sm font-bold text-[#0f2d3c]">Kênh Hỗ Trợ Đối Tác & Quản Trị</h2>
          </div>

          <p className="text-xs text-[#526071] leading-relaxed">
            Tài khoản đăng nhập được cấp phát bởi Ban Quản lý Dự án Du lịch & Di sản Tây Bắc Trails. Nếu chưa có thông
            tin truy cập hoặc cơ sở lưu trú bị tạm ngưng, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật:
          </p>

          <div className="flex flex-col gap-2.5">
            {/* Contact 1: Hotline */}
            <a
              href="tel:19008899"
              className="bg-white rounded-2xl p-3.5 border border-[#e2ecfa] flex items-center gap-3 hover:shadow-xs transition-shadow"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0a3828] flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500 font-medium">Tổng đài đối tác 24/7</span>
                <span className="text-sm font-bold text-[#0f2d3c] tracking-wide">1900 88 99 (Nhánh 2)</span>
              </div>
            </a>

            {/* Contact 2: Email */}
            <a
              href="mailto:doitac@taybactrails.vn"
              className="bg-white rounded-2xl p-3.5 border border-[#e2ecfa] flex items-center gap-3 hover:shadow-xs transition-shadow"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1a73e8] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500 font-medium">Email hỗ trợ tài khoản NCC</span>
                <span className="text-xs font-bold text-[#0f2d3c]">doitac@taybactrails.vn</span>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center my-2">
          <p className="text-[11px] text-slate-400">Phiên bản Cổng Quản Trị v2.4.0 • Tiêu chuẩn UC-08 Phase 1</p>
        </footer>
      </div>
    </div>
  );
}
