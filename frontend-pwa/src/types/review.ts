export interface ReviewDto {
  id: number;
  placeId: number;
  bookingCode: string;
  rating: number;
  content: string;
  images?: string[];
  guestName: string;
  createdAt: string;
  editableUntil?: string;
}

export interface CreateReviewRequest {
  rating: number; // 1 -> 5
  content: string;
  images?: string[];
}

