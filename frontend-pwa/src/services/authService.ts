import axios, { AxiosError } from 'axios';
import { PortalLoginRequest, PortalLoginResponse, AuthErrorResponse } from '../types/user';
import type { GoogleLoginResponse } from '../types/integrations/google-identity';

const API_BASE_URL = '/api/v1/auth';

/** Chuẩn hóa mọi lỗi từ server (JSON không có message, HTML, rỗng...) thành AuthErrorResponse có message. */
const toAuthError = (err: unknown): AuthErrorResponse => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const data: unknown = err.response?.data;
    if (data && typeof data === 'object' && typeof (data as { message?: unknown }).message === 'string' && (data as { message: string }).message) {
      const d = data as Partial<AuthErrorResponse> & { message: string };
      return { status: d.status ?? status, errorCode: d.errorCode ?? 'ERROR', message: d.message };
    }
    if (!err.response) {
      return { status: 0, errorCode: 'NETWORK_ERROR', message: 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.' };
    }
    return {
      status,
      errorCode: 'SERVER_ERROR',
      message: `Máy chủ trả về lỗi ${status}. Vui lòng thử lại sau hoặc liên hệ quản trị viên.`,
    };
  }
  return { status: 500, errorCode: 'UNKNOWN_ERROR', message: 'Đã xảy ra lỗi không xác định trong quá trình xác thực.' };
};

/**
 * Service xác thực đăng nhập Cổng Quản Trị (UC-08)
 */
export const portalLogin = async (request: PortalLoginRequest): Promise<PortalLoginResponse> => {
  try {
    const response = await axios.post<PortalLoginResponse>(`${API_BASE_URL}/portal/login`, request, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<AuthErrorResponse>;
      if (import.meta.env.DEV && (axiosError.response?.status === 404 || axiosError.code === 'ECONNABORTED' || !axiosError.response)) {
        // Chỉ khi chạy dev: giả lập đăng nhập nếu backend chưa bật. Bản build production không bao giờ giả lập.
        return simulateFallbackLogin(request);
      }
    }
    throw toAuthError(err);
  }
};

const postTravelerAuth = async (path: string, body: unknown): Promise<GoogleLoginResponse> => {
  try {
    const response = await axios.post<GoogleLoginResponse>(`${API_BASE_URL}${path}`, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return response.data;
  } catch (err: unknown) {
    throw toAuthError(err);
  }
};

/** Đăng nhập khách du lịch bằng Google: backend xác minh ID token rồi cấp JWT hệ thống. */
export const googleLogin = (idToken: string) => postTravelerAuth('/google/login', { idToken });

export const travelerLogin = (identifier: string, password: string) =>
  postTravelerAuth('/traveler/login', { identifier, password });

export interface TravelerRegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export const travelerRegister = (request: TravelerRegisterRequest) => postTravelerAuth('/traveler/register', request);

/** Lưu phiên khách du lịch (Sidebar đọc traveler_user để hiển thị). */
export const saveTravelerSession = (res: GoogleLoginResponse) => {
  localStorage.setItem('traveler_token', res.token);
  localStorage.setItem(
    'traveler_user',
    JSON.stringify({ email: res.email, fullName: res.fullName, picture: res.picture ?? null }),
  );
};

/**
 * Fallback logic mô phỏng chuẩn xác 7 kịch bản UC-08 khi backend offline
 */
const simulateFallbackLogin = (request: PortalLoginRequest): PortalLoginResponse => {
  const identifier = request.identifier.trim();
  const password = request.password.trim();

  // Kịch bản 7: Lỗi 500
  if (request.simulateError500 || identifier.toLowerCase().includes('sim_500')) {
    throw {
      status: 500,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi máy chủ nội bộ (500) phục vụ kiểm thử QA Simulator.',
    } as AuthErrorResponse;
  }

  // Kịch bản 5: OK - Admin
  if (
    (identifier.toLowerCase() === 'admin@taybactrails.vn' || identifier === '0988888888') &&
    password === 'Admin@123456'
  ) {
    return {
      token: 'mock_jwt_token_admin_uc08',
      tokenType: 'Bearer',
      accountId: 1001,
      email: 'admin@taybactrails.vn',
      phone: '0988888888',
      fullName: 'Nguyễn Quản Trị Viên',
      role: 'ADMIN',
      status: 'ACTIVE',
      redirectUrl: '/admin',
      message: 'Đăng nhập thành công! Đang điều hướng đến Cổng Quản Trị Hệ Thống.',
    };
  }

  // Kịch bản 6: OK - NCC
  if (
    (identifier.toLowerCase() === 'ncc@taybactrails.vn' || identifier === '0912345678') &&
    password === 'Ncc@123456'
  ) {
    return {
      token: 'mock_jwt_token_ncc_uc08',
      tokenType: 'Bearer',
      accountId: 1002,
      email: 'ncc@taybactrails.vn',
      phone: '0912345678',
      fullName: 'Giàng A Páo',
      role: 'PROVIDER',
      status: 'ACTIVE',
      provider: {
        id: 2001,
        name: 'Bản Lìm Mông Eco Lodge',
        status: 'ACTIVE',
        contactName: 'Giàng A Páo',
        contactPhone: '0912345678',
        contactEmail: 'ncc@taybactrails.vn',
        address: 'Bản Lìm Mông, Xã Cao Phạ, Mù Cang Chải, Yên Bái',
      },
      redirectUrl: '/partner',
      message: 'Đăng nhập thành công! Đang điều hướng đến Cổng Nhà Cung Cấp Đối Tác.',
    };
  }

  // Kịch bản 3: TK Vô hiệu hoá
  if (
    (identifier.toLowerCase() === 'inactive_user@taybactrails.vn' || identifier === '0900000001') &&
    password === 'Pass@123456'
  ) {
    throw {
      status: 403,
      errorCode: 'ACCOUNT_INACTIVE',
      message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị hệ thống.',
    } as AuthErrorResponse;
  }

  // Kịch bản 4: NCC Đình chỉ
  if (
    (identifier.toLowerCase() === 'ncc_suspended@taybactrails.vn' || identifier === '0900000002') &&
    password === 'Pass@123456'
  ) {
    throw {
      status: 403,
      errorCode: 'PROVIDER_SUSPENDED',
      message: 'Nhà cung cấp đã bị đình chỉ hoạt động hoặc không khả dụng. Vui lòng liên hệ kênh hỗ trợ đối tác.',
    } as AuthErrorResponse;
  }

  // Kịch bản 2 / Mặc định sai mật khẩu: BV-08 / UC-08
  throw {
    status: 401,
    errorCode: 'AUTH_INVALID_CREDENTIALS',
    message: 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại Email/Số điện thoại hoặc Mật khẩu.',
  } as AuthErrorResponse;
};
