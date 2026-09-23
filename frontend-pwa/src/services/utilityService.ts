import { PlaceContactItem } from '../types/homestay';

export interface UtilityServiceDto {
  id: string;
  name: string;
  kind: 'PHOTO' | 'RENTAL';
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
  categoryBadge: string;
  contacts?: PlaceContactItem[];
}

export interface UtilityFilterParams {
  keyword?: string;
  kind?: 'ALL' | 'PHOTO' | 'RENTAL';
  minPrice?: number;
  maxPrice?: number;
}

const UTILITY_FALLBACK_IMAGES: Record<string, string> = {
  'PHOTO': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'RENTAL': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
};

export const fetchUtilityServices = async (params?: UtilityFilterParams): Promise<UtilityServiceDto[]> => {
  try {
    const fetchKinds = (!params?.kind || params.kind === 'ALL') ? ['PHOTO', 'RENTAL'] : [params.kind];
    const results: UtilityServiceDto[] = [];

    for (const k of fetchKinds) {
      const url = new URL('/api/public/places', window.location.origin);
      url.searchParams.append('kind', k);
      url.searchParams.append('size', '50');

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        const content: Array<{
          id: number;
          name: string;
          kind: string;
          coverImageUrl?: string | null;
          description?: string | null;
          priceRefMin?: number | null;
          ratingAvg?: number | null;
          ratingCount?: number | null;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          contacts?: PlaceContactItem[];
        }> = data.content || [];

        content.forEach((item, idx) => {
          const kindType = (item.kind === 'PHOTO' ? 'PHOTO' : 'RENTAL') as 'PHOTO' | 'RENTAL';
          const fallback: string = UTILITY_FALLBACK_IMAGES[kindType] ?? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80';
          const cover: string = (typeof item.coverImageUrl === 'string' && item.coverImageUrl.trim().length > 0)
            ? item.coverImageUrl
            : fallback;

          const badge = kindType === 'PHOTO' 
            ? '📸 Chụp ảnh & Trang phục' 
            : '🏍️ Thuê xe máy & Lều trại';

          const unitNote = kindType === 'PHOTO' ? 'bộ/buổi' : 'ngày';
          const defaultPrice = kindType === 'PHOTO' ? 150000 : 100000;
          const price = item.priceRefMin && item.priceRefMin > 0 ? item.priceRefMin : defaultPrice;
          const rating = item.ratingAvg && item.ratingAvg > 0 ? item.ratingAvg : (4.7 + (idx % 3) * 0.1);

          results.push({
            id: item.id.toString(),
            name: item.name,
            kind: kindType,
            coverImageUrl: cover,
            description: item.description || (kindType === 'PHOTO' 
              ? 'Dịch vụ chụp ảnh nghệ thuật mùa vàng, flycam góc cao và cho thuê trang phục dân tộc Mông, Thái truyền thống rực rỡ.'
              : 'Dịch vụ cho thuê xe máy phượt khỏe, mũ bảo hiểm chuẩn, lều trại dã ngoại cắm trại đồi Mâm Xôi đầy đủ tiện nghi.'),
            address: item.address || 'Trung tâm Mù Cang Chải',
            latitude: item.latitude || undefined,
            longitude: item.longitude || undefined,
            ratingScore: Math.round(rating * 10) / 10,
            ratingText: 'Dịch vụ tốt',
            reviewCount: item.ratingCount || (16 + idx * 8),
            priceRef: price,
            priceUnitNote: unitNote,
            categoryBadge: badge,
            contacts: item.contacts || [],
          });
        });
      }
    }

    let filtered = results;
    if (params?.keyword && params.keyword.trim().length > 0) {
      const kw = params.keyword.trim().toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(kw) || 
        (u.address && u.address.toLowerCase().includes(kw))
      );
    }

    return filtered;
  } catch (error) {
    console.error('Error fetching utility services:', error);
    return [];
  }
};
