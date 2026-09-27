import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, HelpCircle, KeyRound, Mail, RefreshCw, Send, X } from 'lucide-react';
import { authInputClass } from '@/components/auth/AuthShell';
import { requestPasswordReset, resetPasswordWithOtp } from '@/services/authService';
import type { AuthErrorResponse } from '@/types/user';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const MIN_PASSWORD = 6;

interface ForgotPasswordModalProps {
  /** Điền sẵn email/SĐT người dùng đã gõ ở form đăng nhập. */
  initialIdentifier?: string;
  onClose: () => void;
  /** Gọi sau khi đổi mật khẩu thành công để form đăng nhập điền sẵn tài khoản. */
  onDone: (identifier: string) => void;
}

type Step = 'request' | 'reset' | 'done';

const toMessage = (err: unknown, fallback: string) =>
  err && typeof err === 'object' && 'message' in err && typeof (err as AuthErrorResponse).message === 'string'
    ? (err as AuthErrorResponse).message
    : fallback;

/** Quên mật khẩu 2 bước: nhận OTP 6 số qua email → nhập OTP + mật khẩu mới. */
export function ForgotPasswordModal({ initialIdentifier = '', onClose, onDone }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ttl, setTtl] = useState(10);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const validIdentifier = () => {
    const id = identifier.trim();
    return EMAIL_REGEX.test(id) || VN_PHONE_REGEX.test(id);
  };

  const sendOtp = async () => {
    setError(null);
    if (!validIdentifier()) {
      setError('Vui lòng nhập email hoặc số điện thoại hợp lệ của tài khoản.');
      return;
    }
    setLoading(true);
    try {
      const res = await requestPasswordReset(identifier.trim());
      setTtl(res.otpTtlMinutes);
      setCooldown(res.resendAfterSeconds);
      setStep('reset');
    } catch (err: unknown) {
      setError(toMessage(err, 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Mã OTP gồm đúng 6 chữ số.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Mật khẩu mới tối thiểu ${MIN_PASSWORD} ký tự.`);
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithOtp(identifier.trim(), otp.trim(), password);
      setStep('done');
    } catch (err: unknown) {
      setError(toMessage(err, 'Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  const primaryBtn =
    'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-semibold text-white shadow-xs transition hover:bg-primary-600 disabled:opacity-60';
  const ghostBtn = 'h-10 flex-1 rounded-md border border-[var(--color-border)] text-sm font-semibold text-ink-deep hover:bg-slate-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-label="Khôi phục mật khẩu" className="relative w-full max-w-md rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-muted transition-colors hover:text-ink-deep" aria-label="Đóng">
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink-deep">Khôi phục mật khẩu</h3>
            <p className="text-xs text-muted">
              {step === 'request' ? 'Bước 1/2 · Nhận mã OTP qua email' : step === 'reset' ? 'Bước 2/2 · Nhập mã OTP và mật khẩu mới' : 'Hoàn tất'}
            </p>
          </div>
        </div>

        {step === 'request' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendOtp();
            }}
            className="space-y-4"
          >
            <p className="text-xs leading-relaxed text-ink-light">
              Nhập email hoặc số điện thoại đăng ký tài khoản. Chúng tôi sẽ gửi mã OTP 6 số đến email của tài khoản.
            </p>
            <div>
              <label htmlFor="forgot-identifier" className="mb-1 block text-xs font-semibold text-ink-deep">
                Email hoặc số điện thoại
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  id="forgot-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ban@email.com hoặc 09xxxxxxxx"
                  autoComplete="username"
                  className={`${authInputClass} py-2 text-sm`}
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="flex items-center gap-1 text-xs text-danger">
                <AlertCircle className="h-3 w-3 shrink-0" /> {error}
              </p>
            )}
            <div className="flex gap-2.5">
              <button type="button" onClick={onClose} className={ghostBtn}>Hủy</button>
              <button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Gửi mã OTP</>}
              </button>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={submitReset} className="space-y-4">
            <div className="rounded-md border border-primary/20 bg-primary-50/50 p-3 text-xs leading-relaxed text-ink">
              Nếu tài khoản <strong>{identifier.trim()}</strong> tồn tại và có email, mã OTP đã được gửi (hiệu lực {ttl} phút). Hãy kiểm tra cả hộp thư rác.
            </div>
            <div>
              <label htmlFor="forgot-otp" className="mb-1 block text-xs font-semibold text-ink-deep">Mã OTP (6 số)</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  id="forgot-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="______"
                  className={`${authInputClass} py-2 text-center font-mono text-lg tracking-[0.5em]`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="forgot-new" className="mb-1 block text-xs font-semibold text-ink-deep">Mật khẩu mới</label>
              <div className="relative">
                <input
                  id="forgot-new"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`}
                  className={`${authInputClass} py-2 pr-10 text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 top-2.5 text-muted hover:text-ink-deep"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="forgot-confirm" className="mb-1 block text-xs font-semibold text-ink-deep">Nhập lại mật khẩu mới</label>
              <input
                id="forgot-confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`${authInputClass} py-2 text-sm`}
              />
            </div>
            {error && (
              <p role="alert" className="flex items-center gap-1 text-xs text-danger">
                <AlertCircle className="h-3 w-3 shrink-0" /> {error}
              </p>
            )}
            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={() => { setStep('request'); setError(null); }} className="text-muted hover:text-ink-deep">
                ← Đổi email / SĐT
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={() => void sendOtp()}
                className="font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
              >
                {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
              </button>
            </div>
            <div className="flex gap-2.5">
              <button type="button" onClick={onClose} className={ghostBtn}>Hủy</button>
              <button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Đặt lại mật khẩu'}
              </button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-50/50 p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <h4 className="mt-2 text-sm font-bold text-emerald-800">Đặt lại mật khẩu thành công</h4>
              <p className="mt-1 text-xs text-emerald-700">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
            </div>
            <button type="button" onClick={() => onDone(identifier.trim())} className={`${primaryBtn} w-full`}>
              Về trang đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
