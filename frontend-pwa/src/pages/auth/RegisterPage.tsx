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
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { AUTH_IMAGES } from '@/config/authImages';
import { AuthDivider, AuthShell, authInputClass } from '@/components/auth/AuthShell';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { googleLogin, saveTravelerSession, travelerRegister } from '@/services/authService';
import type { AuthErrorResponse } from '@/types/user';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export default function RegisterPage() {
  const navigate = useNavigate();

  // Form values
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Touched states for realtime validation
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Realtime validation errors
  const errors = useMemo(() => {
    const errs: { [key: string]: string } = {};

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errs.fullName = 'Vui lòng nhập họ và tên.';
    } else if (trimmedName.length < 2) {
      errs.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errs.email = 'Địa chỉ email không hợp lệ (VD: ban@email.com).';
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !VN_PHONE_REGEX.test(trimmedPhone)) {
      errs.phone = 'Số điện thoại không đúng định dạng (VD: 0912345678).';
    }

    if (!password) {
      errs.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 8) {
      errs.password = 'Mật khẩu phải chứa ít nhất 8 ký tự.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Vui lòng xác nhận lại mật khẩu.';
    } else if (confirmPassword !== password) {
      errs.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    if (!agreedTerms) {
      errs.agreedTerms = 'Vui lòng đồng ý với điều khoản sử dụng.';
    }

    return errs;
  }, [fullName, email, phone, password, confirmPassword, agreedTerms]);

  // Độ mạnh mật khẩu (Password Strength)
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };
    if (password.length < 8) return { level: 1, label: 'Quá ngắn (ít nhất 8 ký tự)', color: 'bg-danger text-danger' };

    let score = 1;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 2, label: 'Trung bình', color: 'bg-amber-500 text-amber-600' };
    return { level: 3, label: 'Mạnh & An toàn', color: 'bg-emerald-500 text-emerald-600' };
  }, [password]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Đánh dấu tất cả trường đã touch
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      agreedTerms: true,
    });

    if (!isFormValid) return;

    setIsLoading(true);
    try {
      const res = await travelerRegister({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        confirmPassword,
      });
      saveTravelerSession(res);
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as AuthErrorResponse)?.message ||
        (err instanceof Error ? err.message : 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setServerError(null);
    setIsLoading(true);
    try {
      const res = await googleLogin(idToken);
      saveTravelerSession(res);
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as AuthErrorResponse)?.message ||
        (err instanceof Error ? err.message : 'Không thể đăng nhập bằng tài khoản Google.');
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      image={AUTH_IMAGES.register}
      title="Tạo tài khoản mới"
      subtitle="Đăng ký để khám phá homestay, nhận ưu đãi độc quyền và quản lý chuyến đi Tây Bắc của bạn."
      footer={
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-ink-light">
            <span>Đã có tài khoản?</span>
            <Link
              to="/login"
              className="font-bold text-primary hover:text-primary-600 hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </div>
          <p className="text-center text-xs text-muted">
            Dành cho chủ Homestay & Đối tác: Vui lòng liên hệ Quản trị viên để được cấp tài khoản nhà cung cấp.
          </p>
        </div>
      }
    >
      {/* Nút Google Đăng nhập phát một qua Firebase */}
      <GoogleSignInButton
        text="signup_with"
        onCredential={handleGoogleCredential}
        onError={(msg) => setServerError(msg)}
      />

      <AuthDivider label="hoặc điền thông tin đăng ký" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Họ và tên */}
        <div>
          <label htmlFor="fullName" className="mb-1.5 flex items-center justify-between text-sm font-semibold text-ink-deep">
            <span>Họ và tên <span className="text-danger">*</span></span>
            {touched.fullName && !errors.fullName && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Hợp lệ
              </span>
            )}
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setServerError(null);
              }}
              onBlur={() => markTouched('fullName')}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              className={`${authInputClass} ${
                touched.fullName && errors.fullName
                  ? 'border-danger/70 focus:border-danger focus:ring-danger/20'
                  : touched.fullName && !errors.fullName
                  ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : ''
              }`}
            />
          </div>
          {touched.fullName && errors.fullName && (
            <p className="mt-1 flex items-center gap-1 text-xs text-danger">
              <AlertCircle className="h-3 w-3 shrink-0" /> {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 flex items-center justify-between text-sm font-semibold text-ink-deep">
            <span>Email <span className="text-danger">*</span></span>
            {touched.email && !errors.email && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Hợp lệ
              </span>
            )}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setServerError(null);
              }}
              onBlur={() => markTouched('email')}
              placeholder="ban@email.com"
              autoComplete="email"
              className={`${authInputClass} ${
                touched.email && errors.email
                  ? 'border-danger/70 focus:border-danger focus:ring-danger/20'
                  : touched.email && !errors.email
                  ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : ''
              }`}
            />
          </div>
          {touched.email && errors.email && (
            <p className="mt-1 flex items-center gap-1 text-xs text-danger">
              <AlertCircle className="h-3 w-3 shrink-0" /> {errors.email}
            </p>
          )}
        </div>

        {/* Số điện thoại (tùy chọn) */}
        <div>
          <label htmlFor="phone" className="mb-1.5 flex items-center justify-between text-sm font-semibold text-ink-deep">
            <span>Số điện thoại <span className="text-xs font-normal text-muted">(Không bắt buộc)</span></span>
            {phone && touched.phone && !errors.phone && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Hợp lệ
              </span>
            )}
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setServerError(null);
              }}
              onBlur={() => markTouched('phone')}
              placeholder="09xxxxxxxx (10 chữ số)"
              autoComplete="tel"
              className={`${authInputClass} ${
                phone && touched.phone && errors.phone
                  ? 'border-danger/70 focus:border-danger focus:ring-danger/20'
                  : phone && touched.phone && !errors.phone
                  ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : ''
              }`}
            />
          </div>
          {phone && touched.phone && errors.phone && (
            <p className="mt-1 flex items-center gap-1 text-xs text-danger">
              <AlertCircle className="h-3 w-3 shrink-0" /> {errors.phone}
            </p>
          )}
        </div>

        {/* Mật khẩu */}
        <div>
          <label htmlFor="password" className="mb-1.5 flex items-center justify-between text-sm font-semibold text-ink-deep">
            <span>Mật khẩu <span className="text-danger">*</span></span>
            {touched.password && !errors.password && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đủ ký tự
              </span>
            )}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setServerError(null);
              }}
              onBlur={() => markTouched('password')}
              placeholder="Tối thiểu 8 ký tự"
              autoComplete="new-password"
              className={`${authInputClass} pr-10 ${
                touched.password && errors.password
                  ? 'border-danger/70 focus:border-danger focus:ring-danger/20'
                  : touched.password && !errors.password
                  ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/20'
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

          {/* Chỉ báo độ mạnh mật khẩu */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex h-1.5 w-full overflow-hidden rounded-sm bg-slate-100">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.level === 1
                      ? 'w-1/3 bg-danger'
                      : passwordStrength.level === 2
                      ? 'w-2/3 bg-amber-500'
                      : 'w-full bg-emerald-500'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Độ an toàn:</span>
                <span className={`font-semibold ${passwordStrength.color.split(' ')[1]}`}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}

          {touched.password && errors.password && (
            <p className="mt-1 flex items-center gap-1 text-xs text-danger">
              <AlertCircle className="h-3 w-3 shrink-0" /> {errors.password}
            </p>
          )}
        </div>

        {/* Xác nhận mật khẩu (check 2 lần) */}
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 flex items-center justify-between text-sm font-semibold text-ink-deep">
            <span>Xác nhận lại mật khẩu <span className="text-danger">*</span></span>
            {confirmPassword && touched.confirmPassword && !errors.confirmPassword && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Khớp mật khẩu
              </span>
            )}
          </label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setServerError(null);
              }}
              onBlur={() => markTouched('confirmPassword')}
              placeholder="Nhập lại mật khẩu vừa đặt"
              autoComplete="new-password"
              className={`${authInputClass} pr-10 ${
                touched.confirmPassword && errors.confirmPassword
                  ? 'border-danger/70 focus:border-danger focus:ring-danger/20'
                  : confirmPassword && touched.confirmPassword && !errors.confirmPassword
                  ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-3 top-3 text-muted transition-colors hover:text-primary"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="mt-1 flex items-center gap-1 text-xs text-danger">
              <AlertCircle className="h-3 w-3 shrink-0" /> {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Checkbox điều khoản */}
        <div className="mt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => {
                setAgreedTerms(e.target.checked);
                setServerError(null);
              }}
              className="mt-1 h-4 w-4 rounded-sm border-slate-300 text-primary focus:ring-primary/20 accent-[var(--color-primary)]"
            />
            <span className="text-xs leading-relaxed text-ink-light select-none">
              Tôi xác nhận đồng ý với{' '}
              <a href="#terms" onClick={(e) => e.preventDefault()} className="font-semibold text-primary hover:underline">
                Điều khoản dịch vụ
              </a>{' '}
              và{' '}
              <a href="#privacy" onClick={(e) => e.preventDefault()} className="font-semibold text-primary hover:underline">
                Chính sách bảo mật
              </a>{' '}
              của Đi Du Lịch.
            </span>
          </label>
          {touched.agreedTerms && errors.agreedTerms && (
            <p className="mt-1 flex items-center gap-1 text-xs text-danger">
              <AlertCircle className="h-3 w-3 shrink-0" /> {errors.agreedTerms}
            </p>
          )}
        </div>

        {/* Thông báo lỗi từ Server */}
        {serverError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger animate-in fade-in duration-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Nút Hoàn tất đăng ký */}
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
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang tạo tài khoản...
            </>
          ) : (
            <>
              Hoàn tất đăng ký <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
