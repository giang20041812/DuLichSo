import type { ReactNode } from 'react';
import { ShieldAlert, IdCard, CalendarX2, PawPrint, Baby, Dog } from 'lucide-react';
import { HomestayProfileDetail } from '../../types/homestay';

interface HomestayPoliciesSectionProps {
  profile?: HomestayProfileDetail | null;
}

function PolicyRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-slate-50/60 border border-slate-100">
      {icon}
      <p className="leading-relaxed whitespace-pre-line">
        <strong className="font-semibold text-slate-800">{label}:</strong> {children}
      </p>
    </div>
  );
}

/** Chỉ hiển thị mục chính sách nào chỗ nghỉ đã công bố; không có gì thì hiện một dòng hướng dẫn liên hệ. */
export default function HomestayPoliciesSection({ profile }: HomestayPoliciesSectionProps) {
  const iconClass = 'w-4 h-4 text-emerald-600 shrink-0 mt-0.5';
  const rows: { key: string; icon: ReactNode; label: string; value?: string | null }[] = [
    { key: 'rules', icon: <IdCard className={iconClass} />, label: 'Nội quy lưu trú', value: profile?.houseRules },
    { key: 'children', icon: <Baby className={iconClass} />, label: 'Trẻ em', value: profile?.childrenPolicy },
    { key: 'pets', icon: <Dog className={iconClass} />, label: 'Thú cưng', value: profile?.petsPolicy },
    { key: 'cancel', icon: <CalendarX2 className={iconClass} />, label: 'Chính sách hủy phòng', value: profile?.currentPolicy?.description },
    { key: 'surcharge', icon: <PawPrint className={iconClass} />, label: 'Phụ thu', value: profile?.surchargeNote },
  ];
  const published = rows.filter(row => row.value && row.value.trim());
  const hasTimes = !!(profile?.checkInFrom || profile?.checkOutUntil);

  return (
    <section className="space-y-3.5 pt-2">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
        <ShieldAlert className="w-5 h-5 text-emerald-700" />
        <h2>Thông tin lưu trú & Chính sách</h2>
      </div>

      {hasTimes && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-md bg-sky-50/70 border border-sky-100 text-center">
            <span className="text-[11px] text-slate-500 font-medium block">Giờ nhận phòng</span>
            <span className="text-base sm:text-lg font-bold text-sky-950 mt-0.5 block">
              {profile?.checkInFrom ? `Từ ${profile.checkInFrom}` : 'Chưa công bố'}
            </span>
          </div>
          <div className="p-3.5 rounded-md bg-sky-50/70 border border-sky-100 text-center">
            <span className="text-[11px] text-slate-500 font-medium block">Giờ trả phòng</span>
            <span className="text-base sm:text-lg font-bold text-sky-950 mt-0.5 block">
              {profile?.checkOutUntil ? `Trước ${profile.checkOutUntil}` : 'Chưa công bố'}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
        {published.map(row => (
          <PolicyRow key={row.key} icon={row.icon} label={row.label}>{row.value}</PolicyRow>
        ))}
        {!hasTimes && published.length === 0 && (
          <p className="text-slate-500">
            Chỗ nghỉ chưa công bố giờ nhận/trả phòng và chính sách. Vui lòng liên hệ trực tiếp trước khi đặt.
          </p>
        )}
      </div>
    </section>
  );
}
