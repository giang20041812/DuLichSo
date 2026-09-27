import axios from 'axios';
import type { PartnerRoom, PartnerRoomInput, RoomPrice, RoomPriceInput, RoomInventoryInput, RoomInventoryDay, RoomQuote, HomestayBlockInput, HomestayChangeLog } from '@/types/room';
import type { HomestayOptionsDto } from '@/types/partner';
import type { SubmittedChange } from '@/types/changeRequest';
const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') ?? ''}` } });
const base = (placeId: number) => `/api/v1/partner/homestays/${placeId}/rooms`;
export const partnerRoomService = {
  async list(placeId: number) { return (await axios.get<PartnerRoom[]>(base(placeId),config())).data; },
  async options(placeId: number) { return (await axios.get<HomestayOptionsDto['amenities']>(`${base(placeId)}/options`,config())).data; },
  async save(placeId: number, id: number | null, input: PartnerRoomInput) { return (await axios.request<PartnerRoom | SubmittedChange>({url: id == null ? base(placeId) : `${base(placeId)}/${id}`,method: id == null ? 'POST' : 'PUT',data:input,...config()})).data; },
  async prices(placeId: number,id: number) { return (await axios.get<RoomPrice[]>(`${base(placeId)}/${id}/prices`,config())).data; },
  async savePrice(placeId: number,id: number,priceId: number | null,input: RoomPriceInput) { return (await axios.request<RoomPrice | SubmittedChange>({url:`${base(placeId)}/${id}/prices${priceId == null ? '' : `/${priceId}`}`,method:priceId==null?'POST':'PUT',data:input,...config()})).data; },
  /** Trả SubmittedChange khi Homestay đang công khai (yêu cầu xóa chờ Admin duyệt); undefined khi đã xóa trực tiếp. */
  async deletePrice(placeId: number,id: number,priceId: number): Promise<SubmittedChange | undefined> { const r=await axios.delete<SubmittedChange | ''>(`${base(placeId)}/${id}/prices/${priceId}`,config()); return r.status===202 && r.data!=='' ? r.data : undefined; },
  async calendar(placeId: number,id: number,startDate: string,endDate: string) { return (await axios.get<RoomInventoryDay[]>(`${base(placeId)}/${id}/calendar`,{...config(),params:{startDate,endDate}})).data; },
  async inventory(placeId: number,id: number,input: RoomInventoryInput) { await axios.put(`${base(placeId)}/${id}/calendar`,input,config()); },
  async quote(placeId: number,id: number,startDate: string,endDate: string,roomCount: number,guestCount: number) { return (await axios.get<RoomQuote>(`${base(placeId)}/${id}/quote`,{...config(),params:{startDate,endDate,roomCount,guestCount}})).data; },
  /** Ngừng / mở phục vụ cả Homestay theo ngày; trả về số ngày-loại phòng đã có đơn (đơn cũ vẫn giữ nguyên). */
  async blockHomestay(placeId: number,input: HomestayBlockInput) { return (await axios.put<{ bookedDays: number }>(`/api/v1/partner/homestays/${placeId}/calendar-block`,input,config())).data; },
  async changeLog(placeId: number) { return (await axios.get<HomestayChangeLog[]>(`/api/v1/partner/homestays/${placeId}/change-log`,config())).data; },
};
