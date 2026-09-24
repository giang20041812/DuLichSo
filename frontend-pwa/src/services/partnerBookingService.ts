import axios from 'axios';
import type { AdminBookingDto, BookingSearchParams, BookingStatusSummary, PageResponse } from '../types/admin';

const API_BASE = '/api/v1/partner/bookings';

const authHeaders = () => {
  const token = localStorage.getItem('portal_token');
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

/** Đơn đặt phòng của chính nhà cung cấp đang đăng nhập (backend tự lọc theo tài khoản). */
export const partnerBookingService = {
  async getBookings(params?: Omit<BookingSearchParams, 'providerId'>): Promise<PageResponse<AdminBookingDto>> {
    const res = await axios.get<PageResponse<AdminBookingDto>>(API_BASE, { ...authHeaders(), params });
    return res.data;
  },

  async getSummary(): Promise<BookingStatusSummary> {
    const res = await axios.get<BookingStatusSummary>(`${API_BASE}/summary`, authHeaders());
    return res.data;
  },
};
