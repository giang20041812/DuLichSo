import { PhoneCall, Mail, Phone, ChevronRight } from 'lucide-react';
import { PlaceContactItem } from '../../types/homestay';

interface HomestayContactSectionProps {
  contacts: PlaceContactItem[];
}

export default function HomestayContactSection({ contacts }: HomestayContactSectionProps) {
  const phoneContact = contacts.find((c) => c.channel === 'PHONE')?.value || '(+84) 0376 289 712';
  const emailContact = contacts.find((c) => c.channel === 'EMAIL' || c.channel === 'ZALO')?.value || 'banlimmongecolodge@dulichso.vn';

  return (
    <section className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
        <PhoneCall className="w-5 h-5 text-emerald-700" />
        <h2>Kênh liên hệ đón tiếp công khai</h2>
      </div>

      <div className="space-y-2.5">
        {/* Phone Contact Card */}
        <a
          href={`tel:${phoneContact.replace(/\D/g, '')}`}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/70 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Số điện thoại quản lý homestay
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                {phoneContact}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </a>

        {/* Email / Zalo Card */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-slate-500 font-medium block">
                Email / Zalo tiếp đón
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate block">
                {emailContact}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
