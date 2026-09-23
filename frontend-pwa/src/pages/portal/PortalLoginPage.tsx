import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, RefreshCw } from 'lucide-react';
import { AUTH_IMAGES } from '@/config/authImages';
import { AuthDivider, AuthShell, authInputClass } from '@/components/auth/AuthShell';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { googleLogin, portalLogin, saveTravelerSession, travelerLogin } from '@/services/authService';
import type { AuthErrorResponse } from '@/types/user';

/** Đăng nhập tài khoản: Google (khách du lịch) hoặc Email/SĐT + mật khẩu (Admin, Nhà cung cấp). */
export default function PortalLoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthErrorResponse | null>(null);

  const fail = (message: string, status = 400, errorCode = 'VALIDATION_ERROR') =>
    setError({ status, errorCode, message });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return fail('Vui lòng nhập Email hoặc Số điện thoại.');
    if (!password.trim()) return fail('Vui lòng nhập mật khẩu.');

    setIsLoading(true);
    setError(null);
    try {
      try {
        const res = await portalLogin({ identifier: identifier.trim(), password: password.trim() });
        localStorage.setItem('portal_token', res.token);
        localStorage.setItem('portal_user', JSON.stringify(res));
        navigate(res.role === 'ADMIN' ? '/admin' : '/partner');
      } catch (err: unknown) {
        // NCC bị đình chỉ / chấm dứt → màn hình thông báo riêng
        if ((err as AuthErrorResponse).errorCode === 'PROVIDER_SUSPENDED') {
          navigate('/portal/suspended', { replace: true });
          return;
        }
        // Không phải Admin/NCC → thử tài khoản khách du lịch
        if ((err as AuthErrorResponse).errorCode !== 'AUTH_INVALID_CREDENTIALS') throw err;
        try {
          saveTravelerSession(await travelerLogin(identifier.trim(), password));
          navigate('/');
        } catch (travelerErr: unknown) {
          // Khách bị khóa thì báo đúng lý do; mọi lỗi khác giữ thông báo "sai thông tin đăng nhập".
          throw (travelerErr as AuthErrorResponse).errorCode === 'ACCOUNT_INACTIVE' ? travelerErr : err;
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
    <AuthShell
      image={AUTH_IMAGES.login}
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để lưu hành trình, đặt homestay và quản lý chuyến đi của bạn."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary-600 hover:underline">
            Đăng ký miễn phí
          </Link>
        </>
      }
    >
      <GoogleSignInButton text="signin_with" onCredential={handleGoogleCredential} onError={(m) => fail(m, 500, 'GOOGLE_SDK_ERROR')} />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-ink-deep">
            Email hoặc số điện thoại
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ban@email.com hoặc 09xxxxxxxx"
              autoComplete="username"
              className={authInputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink-deep">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              className={`${authInputClass} pr-10`}
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
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-white shadow-[var(--shadow-teal)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang xác thực...
            </>
          ) : (
            <>
              Đăng nhập <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
