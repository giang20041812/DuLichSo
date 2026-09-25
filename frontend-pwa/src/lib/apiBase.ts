import axios from 'axios';

/**
 * Origin của backend khi frontend và backend ở KHÁC domain (vd https://api.example.com).
 * Để trống nếu dùng reverse proxy cùng domain (nginx chuyển /api → backend) hoặc dev với proxy của Vite.
 */
export const API_ORIGIN: string = (
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.VITE_API_ORIGIN as string | undefined) ??
  ''
).replace(/\/+$/, '').replace(/\/api$/, '');

/** Origin dùng để dựng URL tuyệt đối tới API. */
export const apiOrigin = (): string => API_ORIGIN || window.location.origin;

/**
 * Cài đặt một lần ở main.tsx: mọi request axios/fetch có đường dẫn bắt đầu bằng /api
 * sẽ được gửi tới API_ORIGIN. Không có API_ORIGIN thì không đổi gì.
 */
export const installApiBase = () => {
  axios.defaults.headers.common['ngrok-skip-browser-warning'] = '69420';

  if (API_ORIGIN) {
    axios.defaults.baseURL = API_ORIGIN;
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (!headers.has('ngrok-skip-browser-warning')) {
      headers.set('ngrok-skip-browser-warning', '69420');
    }
    const newInit: RequestInit = { ...init, headers };
    if (API_ORIGIN && typeof input === 'string' && input.startsWith('/api/')) {
      return nativeFetch(`${API_ORIGIN}${input}`, newInit);
    }
    return nativeFetch(input, newInit);
  };
};
