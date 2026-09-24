import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import { AUTH_IMAGES } from '@/config/authImages';
import { AuthDivider, AuthShell, authInputClass } from '@/components/auth/AuthShell';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
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
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const emailTrim = forgotEmail.trim();
    if (!emailTrim || !EMAIL_REGEX.test(emailTrim)) {
      setForgotError('Vui lòng nhập địa chỉ email hợp lệ để nhận hướng dẫn.');
      return;
    }

    setForgotLoading(true);
    try {
      // Giả lập gửi mail khôi phục mật khẩu mượt mà
      await new Promise((r) => setTimeout(r, 1000));
      setForgotSent(true);
    } catch {
      setForgotError('Không thể gửi yêu cầu lúc này. Vui lòng liên hệ ban quản trị.');
    } finally {
      setForgotLoading(false);
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
                onClick={() => {
                  setIsForgotOpen(true);
                  setForgotSent(false);
                  setForgotError(null);
                  setForgotEmail(identifier.includes('@') ? identifier.trim() : '');
                }}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setIsForgotOpen(false)}
              className="absolute right-4 top-4 text-muted transition-colors hover:text-ink-deep"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink-deep">Khôi phục mật khẩu</h3>
                <p className="text-xs text-muted">Nhận hướng dẫn đặt lại mật khẩu qua email</p>
              </div>
            </div>

            {forgotSent ? (
              <div className="space-y-4">
                <div className="rounded-md border border-emerald-500/30 bg-emerald-50/50 p-4 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                  <h4 className="mt-2 text-sm font-bold text-emerald-800">Đã gửi hướng dẫn khôi phục</h4>
                  <p className="mt-1 text-xs text-emerald-700">
                    Hệ thống đã gửi liên kết đặt lại mật khẩu đến <strong>{forgotEmail}</strong>. Vui lòng kiểm tra hộp thư đến (và thư rác).
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 p-3 text-xs text-muted">
                  <strong>Đối tác Homestay / Admin:</strong> Nếu không truy cập được email, vui lòng liên hệ Hotline{' '}
                  <span className="font-semibold text-primary">0988 888 888</span> hoặc email{' '}
                  <span className="font-semibold text-primary">admin@taybactrails.vn</span> để được cấp lại mật khẩu.
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="w-full h-10 rounded-md bg-primary text-sm font-semibold text-white transition hover:bg-primary-600"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs leading-relaxed text-ink-light">
                  Nhập email đăng ký tài khoản của bạn. Chúng tôi sẽ gửi đường dẫn đặt lại mật khẩu trong ít phút.
                </p>

                <div>
                  <label htmlFor="forgot-email" className="mb-1 block text-xs font-semibold text-ink-deep">
                    Email tài khoản
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="ban@email.com"
                      required
                      className={`${authInputClass} text-sm py-2`}
                    />
                  </div>
                </div>

                {forgotError && (
                  <p className="flex items-center gap-1 text-xs text-danger">
                    <AlertCircle className="h-3 w-3 shrink-0" /> {forgotError}
                  </p>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="h-10 flex-1 rounded-md border border-[var(--color-border)] text-sm font-semibold text-ink-deep hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-semibold text-white shadow-xs transition hover:bg-primary-600 disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" /> Gửi yêu cầu
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
