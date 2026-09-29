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
  rejectedBookings: number;
  statusTrend: DailyStatusPoint[];
  revenueTrend: MonthlyRevenuePoint[];
  recentBookings: RecentBookingDto[];
}

export interface MonthlyRevenuePoint {
  year: number;
  month: number;
  totalAmount: number;
  transactionCount: number;
}

export interface DailyStatusPoint {
  date: string;
  completed: number;
  pending: number;
  cancelled: number;
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
  getSummary: async (year?: number, month?: number, homestayId?: number): Promise<PartnerDashboardSummaryDto> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (homestayId) params.append('homestayId', homestayId.toString());
    const query = params.toString();
    return (await axios.get<PartnerDashboardSummaryDto>(`${API}/summary${query ? `?${query}` : ''}`, config())).data;
  }
};
