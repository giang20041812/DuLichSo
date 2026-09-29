import axios from 'axios';
import type { MediaDto } from '@/types/partner';

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') ?? ''}` } });

/** Chủ thể gắn ảnh: cả Homestay, hoặc một loại phòng của Homestay. */
export type MediaTarget = { placeId: number; roomId?: number };

const base = ({ placeId, roomId }: MediaTarget) =>
  roomId == null ? `/api/v1/partner/homestays/${placeId}/media` : `/api/v1/partner/homestays/${placeId}/rooms/${roomId}/media`;

interface CloudinaryUploadConfig {
  provider: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
}

/**
 * Upload ảnh qua Cloudinary
 */
async function uploadToCloudinary(file: File): Promise<{id: string, url: string}> {
  const cfg = (await axios.post<CloudinaryUploadConfig>('/api/v1/partner/media/direct-upload', null, config())).data;
  
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', cfg.apiKey);
  form.append('timestamp', cfg.timestamp.toString());
  form.append('signature', cfg.signature);
  
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: form,
  });
  
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as any;
    throw new Error(err?.error?.message || 'Lỗi khi tải ảnh lên dịch vụ lưu trữ.');
  }
  
  const result = await response.json();
  return { id: result.public_id, url: result.secure_url };
}

export const partnerMediaService = {
  async list(target: MediaTarget) {
    return (await axios.get<MediaDto[]>(base(target), config())).data;
  },
  async upload(target: MediaTarget, file: File) {
    const { id, url } = await uploadToCloudinary(file);
    return (await axios.post<MediaDto[]>(base(target), { imageId: id, url }, config())).data;
  },
  async setCover(target: MediaTarget, mediaId: number) {
    return (await axios.put<MediaDto[]>(`${base(target)}/${mediaId}/cover`, null, config())).data;
  },
  async remove(target: MediaTarget, mediaId: number) {
    return (await axios.delete<MediaDto[]>(`${base(target)}/${mediaId}`, config())).data;
  },
};
