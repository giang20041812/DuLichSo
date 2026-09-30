import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Khung dùng chung cho các biểu mẫu xác thực, căn giữa trên mọi kích thước màn hình. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8 font-body text-ink sm:px-8">
      <div className="w-full max-w-[420px]">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted transition-colors duration-200 hover:bg-hover hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Về trang chủ
        </Link>

        <div className="w-full rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h1 className="font-display text-2xl font-extrabold text-ink-deep">{title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <div className="mt-4 text-center text-sm text-muted">{footer}</div>
      </div>
    </main>
  );
}

/** Đường kẻ "hoặc" giữa nút Google và biểu mẫu email. */
export function AuthDivider({ label = 'hoặc dùng email' }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export const authInputClass =
  'h-11 w-full rounded-md border border-border bg-white pl-10 pr-3 text-sm text-ink placeholder:text-muted/70 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
