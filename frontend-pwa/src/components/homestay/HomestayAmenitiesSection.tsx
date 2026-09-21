import { Sparkles, Utensils, ChefHat, Droplets, ShieldCheck, Car, Bus } from 'lucide-react';
import { PlaceAmenityItem } from '../../types/homestay';

interface HomestayAmenitiesSectionProps {
  amenities: PlaceAmenityItem[];
}

export default function HomestayAmenitiesSection({ amenities }: HomestayAmenitiesSectionProps) {
  const getIcon = (code: string) => {
    switch (code) {
      case 'MEAL_ON_DEMAND':
        return <Utensils className="w-5 h-5 text-blue-600" />;
      case 'FREE_KITCHEN':
        return <ChefHat className="w-5 h-5 text-blue-600" />;
      case 'HOT_WATER':
        return <Droplets className="w-5 h-5 text-blue-600" />;
      case 'MOSQUITO_NET':
        return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      case 'PARKING':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'BUS_PICKUP':
        return <Bus className="w-5 h-5 text-blue-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <section className="space-y-3 pt-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
          <Sparkles className="w-5 h-5 text-emerald-700" />
          <h2>Tiện nghi & Dịch vụ thực tế</h2>
        </div>
        <p className="text-xs text-slate-500">
          Các tiện ích được xác minh phù hợp với điều kiện làng bản vùng cao biên giới Tây Bắc.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {amenities.map((item) => (
          <div
            key={item.id || item.code}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/70 transition-colors"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              {getIcon(item.code)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2">
                {item.name}
              </h4>
              {item.note && (
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {item.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
