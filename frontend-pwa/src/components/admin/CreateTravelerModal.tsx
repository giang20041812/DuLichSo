import { useState } from 'react';
import { X } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { getApiErrorMessage } from '@/lib/apiError';
import OverlayPortal from './OverlayPortal';

interface CreateTravelerModalProps {
  onClose: () => void;
  onCreated: (email: string) => void;
}

const inputClass =
  'h-9 w-full rounded-md border border-border bg-white px-3 text-xs text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

/** Admin tạo tài khoản khách (email + mật khẩu) cho người chưa có tài khoản. */
export default function CreateTravelerModal({ onClose, onCreated }: CreateTravelerModalProps) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Vui lòng nhập họ tên, email và mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adminService.createTraveler({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      onCreated(form.email.trim());
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Không tạo được tài khoản khách.'));
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder?: string) => (
    <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted">
      {label}
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={inputClass}
      />
    </label>
  );

  return (
    <OverlayPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/60 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-border bg-white p-5 shadow-xl"
        aria-label="Tạo tài khoản khách"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-ink-deep">Tạo tài khoản khách</h3>
            <p className="text-xs text-muted">Dành cho người chưa có tài khoản. Khách đăng nhập bằng email và mật khẩu này.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-md p-1.5 text-muted hover:bg-hover">
            <X className="h-4 w-4" />
          </button>
        </div>
        {field('Họ tên *', 'fullName')}
        {field('Email *', 'email', 'email')}
        {field('Số điện thoại', 'phone', 'tel')}
        {field('Mật khẩu * (tối thiểu 6 ký tự)', 'password', 'password')}
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-xs font-medium text-muted hover:bg-hover">
            Hủy
          </button>
          <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-60">
            {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </div>
    </OverlayPortal>
  );
}
