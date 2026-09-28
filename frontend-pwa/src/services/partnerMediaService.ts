import axios from 'axios';
import type { MediaDto } from '@/types/partner';

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') ?? ''}` } });

/** Chủ thể gắn ảnh: cả Homestay, hoặc một loại phòng của Homestay. */
export type MediaTarget = { placeId: number; roomId?: number };

const base = ({ placeId, roomId }: MediaTarget) =>
  roomId == null ? `/api/v1/partner/homestays/${placeId}/media` : `/api/v1/partner/homestays/${placeId}/rooms/${roomId}/media`;

interface CloudflareUploadConfig {
  provider: string;
  uploadUrl: string;
  id: string;
}

/**
 * Upload ảnh qua Cloudflare Images Direct Creator Upload
 */
async function uploadToCloudflare(file: File): Promise<string> {
  const cfg = (await axios.post<CloudflareUploadConfig>('/api/v1/partner/media/direct-upload', null, config())).data;
  
  const form = new FormData();
  form.append('file', file);
  
  const response = await fetch(cfg.uploadUrl, {
    method: 'POST',
    body: form,
  });
  
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as any;
    throw new Error(err?.errors?.[0]?.message || 'Lỗi khi tải ảnh lên dịch vụ lưu trữ.');
  }
  
  return cfg.id;
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
