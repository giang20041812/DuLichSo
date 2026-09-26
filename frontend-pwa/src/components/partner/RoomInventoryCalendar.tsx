import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { partnerRoomService as api } from '@/services/partnerRoomService';
import { homestayError } from '@/services/partnerHomestayService';
import ConfirmDialog, { type ConfirmRequest } from '@/components/partner/ConfirmDialog';
import type { PartnerRoom, RoomInventoryDay } from '@/types/room';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (value: string, n: number) => { const d = new Date(`${value}T00:00:00`); d.setDate(d.getDate() + n); return iso(d); };
const shortMoney = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr` : `${Math.round(n / 1000)}k`);
const field = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none';
type Mode = 'close' | 'broken' | 'open';

/**
 * FR-NCC-09: lịch phòng theo tháng cho một loại phòng. NCC chọn một ngày hoặc khoảng ngày để ngừng phục vụ,
 * khai báo số phòng hỏng/bảo trì (giảm số phòng mở bán) hoặc mở bán lại. Đơn đã giữ/xác nhận không bị ảnh hưởng.
 */
export default function RoomInventoryCalendar({ placeId, room, onChanged }: { placeId: number; room: PartnerRoom; onChanged?: () => void }) {
  const today = iso(new Date());
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [days, setDays] = useState<RoomInventoryDay[]>([]);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selection, setSelection] = useState<{ from: string; to: string } | null>(null);
  const [mode, setMode] = useState<Mode>('close');
  const [broken, setBroken] = useState(1);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const monthStart = iso(month);
  const monthEnd = iso(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  useEffect(() => {
    let active = true;
    api.calendar(placeId, room.id, monthStart, monthEnd)
      .then((d) => { if (active) { setDays(d); setError(''); } })
      .catch((e: unknown) => { if (active) setError(homestayError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [placeId, room.id, monthStart, monthEnd, reload]);

  const byDate = useMemo(() => new Map(days.map((d) => [d.stayDate, d])), [days]);
  const leading = (month.getDay() + 6) % 7;
  const cells: (string | null)[] = [...Array<null>(leading).fill(null)];
  for (let d = new Date(month); d.getMonth() === month.getMonth(); d.setDate(d.getDate() + 1)) cells.push(iso(d));

  const inSelection = (date: string) => selection !== null && date >= selection.from && date <= selection.to;
  const selectedDays = selection ? days.filter((d) => inSelection(d.stayDate)) : [];
  const maxBooked = selectedDays.reduce((m, d) => Math.max(m, d.heldRooms + d.confirmedRooms), 0);
  const reasons = [...new Set(selectedDays.map((d) => d.blockReason).filter((r): r is string => !!r))];

  function pick(date: string) {
    if (date < today) return;
    setMessage('');
    if (!selection || selection.from !== selection.to || date < selection.from) setSelection({ from: date, to: date });
    else setSelection({ from: selection.from, to: date });
  }

  function changeMonth(delta: number) {
    setLoading(true); setSelection(null);
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  async function apply() {
    if (!selection) return;
    const totalRooms = mode === 'broken' ? room.totalRoomCount - broken : room.totalRoomCount;
    setBusy(true); setError(''); setMessage('');
    try {
      await api.inventory(placeId, room.id, { startDate: selection.from, endDate: addDays(selection.to, 1), totalRooms, stopSell: mode === 'close', reason: mode === 'open' ? undefined : reason.trim() });
      setMessage(mode === 'open' ? 'Đã mở bán lại các ngày đã chọn.' : 'Đã cập nhật lịch phòng.');
      setSelection(null); setReason(''); setLoading(true); setReload((n) => n + 1); onChanged?.();
    } catch (e: unknown) { setError(homestayError(e)); }
    finally { setBusy(false); }
  }

  const rangeText = selection ? (selection.from === selection.to ? selection.from : `${selection.from} → ${selection.to}`) : '';
  const invalid = mode !== 'open' && !reason.trim() || (mode === 'broken' && (broken < 1 || room.totalRoomCount - broken < maxBooked));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => changeMonth(-1)} disabled={monthStart <= iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="rounded-md border border-border p-1.5 disabled:opacity-40" aria-label="Tháng trước"><ChevronLeft size={16} /></button>
        <p className="text-sm font-semibold text-ink-deep">Tháng {month.getMonth() + 1}/{month.getFullYear()}</p>
        <button type="button" onClick={() => changeMonth(1)} className="rounded-md border border-border p-1.5" aria-label="Tháng sau"><ChevronRight size={16} /></button>
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm border border-border bg-surface" /> Mở bán</span>
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm bg-sun-light" /> Có phòng hỏng / giảm phòng</span>
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm bg-danger/15" /> Ngừng phục vụ</span>
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm bg-primary-100" /> Đang chọn</span>
      </div>
      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-2.5 text-sm text-danger">{error}</p>}
      {message && <p role="status" className="text-sm text-primary">{message}</p>}

      <div className={`grid grid-cols-7 gap-1 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        {WEEKDAYS.map((w) => <div key={w} className="py-1 text-center text-[11px] font-semibold text-muted">{w}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />;
          const d = byDate.get(date);
          const past = date < today;
          const booked = d ? d.heldRooms + d.confirmedRooms : 0;
          const tone = inSelection(date) ? 'border-primary bg-primary-100' : d?.stopSell ? 'border-danger/30 bg-danger/10' : d && d.totalRooms < room.totalRoomCount ? 'border-sun/50 bg-sun-light/60' : 'border-border bg-surface';
          return (
            <button key={date} type="button" disabled={past} onClick={() => pick(date)} title={d?.blockReason ?? undefined}
              className={`flex min-h-[64px] flex-col items-start rounded-md border p-1.5 text-left text-[11px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}>
              <span className={`font-semibold ${date === today ? 'text-primary' : 'text-ink-deep'}`}>{Number(date.slice(8))}</span>
              {d && (d.stopSell ? <span className="font-semibold text-danger">Ngừng</span>
                : <span className="text-ink">Còn {d.availableRooms}/{d.totalRooms}</span>)}
              {d && booked > 0 && <span className="text-muted">Đặt {booked}</span>}
              {d && !d.stopSell && <span className="hidden text-muted sm:inline">{shortMoney(d.price)}</span>}
            </button>
          );
        })}
      </div>

      {selection ? (
        <form className="flex flex-col gap-3 rounded-md border border-border p-3" onSubmit={(e) => {
          e.preventDefault();
          setConfirm({
            title: `Cập nhật lịch ${rangeText}?`, confirmLabel: 'Xác nhận', tone: mode === 'close' ? 'danger' : 'primary',
            body: <>{mode === 'close' ? 'Ngừng nhận đặt phòng mới' : mode === 'broken' ? `Giảm ${broken} phòng (còn ${room.totalRoomCount - broken}/${room.totalRoomCount} phòng mở bán)` : 'Mở bán lại toàn bộ phòng'} cho <b>{room.name}</b>, {rangeText}.
              {maxBooked > 0 && <><br />Có ngày đã có {maxBooked} phòng được đặt — các đơn này vẫn giữ nguyên.</>}</>,
            onConfirm: () => void apply(),
          });
        }}>
          <p className="text-sm font-semibold text-ink-deep">Đã chọn: {rangeText} <button type="button" onClick={() => setSelection(null)} className="ml-2 text-xs font-normal text-muted underline">Bỏ chọn</button></p>
          <p className="text-xs text-muted">Bấm ngày đầu rồi bấm ngày cuối để chọn một khoảng ngày.</p>
          {reasons.length > 0 && <p className="rounded-md bg-canvas p-2 text-xs text-ink">Lý do đang ghi: {reasons.join(" · ")}</p>}
          <fieldset disabled={busy} className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-1 rounded-md bg-canvas p-1 text-xs font-semibold">
              {(['close', 'broken', 'open'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={`rounded px-2 py-1.5 ${mode === m ? 'bg-surface text-primary shadow-xs' : 'text-muted'}`}>
                  {m === 'close' ? 'Ngừng phục vụ' : m === 'broken' ? 'Phòng hỏng' : 'Mở bán lại'}
                </button>
              ))}
            </div>
            {mode === 'broken' && (
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Số phòng hỏng / bảo trì (tổng {room.totalRoomCount} phòng)
                <input className={field} type="number" min={1} max={room.totalRoomCount} value={broken} onChange={(e) => setBroken(Number(e.target.value))} />
                {room.totalRoomCount - broken < maxBooked && <span className="font-normal text-danger">Có ngày đã đặt {maxBooked} phòng, chỉ khai báo tối đa {room.totalRoomCount - maxBooked} phòng hỏng.</span>}
              </label>
            )}
            {mode !== 'open' && (
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Lý do *
                <input className={field} required maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={mode === 'close' ? 'VD: Nghỉ lễ, sửa chữa nhà, việc gia đình...' : 'VD: Phòng 102 hỏng điều hòa'} />
              </label>
            )}
            <button disabled={invalid} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-700 disabled:opacity-50">
              {busy ? 'Đang lưu...' : 'Áp dụng'}
            </button>
          </fieldset>
        </form>
      ) : (
        <p className="text-xs text-muted">Chọn ngày trên lịch để ngừng phục vụ, khai báo phòng hỏng hoặc mở bán lại. Chọn ngày để xem lý do đang ghi.</p>
      )}
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
