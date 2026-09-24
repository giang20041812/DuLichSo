import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, Phone, RefreshCw, User } from 'lucide-react';
import { AUTH_IMAGES } from '@/config/authImages';
import { AuthDivider, AuthShell, authInputClass } from '@/components/auth/AuthShell';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { googleLogin, saveTravelerSession, travelerRegister } from '@/services/authService';
import type { AuthErrorResponse } from '@/types/user';

/** Đăng ký tài khoản khách du lịch. Tài khoản Đối tác / NCC do Ban quản trị cấp. */
export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password) {
      return setError('Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
    }
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự.');

    setIsLoading(true);
    try {
      const res = await travelerRegister({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      saveTravelerSession(res);
      navigate('/');
    } catch (err: unknown) {
      setError((err as AuthErrorResponse).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    try {
      saveTravelerSession(await googleLogin(idToken));
      navigate('/');
    } catch (err: unknown) {
      setError((err as AuthErrorResponse).message);
    }
  };

  return (
    <AuthShell
      image={AUTH_IMAGES.register}
      title="Tạo tài khoản"
      subtitle="Gia nhập cộng đồng VietTrack — khám phá và đặt chỗ chỉ trong vài phút."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-600 hover:underline">
            Đăng nhập
          </Link>
          <p className="mt-2 text-xs">Là chủ homestay / nhà cung cấp? Vui lòng liên hệ Ban quản trị để được cấp tài khoản đối tác.</p>
        </>
      }
    >
      <GoogleSignInButton text="signup_with" onCredential={handleGoogleCredential} onError={setError} />

      <AuthDivider label="hoặc đăng ký bằng email" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field id="fullName" label="Họ và tên" icon={User}>
          <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" autoComplete="name" className={authInputClass} />
        </Field>

        <Field id="email" label="Email" icon={Mail}>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" autoComplete="email" className={authInputClass} />
        </Field>

        <Field id="phone" label="Số điện thoại (không bắt buộc)" icon={Phone}>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" autoComplete="tel" className={authInputClass} />
        </Field>

        <Field id="password" label="Mật khẩu" icon={Lock}>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" className={authInputClass} />
        </Field>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-white shadow-[var(--shadow-teal)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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

function Field({ id, label, icon: Icon, children }: { id: string; label: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-deep">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
        {children}
      </div>
    </div>
  );
}
