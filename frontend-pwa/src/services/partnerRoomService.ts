import axios from 'axios';
import type { PartnerRoom, PartnerRoomInput, RoomPrice, RoomPriceInput, RoomInventoryInput, RoomInventoryDay, RoomQuote } from '@/types/room';
import type { HomestayOptionsDto } from '@/types/partner';
const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') ?? ''}` } });
const base = (placeId: number) => `/api/v1/partner/homestays/${placeId}/rooms`;
export const partnerRoomService = {
  async list(placeId: number) { return (await axios.get<PartnerRoom[]>(base(placeId),config())).data; },
  async options(placeId: number) { return (await axios.get<HomestayOptionsDto['amenities']>(`${base(placeId)}/options`,config())).data; },
  async save(placeId: number, id: number | null, input: PartnerRoomInput) { return (await axios.request<PartnerRoom>({url: id == null ? base(placeId) : `${base(placeId)}/${id}`,method: id == null ? 'POST' : 'PUT',data:input,...config()})).data; },
  async prices(placeId: number,id: number) { return (await axios.get<RoomPrice[]>(`${base(placeId)}/${id}/prices`,config())).data; },
  async savePrice(placeId: number,id: number,priceId: number | null,input: RoomPriceInput) { return (await axios.request<RoomPrice>({url:`${base(placeId)}/${id}/prices${priceId == null ? '' : `/${priceId}`}`,method:priceId==null?'POST':'PUT',data:input,...config()})).data; },
  async deletePrice(placeId: number,id: number,priceId: number) { await axios.delete(`${base(placeId)}/${id}/prices/${priceId}`,config()); },
  async calendar(placeId: number,id: number,startDate: string,endDate: string) { return (await axios.get<RoomInventoryDay[]>(`${base(placeId)}/${id}/calendar`,{...config(),params:{startDate,endDate}})).data; },
  async inventory(placeId: number,id: number,input: RoomInventoryInput) { await axios.put(`${base(placeId)}/${id}/calendar`,input,config()); },
  async quote(placeId: number,id: number,startDate: string,endDate: string,roomCount: number,guestCount: number) { return (await axios.get<RoomQuote>(`${base(placeId)}/${id}/quote`,{...config(),params:{startDate,endDate,roomCount,guestCount}})).data; },
};
