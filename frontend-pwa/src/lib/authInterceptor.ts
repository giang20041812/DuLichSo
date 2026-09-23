import axios from 'axios';

export const PORTAL_SUSPENDED_PATH = '/portal/suspended';

/** Xóa phiên đăng nhập cổng NCC/Admin. */
export const clearPortalSession = () => {
  localStorage.removeItem('portal_token');
  localStorage.removeItem('portal_user');
};

/**
 * NCC đang đăng nhập mà bị đình chỉ / chấm dứt: backend trả 403 PROVIDER_SUSPENDED
 * ở mọi API → xóa phiên và chuyển sang màn hình thông báo.
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
      return Promise.reject(error);
    },
  );
};
