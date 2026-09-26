import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { AUTH_IMAGES } from '@/config/authImages';
import { AuthShell } from '@/components/auth/AuthShell';
import { providerApplicationService } from '@/services/providerApplicationService';
import { homestayError } from '@/services/partnerHomestayService';
import type { ProviderRegisterInput, ProviderRegisterResult } from '@/types/partner';

const input = 'h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink placeholder:text-muted/70 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const blank: ProviderRegisterInput = { businessName: '', contactName: '', contactPhone: '', contactEmail: '', password: '', address: '', businessLicenseNo: '', description: '' };

/** UC-NCC-08: nhà cung cấp tự đăng ký, hồ sơ chờ Admin thẩm định trước khi được cấp quyền đăng nhập. */
export default function ProviderRegisterPage() {
  const [form, setForm] = useState<ProviderRegisterInput>(blank);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ProviderRegisterResult | null>(null);
  const set = <K extends keyof ProviderRegisterInput>(key: K, value: ProviderRegisterInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    if (form.password !== confirm) { setError('Mật khẩu nhập lại không khớp.'); return; }
    setBusy(true); setError('');
    try { setResult(await providerApplicationService.register({ ...form, contactEmail: form.contactEmail.trim() })); }
    catch (e: unknown) { setError(homestayError(e)); }
    finally { setBusy(false); }
  }

  const footer = (
    <div className="flex items-center justify-center gap-1.5 text-sm text-ink-light">
      <span>Đã được duyệt?</span>
      <Link to="/portal/login" className="font-bold text-primary hover:text-primary-600 hover:underline">Đăng nhập cổng đối tác</Link>
    </div>
  );

  if (result) {
    return (
      <AuthShell image={AUTH_IMAGES.register} title="Đã gửi hồ sơ" subtitle="Cảm ơn bạn đã đăng ký trở thành đối tác." footer={footer}>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary-50 p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <p className="font-semibold text-ink-deep">Hồ sơ #{result.applicationId} đang chờ duyệt</p>
          <p className="text-sm text-ink">{result.message}</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell image={AUTH_IMAGES.register} title="Đăng ký đối tác" subtitle="Dành cho chủ Homestay, hợp tác xã và cơ sở lưu trú muốn đón khách qua nền tảng." footer={footer}>
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="flex flex-col gap-4">
        <fieldset disabled={busy} className="flex flex-col gap-4">
          <Field label="Tên cơ sở kinh doanh / hợp tác xã" required>
            <input className={input} required maxLength={255} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
          </Field>
          <Field label="Người đại diện liên hệ" required>
            <input className={input} required maxLength={255} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Số điện thoại (dùng để đăng nhập)" required>
              <input className={input} required type="tel" maxLength={20} pattern="[+0-9() .\-]{8,20}" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
            </Field>
            <Field label="Email">
              <input className={input} type="email" maxLength={255} value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            </Field>
          </div>
          <Field label="Địa chỉ cơ sở" required>
            <input className={input} required maxLength={500} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Số giấy phép / đăng ký kinh doanh">
            <input className={input} maxLength={64} value={form.businessLicenseNo} onChange={(e) => set('businessLicenseNo', e.target.value)} />
          </Field>
          <Field label="Giới thiệu cơ sở (số phòng, loại hình, kinh nghiệm đón khách...)">
            <textarea className={`${input} h-auto py-2`} rows={3} maxLength={5000} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mật khẩu (tối thiểu 8 ký tự)" required>
              <input className={input} required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
            </Field>
            <Field label="Nhập lại mật khẩu" required>
              <input className={input} required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
          </div>
          {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
          <p className="text-xs text-muted">Quản trị viên sẽ thẩm định hồ sơ. Bạn đăng nhập được bằng số điện thoại/email và mật khẩu trên sau khi hồ sơ được duyệt.</p>
          <button className="h-11 rounded-md bg-coral text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all duration-200 hover:bg-coral-hover disabled:opacity-50">
            {busy ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ đăng ký'}
          </button>
        </fieldset>
      </form>
    </AuthShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-deep">
      <span>{label}{required && <span className="text-danger"> *</span>}</span>
      {children}
    </label>
  );
}
