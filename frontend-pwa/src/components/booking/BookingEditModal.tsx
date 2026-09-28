import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  Calendar,
  BedDouble,
  Users,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';
import type { BookingResponseDto, UpdateBookingDetailsRequest, CheckAvailabilityResponse, BookedDateRangeDto } from '@/types/booking';
import { updateBookingDetails, checkRoomAvailability, fetchBookedDatesByRoom } from '@/services/bookingService';
import RoomAvailabilityCalendar from '@/components/homestay/RoomAvailabilityCalendar';

interface BookingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingResponseDto;
  onSuccess: (updatedBooking: BookingResponseDto) => void;
}

export default function BookingEditModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: BookingEditModalProps) {
  const isPending = booking.status === 'PENDING' || booking.status === 'AWAITING_PAYMENT';
  const isConfirmed = booking.status === 'CONFIRMED';

  const [guestName, setGuestName] = useState(booking.guestName || '');
  const [guestPhone, setGuestPhone] = useState(booking.guestPhone || '');
  const [guestEmail, setGuestEmail] = useState(booking.guestEmail || '');
  const [guestNote, setGuestNote] = useState(booking.guestNote || '');
  const [checkIn, setCheckIn] = useState(booking.checkIn || '');
  const [checkOut, setCheckOut] = useState(booking.checkOut || '');
  const [roomCount, setRoomCount] = useState<number>(booking.roomCount || 1);
  const [guestCount, setGuestCount] = useState<number>(booking.guestCount || 1);
  const [reason, setReason] = useState('');

  // Kiểm tra lịch phòng trống
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<CheckAvailabilityResponse | null>(null);
  const [roomBookedDates, setRoomBookedDates] = useState<BookedDateRangeDto[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
      
    // Fetch booked dates for this room
    if (booking.roomTypeId) {
      fetchBookedDatesByRoom(booking.roomTypeId).then((data) => {
        if (isMounted) setRoomBookedDates(data);
      }).catch(() => {});
    }
      
    return () => {
      isMounted = false;
    };
  }, [isOpen, booking.roomTypeId]);

  // Reset kết quả kiểm tra lịch nếu người dùng sửa ngày hoặc số phòng
  const handleDateOrRoomChange = (
    newCheckIn: string,
    newCheckOut: string,
    newRoomCount: number
  ) => {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
    setRoomCount(newRoomCount);
    setAvailabilityResult(null);
  };

  // Hàm kiểm tra lịch phòng
  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) {
      setErrorMsg('Vui lòng chọn ngày nhận phòng và ngày trả phòng trước khi kiểm tra.');
      return;
    }
    if (checkOut <= checkIn) {
      setErrorMsg('Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }
    setErrorMsg(null);
    setIsCheckingAvailability(true);

    try {
      const result = await checkRoomAvailability(
        booking.roomTypeId,
        checkIn,
        checkOut,
        roomCount,
        booking.bookingCode
      );
      setAvailabilityResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kiểm tra tình trạng phòng.';
      setErrorMsg(msg);
      setAvailabilityResult(null);
    } finally {
      setIsCheckingAvailability(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guestName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên khách lưu trú.');
      return;
    }
    if (!guestPhone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }
    if (!checkIn || !checkOut) {
      setErrorMsg('Vui lòng chọn ngày nhận phòng và trả phòng.');
      return;
    }
    if (checkOut <= checkIn) {
      setErrorMsg('Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }
    if (roomCount < 1) {
      setErrorMsg('Số lượng phòng phải từ 1 trở lên.');
      return;
    }
    if (guestCount < 1) {
      setErrorMsg('Số lượng khách phải từ 1 trở lên.');
      return;
    }
    if (isConfirmed && !reason.trim()) {
      setErrorMsg('Đơn đã xác nhận: Vui lòng nhập lý do đề xuất thay đổi để gửi cho nhà quản lý duyệt.');
      return;
    }

    // Nếu đã kiểm tra lịch và thấy hết phòng, chặn submit
    if (availabilityResult && !availabilityResult.available) {
      setErrorMsg('Khoảng thời gian này đã hết phòng. Vui lòng kiểm tra và chọn ngày khác trước khi lưu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateBookingDetailsRequest = {
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim() || undefined,
        guestNote: guestNote.trim() || undefined,
        checkIn,
        checkOut,
        roomCount,
        guestCount,
        reason: isConfirmed ? reason.trim() : undefined,
        serviceItems: booking.serviceItems || [],
      };

      const updated = await updateBookingDetails(booking.bookingCode, payload);
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu thay đổi đặt phòng.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-2 sm:p-4 pt-20 sm:pt-24 pb-8 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[calc(100vh-6.5rem)] flex flex-col shadow-2xl border border-gray-200 overflow-hidden my-auto sm:my-0">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-[var(--color-primary)]" />
              <span>{isPending ? 'Chỉnh sửa chi tiết đặt phòng' : 'Gửi yêu cầu thay đổi đặt phòng'}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Mã booking: <strong className="font-mono text-[var(--color-primary)]">#{booking.bookingCode}</strong> ({booking.roomTypeName})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo phân nhánh PENDING vs CONFIRMED */}
        <div className="px-5 pt-3 shrink-0">
          {isPending ? (
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-md text-teal-800 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đơn đang chờ duyệt (PENDING):</span>
                <p className="text-[11px] text-teal-700 mt-0.5">
                  Bạn có thể cập nhật trực tiếp thông tin liên hệ, thời gian, số phòng, số khách và thêm/bớt các dịch vụ tư vấn đính kèm.
                </p>
              </div>
            </div>
          ) : isConfirmed ? (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đơn đã xác nhận (CONFIRMED):</span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Mọi thay đổi về thời gian, số phòng, dịch vụ tư vấn hay thông tin khách sẽ được chuyển thành yêu cầu gửi nhà quản lý duyệt trước khi có hiệu lực.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-md text-gray-700 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500 shrink-0" />
              <span>Trạng thái đơn hiện tại: {booking.status}.</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-5 mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Form Body cuộn mượt */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-3.5 space-y-4 text-xs">
          {/* Nhóm 1: Thông tin khách liên hệ */}
          <div className="space-y-3 p-3.5 bg-[#F6FAF8] rounded-md border border-gray-100">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              Thông tin người liên hệ
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Họ và tên khách <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-500 font-medium mb-1">Email nhận xác nhận</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Lịch trình & Số lượng phòng + NÚT CHECK LỊCH PHÒNG */}
          <div className="space-y-3 p-3.5 bg-[#F6FAF8] rounded-md border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Thời gian &amp; Số lượng phòng
              </span>

              {/* Nút kiểm tra lịch phòng */}
              <button
                type="button"
                onClick={handleCheckAvailability}
                disabled={isCheckingAvailability || !checkIn || !checkOut}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCheckingAvailability ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3 h-3" />
                    <span>Kiểm tra phòng trống</span>
                  </>
                )}
              </button>
            </div>

            {/* Thông báo kết quả kiểm tra lịch phòng */}
            {availabilityResult && (
              <div
                className={`p-2.5 rounded-md text-xs flex items-start gap-2 transition-all ${
                  availabilityResult.available
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {availabilityResult.available ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-bold block">
                    {availabilityResult.available ? 'Phòng khả dụng' : 'Không thể đặt'}
                  </span>
                  <p className="text-[11px] mt-0.5 leading-snug">
                    {availabilityResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Nhận phòng (Check-in) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={checkIn}
                  onChange={(e) => handleDateOrRoomChange(e.target.value, checkOut, roomCount)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Trả phòng (Check-out) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  value={checkOut}
                  onChange={(e) => handleDateOrRoomChange(checkIn, e.target.value, roomCount)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                />
              </div>
            </div>

            <div className="bg-slate-50/70 p-2 md:p-3 rounded-md border border-slate-200 mt-3">
              <RoomAvailabilityCalendar
                bookedDates={roomBookedDates}
                totalRoomCount={booking.roomCount || 1} // Fallback to current if max unknown
                requestedRoomCount={roomCount}
                selectedCheckIn={checkIn}
                selectedCheckOut={checkOut}
                onSelectDates={(inDate, outDate) => {
                  handleDateOrRoomChange(inDate, outDate, roomCount);
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Số lượng phòng <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <BedDouble className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={roomCount}
                    onChange={(e) =>
                      handleDateOrRoomChange(checkIn, checkOut, parseInt(e.target.value) || 1)
                    }
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-medium mb-1">
                  Số lượng khách <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Users className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>



          {/* Ghi chú chung */}
          <div>
            <label className="block text-gray-500 font-medium mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-gray-400" />
              <span>Ghi chú thêm cho chủ homestay</span>
            </label>
            <textarea
              rows={2}
              value={guestNote}
              onChange={(e) => setGuestNote(e.target.value)}
              placeholder="VD: Đến muộn sau 18h, cần đệm phụ..."
              className="w-full p-2.5 bg-white border border-gray-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-hidden resize-none"
            />
          </div>

          {/* Lý do thay đổi (bắt buộc khi CONFIRMED) */}
          {isConfirmed && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-md space-y-1.5">
              <label className="block text-amber-900 font-bold text-xs">
                Lý do yêu cầu thay đổi <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Chuyến bay bị hoãn, muốn dời ngày nhận phòng sang hôm sau..."
                className="w-full p-2.5 bg-white border border-amber-200 rounded-md text-slate-800 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden resize-none"
              />
              <span className="text-[11px] text-amber-700 block">
                Yêu cầu này sẽ được gửi ngay đến Nhà quản lý để thẩm định tình trạng phòng và liên hệ xác nhận lại với bạn.
              </span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (availabilityResult !== null && !availabilityResult.available)}
              className="px-5 py-2 text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[#059669] rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : isPending ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi ngay</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi yêu cầu cho quản lý</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

