import axios from 'axios';
import type { DirectUploadDto, MediaDto } from '@/types/partner';

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') ?? ''}` } });

/** Chủ thể gắn ảnh: cả Homestay, hoặc một loại phòng của Homestay. */
export type MediaTarget = { placeId: number; roomId?: number };

const base = ({ placeId, roomId }: MediaTarget) =>
  roomId == null ? `/api/v1/partner/homestays/${placeId}/media` : `/api/v1/partner/homestays/${placeId}/rooms/${roomId}/media`;

/**
 * Cloudflare Images Direct Creator Upload: backend cấp uploadURL dùng một lần, file đi thẳng từ trình duyệt lên Cloudflare
 * (không qua backend, không lộ API token), sau đó backend kiểm tra ảnh rồi mới gắn vào Homestay/phòng.
 */
async function uploadToCloudflare(file: File): Promise<string> {
  const ticket = (await axios.post<DirectUploadDto>('/api/v1/partner/media/direct-upload', null, config())).data;
  if (!ticket.allowedTypes.includes(file.type)) throw new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.');
  if (file.size > ticket.maxFileBytes) throw new Error(`Ảnh vượt quá ${Math.round(ticket.maxFileBytes / 1024 / 1024)}MB.`);
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(ticket.uploadUrl, { method: 'POST', body: form });
  if (!response.ok) throw new Error('Upload ảnh lên dịch vụ lưu trữ thất bại. Vui lòng thử lại.');
  return ticket.imageId;
}

export const partnerMediaService = {
  async list(target: MediaTarget) {
    return (await axios.get<MediaDto[]>(base(target), config())).data;
  },
  async upload(target: MediaTarget, file: File) {
    const imageId = await uploadToCloudflare(file);
    return (await axios.post<MediaDto[]>(base(target), { imageId }, config())).data;
  },
  async setCover(target: MediaTarget, mediaId: number) {
    return (await axios.put<MediaDto[]>(`${base(target)}/${mediaId}/cover`, null, config())).data;
  },
  async remove(target: MediaTarget, mediaId: number) {
    return (await axios.delete<MediaDto[]>(`${base(target)}/${mediaId}`, config())).data;
  },
};
