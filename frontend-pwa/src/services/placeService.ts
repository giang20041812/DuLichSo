import axios from 'axios';
import { PlaceDetail } from '../types/homestay';
import { RoomTypeItem } from '../types/room';
import { MapContextData } from '../types/integrations/google-maps';

const API_BASE_URL = '/api';

export const FALLBACK_PLACE_DETAIL: PlaceDetail = {
  id: 1,
  slug: 'ban-lim-mong-eco-lodge',
  name: 'Bản Lìm Mông Eco Lodge',
  categoryKind: 'HOMESTAY',
  categoryName: 'Homestay cộng đồng',
  regionName: 'Yên Bái',
  address: 'Bản Lìm Mông, Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái',
  latitude: 21.751214,
  longitude: 104.318420,
  accessNote: 'Đường bê tông liên thôn, dốc vừa phải, ô tô 16 chỗ vào tận sân. Có biển chỉ dẫn từ đường QL32 vào 2km.',
  priceRefMin: 450000,
  priceRefMax: 750000,
  priceUnitNote: 'đêm',
  operationStatus: 'OPERATING',
  verification: 'COMMUNITY_VERIFIED',
  ratingAvg: 4.95,
  ratingCount: 48,
  altitudeMeters: 850,
  verifiedGpsText: '21.751214 - 104.318420',
  description: 'Nằm ôm trọn vách núi Lìm Mông hùng vĩ, Bản Lìm Mông Eco Lodge gìn giữ trọn vẹn nét văn hóa của người Thái Trắng với nếp nhà sàn pơ mu thơm lừng. Từ hiên nhà, bạn có thể phóng tầm mắt ngắm trọn thung lũng Tú Lệ trập trùng ruộng bậc thang ngát hương lúa mới.\n\nHomestay cam kết du lịch sinh thái bền vững, phục vụ các món ăn bản địa nấu từ nông sản tự cung tự cấp, nước sinh hoạt từ mạch nguồn tự nhiên mát lành.',
  media: [
    {
      id: 1,
      publicUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      role: 'COVER',
      caption: 'Nhà sàn gỗ 40 năm tuổi nguyên bản giữa thung lũng Tú Lệ'
    },
    {
      id: 2,
      publicUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      role: 'GALLERY',
      caption: 'Không gian hiên nhà ngắm ruộng bậc thang buổi sớm'
    },
    {
      id: 3,
      publicUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
      role: 'GALLERY',
      caption: 'Phòng nghỉ ấm cúng phong cách nhà gỗ bản địa'
    },
    {
      id: 4,
      publicUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      role: 'GALLERY',
      caption: 'Đường dạo quanh bản làng yên bình rợp bóng pơ mu'
    },
    {
      id: 5,
      publicUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      role: 'GALLERY',
      caption: 'Góc bàn trà ngắm thung lũng mờ sương'
    }
  ],
  amenities: [
    { id: 1, code: 'MEAL_ON_DEMAND', name: 'Phục vụ bữa ăn theo yêu cầu', icon: 'Utensils', value: 'YES', note: 'Món ăn đặc sản Thái Trắng tươi ngon' },
    { id: 2, code: 'FREE_KITCHEN', name: 'Nấu nướng tự do (bếp chung có củi)', icon: 'ChefHat', value: 'YES', note: 'Có sẵn gia vị, củi khô và bếp ga' },
    { id: 3, code: 'HOT_WATER', name: 'Nước nóng sinh hoạt (bình NLMT)', icon: 'ShowerHead', value: 'YES', note: 'Hệ thống nước nóng 24/7 ổn định' },
    { id: 4, code: 'MOSQUITO_NET', name: 'Màn chống muỗi từng đệm nằm riêng', icon: 'Shield', value: 'YES', note: 'Đảm bảo giấc ngủ trọn vẹn an toàn' },
    { id: 5, code: 'PARKING', name: 'Chỗ để xe máy & ô tô an toàn', icon: 'Car', value: 'YES', note: 'Sân bê tông rộng, có camera an ninh' },
    { id: 6, code: 'BUS_PICKUP', name: 'Hỗ trợ đón từ xe khách (có phụ phí)', icon: 'Bus', value: 'YES', note: 'Đón khách từ ngã ba Tú Lệ hoặc đèo Khau Phạ' }
  ],
  contacts: [
    { id: 1, channel: 'PHONE', value: '(+84) 0376 289 712', isPublic: true, sortOrder: 1 },
    { id: 2, channel: 'EMAIL', value: 'banlimmongecolodge@dulichso.vn', isPublic: true, sortOrder: 2 }
  ],
  highlights: [
    { id: 1, type: 'PRO', content: 'Nhà sàn 40 năm tuổi giữ nguyên kết cấu gỗ pơ mu' },
    { id: 2, type: 'PRO', content: 'Tầm nhìn không che chắn ra thung lũng ruộng bậc thang' }
  ],
  homestayProfile: {
    placeId: 1,
    checkInFrom: '14:00',
    checkOutUntil: '12:00',
    houseRules: 'Xuất trình CCCD/Hộ chiếu khi nhận phòng. Giữ yên lặng sau 22:30.',
    surchargeNote: 'Trẻ em dưới 6 tuổi ngủ chung miễn phí; thú cưng được phép mang theo nếu có xích/lồng riêng.',
    currentPolicy: {
      id: 1,
      name: 'Chính sách hủy tiêu chuẩn 48h',
      description: 'Miễn phí hủy trước 48 giờ so với thời điểm nhận phòng (14:00). Hủy trong vòng 48 giờ mất phí 50% tổng cọc.'
    }
  }
};

export const FALLBACK_ROOMS: RoomTypeItem[] = [
  {
    id: 1,
    placeId: 1,
    name: 'Phòng riêng Đồi view ruộng bậc thang',
    description: 'Không gian riêng tư đón trọn ánh nắng ban mai và gió thung lũng Tú Lệ mát lành.',
    maxOccupancy: 2,
    totalRoomCount: 3,
    privateBathroom: 'YES',
    areaSqm: 25,
    basePrice: 450000,
    status: 'ACTIVE',
    availableRooms: 1,
    badgeText: 'Còn 1 phòng trống',
    coverImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    bedDescription: '1 giường 1m8',
    features: ['Tối đa 2 người', 'Ban công gỗ ngắm thung lũng'],
    unitNote: '/ đêm'
  },
  {
    id: 2,
    placeId: 1,
    name: 'Gian ngủ tập thể Nhà Sàn truyền thống',
    description: 'Trải nghiệm ngủ nhà sàn cộng đồng đậm đà bản sắc, thoáng mát mùa hè, ấm áp mùa đông.',
    maxOccupancy: 12,
    totalRoomCount: 1,
    privateBathroom: 'NO',
    areaSqm: 60,
    basePrice: 180000,
    status: 'ACTIVE',
    availableRooms: 6,
    badgeText: 'Còn 6 chỗ trống',
    coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    bedDescription: 'Đệm riêng kèm chăn màn',
    features: ['Tối đa 12 người', 'Vách ngăn rèm riêng tư'],
    unitNote: '/ người'
  },
  {
    id: 3,
    placeId: 1,
    name: 'Phòng Gia Đình Gắn Gác',
    description: 'Không gian rộng rãi 2 tầng gác lửng phù hợp cho cả gia đình hoặc nhóm bạn 4 người.',
    maxOccupancy: 4,
    totalRoomCount: 2,
    privateBathroom: 'YES',
    areaSqm: 40,
    basePrice: 750000,
    status: 'ACTIVE',
    availableRooms: 0,
    badgeText: 'Hết phòng',
    coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    bedDescription: '2 giường đôi lớn',
    features: ['Tối đa 4 người', 'Phù hợp cho nhóm gia đình'],
    unitNote: '/ đêm'
  }
];

export const FALLBACK_MAP_CONTEXT: MapContextData = {
  placeId: 1,
  placeSlug: 'ban-lim-mong-eco-lodge',
  placeName: 'Bản Lìm Mông Eco Lodge',
  regionName: 'Yên Bái',
  address: 'Bản Lìm Mông, Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái',
  coordinates: {
    latitude: 21.751214,
    longitude: 104.318420
  },
  altitudeMeters: 850,
  accessNote: 'Đường bê tông liên thôn, dốc thoai thoải, xe dưới 16 chỗ vào tận sân.',
  verificationBadge: 'GPS Verified',
  pois: [
    {
      id: 101,
      name: 'Tạp hoá Tụ San',
      category: 'MARKET',
      latitude: 21.755410,
      longitude: 104.312150,
      distanceKm: 0.8,
      note: 'Bán nhu yếu phẩm, nước giải khát, sim thẻ'
    },
    {
      id: 102,
      name: 'Điểm Bay Dù Lượn Khau Phạ',
      category: 'ATTRACTION',
      latitude: 21.742890,
      longitude: 104.319800,
      distanceKm: 2.4,
      note: 'Khu cất cánh & bãi hạ cánh dù lượn ngắm thung lũng'
    },
    {
      id: 103,
      name: 'Le Champ Tú Lệ Resort & Hot Spring',
      category: 'SERVICE',
      latitude: 21.758200,
      longitude: 104.331200,
      distanceKm: 3.1,
      note: 'Khu tắm khoáng nóng tự nhiên cao cấp'
    },
    {
      id: 104,
      name: 'Suối khoáng nóng bản Chao',
      category: 'ATTRACTION',
      latitude: 21.749500,
      longitude: 104.324500,
      distanceKm: 1.2,
      note: 'Bể tắm khoáng nóng truyền thống người Thái'
    }
  ],
  scenarios: [
    {
      id: 'SCENARIO_1',
      code: 'MAP-CUS-01',
      label: '1. Chuẩn: Bản Lìm Mông',
      targetName: 'Bản Lìm Mông Eco Lodge',
      latitude: 21.751214,
      longitude: 104.318420,
      zoomLevel: 15,
      altitudeMeters: 850,
      accessNote: 'Đường bê tông liên thôn, dốc thoai thoải, xe dưới 16 chỗ vào tận sân.',
      isPrimary: true
    },
    {
      id: 'SCENARIO_2',
      code: 'MAP-CUS-02',
      label: '2. Dịch vụ: Giã Cốm Tú Lệ',
      targetName: 'Lò cốm truyền thống Tú Lệ',
      latitude: 21.753800,
      longitude: 104.322900,
      zoomLevel: 16,
      altitudeMeters: 830,
      accessNote: 'Ngay trục đường liên xã, xe ô tô dừng đỗ thoải mái.',
      isPrimary: false
    },
    {
      id: 'SCENARIO_3',
      code: 'MAP-CUS-03',
      label: '3. Trải nghiệm: Tắm suối khoáng',
      targetName: 'Khu tắm khoáng bản Chao',
      latitude: 21.749500,
      longitude: 104.324500,
      zoomLevel: 15,
      altitudeMeters: 820,
      accessNote: 'Đi xe máy hoặc đi bộ 500m từ đường lớn.',
      isPrimary: false
    }
  ]
};

export const fetchPlaceDetail = async (slug: string): Promise<PlaceDetail> => {
  try {
    const response = await axios.get<PlaceDetail>(`${API_BASE_URL}/public/places/${slug}`);
    return response.data;
  } catch {
    try {
      const response2 = await axios.get<PlaceDetail>(`${API_BASE_URL}/v1/public/places/${slug}`);
      return response2.data;
    } catch (err) {
      console.warn(`[placeService] Using fallback detail for ${slug}:`, err);
      return FALLBACK_PLACE_DETAIL;
    }
  }
};

export const fetchPlaceRooms = async (slug: string): Promise<RoomTypeItem[]> => {
  try {
    const response = await axios.get<RoomTypeItem[]>(`${API_BASE_URL}/v1/public/places/${slug}/rooms`);
    return response.data;
  } catch (error) {
    console.warn(`[placeService] Using fallback rooms for ${slug}:`, error);
    return FALLBACK_ROOMS;
  }
};

export const fetchMapContext = async (slug: string): Promise<MapContextData> => {
  try {
    const response = await axios.get<MapContextData>(`${API_BASE_URL}/v1/public/places/${slug}/map-context`);
    return response.data;
  } catch (error) {
    console.warn(`[placeService] Using fallback map context for ${slug}:`, error);
    return FALLBACK_MAP_CONTEXT;
  }
};
