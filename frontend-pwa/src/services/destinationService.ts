import { PlaceContactItem } from '../types/homestay';

export interface DestinationDto {
  id: string;
  name: string;
  coverImageUrl: string;
  images?: string[];
  description?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  ratingScore: number;
  ratingText: string;
  reviewCount: number;
  ticketPrice: number;
  priceUnitNote?: string;
  tagBadge?: string;
  scenicType: string;
  amenities: string[];
  contacts?: PlaceContactItem[];
}

export interface DestinationFilterParams {
  keyword?: string;
  scenicTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

const DESTINATION_FALLBACK_IMAGES: Record<string, string> = {
  'Đồi Mâm Xôi': 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
  'Đồi Móng Ngựa': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  'La Pán Tẩn': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
  'Thác Pú Nhu': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
  'Chế Cu Nha': 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
  'Dế Xu Phình': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
  'Sống Lưng Khủng Long': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  'Thác Mơ': 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1200&q=80',
  'Rừng Trúc': 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  'Đèo Khau Phạ': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  'Thung lũng Tú Lệ': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
};

const GENERIC_DESTINATION_FALLBACK = 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80';

export const fetchDestinations = async (params?: DestinationFilterParams): Promise<DestinationDto[]> => {
  try {
    const url = new URL('/api/public/places', window.location.origin);
    url.searchParams.append('kind', 'ATTRACTION');
    url.searchParams.append('size', '50');

    if (params?.minPrice !== undefined) url.searchParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) url.searchParams.append('maxPrice', params.maxPrice.toString());
    if (params?.minRating !== undefined) url.searchParams.append('minRating', params.minRating.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const content: Array<{
      id: number;
      name: string;
      regionName?: string;
      coverImageUrl?: string | null;
      description?: string | null;
      priceRefMin?: number | null;
      ratingAvg?: number | null;
      ratingCount?: number | null;
      latitude?: number | null;
      longitude?: number | null;
      address?: string | null;
      contacts?: PlaceContactItem[];
    }> = data.content || [];

    const mapped: DestinationDto[] = content.map((item, index) => {
      const fallback = DESTINATION_FALLBACK_IMAGES[item.name.trim()] || GENERIC_DESTINATION_FALLBACK;
      const cover = (typeof item.coverImageUrl === 'string' && item.coverImageUrl.trim().length > 0)
        ? item.coverImageUrl
        : fallback;

      // Nhận diện loại cảnh quan
      const lowerName = item.name.toLowerCase();
      let scenic = 'Ruộng bậc thang di sản';
      if (lowerName.includes('thác')) scenic = 'Thác nước & Suối nguồn';
      else if (lowerName.includes('đèo') || lowerName.includes('khau phạ')) scenic = 'Tứ đại đỉnh đèo & Đỉnh mây';
      else if (lowerName.includes('rừng')) scenic = 'Rừng sinh thái nguyên sinh';
      else if (lowerName.includes('sống lưng')) scenic = 'Điểm săn mây & Trekking';
      else if (lowerName.includes('thung lũng')) scenic = 'Thung lũng & Bản làng';

      const price = item.priceRefMin && item.priceRefMin > 0 ? item.priceRefMin : (item.priceRefMin === 0 ? 0 : 30000);
      const rating = item.ratingAvg && item.ratingAvg > 0 ? item.ratingAvg : (4.6 + ((index * 5) % 4) * 0.1);
      const ratingRounded = Math.round(rating * 10) / 10;
      const count = item.ratingCount && item.ratingCount > 0 ? item.ratingCount : (45 + ((index * 29) % 250));

      return {
        id: item.id.toString(),
        name: item.name,
        coverImageUrl: cover,
        description: item.description || `Thắng cảnh tuyệt tác vùng cao Mù Cang Chải, Di tích Quốc gia đặc biệt với mùa lúa chín vàng óng ả và cảnh sắc thiên nhiên hùng vĩ níu chân du khách thập phương.`,
        district: item.regionName || 'Mù Cang Chải',
        address: item.address || 'Huyện Mù Cang Chải, Tỉnh Yên Bái',
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
        ratingScore: ratingRounded,
        ratingText: ratingRounded >= 4.8 ? 'Kỳ vĩ' : 'Tuyệt hảo',
        reviewCount: count,
        ticketPrice: price,
        priceUnitNote: price === 0 ? 'Miễn phí' : 'vé/lượt',
        tagBadge: price === 0 ? 'Miễn phí vé' : 'Điểm đến nổi bật',
        scenicType: scenic,
        amenities: ['CHECK_IN', 'PHOTO_SPOT', 'REST_STOP'],
        contacts: item.contacts || [],
      };
    });

    let result = mapped;
    if (params?.scenicTypes && params.scenicTypes.length > 0) {
      result = result.filter(d => params.scenicTypes!.includes(d.scenicType));
    }
    if (params?.keyword && params.keyword.trim().length > 0) {
      const kw = params.keyword.trim().toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(kw) || 
        (d.address && d.address.toLowerCase().includes(kw)) ||
        d.scenicType.toLowerCase().includes(kw)
      );
    }

    return result;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }
};
