export interface ReviewDto {
  id: number;
  placeId: number;
  rating: number;
  content: string;
  guestName: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  rating: number; // 1 -> 5
  content: string;
}

