import BookingsPanel from '@/components/admin/BookingsPanel';

export default function PartnerBookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-coral-hover">Cổng nhà cung cấp</p>
        <h1 className="font-display text-2xl font-extrabold text-ink-deep">Đơn đặt phòng</h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
          Thông tin khách và lịch lưu trú của các đơn đặt tại homestay của bạn.
        </p>
      </div>
      <BookingsPanel scope="partner" />
    </div>
  );
}
