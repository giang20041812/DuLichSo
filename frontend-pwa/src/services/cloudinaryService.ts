export interface CloudinaryUploadConfig {
  provider: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
}

/**
 * Uploads an image file to Cloudinary using direct creator upload URL from the backend.
 */
export async function uploadReviewImageToCloudinary(file: File): Promise<{id: string, url: string}> {
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

  // 2. Prepare FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  // 3. Upload directly to Cloudinary
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    let errMsg = `Upload ảnh thất bại (HTTP ${uploadRes.status})`;
    try {
      const errJson = (await uploadRes.json()) as any;
      if (errJson?.error?.message) {
        errMsg = errJson.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const result = await uploadRes.json();
  return { id: result.public_id, url: result.secure_url };
}