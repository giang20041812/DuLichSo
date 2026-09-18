// Hàm giả lập gọi API lấy signature từ backend, sau đó gọi Cloudinary API để upload
export const uploadImageToCloudinary = async (file: File) => {
  // 1. Gọi API Backend (vd: /api/v1/cloudinary/signature) để lấy { signature, timestamp, api_key }
  // 2. Tạo FormData chứa file, signature, timestamp, api_key, cloud_name
  // 3. Post HTTP tới `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`
  
  // Trả về secure_url của ảnh
  return "https://res.cloudinary.com/demo/image/upload/sample.jpg";
};
