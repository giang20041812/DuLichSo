import axios from 'axios';

export interface PartnerDashboardSummaryDto {
  monthlyRevenue: number;
  monthlyBookingsCount: number;
  averageRating: number;
  totalReviews: number;
  occupancyRate: number;
  
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;

  revenueTrend: MonthlyRevenuePoint[];
  recentBookings: RecentBookingDto[];
}

export interface MonthlyRevenuePoint {
  year: number;
  month: number;
  totalAmount: number;
  transactionCount: number;
}

export interface RecentBookingDto {
  bookingCode: string;
  homestayName: string;
  guestName: string;
  checkInDate: string;
  totalAmount: number;
  status: string;
}

const API = '/api/v1/partner/dashboard';

const config = () => {
  const token = localStorage.getItem('portal_token');
  return { headers: token ? { Authorization: `Bearer ${token}` } : {}, timeout: 15000 };
};

export const partnerDashboardService = {
  getSummary: async (): Promise<PartnerDashboardSummaryDto> => {
    return (await axios.get<PartnerDashboardSummaryDto>(`${API}/summary`, config())).data;
  }
};
