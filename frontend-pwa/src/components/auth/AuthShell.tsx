import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf, MapPin, ShieldCheck, Star } from 'lucide-react';
import { VietTrackLogo } from '@/components/ui/logo';
import type { AuthHeroImage } from '@/config/authImages';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  image: AuthHeroImage;
}

const HIGHLIGHTS = [
  { icon: MapPin, text: 'Homestay bản địa xác thực tại Tây Bắc' },
  { icon: ShieldCheck, text: 'Thanh toán an toàn, giữ chỗ minh bạch' },
  { icon: Leaf, text: 'Du lịch xanh, đồng hành cùng cộng đồng' },
];

/**
 * Khung dùng chung cho Đăng nhập / Đăng ký: nửa trái là ảnh thương hiệu (ẩn trên mobile),
 * nửa phải là biểu mẫu.
 */
export function AuthShell({ title, subtitle, children, footer, image }: AuthShellProps) {
  const [imageSrc, setImageSrc] = useState(image.src);

  return (
    <div className="min-h-screen bg-canvas text-ink font-body lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Hero */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 text-white">
        <img
          src={imageSrc}
          alt={image.alt}
          onError={() => setImageSrc(image.fallback)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/85 via-primary-800/55 to-primary-900/90" />

        <Link to="/" className="relative inline-flex w-fit rounded-md bg-white/95 px-3 py-2 shadow-md">
          <VietTrackLogo size={34} />
        </Link>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-sun px-2.5 py-1 text-xs font-bold text-ink-deep">
            <Star className="h-3.5 w-3.5" /> Mùa lúa chín Tây Bắc
          </span>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight">
            Chạm vào những bản làng chưa từng được kể.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            Lên kế hoạch, đặt homestay và khám phá văn hóa bản địa chỉ trong một ứng dụng.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-medium">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm">
                  <Icon className="h-4 w-4 text-primary-light" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">© VietTrack — Du lịch di sản Việt Nam</p>
      </aside>

      {/* Form */}
      <main className="flex min-h-screen flex-col px-4 py-6 sm:px-8 lg:min-h-0">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted transition-colors duration-200 hover:bg-hover hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Về trang chủ
          </Link>
          <Link to="/" className="lg:hidden">
            <VietTrackLogo size={34} />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[420px] rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h1 className="font-display text-2xl font-extrabold text-ink-deep">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>

        <div className="text-center text-sm text-muted">{footer}</div>
      </main>
    </div>
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
