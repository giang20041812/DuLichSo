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

export const installApiBase = () => {
  if (API_ORIGIN) {
    axios.defaults.baseURL = API_ORIGIN;
  }

  // Helper to determine if a URL targets our backend
  const isTargetingOurApi = (url?: string) => {
    if (!url) return false;
    // If it's a relative URL, it will hit our API_ORIGIN or Vite Proxy
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
      return true;
    }
    // If it's an absolute URL, check if it matches API_ORIGIN
    if (API_ORIGIN && url.startsWith(API_ORIGIN)) {
      return true;
    }
    // Or if it targets the same origin as the frontend (which might be proxied)
    if (url.startsWith(window.location.origin)) {
      return true;
    }
    return false;
  };

  // Add axios interceptor for ngrok header instead of global default
  axios.interceptors.request.use((config) => {
    if (isTargetingOurApi(config.url)) {
      config.headers['ngrok-skip-browser-warning'] = '69420';
    }
    return config;
  });

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let urlStr = '';
    if (typeof input === 'string') urlStr = input;
    else if (input instanceof URL) urlStr = input.toString();
    else if (input && typeof (input as Request).url === 'string') urlStr = (input as Request).url;

    const newInit: RequestInit = { ...init };

    if (isTargetingOurApi(urlStr)) {
      const headers = new Headers(init?.headers);
      if (!headers.has('ngrok-skip-browser-warning')) {
        headers.set('ngrok-skip-browser-warning', '69420');
      }
      newInit.headers = headers;
    }

    if (API_ORIGIN && typeof input === 'string' && input.startsWith('/api/')) {
      return nativeFetch(`${API_ORIGIN}${input}`, newInit);
    }
    return nativeFetch(input, newInit);
  };
};
