import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  BedDouble, CalendarDays, DoorOpen, Maximize2, Pencil, Plus, Search, Trash2, Users, X,
} from 'lucide-react';
import type { PartnerRoom, PartnerRoomInput, RoomPrice, RoomPriceInput, RoomQuote } from '@/types/room';
import type { HomestayOptionsDto } from '@/types/partner';
import { partnerRoomService as api } from '@/services/partnerRoomService';
import { fetchPartnerHomestays, homestayError } from '@/services/partnerHomestayService';
import { isSubmittedChange } from '@/services/changeRequestService';
import MediaManager from '@/components/partner/MediaManager';
import MoneyInput from '@/components/partner/MoneyInput';
import PendingPhotoPicker from '@/components/partner/PendingPhotoPicker';
import { partnerMediaService } from '@/services/partnerMediaService';
import RoomInventoryCalendar from '@/components/partner/RoomInventoryCalendar';
import ConfirmDialog, { type ConfirmRequest } from '@/components/partner/ConfirmDialog';
import { Alert, EmptyState, Field, LoadingBlock, PageHeader, Pill, Tabs, type TabItem } from '@/components/partner/PartnerUI';
import { ui, vnd } from '@/lib/partnerUi';

const BLANK: PartnerRoomInput = { name: '', description: '', maxOccupancy: 2, totalRoomCount: 1, privateBathroom: 'UNVERIFIED', areaSqm: null, basePrice: 0, weekendPrice: undefined, status: 'ACTIVE', viewDescription: '', beds: [], amenityIds: [] };
const localDate = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const bedsText = (room: PartnerRoom) => room.beds.length ? room.beds.map(b => `${b.quantity} ${b.bedType.toLowerCase()}`).join(', ') : 'Chưa khai báo giường';
const toInput = (room: PartnerRoom): PartnerRoomInput => ({ ...room, description: room.description ?? '', viewDescription: room.viewDescription ?? '' });

type WorkTab = 'calendar' | 'quote';
const WORK_TABS: TabItem<WorkTab>[] = [
  { id: 'calendar', label: 'Lịch phòng', icon: CalendarDays },
  { id: 'quote', label: 'Kiểm tra phòng trống', icon: Search },
];

export default function PartnerRoomsPage() {
  const { id } = useParams();
  const placeId = Number(id);
  const navigate = useNavigate();
  const [homestays, setHomestays] = useState<{ id: number; name: string }[]>([]);
  const [rooms, setRooms] = useState<PartnerRoom[]>([]);
  const [options, setOptions] = useState<HomestayOptionsDto['amenities']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<{ id: number | null; form: PartnerRoomInput } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<WorkTab>('calendar');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    fetchPartnerHomestays()
      .then(res => { if (active) setHomestays(res.homestays.map(h => ({ id: h.id, name: h.name }))); })
      .catch(() => { /* Bộ chọn Homestay chỉ để chuyển nhanh; lỗi thì ẩn đi. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.list(placeId), api.options(placeId)])
      .then(([r, o]) => {
        if (!active) return;
        setRooms(r); setOptions(o); setError('');
        setSelectedId(prev => prev != null && r.some(x => x.id === prev) ? prev : r[0]?.id ?? null);
      })
      .catch((e: unknown) => { if (active) setError(homestayError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [placeId, reload]);

  const selected = rooms.find(r => r.id === selectedId) ?? null;
  const openNew = () => { setNotice(''); setEditor({ id: null, form: { ...BLANK } }); };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader 
        breadcrumbs={[{ label: 'Bảng điều khiển', to: '/partner' }, { label: 'Cơ sở lưu trú', to: '/partner/homestays' }, { label: 'Phòng & giá' }]}
        title="Phòng, giá và lịch bán" description="Khai báo từng loại phòng, đặt giá theo mùa và quản lý số phòng mở bán mỗi ngày."
        actions={<>
          {homestays.length > 1 && (
            <select aria-label="Chọn Homestay" className={`${ui.select} w-auto max-w-[240px] font-semibold`} value={placeId}
              onChange={(e) => { setLoading(true); setSelectedId(null); setNotice(''); navigate(`/partner/homestay/${e.target.value}/rooms`); }}>
              {homestays.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
          <button type="button" className={ui.btnCoral} onClick={openNew}><Plus className="h-4 w-4" />Thêm loại phòng</button>
        </>} />

      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="info" action={<button type="button" aria-label="Đóng thông báo" className={ui.iconBtn} onClick={() => setNotice('')}><X className="h-4 w-4" /></button>}>{notice}</Alert>}

      {loading ? <LoadingBlock label="Đang tải loại phòng..." rows={2} /> : rooms.length === 0 ? (
        !error && <EmptyState icon={BedDouble} title="Chưa có loại phòng nào" description="Tạo loại phòng đầu tiên với số lượng, sức chứa và giá để khách có thể đặt."
          action={<button type="button" className={ui.btnCoral} onClick={openNew}><Plus className="h-4 w-4" />Tạo loại phòng</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => {
            const active = room.id === selectedId;
            return (
              <article key={room.id} onClick={() => setSelectedId(room.id)}
                className={`group flex cursor-pointer flex-col gap-3 rounded-lg border bg-surface p-4 transition-all duration-200 ${active ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-ink-deep">{room.name}</h3>
                    <p className="truncate text-xs text-muted">{room.viewDescription || 'Chưa khai báo view'}</p>
                  </div>
                  <Pill tone={room.status === 'ACTIVE' ? 'accent' : 'neutral'}>{room.status === 'ACTIVE' ? 'Mở bán' : 'Ngừng bán'}</Pill>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-ink">
                  <span className="flex items-center gap-1.5"><DoorOpen className="h-3.5 w-3.5 text-primary/80" />{room.totalRoomCount} phòng</span>
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary/80" />{room.maxOccupancy} khách/phòng</span>
                  <span className="flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5 text-primary/80" />{room.areaSqm ? `${room.areaSqm} m²` : '— m²'}</span>
                  <span className="flex items-center gap-1.5 truncate"><BedDouble className="h-3.5 w-3.5 shrink-0 text-primary/80" /><span className="truncate">{bedsText(room)}</span></span>
                </div>
                <div className="mt-auto flex items-end justify-between gap-2 border-t border-primary/10 pt-3">
                  <div>
                    <p className=" text-lg font-extrabold text-ink-deep">{vnd(room.basePrice)}<span className="text-xs font-medium text-muted"> /đêm</span></p>
                    {room.weekendPrice ? <p className="text-[11px] text-muted">Cuối tuần {vnd(room.weekendPrice)}</p> : null}
                  </div>
                  <button type="button" aria-label={`Sửa ${room.name}`} className={ui.iconBtn}
                    onClick={(e) => { e.stopPropagation(); setNotice(''); setEditor({ id: room.id, form: toInput(room) }); }}>
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <section className={`${ui.card} flex flex-col gap-4 p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Đang quản lý</p><h2 className=" text-lg font-bold text-ink-deep">{selected.name}</h2></div>
            <span className="text-xs text-muted">{selected.totalRoomCount} phòng · giá cơ bản {vnd(selected.basePrice)}</span>
          </div>
          <Tabs tabs={WORK_TABS} value={tab} onChange={setTab} />
          {tab === 'calendar' && <RoomInventoryCalendar key={`cal-${selected.id}`} placeId={placeId} room={selected} />}
          {tab === 'quote' && <AvailabilityCheck key={`quote-${selected.id}`} placeId={placeId} room={selected} />}
        </section>
      )}

      <RoomEditor placeId={placeId} options={options} editor={editor} onClose={() => setEditor(null)}
        onSaved={(roomId, message) => {
          setEditor(null);
          if (message) setNotice(message);
          if (roomId != null) setSelectedId(roomId);
          setLoading(true); setReload(n => n + 1);
        }} />
    </div>
  );
}

/** Ngăn kéo bên phải: tạo / sửa loại phòng. Thay đổi có thể được gửi chờ Admin duyệt thay vì áp dụng ngay. */
function RoomEditor({ placeId, options, editor, onClose, onSaved }: {
  placeId: number; options: HomestayOptionsDto['amenities']; editor: { id: number | null; form: PartnerRoomInput } | null;
  onClose: () => void; onSaved: (roomId: number | null, message?: string) => void;
}) {
  const [form, setForm] = useState<PartnerRoomInput>(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [progress, setProgress] = useState('');
  const [openedFor, setOpenedFor] = useState<typeof editor>(null);
  if (editor !== openedFor) { setOpenedFor(editor); if (editor) { setForm(editor.form); setError(''); setPhotos([]); setProgress(''); } }

  const set = <K extends keyof PartnerRoomInput>(k: K, v: PartnerRoomInput[K]) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setBusy(true); setError('');
    try {
      const saved = await api.save(placeId, editor?.id ?? null, form);
      if (isSubmittedChange(saved)) {
        // Homestay đang công khai: loại phòng mới chờ Admin duyệt nên chưa có mã phòng để gắn ảnh.
        onSaved(editor?.id ?? null, photos.length
          ? `${saved.message} Ảnh đã chọn chưa được tải lên; hãy thêm ảnh sau khi loại phòng được duyệt.`
          : saved.message);
        return;
      }
      // UC-NCC-03: tải các ảnh đã chọn lúc tạo loại phòng mới, ảnh đầu tiên thành ảnh đại diện.
      const failed: string[] = [];
      for (const [i, file] of photos.entries()) {
        setProgress(`Đang tải ảnh ${i + 1}/${photos.length}...`);
        try { await partnerMediaService.upload({ placeId, roomId: saved.id }, file); }
        catch { failed.push(file.name); }
      }
      onSaved(saved.id, failed.length
        ? `Đã lưu thông tin loại phòng, nhưng chưa tải được ${failed.length} ảnh (${failed.join(', ')}). Hãy mở lại loại phòng để thêm ảnh.`
        : 'Đã lưu thông tin loại phòng');
    } catch (e: unknown) { setError(homestayError(e)); }
    finally { setBusy(false); setProgress(''); }
  }

  return (
    <Dialog.Root open={editor !== null} onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-deep/40" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-surface shadow-[var(--shadow-lg)]">
          <header className="flex items-center justify-between border-b border-primary/10 px-5 py-4">
            <Dialog.Title className=" text-lg font-bold text-ink-deep">{editor?.id ? 'Sửa loại phòng' : 'Loại phòng mới'}</Dialog.Title>
            <Dialog.Close aria-label="Đóng" className={ui.iconBtn}><X className="h-5 w-5" /></Dialog.Close>
          </header>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); void save(); }}>
            <fieldset disabled={busy} className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
              {error && <Alert tone="error">{error}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tên loại phòng" required className="sm:col-span-2"><input className={ui.input} required maxLength={255} value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Phòng đôi view ruộng bậc thang" /></Field>
                <Field label="Tổng số phòng" required><input className={ui.input} type="number" required min={1} max={10000} value={form.totalRoomCount} onChange={e => set('totalRoomCount', Number(e.target.value))} /></Field>
                <Field label="Khách tối đa mỗi phòng" required><input className={ui.input} type="number" required min={1} max={1000} value={form.maxOccupancy} onChange={e => set('maxOccupancy', Number(e.target.value))} /></Field>
                <Field label="Diện tích (m²)"><input className={ui.input} type="number" min={0.01} max={9999.99} step="0.01" value={form.areaSqm ?? ''} onChange={e => set('areaSqm', e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Phòng tắm riêng">
                  <select className={ui.select} value={form.privateBathroom} onChange={e => set('privateBathroom', e.target.value === 'YES' ? 'YES' : e.target.value === 'NO' ? 'NO' : 'UNVERIFIED')}>
                    <option value="UNVERIFIED">Chưa xác định</option><option value="YES">Có phòng tắm riêng</option><option value="NO">Dùng chung</option>
                  </select>
                </Field>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Giá</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Giá ngày thường / phòng / đêm" required><MoneyInput required ariaLabel="Giá ngày thường" value={form.basePrice > 0 ? form.basePrice : null} onChange={v => set('basePrice', v ?? 0)} /></Field>
                  <Field label="Giá cuối tuần (T7, CN)" hint="Để trống nếu bằng giá ngày thường."><MoneyInput ariaLabel="Giá cuối tuần" placeholder="Bằng giá ngày thường" value={form.weekendPrice ?? null} onChange={v => set('weekendPrice', v ?? undefined)} /></Field>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Giường ngủ</p>
                {form.beds.map((bed, i) => (
                  <div key={i} className="flex gap-2">
                    <input aria-label="Loại giường" required maxLength={32} placeholder="Giường đôi, giường đơn, đệm..." className={ui.input} value={bed.bedType} onChange={e => set('beds', form.beds.map((b, j) => i === j ? { ...b, bedType: e.target.value } : b))} />
                    <input aria-label="Số lượng" required type="number" min={1} max={100} className={`${ui.input} w-20`} value={bed.quantity} onChange={e => set('beds', form.beds.map((b, j) => i === j ? { ...b, quantity: Number(e.target.value) } : b))} />
                    <button type="button" aria-label="Xóa giường" className={ui.iconBtn} onClick={() => set('beds', form.beds.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <button type="button" className={`${ui.btnGhost} w-fit text-primary`} onClick={() => set('beds', [...form.beds, { bedType: '', quantity: 1 }])}><Plus className="h-4 w-4" />Thêm giường</button>
              </div>

              <div className="grid gap-4">
                <Field label="Vị trí / hướng nhìn"><input className={ui.input} maxLength={500} value={form.viewDescription} onChange={e => set('viewDescription', e.target.value)} placeholder="VD: Tầng 2, nhìn ra thung lũng" /></Field>
                <Field label="Mô tả"><textarea className={ui.textarea} rows={4} maxLength={10000} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
              </div>

              {options.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Tiện nghi trong phòng</p>
                  <div className="flex flex-wrap gap-2">
                    {options.map(a => {
                      const on = form.amenityIds.includes(a.id);
                      return (
                        <button key={a.id} type="button" aria-pressed={on} onClick={() => set('amenityIds', on ? form.amenityIds.filter(x => x !== a.id) : [...form.amenityIds, a.id])}
                          className={`rounded-sm border px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${on ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-ink hover:border-primary/50'}`}>
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 rounded-md border border-primary/10 bg-canvas p-3 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={form.status === 'ACTIVE'} onChange={e => set('status', e.target.checked ? 'ACTIVE' : 'INACTIVE')} />
                <span><b>Mở bán</b> loại phòng này <span className="text-muted">(bỏ chọn để tạm ẩn, không nhận đặt mới)</span></span>
              </label>
              {editor?.id == null ? (
                <div className="flex flex-col gap-3 border-t border-primary/10 pt-5">
                  <PendingPhotoPicker files={photos} onChange={setPhotos} disabled={busy} onError={setError} />
                  <p className="text-[11px] leading-relaxed text-muted">Giá theo mùa khai báo được sau khi lưu loại phòng.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 border-t border-primary/10 pt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">Ảnh phòng</p>
                    <p className="text-[11px] leading-relaxed text-muted">Cần bổ sung ít nhất một ảnh toàn phòng; thiếu ảnh thì loại phòng chưa đủ điều kiện công khai/nhận Booking.</p>
                    <MediaManager target={{ placeId, roomId: editor.id }} title={`Ảnh phòng ${form.name}`} />
                  </div>
                  <div className="flex flex-col gap-3 border-t border-primary/10 pt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">Giá theo mùa</p>
                    <SeasonalPrices placeId={placeId} room={{ id: editor.id, ...form } as unknown as PartnerRoom} />
                  </div>
                </>
              )}
            </fieldset>
            <footer className="flex justify-end gap-2 border-t border-primary/10 bg-canvas/60 px-5 py-3">
              <Dialog.Close type="button" className={ui.btnGhost}>Hủy</Dialog.Close>
              <button className={ui.btnPrimary} disabled={busy}>{busy ? (progress || 'Đang lưu...') : 'Lưu loại phòng'}</button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Giá theo mùa / dịp lễ, ưu tiên hơn giá ngày thường và cuối tuần. */
function SeasonalPrices({ placeId, room }: { placeId: number; room: PartnerRoom }) {
  const empty: RoomPriceInput = { name: '', periodStart: localDate(0), periodEnd: localDate(1), price: room.basePrice };
  const [prices, setPrices] = useState<RoomPrice[]>([]);
  const [form, setForm] = useState<RoomPriceInput>(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const load = useCallback(() => api.prices(placeId, room.id).then(setPrices), [placeId, room.id]);
  useEffect(() => {
    let active = true;
    api.prices(placeId, room.id).then(p => { if (active) setPrices(p); }).catch((e: unknown) => { if (active) setError(homestayError(e)); });
    return () => { active = false; };
  }, [placeId, room.id]);

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true); setError(''); setMessage('');
    try { const result = await action(); await load(); setMessage(isSubmittedChange(result) ? result.message : done); }
    catch (e: unknown) { setError(homestayError(e)); } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted">Giá theo mùa được ưu tiên hơn giá ngày thường và cuối tuần. Khoảng ngày tính cả ngày bắt đầu và kết thúc, không được trùng nhau.</p>
        {error && <Alert tone="error">{error}</Alert>}
        {message && <Alert tone="success">{message}</Alert>}
        {prices.length === 0 ? <p className="rounded-md border border-dashed border-primary/20 p-6 text-center text-sm text-muted">Chưa có giá theo mùa. Loại phòng đang dùng giá cơ bản {vnd(room.basePrice)}.</p> : (
          <ul className="flex flex-col divide-y divide-primary/10 rounded-md border border-primary/10">
            {prices.map(p => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div><p className="text-sm font-semibold text-ink-deep">{p.name}</p><p className="text-xs text-muted">{p.periodStart} → {p.periodEnd}</p></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{vnd(p.price)}</span>
                  <button type="button" aria-label="Sửa" className={ui.iconBtn} onClick={() => { setEditId(p.id); setForm({ name: p.name, periodStart: p.periodStart, periodEnd: p.periodEnd, price: p.price }); }}><Pencil className="h-4 w-4" /></button>
                  <button type="button" aria-label="Xóa" className={ui.iconBtn} onClick={() => setConfirm({ title: `Xóa giá “${p.name}”?`, confirmLabel: 'Xóa', tone: 'danger', body: 'Các ngày này sẽ quay về giá cơ bản / cuối tuần. Đơn đã đặt không bị ảnh hưởng.', onConfirm: () => void run(() => api.deletePrice(placeId, room.id, p.id), 'Đã xóa giá theo mùa.') })}><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form className="flex flex-col gap-3 rounded-md border border-primary/15 bg-primary-50/40 p-4" onSubmit={(e) => { e.preventDefault(); void run(async () => { const saved = await api.savePrice(placeId, room.id, editId, form); setEditId(null); setForm(empty); return saved; }, 'Đã cập nhật giá và tình trạng phòng'); }}>
        <p className="text-sm font-bold text-ink-deep">{editId ? 'Sửa giá theo mùa' : 'Thêm giá theo mùa'}</p>
        <fieldset disabled={busy} className="flex flex-col gap-3">
          <Field label="Tên" required><input className={ui.input} required maxLength={255} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Mùa lúa chín, Tết..." /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Từ ngày" required><input className={ui.input} type="date" required value={form.periodStart} onChange={e => setForm({ ...form, periodStart: e.target.value })} /></Field>
            <Field label="Đến ngày" required><input className={ui.input} type="date" required min={form.periodStart} value={form.periodEnd} onChange={e => setForm({ ...form, periodEnd: e.target.value })} /></Field>
          </div>
          <Field label="Giá / phòng / đêm" required><MoneyInput required ariaLabel="Giá theo mùa" value={form.price > 0 ? form.price : null} onChange={v => setForm({ ...form, price: v ?? 0 })} /></Field>
          <button className={ui.btnPrimary}>{editId ? 'Lưu thay đổi' : 'Thêm giá'}</button>
          {editId && <button type="button" className={ui.btnGhost} onClick={() => { setEditId(null); setForm(empty); }}>Hủy sửa</button>}
        </fieldset>
      </form>
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}

/** Kiểm tra nhanh còn đủ phòng cho một yêu cầu của khách không. */
function AvailabilityCheck({ placeId, room }: { placeId: number; room: PartnerRoom }) {
  const [start, setStart] = useState(localDate(0));
  const [end, setEnd] = useState(localDate(1));
  const [count, setCount] = useState(1);
  const [guests, setGuests] = useState(2);
  const [quote, setQuote] = useState<RoomQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function check() {
    setBusy(true); setError(''); setQuote(null);
    try { setQuote(await api.quote(placeId, room.id, start, end, count, guests)); } catch (e: unknown) { setError(homestayError(e)); } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_120px_120px_auto] lg:items-end" onSubmit={(e) => { e.preventDefault(); void check(); }}>
        <Field label="Nhận phòng"><input className={ui.input} type="date" value={start} onChange={e => setStart(e.target.value)} /></Field>
        <Field label="Trả phòng"><input className={ui.input} type="date" min={start} value={end} onChange={e => setEnd(e.target.value)} /></Field>
        <Field label="Số phòng"><input className={ui.input} type="number" min={1} value={count} onChange={e => setCount(Number(e.target.value))} /></Field>
        <Field label="Số khách"><input className={ui.input} type="number" min={1} value={guests} onChange={e => setGuests(Number(e.target.value))} /></Field>
        <button className={ui.btnPrimary} disabled={busy}><Search className="h-4 w-4" />{busy ? 'Đang kiểm tra...' : 'Kiểm tra'}</button>
      </form>
      {error && <Alert tone="error">{error}</Alert>}
      {quote && (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-md border p-4 ${quote.suitable ? 'border-accent/40 bg-accent-50' : 'border-danger/30 bg-danger/5'}`}>
          <div>
            <p className={`text-sm font-bold ${quote.suitable ? 'text-accent-700' : 'text-danger'}`}>{quote.suitable ? 'Có thể đáp ứng yêu cầu này' : 'Không đủ phòng hoặc sức chứa'}</p>
            <p className="text-xs text-muted">Còn ít nhất {quote.availableRooms} phòng trống trong suốt khoảng ngày · tối đa {room.maxOccupancy} khách/phòng</p>
          </div>
          <p className=" text-xl font-extrabold text-ink-deep">{vnd(quote.totalAmount)}</p>
        </div>
      )}
    </div>
  );
}
