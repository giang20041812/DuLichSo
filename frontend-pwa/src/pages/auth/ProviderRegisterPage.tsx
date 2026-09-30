import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { providerApplicationService } from '@/services/providerApplicationService';
import { homestayError } from '@/services/partnerHomestayService';
import { getApiFieldErrors } from '@/lib/apiError';
import type { ProviderApplicationStatusResult, ProviderRegisterInput, ProviderRegisterResult } from '@/types/partner';

const input = 'h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink placeholder:text-muted/70 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const blank: ProviderRegisterInput = { businessName: '', contactName: '', contactPhone: '', contactEmail: '', password: '', address: '', businessLicenseNo: '', description: '' };
const inputInvalid = '!border-danger focus:!border-danger focus:!ring-danger/20';
/** Các ô được server kiểm tra trùng (tên khớp RegisterInput bên backend). */
type DuplicateField = 'contactPhone' | 'contactEmail' | 'businessLicenseNo';
const DUPLICATE_FIELDS: readonly DuplicateField[] = ['contactPhone', 'contactEmail', 'businessLicenseNo'];
const STATUS_TONE = { PENDING: 'border-sun/40 bg-sun-light text-ink-deep', APPROVED: 'border-accent/40 bg-accent-50 text-accent-700', REJECTED: 'border-danger/30 bg-danger/5 text-danger' } as const;

/** UC-NCC-01: nhà cung cấp tự đăng ký, xem lại rồi gửi; hồ sơ chờ Admin thẩm định trước khi được cấp quyền. Có tra cứu trạng thái hồ sơ. */
export default function ProviderRegisterPage() {
  const [mode, setMode] = useState<'register' | 'status'>('register');
  const [form, setForm] = useState<ProviderRegisterInput>(blank);
  const [confirm, setConfirm] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ProviderRegisterResult | null>(null);
  // Lỗi trùng do server báo theo từng ô, kèm giá trị đã gửi: sửa ô đó thì lỗi tự mất.
  const [duplicates, setDuplicates] = useState<Partial<Record<DuplicateField, { value: string; message: string }>>>({});
  const duplicateError = (field: DuplicateField) => {
    const dup = duplicates[field];
    return dup && dup.value === form[field].trim() ? dup.message : undefined;
  };
  const set = <K extends keyof ProviderRegisterInput>(key: K, value: ProviderRegisterInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  function review() {
    if (form.password !== confirm) { setError('Mật khẩu nhập lại không khớp.'); return; }
    if (DUPLICATE_FIELDS.some((f) => duplicateError(f))) { setError('Vui lòng sửa các thông tin bị trùng được đánh dấu.'); return; }
    setError(''); setReviewing(true);
  }

  async function submit() {
    setBusy(true); setError('');
    try { setResult(await providerApplicationService.register({ ...form, contactEmail: form.contactEmail.trim() })); }
    catch (e: unknown) {
      // Trùng thông tin: quay về form, báo ngay dưới từng ô bị trùng (có thể nhiều ô cùng lúc).
      const found = getApiFieldErrors(e).filter((f): f is { field: DuplicateField; message: string } =>
        (DUPLICATE_FIELDS as readonly string[]).includes(f.field));
      if (found.length) {
        setDuplicates(Object.fromEntries(found.map((f) => [f.field, { value: form[f.field].trim(), message: f.message }])));
        setError('');
      } else {
        setError(homestayError(e));
      }
      setReviewing(false);
    }
    finally { setBusy(false); }
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-ink-light">
      <span>Đã được duyệt? <Link to="/portal/login" className="font-bold text-primary hover:text-primary-600 hover:underline">Đăng nhập cổng đối tác</Link></span>
      <button type="button" onClick={() => { setMode(mode === 'status' ? 'register' : 'status'); setError(''); }} className="font-bold text-primary hover:underline">
        {mode === 'status' ? 'Đăng ký mới' : 'Xem trạng thái hồ sơ'}
      </button>
    </div>
  );

  if (mode === 'status') {
    return (
          <AuthShell title="Xem trạng thái hồ sơ" subtitle="Nhập mã hồ sơ và số điện thoại đã dùng khi đăng ký." footer={footer}>
        <StatusLookup initialId={result?.applicationId} initialPhone={result ? form.contactPhone : ''} />
      </AuthShell>
    );
  }

  if (result) {
    return (
          <AuthShell title="Đã gửi hồ sơ" subtitle="Cảm ơn bạn đã đăng ký trở thành đối tác." footer={footer}>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary-50 p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-accent-600" />
          <p className="font-semibold text-ink-deep">Đã tiếp nhận hồ sơ đăng ký Nhà cung cấp</p>
          <p className="rounded-md border border-sun/40 bg-sun-light px-3 py-1 text-sm font-bold text-ink-deep">Mã hồ sơ: #{result.applicationId} · Hồ sơ đang chờ xét duyệt</p>
          <p className="text-sm text-ink">{result.message}</p>
          <p className="text-xs text-muted">Hãy lưu lại mã hồ sơ để tra cứu trạng thái. Tài khoản chưa có quyền quản lý Homestay và xử lý Booking cho tới khi được duyệt.</p>
          <button type="button" onClick={() => setMode('status')} className="h-10 rounded-md border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary-50">Xem trạng thái</button>
        </div>
      </AuthShell>
    );
  }

  if (reviewing) {
    const rows: [string, string][] = [
      ['Họ tên người đại diện', form.contactName], ['Số điện thoại', form.contactPhone], ['Email', form.contactEmail || '—'],
      ['Tên cơ sở', form.businessName], ['Địa chỉ cơ sở', form.address], ['Số giấy phép', form.businessLicenseNo || '—'], ['Giới thiệu', form.description || '—'],
    ];
    return (
          <AuthShell title="Xem lại hồ sơ" subtitle="Kiểm tra thông tin trước khi gửi cho quản trị viên thẩm định." footer={footer}>
        <div className="flex flex-col gap-4">
          <dl className="flex flex-col divide-y divide-border rounded-lg border border-border bg-white text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-2.5"><dt className="font-semibold text-ink-deep">{k}</dt><dd className="whitespace-pre-wrap break-words text-ink">{v}</dd></div>
            ))}
          </dl>
          {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={busy} onClick={() => setReviewing(false)} className="h-11 rounded-md border border-border text-sm font-semibold text-ink hover:bg-canvas">Quay lại sửa</button>
            <button type="button" disabled={busy} onClick={() => void submit()} className="h-11 rounded-md bg-coral text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all duration-200 hover:bg-coral-hover disabled:opacity-50">
              {busy ? 'Đang gửi...' : 'Gửi đăng ký'}
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Đăng ký đối tác" subtitle="Dành cho chủ Homestay, hợp tác xã và cơ sở lưu trú muốn đón khách qua nền tảng." footer={footer}>
      <form onSubmit={(e) => { e.preventDefault(); review(); }}
        onInvalidCapture={() => setError('Vui lòng hoàn thiện các trường được đánh dấu')} className="flex flex-col gap-4">
        <fieldset disabled={busy} className="flex flex-col gap-4">
          <Field label="Họ tên người đại diện" required>
            <input className={input} required maxLength={255} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Số điện thoại (dùng để đăng nhập)" required error={duplicateError('contactPhone')}>
              <input className={`${input} ${duplicateError('contactPhone') ? inputInvalid : ''}`} aria-invalid={Boolean(duplicateError('contactPhone'))} required type="tel" maxLength={20} pattern="[+0-9() .\-]{8,20}" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
            </Field>
            <Field label="Email" error={duplicateError('contactEmail')}>
              <input className={`${input} ${duplicateError('contactEmail') ? inputInvalid : ''}`} aria-invalid={Boolean(duplicateError('contactEmail'))} type="email" maxLength={255} value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mật khẩu (tối thiểu 8 ký tự)" required>
              <input className={input} required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
            </Field>
            <Field label="Nhập lại mật khẩu" required>
              <input className={input} required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
          </div>
          <Field label="Tên cơ sở kinh doanh / hợp tác xã" required>
            <input className={input} required maxLength={255} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
          </Field>
          <Field label="Địa chỉ cơ sở" required>
            <input className={input} required maxLength={500} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Số giấy phép / đăng ký kinh doanh" required error={duplicateError('businessLicenseNo')}>
            <input className={`${input} ${duplicateError('businessLicenseNo') ? inputInvalid : ''}`} aria-invalid={Boolean(duplicateError('businessLicenseNo'))} required maxLength={64} value={form.businessLicenseNo} onChange={(e) => set('businessLicenseNo', e.target.value)} />
          </Field>
          <Field label="Giới thiệu cơ sở (số phòng, loại hình, kinh nghiệm đón khách...)">
            <textarea className={`${input} h-auto py-2`} rows={3} maxLength={5000} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
          <p className="text-xs text-muted">Quản trị viên sẽ thẩm định hồ sơ. Bạn đăng nhập được bằng số điện thoại/email và mật khẩu trên sau khi hồ sơ được duyệt.</p>
          <button className="h-11 rounded-md bg-coral text-sm font-bold text-white shadow-[var(--shadow-coral)] transition-all duration-200 hover:bg-coral-hover disabled:opacity-50">
            Xem lại thông tin
          </button>
        </fieldset>
      </form>
    </AuthShell>
  );
}

/** UC-NCC-01 "Xem trạng thái": chỉ người biết mã hồ sơ + số điện thoại đăng ký mới xem được. */
function StatusLookup({ initialId, initialPhone }: { initialId?: number; initialPhone: string }) {
  const [applicationId, setApplicationId] = useState(initialId ? String(initialId) : '');
  const [phone, setPhone] = useState(initialPhone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<ProviderApplicationStatusResult | null>(null);

  async function lookup() {
    setBusy(true); setError(''); setStatus(null);
    try { setStatus(await providerApplicationService.status({ applicationId: Number(applicationId), contactPhone: phone.trim() })); }
    catch (e: unknown) { setError(homestayError(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e) => { e.preventDefault(); void lookup(); }} className="flex flex-col gap-4">
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          <Field label="Mã hồ sơ" required><input className={input} required inputMode="numeric" pattern="[0-9]+" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} placeholder="VD: 12" /></Field>
          <Field label="Số điện thoại đăng ký" required><input className={input} required type="tel" pattern="[+0-9() .\-]{8,20}" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        </fieldset>
        <button disabled={busy} className="flex h-11 items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-white shadow-[var(--shadow-teal)] transition-all duration-200 hover:bg-primary-600 disabled:opacity-50">
          <Search className="h-4 w-4" />{busy ? 'Đang tra cứu...' : 'Xem trạng thái'}
        </button>
      </form>
      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
      {status && (
        <div className={`flex flex-col gap-2 rounded-lg border p-4 text-sm ${STATUS_TONE[status.status]}`}>
          <p className="font-bold">{status.statusLabel}</p>
          <p>Hồ sơ #{status.applicationId} · {status.businessName}</p>
          <p className="text-xs">Gửi lúc {new Date(status.createdAt).toLocaleString('vi-VN')}{status.reviewedAt ? ` · xử lý lúc ${new Date(status.reviewedAt).toLocaleString('vi-VN')}` : ''}</p>
          {status.reviewNote && <p className="whitespace-pre-wrap rounded-md bg-white/70 p-2.5 text-ink">Nội dung cần xử lý: {status.reviewNote}</p>}
          {status.status === 'APPROVED' && <Link to="/portal/login" className="font-bold underline">Đăng nhập cổng đối tác</Link>}
          {status.status === 'REJECTED' && <p className="text-xs text-ink">Bạn có thể bổ sung theo nội dung trên rồi gửi hồ sơ đăng ký mới.</p>}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-deep">
      <span>{label}{required && <span className="text-danger"> *</span>}</span>
      {children}
      {error && (
        <span role="alert" className="flex items-center gap-1 text-xs font-normal text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </span>
      )}
    </label>
  );
}
