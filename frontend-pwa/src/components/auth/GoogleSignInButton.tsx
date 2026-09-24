import { useState } from 'react';
import { signInWithGooglePopup, signInWithGoogleGsi, isFirebaseConfigured } from '@/lib/firebase';

interface GoogleSignInButtonProps {
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onCredential: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
}

/**
 * Nút Đăng nhập / Đăng ký Google "phát một" qua Firebase Auth Popup.
 * Tuân thủ AGENTS.md: rounded-md, thiết kế sắc nét, có trạng thái loading mượt mà.
 */
export function GoogleSignInButton({
  text = 'continue_with',
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getLabel = () => {
    switch (text) {
      case 'signin_with':
        return 'Đăng nhập bằng Google';
      case 'signup_with':
        return 'Đăng ký bằng Google';
      case 'continue_with':
      default:
        return 'Tiếp tục với Google';
    }
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    if (!isFirebaseConfigured) {
      const msg = 'Chưa cấu hình Firebase! Vui lòng cấu hình các khóa VITE_FIREBASE_* trong file .env.';
      onError?.(msg);
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await signInWithGooglePopup();
      await onCredential(idToken);
    } catch (err: unknown) {
      // Người dùng tắt popup trước khi đăng nhập
      if (
        err &&
        typeof err === 'object' &&
        'code' in err
      ) {
        const code = (err as { code: string }).code;
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          setIsLoading(false);
          return;
        }

        if (code === 'auth/network-request-failed') {
          console.warn('Firebase popup bị chặn (auth/network-request-failed). Đang tự động chuyển sang Google Identity trực tiếp...');
          try {
            const gsiToken = await signInWithGoogleGsi();
            await onCredential(gsiToken);
            return;
          } catch (gsiErr: unknown) {
            console.error('Google GSI Fallback error:', gsiErr);
            onError?.(
              'Không thể kết nối Google: Vui lòng kiểm tra tiện ích chặn quảng cáo (AdBlock/uBlock) hoặc mở trên Tab ẩn danh.'
            );
            setIsLoading(false);
            return;
          }
        }

        if (code === 'auth/operation-not-allowed') {
          onError?.(
            'Google Sign-In chưa được kích hoạt: Vui lòng vào Firebase Console → Authentication → Sign-in method → Bật (Enable) Google và nhấn Lưu.'
          );
          setIsLoading(false);
          return;
        }

        if (code === 'auth/unauthorized-domain') {
          onError?.(
            'Domain chưa được cấp phép: Vui lòng vào Firebase Console → Authentication → Settings → Authorized domains và thêm localhost.'
          );
          setIsLoading(false);
          return;
        }
      }

      const message = err instanceof Error ? err.message : 'Đăng nhập Google thất bại. Vui lòng thử lại.';
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      title={isFirebaseConfigured ? getLabel() : 'Cần cấu hình Firebase trong .env'}
      className="group relative flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-ink-deep shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-sm active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <GoogleMark />
      )}
      <span>{isLoading ? 'Đang kết nối Google...' : getLabel()}</span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
export default GoogleSignInButton;
