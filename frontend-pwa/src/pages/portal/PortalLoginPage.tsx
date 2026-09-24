import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { AUTH_IMAGES } from '@/config/authImages';
import { AuthDivider, AuthShell, authInputClass } from '@/components/auth/AuthShell';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { googleLogin, portalLogin, saveTravelerSession, travelerLogin } from '@/services/authService';
import type { AuthErrorResponse } from '@/types/user';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export default function PortalLoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Realtime validation state
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthErrorResponse | null>(null);

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Realtime validation
  const errors = useMemo(() => {
    const errs: { [key: string]: string } = {};
    const trimmedId = identifier.trim();

    if (!trimmedId) {
      errs.identifier = 'Vui lòng nhập Email hoặc Số điện thoại.';
    } else if (!EMAIL_REGEX.test(trimmedId) && !VN_PHONE_REGEX.test(trimmedId)) {
      errs.identifier = 'Email hoặc Số điện thoại chưa đúng định dạng.';
    }

    if (!password) {
      errs.password = 'Vui lòng nhập mật khẩu.';
    }

    return errs;
  }, [identifier, password]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });

    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);
    const cleanId = identifier.trim();

    try {
      try {
        // 1. Thử đăng nhập Cổng Quản Trị (Admin hoặc NCC Partner)
        const res = await portalLogin({ identifier: cleanId, password });
        localStorage.setItem('portal_token', res.token);
        localStorage.setItem('portal_user', JSON.stringify(res));
        navigate(res.role === 'ADMIN' ? '/admin' : '/partner');
      } catch (err: unknown) {
        // NCC bị đình chỉ / chấm dứt → màn hình thông báo riêng
        if ((err as AuthErrorResponse)?.errorCode === 'PROVIDER_SUSPENDED') {
          navigate('/portal/suspended', { replace: true });
          return;
        }

        // Nếu không phải tài khoản Portal, thử tiếp tài khoản Khách du lịch (Traveler)
        if ((err as AuthErrorResponse)?.errorCode !== 'AUTH_INVALID_CREDENTIALS') throw err;

        try {
          const travelerRes = await travelerLogin(cleanId, password);
          saveTravelerSession(travelerRes);
          navigate('/');
        } catch (travelerErr: unknown) {
          throw (travelerErr as AuthErrorResponse)?.errorCode === 'ACCOUNT_INACTIVE'
            ? travelerErr
            : err;
        }
      }
    } catch (err: unknown) {
      setError(err as AuthErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      saveTravelerSession(await googleLogin(idToken));
      navigate('/');
    } catch (err: unknown) {
      setError(err as AuthErrorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthShell
        image={AUTH_IMAGES.login}
        title="Đăng nhập tài khoản"
        subtitle="Khám phá homestay Tây Bắc, quản lý đặt phòng và dịch vụ của bạn."
        footer={
          <p className="text-center text-xs text-muted">
            Đăng nhập hỗ trợ tài khoản Khách du lịch, Đối tác Homestay và Ban quản trị hệ thống.
          </p>
        }
      >
        {/* Nút Đăng nhập phát một qua Google Firebase Popup */}
        <GoogleSignInButton
          text="signin_with"
          onCredential={handleGoogleCredential}
          onError={(msg) =>
            setError({ status: 500, errorCode: 'GOOGLE_AUTH_ERROR', message: msg })
          }
        />

        <AuthDivider label="hoặc đăng nhập bằng tài khoản" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Email hoặc Số điện thoại */}
          <div>
            <label
              htmlFor="identifier"
              className="mb-1.5 flex items-center justify-between text-sm font-semibold text-ink-deep"
            >
              <span>Email hoặc Số điện thoại <span className="text-danger">*</span></span>
              {touched.identifier && !errors.identifier && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Hợp lệ
                </span>
              )}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError(null);
                }}
                onBlur={() => markTouched('identifier')}
                placeholder="ban@email.com hoặc 09xxxxxxxx"
                autoComplete="username"
                className={`${authInputClass} ${
                  touched.identifier && errors.identifier
                    ? 'border-danger/70 focus:border-danger focus:ring-danger/20'
                    : touched.identifier && !errors.identifier
                    ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/20'
                    : ''
                }`}
              />
            </div>
            {touched.identifier && errors.identifier && (
              <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                <AlertCircle className="h-3 w-3 shrink-0" /> {errors.identifier}
              </p>
            )}
          </div>

          {/* Mật khẩu & Quên mật khẩu */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <label htmlFor="password" className="font-semibold text-ink-deep">
                Mật khẩu <span className="text-danger">*</span>
              </label>
              {/* Nút Quên mật khẩu */}
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs font-semibold text-primary transition-colors hover:text-primary-600 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onBlur={() => markTouched('password')}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                className={`${authInputClass} pr-10 ${
                  touched.password && errors.password
                    ? 'border-danger/70 focus:border-danger focus:ring-danger/20'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-3 text-muted transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                <AlertCircle className="h-3 w-3 shrink-0" /> {errors.password}
              </p>
            )}
          </div>

          {/* Ghi nhớ đăng nhập */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded-sm border-slate-300 text-primary focus:ring-primary/20 accent-[var(--color-primary)]"
              />
              <span className="text-xs font-medium text-ink-light">Ghi nhớ đăng nhập</span>
            </label>
          </div>

          {/* Thông báo lỗi tổng quát */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger animate-in fade-in duration-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error.message}</span>
            </div>
          )}

          {/* Nút Đăng nhập */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-bold text-white shadow-[var(--shadow-teal)] transition-all duration-200 ${
              !isFormValid || isLoading
                ? 'cursor-not-allowed bg-slate-300 text-slate-500 shadow-none'
                : 'bg-primary hover:-translate-y-0.5 hover:bg-primary-600 active:translate-y-0'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Đang đăng nhập...
              </>
            ) : (
              <>
                Đăng nhập <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Đặt lại nút đăng ký tài khoản vào form đăng nhập ở dưới cùng, cơ bản */}
          <div className="pt-2 text-center text-xs text-muted">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary transition-colors hover:text-primary-600 hover:underline"
            >
              Đăng ký tài khoản
            </Link>
          </div>
        </form>
      </AuthShell>

      {/* Modal Quên Mật Khẩu */}
      {isForgotOpen && (
        <ForgotPasswordModal
          initialIdentifier={identifier}
          onClose={() => setIsForgotOpen(false)}
          onDone={(id) => {
            setIdentifier(id);
            setPassword('');
            setError(null);
            setIsForgotOpen(false);
          }}
        />
      )}
    </>
  );
}
