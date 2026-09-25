import { ExperienceDetail } from '../types/itinerary';

export const FALLBACK_EXPERIENCE_DETAIL: ExperienceDetail = {
  id: 1,
  slug: 'trai-nghiem-gia-com-nep-tu-le',
  title: 'Trải Nghiệm Giã Cốm Nếp Tú Lệ Cùng Nghệ Nhân Thái',
  categoryTag: 'TRẢI NGHIỆM VĂN HÓA',
  subCategoryTag: 'TRẢI NGHIỆM BẢN ĐỊA',
  seasonalTag: 'Mùa lúa chín - Thu hoạch',
  address: 'Thôn Nà Lộng, Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái',
  mapCode: 'UC-03',
  
  priceRef: 150000,
  priceUnit: 'người',
  priceBadge: 'Phi thương mại (Phase 1)',
  priceNotice: 'Giá tham khảo trực tiếp tại cơ sở của nghệ nhân. Cổng Tây Bắc Trails (Phase 1) không thu phí trung gian hay hỗ trợ đặt trực tuyến. Quý khách vui lòng gọi trước để chuẩn bị lúa nương tươi ngon nhất.',
  
  description: `Tú Lệ được ví như chiếc bát ngọc bích nằm lọt thỏm giữa ba ngọn núi Khau Phạ, Khau Song và Khau Thán. Giống nếp Tan Lả lừng danh truyền đời của người Thái nơi đây mang vị ngọt ngào, thơm dẻo hiếm nơi nào sánh kịp.

Khách phương xa sẽ cùng nghệ nhân ra ruộng hái những bông lúa còn ngậm sữa sương sớm, học cách đảo đều tay trên chảo rang củi than nỏ rực lửa và lắng nghe nhịp chày cối giã rộn ràng bên gian bếp nhà sàn ấm cúng.`,
  
  duration: 'Khoảng 2 – 3 giờ (Bao gồm thưởng trà và đóng gói)',
  bestSeason: 'Tháng 9 – cuối tháng 10 (Mùa lúa nếp chín rộ)',
  targetAudience: 'Gia đình có trẻ nhỏ, người yêu văn hóa ẩm thực bản xứ',
  giftIncluded: '0.5kg cốm tươi bọc lá dong rừng',
  languages: 'Tiếng Việt, Tiếng Thái bản địa',
  
  locationTag: 'Tọa độ MAP-CUS-01',
  locationName: 'Lò nếp giã cốm Tú Lệ',
  accessNote: 'Cách ngã ba trung tâm xã Tú Lệ khoảng 400m theo hướng đi bản Lìm Mông. Đường bê tông liên thôn thoáng đãng, xe máy và ô tô dưới 16 chỗ vào tận sân nhà nghệ nhân.',
  latitude: 21.753800,
  longitude: 104.322900,
  
  hostName: 'Nghệ nhân Lò Thị Mai',
  hostRole: 'Phụ trách tiếp đón & trải nghiệm',
  hostPhone: '0389 456 712',
  hostWorkingHours: 'Giờ nghe máy: 07:00 – 19:00 hàng ngày',
  
  images: []
};

export const fetchExperienceDetail = async (slug: string): Promise<ExperienceDetail> => {
  // Graceful fallback for local development
  return Promise.resolve({ ...FALLBACK_EXPERIENCE_DETAIL, slug });
};
