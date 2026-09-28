import PartnerBookingList from '@/components/partner/PartnerBookingList';
import PartnerBookingChangeRequests from '@/components/partner/PartnerBookingChangeRequests';
import { PageHeader } from '@/components/partner/PartnerUI';

export default function PartnerBookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[{ label: 'Bảng điều khiển', to: '/partner' }, { label: 'Đơn đặt phòng' }]}
        title="Đơn đặt phòng"
        description="Chọn một đơn để kiểm tra thông tin, tình trạng phòng và chấp nhận hoặc từ chối yêu cầu."
      />
      <PartnerBookingChangeRequests />
      <PartnerBookingList />
    </div>
  );
}
