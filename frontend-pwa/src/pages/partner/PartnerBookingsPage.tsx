import PartnerBookingList from '@/components/partner/PartnerBookingList';

export default function PartnerBookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Quản lý lưu trú</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-deep sm:text-3xl">Đơn đặt phòng</h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
          Chọn một đơn để kiểm tra thông tin, tình trạng phòng và chấp nhận hoặc từ chối yêu cầu.
        </p>
      </div>
      <PartnerBookingList />
    </div>
  );
}
