export type NotificationBookingStatus = 'CONFIRMED' | 'REJECTED' | 'REFUNDED';

export interface NotificationPayload {
  title?: string;
  message?: string;
  bookingCode?: string;
  bookingStatus?: NotificationBookingStatus | string;
  placeName?: string;
  isRead?: boolean;
  totalAmount?: number;
  [key: string]: unknown;
}

export interface CustomerNotification {
  id: number;
  templateCode?: string;
  channel?: string;
  recipientType?: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  bookingCode?: string | null;
  title: string;
  message: string;
  bookingStatus?: NotificationBookingStatus | null;
  isRead: boolean;
  createdAt: string;
  payload?: NotificationPayload;
}
