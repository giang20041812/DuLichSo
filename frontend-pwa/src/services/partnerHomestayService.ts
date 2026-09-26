import axios from 'axios';
import type { GeocodeResult, HomestayOptionsDto, PartnerHomestayPageResponse, PartnerHomestaySummaryDto, PartnerHomestayDetailDto, UpdateStatusRequest } from '@/types/partner';

const API = '/api/v1/partner/homestays';
const config = () => {
  const token = localStorage.getItem('portal_token');
  return { headers: token ? { Authorization: `Bearer ${token}` } : {}, timeout: 15000 };
};

export async function fetchPartnerHomestays(keyword?: string, visibility?: string, operationStatus?: string): Promise<PartnerHomestayPageResponse> {
  return (await axios.get<PartnerHomestayPageResponse>(API, { ...config(), params: { keyword, visibility, operationStatus } })).data;
}
export async function fetchPartnerHomestayDetail(id: number): Promise<PartnerHomestayDetailDto> {
  return (await axios.get<PartnerHomestayDetailDto>(`${API}/${id}`, config())).data;
}
export async function fetchHomestayOptions(): Promise<HomestayOptionsDto> {
  return (await axios.get<HomestayOptionsDto>(`${API}/options`, config())).data;
}
export async function createPartnerHomestay(detail: PartnerHomestayDetailDto): Promise<PartnerHomestayDetailDto> {
  return (await axios.post<PartnerHomestayDetailDto>(API, detail, config())).data;
}
export async function savePartnerHomestayDetail(id: number, detail: PartnerHomestayDetailDto): Promise<PartnerHomestayDetailDto> {
  return (await axios.put<PartnerHomestayDetailDto>(`${API}/${id}`, detail, config())).data;
}
export async function updateHomestayStatus(id: number, request: UpdateStatusRequest): Promise<PartnerHomestaySummaryDto> {
  return (await axios.patch<PartnerHomestaySummaryDto>(`${API}/${id}/status`, request, config())).data;
}
/** Gợi ý tọa độ từ địa chỉ (backend gọi OpenStreetMap Nominatim). */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  return (await axios.get<GeocodeResult>('/api/v1/partner/geocode', { ...config(), params: { address } })).data;
}
export function homestayError(error: unknown): string {
  if (axios.isAxiosError<unknown>(error)) {
    const body = error.response?.data;
    if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') return body.message;
    if (error.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (error.response?.status === 404) return 'Không tìm thấy Homestay của bạn.';
  }
  return 'Không thể kết nối hoặc lưu dữ liệu. Vui lòng thử lại.';
}
