import { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { submitBookingReview } from '@/services/bookingService';
import type { ReviewDto } from '@/types/review';

interface BookingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingCode: string;
  placeName: string;
  roomTypeName?: string;
  onSuccess: (review: ReviewDto) => void;
}

export default function BookingReviewModal({
  isOpen,
  onClose,
  bookingCode,
  placeName,
  roomTypeName,
  onSuccess,
}: BookingReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) {
      setErrorMsg('Vui lòng chia sẻ nhận xét chi tiết hơn (tối thiểu 5 ký tự).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const newReview = await submitBookingReview(bookingCode, {
        rating,
        content: content.trim(),
      });
      onSuccess(newReview);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi đánh giá.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'Tuyệt vời & rất hài lòng';
      case 4:
        return 'Hài lòng & dịch vụ tốt';
      case 3:
        return 'Bình thường, tạm ổn';
      case 2:
        return 'Chưa được như kỳ vọng';
      case 1:
        return 'Thất vọng, cần cải thiện';
      default:
        return '';
    }
  };

  const activeScore = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-lg border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#F6FAF8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#048C73]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Đánh giá kỳ nghỉ của bạn</h3>
              <p className="text-xs text-gray-500">Mã đơn: #{bookingCode}</p>
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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 bg-slate-50 border border-gray-200/70 rounded-md">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chỗ nghỉ</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{placeName}</div>
            {roomTypeName && (
              <div className="text-xs text-gray-600 mt-0.5">Hạng phòng: {roomTypeName}</div>
            )}
          </div>

          {/* Chọn số sao */}
          <div className="space-y-1.5 text-center py-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Mức độ hài lòng của bạn
            </label>
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  title={`${star} sao`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= activeScore
                        ? 'fill-[var(--color-sun)] text-[var(--color-sun)]'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-[var(--color-coral)] min-h-[18px]">
              {getRatingLabel(activeScore)}
            </div>
          </div>

          {/* Ô nhập nhận xét */}
          <div className="space-y-1.5">
            <label htmlFor="reviewContent" className="block text-xs font-bold text-gray-700">
              Chia sẻ trải nghiệm thực tế <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="reviewContent"
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ về không gian homestay, sự hiếu khách của chủ nhà, món ăn bản địa, vị trí phong cảnh xung quanh..."
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all placeholder:text-gray-400"
            />
            <div className="flex justify-between items-center text-[11px] text-gray-400">
              <span>Tối thiểu 5 ký tự</span>
              <span>{content.length}/2000</span>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lời cam kết xanh */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-md flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Đánh giá của bạn sẽ giúp cộng đồng du khách tiếp cận dịch vụ chân thực và khích lệ các chủ homestay bản địa không ngừng nâng cao chất lượng.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[var(--color-coral)] hover:bg-[#ea580c] active:translate-y-0.5 rounded-md transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>Gửi đánh giá</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
