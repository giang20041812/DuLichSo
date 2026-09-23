import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, Phone, ShieldAlert } from 'lucide-react';
import { SUPPORT_CONTACT } from '@/config/support';
import { clearPortalSession } from '@/lib/authInterceptor';

/**
 * Màn hình toàn trang cho NCC bị đình chỉ hoặc chấm dứt: chỉ có thông báo và cách liên hệ,
 * không có điều hướng nào khác ngoài đăng xuất.
 */
export default function ProviderSuspendedPage() {
  const navigate = useNavigate();

  useEffect(() => {
    clearPortalSession();
  }, []);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10 font-body">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-coral-light text-coral">
          <ShieldAlert className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-ink-deep">Tài khoản đang bị đình chỉ</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Tài khoản của bạn đang bị đình chỉ nên hiện không thể sử dụng. Vui lòng liên hệ với chúng tôi để được mở lại.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 text-left">
          <a
            href={SUPPORT_CONTACT.hotlineHref}
            className="flex items-center gap-3 rounded-md border border-border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-hover"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-50 text-primary">
              <Phone className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs text-muted">Hotline hỗ trợ đối tác</span>
              <span className="text-sm font-bold text-ink-deep">{SUPPORT_CONTACT.hotline}</span>
            </span>
          </a>
          <a
            href={`mailto:${SUPPORT_CONTACT.email}`}
            className="flex items-center gap-3 rounded-md border border-border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-hover"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary-50 text-secondary-700">
              <Mail className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs text-muted">Email hỗ trợ</span>
              <span className="text-sm font-bold text-ink-deep">{SUPPORT_CONTACT.email}</span>
            </span>
          </a>
        </div>

        <button
          type="button"
          onClick={() => navigate('/portal/login', { replace: true })}
          className="mt-6 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-hover hover:text-primary"
        >
          <LogOut className="h-4 w-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
