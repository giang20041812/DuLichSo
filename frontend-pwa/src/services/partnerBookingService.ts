import axios from 'axios';
import type { AdminBookingDto, BookingSearchParams, BookingStatusSummary, PageResponse } from '../types/admin';
import type { BookingResponseDto } from '../types/booking';
import type { AcceptBookingInput, BookingChangeRequestDto, BookingEvaluationInput, BookingStatus, InfoRequestInput, PartnerBookingDetailDto, PartnerBookingRowDto, RejectBookingInput, StayActionInput } from '../types/booking';

const API_BASE = '/api/v1/partner/bookings';

const authHeaders = () => {
  const token = localStorage.getItem('portal_token');
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

/** Đơn đặt phòng của chính nhà cung cấp đang đăng nhập (backend tự lọc theo tài khoản). */
export const partnerBookingService = {
  async getBookings(params?: Omit<BookingSearchParams, 'providerId'>): Promise<PageResponse<PartnerBookingRowDto>> {
    const res = await axios.get<PageResponse<PartnerBookingRowDto>>(API_BASE, { ...authHeaders(), params });
    return res.data;
  },

  async getSummary(): Promise<BookingStatusSummary> {
    const res = await axios.get<BookingStatusSummary>(`${API_BASE}/summary`, authHeaders());
    return res.data;
  },

  async updateStatus(id: number, status: BookingStatus, reason?: string): Promise<AdminBookingDto> {
    const res = await axios.put<AdminBookingDto>(`${API_BASE}/${id}/status`, { status, reason }, authHeaders());
    return res.data;
  },

  async getDetail(id: number): Promise<PartnerBookingDetailDto> {
    const res = await axios.get<PartnerBookingDetailDto>(`${API_BASE}/${id}`, authHeaders());
    return res.data;
  },

  /** UC-NCC-07: lưu kết quả đánh giá khả năng đáp ứng (chưa xác nhận Booking). */
  async evaluate(id: number, input: BookingEvaluationInput): Promise<PartnerBookingDetailDto> {
    const res = await axios.post<PartnerBookingDetailDto>(`${API_BASE}/${id}/evaluation`, input, authHeaders());
    return res.data;
  },

  async accept(id: number, input: AcceptBookingInput): Promise<PartnerBookingDetailDto> {
    const res = await axios.post<PartnerBookingDetailDto>(`${API_BASE}/${id}/accept`, input, authHeaders());
    return res.data;
  },

  async requestInfo(id: number, input: InfoRequestInput): Promise<PartnerBookingDetailDto> {
    const res = await axios.post<PartnerBookingDetailDto>(`${API_BASE}/${id}/info-requests`, input, authHeaders());
    return res.data;
  },

  /** Nhận phòng / trả phòng / hoàn thành / khách không đến. */
  async stayAction(id: number, input: StayActionInput): Promise<PartnerBookingDetailDto> {
    const res = await axios.post<PartnerBookingDetailDto>(`${API_BASE}/${id}/stay`, input, authHeaders());
    return res.data;
  },

  async reject(id: number, input: RejectBookingInput): Promise<PartnerBookingDetailDto> {
    const res = await axios.post<PartnerBookingDetailDto>(`${API_BASE}/${id}/reject`, input, authHeaders());
    return res.data;
  },

  async getBookingChangeRequests(): Promise<BookingChangeRequestDto[]> {
    const res = await axios.get<BookingChangeRequestDto[]>(`${API_BASE}/change-requests`, authHeaders());
    return res.data;
  },

  async reviewBookingChangeRequest(
    id: number,
    approved: boolean,
    rejectionReason?: string
  ): Promise<BookingResponseDto> {
    const res = await axios.post<BookingResponseDto>(
      `${API_BASE}/change-requests/${id}/review`,
      { approved, rejectionReason },
      authHeaders()
    );
    return res.data;
  },
};
