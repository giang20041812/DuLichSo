import { useEffect, useRef, useState } from 'react';
import type { GoogleCredentialResponse } from '@/types/integrations/google-identity';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;

let gsiLoader: Promise<void> | null = null;

const loadGsi = (): Promise<void> => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiLoader) {
    gsiLoader = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiLoader = null;
        reject(new Error('Không tải được Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  }
  return gsiLoader;
};

interface GoogleSignInButtonProps {
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
}

/**
 * Nút "Tiếp tục với Google" chính thức của Google Identity Services.
 * Chỉ dùng client ID công khai (VITE_GOOGLE_OAUTH_CLIENT_ID); ID token được backend xác minh.
 */
export function GoogleSignInButton({ text = 'continue_with', onCredential, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>(CLIENT_ID ? 'loading' : 'unavailable');
  const callbacks = useRef({ onCredential, onError });

  useEffect(() => {
    callbacks.current = { onCredential, onError };
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGsi()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (res: GoogleCredentialResponse) => callbacks.current.onCredential(res.credential),
        });
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          logo_alignment: 'center',
          width: Math.min(container.offsetWidth || 360, 400),
          locale: 'vi',
        });
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('unavailable');
        callbacks.current.onError?.(err instanceof Error ? err.message : 'Không thể tải đăng nhập Google.');
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (status === 'unavailable') {
    return (
      <button
        type="button"
        disabled
        title={CLIENT_ID ? 'Không tải được Google' : 'Chưa cấu hình VITE_GOOGLE_OAUTH_CLIENT_ID'}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-text-light)] opacity-60 cursor-not-allowed"
      >
        <GoogleMark />
        <span>Google chưa khả dụng</span>
      </button>
    );
  }

  return (
    <div className="relative w-full min-h-11 flex justify-center">
      <div ref={containerRef} className="w-full flex justify-center" />
      {status === 'loading' && <div className="absolute inset-x-0 top-0 mx-auto h-11 w-full max-w-[400px] pointer-events-none rounded-md bg-slate-100 animate-pulse" />}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
