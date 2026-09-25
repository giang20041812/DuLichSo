import { ShieldAlert, IdCard, CalendarX2, PawPrint } from 'lucide-react';
import { HomestayProfileDetail } from '../../types/homestay';

interface HomestayPoliciesSectionProps {
  profile?: HomestayProfileDetail | null;
}

export default function HomestayPoliciesSection({ profile }: HomestayPoliciesSectionProps) {
  const checkIn = profile?.checkInFrom || 'Chưa công bố';
  const checkOut = profile?.checkOutUntil || 'Chưa công bố';
  const policyDesc = profile?.currentPolicy?.description || 
    'Chưa công bố chính sách hủy phòng. Vui lòng liên hệ chỗ nghỉ.';

  return (
    <section className="space-y-3.5 pt-2">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
        <ShieldAlert className="w-5 h-5 text-emerald-700" />
        <h2>Thông tin lưu trú & Chính sách</h2>
      </div>

      {/* Checkin / Checkout times */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-center">
          <span className="text-[11px] text-slate-500 font-medium block">Giờ nhận phòng</span>
          <span className="text-base sm:text-lg font-bold text-sky-950 mt-0.5 block">
            Từ {checkIn}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-center">
          <span className="text-[11px] text-slate-500 font-medium block">Giờ trả phòng</span>
          <span className="text-base sm:text-lg font-bold text-sky-950 mt-0.5 block">
            Trước {checkOut}
          </span>
        </div>
      </div>

      {/* Rules & Policy List */}
      <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
          <IdCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-slate-800">Nội quy lưu trú:</strong> {profile?.houseRules || 'Chưa công bố nội quy.'}
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
          <CalendarX2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-slate-800">Chính sách hủy phòng:</strong> {policyDesc}
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
          <PawPrint className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-slate-800">Phụ thu:</strong> {profile?.surchargeNote || 'Vui lòng liên hệ chỗ nghỉ để biết quy định phụ thu.'}
          </p>
        </div>
      </div>
    </section>
  );
}
