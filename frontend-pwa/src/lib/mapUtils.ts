/**
 * Tiện ích hỗ trợ mở chỉ đường bản đồ từ vị trí hiện tại của người dùng đến địa điểm đến.
 */
export function openGoogleMapsDirections(lat?: number, lng?: number, addressOrName?: string) {
  let destination = '';
  if (lat && lng) {
    destination = `${lat},${lng}`;
  } else if (addressOrName) {
    destination = encodeURIComponent(addressOrName);
  } else {
    destination = encodeURIComponent('Mù Cang Chải, Yên Bái');
  }

  // Google Maps Direction URL:
  // Nếu có geolocation của trình duyệt, truyền saddr / origin để chỉ đường từ vị trí người dùng.
  // URL chuẩn của Google Maps Directions: https://www.google.com/maps/dir/?api=1&destination=...
  // Khi không truyền origin, Google Maps tự động lấy vị trí hiện tại ("My Location") của thiết bị.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destination}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      () => {
        // Nếu người dùng từ chối cấp quyền vị trí, vẫn mở Google Maps với chế độ tự định vị nguồn
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      { timeout: 3000 }
    );
  } else {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
