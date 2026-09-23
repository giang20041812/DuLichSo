import { PlaceContactItem } from '../types/homestay';
import { apiOrigin } from '@/lib/apiBase';

export interface TransportDto {
  id: string;
  name: string;
  coverImageUrl: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  ratingScore: number;
  ratingText: string;
  reviewCount: number;
  priceRef: number;
  priceUnitNote?: string;
  categoryGroup: string; // 'LOCAL_MOTO' | 'TOUR_MOTO' | 'SELF_DRIVE' | 'INTERCITY_BUS' | 'SHARED_CAR'
  categoryGroupName: string;
  vehicleType: string;
  routeType: string;
  distance?: string;
  duration?: string;
  positiveReview?: string;
  negativeReview?: string;
  painPointNote?: string;
  contacts?: PlaceContactItem[];
}

export interface TransportFilterParams {
  keyword?: string;
  categoryGroups?: string[];
  vehicleTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
}

const TRANSPORT_FALLBACK_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80', // Xe máy leo dốc
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80', // Limousine / Bus
  'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80', // Xe khách
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', // Xe ghép
];

export const fetchTransports = async (params?: TransportFilterParams): Promise<TransportDto[]> => {
  try {
    const url = new URL('/api/public/places', apiOrigin());
    url.searchParams.append('kind', 'TRANSPORT');
    url.searchParams.append('size', '50');

    if (params?.minPrice !== undefined) url.searchParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) url.searchParams.append('maxPrice', params.maxPrice.toString());

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const content: Array<{
      id: number;
      name: string;
      coverImageUrl?: string | null;
      description?: string | null;
      priceRefMin?: number | null;
      priceRefMax?: number | null;
      priceUnitNote?: string | null;
      ratingAvg?: number | null;
      ratingCount?: number | null;
      address?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      attributes?: Record<string, unknown>;
      contacts?: PlaceContactItem[];
    }> = data.content || [];

    const defaultImg = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80';

    const mapped: TransportDto[] = content.map((item, index) => {
      const attrs = item.attributes || {};
      const fallback: string = TRANSPORT_FALLBACK_IMAGES[index % TRANSPORT_FALLBACK_IMAGES.length] || defaultImg;
      const cover: string = (item.coverImageUrl && item.coverImageUrl.trim().length > 0)
        ? item.coverImageUrl
        : (typeof attrs.coverImageUrl === 'string' && attrs.coverImageUrl.trim().length > 0)
          ? attrs.coverImageUrl
          : fallback;

      const lowerName = item.name.toLowerCase();

      // Phân nhóm theo categoryGroup từ DB attributes hoặc suy luận
      let categoryGroup = typeof attrs.categoryGroup === 'string' ? attrs.categoryGroup : '';
      let categoryGroupName = typeof attrs.categoryGroupName === 'string' ? attrs.categoryGroupName : '';

      if (!categoryGroup) {
        if (lowerName.includes('xe ôm') || lowerName.includes('ngã 3') || lowerName.includes('trung chuyển')) {
          categoryGroup = 'LOCAL_MOTO';
          categoryGroupName = 'Xe ôm bản địa vượt dốc';
        } else if (lowerName.includes('ghép đoàn') || lowerName.includes('tour')) {
          categoryGroup = 'TOUR_MOTO';
          categoryGroupName = 'Xe ôm tour & ghép đoàn';
        } else if (lowerName.includes('thuê xe') || lowerName.includes('tự lái') || lowerName.includes('bán tải')) {
          categoryGroup = 'SELF_DRIVE';
          categoryGroupName = 'Thuê xe tự lái (Xe máy / Ô tô)';
        } else if (lowerName.includes('limousine') || lowerName.includes('giường nằm') || lowerName.includes('hà trang') || lowerName.includes('cường lan') || lowerName.includes('hưng thành') || lowerName.includes('sơn phương')) {
          categoryGroup = 'INTERCITY_BUS';
          categoryGroupName = 'Xe khách & Limousine liên tỉnh';
        } else {
          categoryGroup = 'SHARED_CAR';
          categoryGroupName = 'Xe ghép liên xã & bán tải';
        }
      }

      let vType = typeof attrs.vehicleType === 'string' ? attrs.vehicleType : 'Phương tiện di chuyển';
      let rType = typeof attrs.routeSchedule === 'string' ? attrs.routeSchedule : (typeof attrs.schedule === 'string' ? attrs.schedule : 'Di chuyển quanh Mù Cang Chải');

      if (!vType || vType === 'Phương tiện di chuyển') {
        if (categoryGroup === 'LOCAL_MOTO') {
          vType = 'Xe ôm số chuyên leo dốc bản địa';
          rType = 'Đưa đón tận nơi các điểm hiểm trở';
        } else if (categoryGroup === 'TOUR_MOTO') {
          vType = 'Xe máy kèm tài xế bản địa kiêm thợ ảnh';
          rType = 'Lịch trình trọn ngày các điểm săn lúa';
        } else if (categoryGroup === 'SELF_DRIVE') {
          vType = 'Xe máy số / Xe bán tải 4x4';
          rType = 'Tự do trải nghiệm toàn huyện';
        } else if (categoryGroup === 'INTERCITY_BUS') {
          vType = lowerName.includes('limousine') ? 'Xe Limousine VIP 9–11 chỗ' : 'Xe khách giường nằm 40 chỗ VIP';
          rType = 'Hà Nội – Mù Cang Chải (Hàng ngày)';
        } else {
          vType = 'Xe taxi 7 chỗ ghép chuyến';
          rType = 'TP Yên Bái ↔ Mù Cang Chải ↔ Các xã';
        }
      }

      const price = item.priceRefMin && item.priceRefMin > 0 
        ? item.priceRefMin 
        : (categoryGroup === 'LOCAL_MOTO' ? 60000 : (categoryGroup === 'SELF_DRIVE' ? 150000 : 250000));
        
      const rating = item.ratingAvg && item.ratingAvg > 0 ? item.ratingAvg : (4.7 + ((index * 3) % 4) * 0.1);

      return {
        id: item.id.toString(),
        name: item.name,
        coverImageUrl: cover,
        description: item.description || `Dịch vụ vận chuyển tiện lợi, phục vụ tận tình, thông thạo địa hình Mù Cang Chải giúp quý khách có chuyến đi trọn vẹn và an toàn.`,
        address: item.address || 'Huyện Mù Cang Chải, Tỉnh Yên Bái',
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
        ratingScore: Math.round(rating * 10) / 10,
        ratingText: rating >= 4.8 ? 'Tuyệt vời & An toàn' : 'Uy tín & Chu đáo',
        reviewCount: item.ratingCount || (45 + (index * 11) % 80),
        priceRef: price,
        priceUnitNote: item.priceUnitNote || (typeof attrs.priceDetails === 'string' ? attrs.priceDetails : undefined),
        categoryGroup,
        categoryGroupName,
        vehicleType: vType,
        routeType: rType,
        distance: typeof attrs.distance === 'string' ? attrs.distance : undefined,
        duration: typeof attrs.duration === 'string' ? attrs.duration : undefined,
        positiveReview: typeof attrs.positiveReview === 'string' ? attrs.positiveReview : undefined,
        negativeReview: typeof attrs.negativeReview === 'string' ? attrs.negativeReview : undefined,
        painPointNote: typeof attrs.painPointNote === 'string' ? attrs.painPointNote : undefined,
        contacts: item.contacts || [],
      };
    });

    let result = mapped;
    if (params?.categoryGroups && params.categoryGroups.length > 0) {
      result = result.filter(t => params.categoryGroups!.includes(t.categoryGroup));
    }
    if (params?.vehicleTypes && params.vehicleTypes.length > 0) {
      result = result.filter(t => params.vehicleTypes!.includes(t.vehicleType));
    }
    if (params?.keyword && params.keyword.trim().length > 0) {
      const kw = params.keyword.trim().toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(kw) || 
        t.vehicleType.toLowerCase().includes(kw) ||
        t.categoryGroupName.toLowerCase().includes(kw) ||
        t.routeType.toLowerCase().includes(kw) ||
        (t.address && t.address.toLowerCase().includes(kw))
      );
    }

    return result;
  } catch (error) {
    console.error('Error fetching transports:', error);
    return [];
  }
};
