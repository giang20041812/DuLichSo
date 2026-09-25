import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';
import type { BookingResponseDto } from '@/types/booking';
import { cancelBooking } from '@/services/bookingService';

interface BookingCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingResponseDto;
  onSuccess: (updatedBooking: BookingResponseDto) => void;
}

const CANCEL_REASONS = [
  'Thay đổi lịch trình / kế hoạch du lịch cá nhân',
  'Tìm thấy lựa chọn lưu trú khác phù hợp hơn',
  'Thời tiết xấu / sạt lở hoặc sự cố di chuyển',
  'Đặt nhầm ngày hoặc thông tin phòng',
  'Lý do sức khỏe hoặc việc gia đình đột xuất',
  'Lý do khác',
];

export default function BookingCancelModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: BookingCancelModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0] || '');
  const [customNote, setCustomNote] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Tính toán thời gian và chính sách hoàn tiền
  const now = new Date();
  const checkInDate = new Date(`${booking.checkIn}T14:00:00`);
  const diffHours = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  const policy = booking.policySnapshot || {};
  const cutoff = typeof policy.freeCancelCutoffHours === 'number' ? policy.freeCancelCutoffHours : 24;

  const isEligibleForRefund = booking.status === 'CONFIRMED' && diffHours >= cutoff;
  const isLateCancel = diffHours < cutoff && diffHours > 0;
  const hasPassedCheckIn = diffHours <= 0;

  const refundAmount = isEligibleForRefund ? booking.totalAmount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) {
      setErrorMsg('Vui lòng xác nhận bạn đã hiểu rõ quy định hủy phòng.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const note = selectedReason === 'Lý do khác' ? customNote.trim() : selectedReason + (customNote ? ` (${customNote.trim()})` : '');
      const updated = await cancelBooking(booking.bookingCode, selectedReason, note);
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xử lý hủy đặt phòng.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 pt-24 sm:pt-28 pb-8 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-lg border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#F6FAF8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Yêu cầu hủy đặt phòng</h3>
              <p className="text-xs text-gray-500 font-mono">Mã đơn: #{booking.bookingCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Tóm tắt đơn đặt */}
          <div className="p-3.5 bg-slate-50 border border-gray-200/80 rounded-md space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Chỗ nghỉ</span>
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                  {booking.placeName}
                </span>
                <span className="text-gray-500 block mt-0.5">{booking.roomTypeName}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tổng giá trị</span>
                <span className="font-bold text-slate-800 text-sm text-[var(--color-coral)]">
                  {Number(booking.totalAmount || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200/70 grid grid-cols-2 gap-2 text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Nhận phòng: <strong>{booking.checkIn}</strong> (14:00)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Trả phòng: <strong>{booking.checkOut}</strong> (12:00)</span>
              </div>
            </div>
          </div>

          {/* Phân tích chính sách hủy */}
          <div className="p-3.5 rounded-md border space-y-2.5 transition-all bg-[#F6FAF8] border-gray-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Chính sách áp dụng: {String(policy.policyName || 'Tiêu chuẩn')}
              </span>
            </div>

            {isEligibleForRefund ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đủ điều kiện hoàn tiền 100%!</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Thời gian nhận phòng còn hơn {cutoff} giờ. Bạn sẽ được hoàn lại toàn bộ số tiền đã cọc:{' '}
                  <strong>{Number(refundAmount).toLocaleString('vi-VN')} đ</strong> qua phương thức thanh toán ban đầu.
                </p>
              </div>
            ) : isLateCancel ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Hủy cận giờ nhận phòng (dưới {cutoff}h)</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Theo quy định của homestay, hủy phòng trong vòng {cutoff}h trước giờ nhận phòng sẽ tính phí phạt theo chính sách. Số tiền hoàn dự kiến: <strong>0 đ</strong>.
                </p>
              </div>
            ) : hasPassedCheckIn ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Đã quá thời gian nhận phòng</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Đơn đặt phòng này đã quá giờ nhận phòng dự kiến. Hủy đơn sẽ không được hoàn tiền.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                <p className="text-[11px] leading-relaxed">
                  Đơn đặt phòng đang ở trạng thái chờ duyệt. Việc hủy sẽ giải phóng giữ chỗ ngay lập tức và không phát sinh phí.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-gray-200/60 font-semibold text-slate-700">
              <span>Số tiền hoàn dự kiến:</span>
              <span className={`text-sm font-bold ${isEligibleForRefund ? 'text-emerald-600' : 'text-slate-700'}`}>
                {Number(refundAmount).toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Chọn lý do hủy */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800">
              Lý do bạn muốn hủy đơn <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-2.5 rounded-md border transition-all cursor-pointer ${
                    selectedReason === r
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle,#E6F4F1)] text-[var(--color-primary)] font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700 font-normal'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="accent-[var(--color-primary)] cursor-pointer"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div className="pt-1.5">
              <label htmlFor="customNote" className="block text-gray-600 mb-1">
                Ghi chú thêm (không bắt buộc):
              </label>
              <textarea
                id="customNote"
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Nhập thêm chi tiết hoặc nguyện vọng hỗ trợ..."
                className="w-full px-3 py-2 text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Cam kết */}
          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="mt-0.5 accent-[var(--color-primary)] rounded-xs cursor-pointer"
              />
              <span className="text-[11px] text-gray-600 leading-snug">
                Tôi xác nhận đã đọc, hiểu và đồng ý với chính sách hủy phòng của homestay cùng điều khoản hoàn tiền (nếu có).
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nút hành động */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Giữ lại đơn phòng
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isAgreed}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-md transition-all shadow-sm shadow-rose-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý hủy...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Xác nhận hủy đặt phòng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
