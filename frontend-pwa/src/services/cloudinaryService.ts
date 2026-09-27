export interface CloudinaryUploadConfig {
  provider: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
}

/**
 * Uploads an image file to Cloudinary using signed parameters from the backend.
 * Falls back to direct unsigned/signed upload if backend endpoint is available.
 */
export async function uploadReviewImageToCloudinary(file: File): Promise<string> {
  // 1. Get upload config from backend
  const res = await fetch('/api/public/bookings/media/upload-config');
  if (!res.ok) {
    throw new Error('Không thể lấy cấu hình tải ảnh từ hệ thống.');
  }

  const config = (await res.json()) as CloudinaryUploadConfig;
  const { cloudName, apiKey, timestamp, signature } = config;

  if (!cloudName || !apiKey || !signature) {
    throw new Error('Cấu hình Cloudinary không hợp lệ.');
  }

  // 2. Prepare FormData for Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  // 3. Upload directly to Cloudinary
  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    let errMsg = `Upload ảnh thất bại (HTTP ${uploadRes.status})`;
    try {
      const errJson = (await uploadRes.json()) as { error?: { message?: string } };
      if (errJson.error?.message) {
        errMsg = errJson.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const data = (await uploadRes.json()) as { secure_url?: string; url?: string };
  const finalUrl = data.secure_url || data.url;
  if (!finalUrl) {
    throw new Error('Dịch vụ Cloudinary không trả về liên kết ảnh.');
  }

  return finalUrl;
}
