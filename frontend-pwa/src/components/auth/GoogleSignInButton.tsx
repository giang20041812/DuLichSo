import { useState } from 'react';
import { signInWithGooglePopup, signInWithGoogleGsi, isFirebaseConfigured } from '@/lib/firebase';
import { GoogleMark } from './GoogleMark';

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

export default GoogleSignInButton;
