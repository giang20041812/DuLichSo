import axios from 'axios';
import {
  PartnerHomestayPageResponse,
  PartnerHomestaySummaryDto,
  PartnerHomestayDetailDto,
  UpdateStatusRequest,
  QuickCreateHomestayRequest,
} from '../types/partner';

const API_BASE_URL = '/api/v1/partner/homestays';

export const INITIAL_MOCK_HOMESTAYS: PartnerHomestaySummaryDto[] = [
  {
    id: 1,
    code: 'ID: #LM-01',
    slug: 'ban-lim-mong-eco-lodge',
    name: 'Bản Lìm Mông Eco Lodge',
    address: 'Bản Lìm Mông, Xã Cao Phạ, Huyện Mù Cang Chải',
    coverImageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Lưu trú / Homestay',
    visibility: 'PUBLISHED',
    operationStatus: 'OPERATING',
    roomTypesCount: 3,
    priceRefMin: 450000,
    priceRefMax: 750000,
    priceUnitNote: 'đêm',
    lastUpdatedText: 'Hôm nay 08:30',
    auditStatus: 'STANDARD',
    auditStatusText: 'Hồ sơ chuẩn',
    isReadyToPublish: true,
  },
  {
    id: 2,
    code: 'ID: #KP-02',
    slug: 'nha-san-po-mu-khau-pha',
    name: 'Nhà Sàn Pơ Mu Khau Phạ',
    address: 'Đèo Khau Phạ, Huyện Mù Cang Chải, Yên Bái',
    coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Lưu trú / Homestay',
    visibility: 'PUBLISHED',
    operationStatus: 'TEMP_CLOSED',
    alertNote:
      'Đang hiển thị trang giới thiệu. Trên Customer Web ngừng tiếp nhận phòng do đang bảo trì mái gỗ Pơ Mu.',
    roomTypesCount: 2,
    priceRefMin: 350000,
    priceRefMax: 600000,
    priceUnitNote: 'đêm',
    lastUpdatedText: 'Hôm qua 15:45',
    auditStatus: 'MAINTENANCE',
    auditStatusText: 'Đang bảo trì',
    isReadyToPublish: true,
  },
  {
    id: 3,
    code: 'ID: #NL-03',
    slug: 'suoi-khoang-nam-lung-retreat',
    name: 'Suối Khoáng Nậm Lúng Retreat',
    address: 'Bản Nậm Lúng, Xã Tú Lệ, Huyện Văn Chấn',
    coverImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    categoryName: 'Lưu trú / Homestay',
    visibility: 'DRAFT',
    operationStatus: 'OPERATING',
    alertNote:
      'Chưa đủ điều kiện công khai: Thiếu ảnh đại diện mặt tiền và giấy đăng ký lưu trú cấp xã. Bổ sung để hiển thị ngay lập tức (không cần duyệt).',
    roomTypesCount: 1,
    priceRefMin: 500000,
    priceRefMax: 500000,
    priceUnitNote: 'đêm',
    lastUpdatedText: '2 ngày trước',
    auditStatus: 'NEEDS_DATA',
    auditStatusText: 'Cần thêm dữ liệu',
    isReadyToPublish: false,
  },
];

export const fetchPartnerHomestays = async (
  scenario = 'DEFAULT',
  keyword?: string,
  visibility?: string,
  operationStatus?: string
): Promise<PartnerHomestayPageResponse> => {
  try {
    const params = new URLSearchParams();
    if (scenario) params.append('scenario', scenario);
    if (keyword) params.append('keyword', keyword);
    if (visibility) params.append('visibility', visibility);
    if (operationStatus) params.append('operationStatus', operationStatus);

    const response = await axios.get<PartnerHomestayPageResponse>(`${API_BASE_URL}?${params.toString()}`, {
      timeout: 5000,
    });
    return response.data;
  } catch {
    // Fallback simulation cho QA Sandbox offline mode
    return getLocalMockResponse(scenario, keyword, visibility, operationStatus);
  }
};

export const updateHomestayStatus = async (
  id: number,
  request: UpdateStatusRequest
): Promise<PartnerHomestaySummaryDto> => {
  try {
    const response = await axios.patch<PartnerHomestaySummaryDto>(`${API_BASE_URL}/${id}/status`, request, {
      timeout: 5000,
    });
    return response.data;
  } catch {
    const item = INITIAL_MOCK_HOMESTAYS.find((h) => h.id === id);
    if (!item) throw new Error('Homestay không tồn tại');
    if (request.visibility) item.visibility = request.visibility;
    if (request.operationStatus) item.operationStatus = request.operationStatus;
    item.lastUpdatedText = 'Vừa xong';
    return { ...item };
  }
};

export const createQuickHomestay = async (
  request: QuickCreateHomestayRequest
): Promise<PartnerHomestaySummaryDto> => {
  try {
    const response = await axios.post<PartnerHomestaySummaryDto>(API_BASE_URL, request, {
      timeout: 5000,
    });
    return response.data;
  } catch {
    const newId = INITIAL_MOCK_HOMESTAYS.length + 1;
    const newItem: PartnerHomestaySummaryDto = {
      id: newId,
      code: `ID: #HM-0${newId}`,
      slug: `homestay-${newId}`,
      name: request.name,
      address: request.address,
      coverImageUrl: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
      categoryName: 'Lưu trú / Homestay',
      visibility: 'DRAFT',
      operationStatus: 'OPERATING',
      roomTypesCount: 1,
      priceRefMin: request.priceRefMin || 400000,
      priceRefMax: request.priceRefMax || 600000,
      priceUnitNote: 'đêm',
      lastUpdatedText: 'Vừa tạo',
      auditStatus: 'NEEDS_DATA',
      auditStatusText: 'Cần thêm dữ liệu',
      alertNote: 'Chưa đủ điều kiện công khai: Vui lòng bổ sung đầy đủ thông tin phòng để xuất bản.',
      isReadyToPublish: false,
    };
    INITIAL_MOCK_HOMESTAYS.unshift(newItem);
    return newItem;
  }
};

export const fetchPartnerHomestayDetail = async (id: number): Promise<PartnerHomestayDetailDto> => {
  try {
    const response = await axios.get<PartnerHomestayDetailDto>(`${API_BASE_URL}/${id}`, {
      timeout: 5000,
    });
    return response.data;
  } catch {
    return getLocalMockDetail(id);
  }
};

export const savePartnerHomestayDetail = async (
  id: number,
  detail: PartnerHomestayDetailDto
): Promise<PartnerHomestayDetailDto> => {
  try {
    const response = await axios.put<PartnerHomestayDetailDto>(`${API_BASE_URL}/${id}`, detail, {
      timeout: 5000,
    });
    return response.data;
  } catch {
    const summary = INITIAL_MOCK_HOMESTAYS.find((h) => h.id === id);
    if (summary) {
      summary.name = detail.name;
      summary.address = detail.address;
      summary.visibility = detail.visibility;
      summary.operationStatus = detail.operationStatus;
      summary.coverImageUrl = detail.coverImageUrl;
      summary.lastUpdatedText = 'Vừa xong';
    }
    return detail;
  }
};

const getLocalMockDetail = (id: number): PartnerHomestayDetailDto => {
  if (id === 2) {
    return {
      id: 2,
      code: 'ID: #KP-02',
      slug: 'nha-san-po-mu-khau-pha',
      name: 'Nhà Sàn Pơ Mu Khau Phạ',
      description: 'Nhà sàn gỗ Pơ Mu nguyên bản ngắm trọn đỉnh đèo Khau Phạ quanh năm mây mù bao phủ.',
      contactPhone: '0987 654 321',
      contactEmail: 'khaupha@taybactrails.vn',
      regionName: 'Xã Cao Phạ, Huyện Mù Cang Chải, Tỉnh Yên Bái',
      address: 'Đèo Khau Phạ, Huyện Mù Cang Chải, Yên Bái',
      latitude: 21.78231,
      longitude: 104.30124,
      accessNote: 'Ngay sườn đèo Khau Phạ, ô tô lên thẳng sân.',
      coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      ],
      amenities: ['Wifi tốc độ cao', 'Chỗ đỗ ô tô miễn phí', 'Sân lửa trại / BBQ', 'View ruộng bậc thang'],
      checkInFrom: '14:00',
      checkOutUntil: '12:00',
      houseRules: 'Giữ gìn vệ sinh, không hút thuốc phòng ngủ.',
      cancellationPolicy: 'Miễn phí hủy trước 48h (Chính sách Tiêu chuẩn)',
      visibility: 'PUBLISHED',
      operationStatus: 'TEMP_CLOSED',
      isReadyToPublish: true,
      cooperativeName: 'HTX Du Lịch Cộng Đồng Lìm Mông',
      providerCode: 'NCC-TB-0824',
      alertNote: 'Đang hiển thị trang giới thiệu. Trên Customer Web ngừng tiếp nhận phòng do đang bảo trì mái gỗ Pơ Mu.',
    };
  }

  if (id === 3) {
    return {
      id: 3,
      code: 'ID: #NL-03',
      slug: 'suoi-khoang-nam-lung-retreat',
      name: 'Suối Khoáng Nậm Lúng Retreat',
      description: 'Khu nghỉ dưỡng suối nước khoáng nóng tự nhiên giữa bản Nậm Lúng yên bình.',
      contactPhone: '0901 234 567',
      contactEmail: 'namlung@taybactrails.vn',
      regionName: 'Xã Tú Lệ, Huyện Văn Chấn, Tỉnh Yên Bái',
      address: 'Bản Nậm Lúng, Xã Tú Lệ, Huyện Văn Chấn',
      latitude: 21.73451,
      longitude: 104.35123,
      accessNote: 'Cách quốc lộ 32 1.5km đường bê tông.',
      coverImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
      ],
      amenities: ['Tắm lá thuốc dân tộc', 'Phục vụ ẩm thực bản địa'],
      checkInFrom: '14:00',
      checkOutUntil: '12:00',
      houseRules: 'Giữ trật tự khu vực suối khoáng sau 21h.',
      cancellationPolicy: 'Miễn phí hủy trước 24h',
      visibility: 'DRAFT',
      operationStatus: 'OPERATING',
      isReadyToPublish: false,
      cooperativeName: 'HTX Du Lịch Cộng Đồng Lìm Mông',
      providerCode: 'NCC-TB-0824',
      alertNote: 'Chưa đủ điều kiện công khai: Thiếu ảnh đại diện mặt tiền và giấy đăng ký lưu trú cấp xã. Bổ sung để hiển thị ngay lập tức (không cần duyệt).',
    };
  }

  // Mặc định: Bản Lìm Mông Eco Lodge (Khớp chính xác với hình ảnh thiết kế)
  return {
    id: 1,
    code: 'ID: #LM-01',
    slug: 'ban-lim-mong-eco-lodge',
    name: 'Bản Lìm Mông Eco Lodge',
    description:
      'Nằm ôm trọn vách núi Lìm Mông hùng vĩ, Bản Lìm Mông Eco Lodge gìn giữ trọn vẹn nét văn hóa của người Thái Trắng với nếp nhà sàn pơ mu thơm lừng. Từ hiên nhà, bạn có thể phóng tầm mắt ngắm trọn thung lũng Tú Lệ trập trùng ruộng bậc thang ngát hương lúa mới.',
    contactPhone: '0912 345 678',
    contactEmail: 'limmongecolodge@taybactrails.vn',
    regionName: 'Xã Cao Phạ, Huyện Mù Cang Chải, Tỉnh Yên Bái',
    address: 'Bản Lìm Mông, Dưới chân đèo Khau Phạ',
    latitude: 21.751214,
    longitude: 104.31842,
    accessNote:
      'Đường bê tông liên thôn, dốc vừa phải, ô tô 16 chỗ vào tận sân. Có biển chỉ dẫn từ đường QL32 vào 2km.',
    coverImageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    ],
    amenities: [
      'Wifi tốc độ cao',
      'Chỗ đỗ ô tô miễn phí',
      'Phục vụ ẩm thực bản địa',
      'Sân lửa trại / BBQ',
      'View ruộng bậc thang',
      'Tắm lá thuốc dân tộc',
    ],
    checkInFrom: '14:00',
    checkOutUntil: '12:00',
    houseRules:
      "Tuyệt đối không hút thuốc trong phòng ngủ bằng gỗ. Tôn trọng không gian tập quán bản địa của người H'Mông, Thái; giữ trật tự sau 22h đêm.",
    cancellationPolicy: 'Miễn phí hủy trước 48h (Chính sách Tiêu chuẩn)',
    visibility: 'PUBLISHED',
    operationStatus: 'OPERATING',
    isReadyToPublish: true,
    cooperativeName: 'HTX Du Lịch Cộng Đồng Lìm Mông',
    providerCode: 'NCC-TB-0824',
  };
};

const getLocalMockResponse = (
  scenario = 'DEFAULT',
  keyword?: string,
  visibility?: string,
  operationStatus?: string
): PartnerHomestayPageResponse => {
  if (scenario === 'EMPTY') {
    return {
      homestays: [],
      stats: {
        totalCount: 0,
        publishedCount: 0,
        draftCount: 0,
        unpublishedCount: 0,
        operatingCount: 0,
        tempClosedCount: 0,
      },
      cooperativeName: 'HỢP TÁC XÃ DU LỊCH CỘNG ĐỒNG LÌM MÔNG',
      providerCode: 'NCC-TB-0824',
      isProviderSuspended: false,
    };
  }

  const isSuspended = scenario === 'SUSPENDED';

  let list = [...INITIAL_MOCK_HOMESTAYS];
  if (keyword) {
    const kw = keyword.toLowerCase();
    list = list.filter((h) => h.name.toLowerCase().includes(kw) || h.address.toLowerCase().includes(kw));
  }
  if (visibility && visibility !== 'ALL') {
    list = list.filter((h) => h.visibility === visibility);
  }
  if (operationStatus && operationStatus !== 'ALL') {
    list = list.filter((h) => h.operationStatus === operationStatus);
  }

  const all = INITIAL_MOCK_HOMESTAYS;
  return {
    homestays: list,
    stats: {
      totalCount: all.length,
      publishedCount: all.filter((h) => h.visibility === 'PUBLISHED').length,
      draftCount: all.filter((h) => h.visibility === 'DRAFT').length,
      unpublishedCount: all.filter((h) => h.visibility === 'UNPUBLISHED').length,
      operatingCount: all.filter((h) => h.operationStatus === 'OPERATING').length,
      tempClosedCount: all.filter((h) => h.operationStatus === 'TEMP_CLOSED').length,
    },
    cooperativeName: 'HỢP TÁC XÃ DU LỊCH CỘNG ĐỒNG LÌM MÔNG',
    providerCode: 'NCC-TB-0824',
    isProviderSuspended: isSuspended,
  };
};
