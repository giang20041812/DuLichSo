import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentCustomer } from '@/services/authService';
import { fetchMyBookings, getUserSavedBookings } from '@/services/bookingService';
import type { BookingResponseDto } from '@/types/booking';
import { ChevronRight, CalendarCheck } from 'lucide-react';

export default function RecentBookingBanner() {
  const [booking, setBooking] = useState<BookingResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customer = getCurrentCustomer();
    if (!customer) {
      // If not logged in, we check local storage just in case they booked as guest on this device
      const localBookings = getUserSavedBookings();
      if (localBookings.length > 0) {
        setBooking(localBookings[0] || null);
      }
      setLoading(false);
      return;
    }

    // Try fetching from server
    fetchMyBookings({ email: customer.email, phone: customer.phone })
      .then((data) => {
        if (data && data.length > 0) {
          // Sort by createdAt descending
          const sorted = [...data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setBooking(sorted[0] || null);
        } else {
          // fallback to local storage
          const localBookings = getUserSavedBookings();
          if (localBookings.length > 0) {
            setBooking(localBookings[0] || null);
          }
        }
      })
      .catch((err) => {
        console.warn('Cannot fetch recent bookings', err);
        const localBookings = getUserSavedBookings();
        if (localBookings.length > 0) {
          setBooking(localBookings[0] || null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !booking) return null;

  const getStatusText = (s: string) => {
    switch (s) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'AWAITING_PAYMENT': return 'Chờ thanh toán';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'CHECKED_IN': return 'Đang ở';
      case 'CHECKED_OUT': return 'Đã trả phòng';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      case 'REJECTED': return 'Từ chối';
      case 'EXPIRED': return 'Hết hạn giữ chỗ';
      case 'NO_SHOW': return 'Không đến';
      default: return 'Không xác định';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'PENDING':
      case 'AWAITING_PAYMENT': return 'text-amber-600 bg-amber-100 border-amber-200';
      case 'CONFIRMED':
      case 'CHECKED_IN':
      case 'CHECKED_OUT':
      case 'COMPLETED': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="w-full bg-white shadow-sm border-b border-gray-200 relative z-40">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="truncate text-sm">
            <span className="text-gray-500 mr-1">Đơn đặt phòng gần nhất:</span>
            <span className="font-semibold text-ink-deep truncate">{booking.placeName}</span>
          </div>
          <div className={`hidden sm:flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider items-center ${getStatusColor(booking.status)}`}>
            {getStatusText(booking.status)}
          </div>
        </div>
        
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className={`sm:hidden px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider items-center ${getStatusColor(booking.status)}`}>
            {getStatusText(booking.status)}
          </div>
          <Link 
            to={`/bookings/${booking.bookingCode}`}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-600 transition-colors whitespace-nowrap"
          >
            Xem chi tiết <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

