import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getUserSavedBookings, fetchMyBookings } from "@/services/bookingService";
import { getCurrentCustomer } from "@/services/authService";
import { BookingResponseDto } from "@/types/booking";
import { useNavigate } from "react-router-dom";

export default function RecentBookingTag() {
  const [latestBooking, setLatestBooking] = useState<BookingResponseDto | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const fetchLatest = async () => {
      const customer = getCurrentCustomer();
      if (!customer) {
        const localBookings = getUserSavedBookings();
        if (localBookings && localBookings.length > 0 && mounted) {
          setLatestBooking(localBookings[0]);
        }
        return;
      }

      try {
        const data = await fetchMyBookings({ email: customer.email, phone: customer.phone });
        if (mounted) {
          if (data && data.length > 0) {
            const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setLatestBooking(sorted[0]);
          } else {
            const localBookings = getUserSavedBookings();
            if (localBookings && localBookings.length > 0) {
              setLatestBooking(localBookings[0]);
            }
          }
        }
      } catch (error) {
        console.warn('Cannot fetch recent bookings for tag', error);
        if (mounted) {
          const localBookings = getUserSavedBookings();
          if (localBookings && localBookings.length > 0) {
            setLatestBooking(localBookings[0]);
          }
        }
      }
    };
    
    fetchLatest();
    
    const handleStorageChange = () => fetchLatest();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth_change', handleStorageChange);
    
    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth_change', handleStorageChange);
    };
  }, []);

  if (!latestBooking) return null;

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'Chờ xác nhận',
      AWAITING_PAYMENT: 'Chờ thanh toán',
      CONFIRMED: 'Đã xác nhận',
      CHECKED_IN: 'Đang ở',
      CHECKED_OUT: 'Đã trả phòng',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
      REJECTED: 'Bị từ chối',
      EXPIRED: 'Hết hạn',
      NO_SHOW: 'Không đến'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'AWAITING_PAYMENT':
        return 'text-[var(--color-sun)] bg-[var(--color-sun)]/10 border-[var(--color-sun)]/30';
      case 'CONFIRMED':
      case 'CHECKED_IN':
        return 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30';
      case 'COMPLETED':
        return 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30';
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_SHOW':
      case 'EXPIRED':
        return 'text-rose-600 bg-rose-100 border-rose-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="w-full flex justify-center py-1.5 px-3 animate-in slide-in-from-top-2 fade-in duration-300">
      <button
        type="button"
        onClick={() => navigate(`/bookings/${latestBooking.bookingCode}`)}
        className="flex items-center gap-2 max-w-full sm:max-w-md px-3 py-1.5 bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-full text-[13px] font-medium cursor-pointer hover:bg-white transition-all hover:shadow-md hover:-translate-y-px active:translate-y-0 group"
      >
        <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-[#edfbf7] text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors shadow-xs">
          <Clock className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-gray-500 shrink-0 hidden sm:inline">Đơn đặt:</span>
          <span className="font-bold text-gray-800 truncate" title={latestBooking.placeName}>
            {latestBooking.placeName}
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusColor(latestBooking.status)}`}>
          {getStatusLabel(latestBooking.status)}
        </div>
      </button>
    </div>
  );
}
