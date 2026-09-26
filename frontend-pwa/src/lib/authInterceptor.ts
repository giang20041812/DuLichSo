import axios from 'axios';

export const PORTAL_SUSPENDED_PATH = '/portal/suspended';
export const PORTAL_LOGIN_PATH = '/portal/login';

/**
 * Báo backend thu hồi phiên (NFR-SEC-03). Dùng fetch thay vì axios để không đi qua interceptor
 * bên dưới; lỗi mạng bị bỏ qua vì phiên phía client vẫn được xóa.
 */
export const revokePortalToken = () => {
  const token = localStorage.getItem('portal_token');
  if (!token) return;
  void fetch('/api/v1/auth/portal/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    keepalive: true,
  }).catch(() => undefined);
};

/**
 * Xóa phiên đăng nhập cổng NCC/Admin. Mặc định thu hồi phiên trên backend;
 * truyền revoke=false khi backend đã tự từ chối phiên (hết hạn/đã bị thu hồi).
 */
export const clearPortalSession = ({ revoke = true }: { revoke?: boolean } = {}) => {
  if (revoke) revokePortalToken();
  localStorage.removeItem('portal_token');
  localStorage.removeItem('portal_user');
};

/**
 * NCC đang đăng nhập mà bị đình chỉ / chấm dứt: backend trả 403 PROVIDER_SUSPENDED
 * ở mọi API → xóa phiên và chuyển sang màn hình thông báo.
 * Phiên hết hạn do không hoạt động hoặc bị thu hồi (đổi quyền, khóa, đặt lại mật khẩu):
 * backend trả 401 SESSION_EXPIRED / SESSION_REVOKED → xóa phiên và chuyển về trang đăng nhập.
 */
export const installAuthInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        const data = error.response.data as { errorCode?: string } | undefined;
        if (data?.errorCode === 'PROVIDER_SUSPENDED' && window.location.pathname !== PORTAL_SUSPENDED_PATH) {
          clearPortalSession();
          window.location.assign(PORTAL_SUSPENDED_PATH);
        }
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const data = error.response.data as { errorCode?: string } | undefined;
        const sessionEnded = data?.errorCode === 'SESSION_EXPIRED' || data?.errorCode === 'SESSION_REVOKED';
        if (sessionEnded && window.location.pathname !== PORTAL_LOGIN_PATH) {
          clearPortalSession({ revoke: false });
          window.location.assign(PORTAL_LOGIN_PATH);
        }
      }
      return Promise.reject(error);
    },
  );
};
