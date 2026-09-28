export interface CloudflareUploadConfig {
  provider: string;
  uploadUrl: string;
  id: string;
}

/**
 * Uploads an image file to Cloudflare Images using direct creator upload URL from the backend.
 */
export async function uploadReviewImageToCloudinary(file: File): Promise<string> {
  // 1. Get upload config from backend
  const res = await fetch('/api/public/bookings/media/upload-config');
  if (!res.ok) {
    throw new Error('Không thể lấy cấu hình tải ảnh từ hệ thống.');
  }

  const config = (await res.json()) as CloudflareUploadConfig;
  const { uploadUrl, id } = config;

  if (!uploadUrl || !id) {
    throw new Error('Cấu hình Cloudflare không hợp lệ.');
  }

  // 2. Prepare FormData
  const formData = new FormData();
  formData.append('file', file);

  // 3. Upload directly to Cloudflare
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    let errMsg = `Upload ảnh thất bại (HTTP ${uploadRes.status})`;
    try {
      const errJson = (await uploadRes.json()) as any;
      if (errJson?.errors?.[0]?.message) {
        errMsg = errJson.errors[0].message;
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return id;
}