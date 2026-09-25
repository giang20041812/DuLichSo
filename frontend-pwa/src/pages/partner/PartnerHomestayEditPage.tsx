import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import type { HomestayOptionsDto, PartnerHomestayDetailDto } from '@/types/partner';
import { createPartnerHomestay, fetchHomestayOptions, fetchPartnerHomestayDetail, homestayError, savePartnerHomestayDetail } from '@/services/partnerHomestayService';

const EMPTY: PartnerHomestayDetailDto = {
  id: 0, code: '', slug: '', name: '', description: '', address: '', regionName: '', regionId: null,
  latitude: null, longitude: null, contactPhone: '', contactEmail: '', accessNote: '',
  coverImageUrl: '', galleryUrls: [], amenities: [], checkInFrom: '', checkOutUntil: '',
  houseRules: '', cancellationPolicy: '', policyName: '', freeCancelCutoffHours: null, refundOnLateCancel: null,
  surchargeNote: '', visibility: 'DRAFT', operationStatus: 'OPERATING', isReadyToPublish: false,
  cooperativeName: '', providerCode: '',
};
const input = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none';

export default function PartnerHomestayEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<PartnerHomestayDetailDto>(EMPTY);
  const [options, setOptions] = useState<HomestayOptionsDto>({ regions: [], amenities: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    setSaveError('');
    if (id && (!Number.isSafeInteger(Number(id)) || Number(id) <= 0)) {
      setLoadError('Mã Homestay không hợp lệ.');
      setLoading(false);
      return;
    }
    Promise.all([fetchHomestayOptions(), id ? fetchPartnerHomestayDetail(Number(id)) : Promise.resolve({ ...EMPTY })])
      .then(([catalog, detail]) => { if (active) { setOptions(catalog); setForm(detail); } })
      .catch((error: unknown) => { if (active) setLoadError(homestayError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);

  function set<K extends keyof PartnerHomestayDetailDto>(key: K, value: PartnerHomestayDetailDto[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading || loadError) return;
    setSaving(true);
    setSaveError('');
    try {
      const saved = id ? await savePartnerHomestayDetail(Number(id), form) : await createPartnerHomestay(form);
      navigate(`/partner/homestay/${saved.id}`, { replace: true });
    } catch (error: unknown) { setSaveError(homestayError(error)); }
    finally { setSaving(false); }
  }
  const amenities = [...new Set([...options.amenities.map(a => a.name), ...form.amenities])];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-8">
      <Link to="/partner" className="flex items-center gap-2 text-sm text-primary"><ArrowLeft size={16} /> Homestay của tôi</Link>
      <div><h1 className="font-display text-2xl font-bold text-ink-deep">{id ? 'Chỉnh sửa Homestay' : 'Tạo Homestay'}</h1>
        <p className="mt-2 text-sm text-muted">{id ? 'Cập nhật thông tin giới thiệu và chính sách lưu trú.' : 'Homestay mới sẽ được lưu dưới dạng bản nháp.'}</p></div>
      {loading ? <p role="status">Đang tải thông tin...</p> : loadError ? (
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-danger">{loadError}
          <button type="button" onClick={() => setRetry(n => n + 1)} className="ml-3 rounded-md border px-3 py-1">Thử lại</button></div>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-5">
          <fieldset disabled={saving} className="flex flex-col gap-5 disabled:opacity-70">
            <Section title="Thông tin chung">
              <Field label="Tên Homestay *"><input className={input} required maxLength={255} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
              <Field label="Mô tả tổng quan"><textarea className={input} rows={5} maxLength={10000} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Số điện thoại liên hệ *"><input className={input} type="tel" required maxLength={32} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} /></Field>
                <Field label="Email liên hệ"><input className={input} type="email" maxLength={254} value={form.contactEmail ?? ''} onChange={e => set('contactEmail', e.target.value)} /></Field>
              </div>
            </Section>
            <Section title="Địa chỉ và tiếp cận">
              <Field label="Địa chỉ *"><input className={input} required maxLength={500} value={form.address} onChange={e => set('address', e.target.value)} /></Field>
              <Field label="Khu vực"><select className={input} value={form.regionId ?? ''} onChange={e => set('regionId', e.target.value ? Number(e.target.value) : null)}>
                <option value="">Chưa chọn khu vực</option>
                {options.regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vĩ độ"><input className={input} type="number" min={-90} max={90} step="any" value={form.latitude ?? ''} onChange={e => set('latitude', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                <Field label="Kinh độ"><input className={input} type="number" min={-180} max={180} step="any" value={form.longitude ?? ''} onChange={e => set('longitude', e.target.value === '' ? null : Number(e.target.value))} /></Field>
              </div>
              <Field label="Hướng dẫn đường đi và tiếp cận"><textarea className={input} rows={3} maxLength={10000} value={form.accessNote ?? ''} onChange={e => set('accessNote', e.target.value)} /></Field>
            </Section>
            <Section title="Tiện nghi và khu vực chung">
              {amenities.length === 0 && <p className="text-sm text-muted">Chưa có tiện nghi trong danh mục.</p>}
              <div className="grid gap-3 sm:grid-cols-2">{amenities.map(name => (
                <label key={name} className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                  <input type="checkbox" checked={form.amenities.includes(name)} onChange={e => set('amenities', e.target.checked ? [...form.amenities, name] : form.amenities.filter(a => a !== name))} />{name}
                </label>
              ))}</div>
            </Section>
            <Section title="Giờ lưu trú và quy định">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nhận phòng từ"><input className={input} type="time" value={form.checkInFrom} onChange={e => set('checkInFrom', e.target.value)} /></Field>
                <Field label="Trả phòng trước"><input className={input} type="time" value={form.checkOutUntil} onChange={e => set('checkOutUntil', e.target.value)} /></Field>
              </div>
              <Field label="Nội quy chung và đối tượng khách phù hợp"><textarea className={input} rows={4} maxLength={10000} value={form.houseRules} onChange={e => set('houseRules', e.target.value)} /></Field>
              <Field label="Quy định phụ thu"><textarea className={input} rows={3} maxLength={10000} value={form.surchargeNote ?? ''} onChange={e => set('surchargeNote', e.target.value)} /></Field>
              <Field label="Chính sách trẻ em"><textarea className={input} rows={2} maxLength={10000} value={form.childrenPolicy ?? ''} onChange={e => set('childrenPolicy', e.target.value)} /></Field>
              <Field label="Chính sách thú cưng"><textarea className={input} rows={2} maxLength={10000} value={form.petsPolicy ?? ''} onChange={e => set('petsPolicy', e.target.value)} /></Field>
              <Field label="Số khách và khách phù hợp"><textarea className={input} rows={2} maxLength={10000} value={form.guestPolicy ?? ''} onChange={e => set('guestPolicy', e.target.value)} /></Field>
            </Section>
            <Section title="Chính sách hủy phòng">
              <p className="text-sm text-muted">{form.policyVersion ? `Phiên bản hiện tại: ${form.policyVersion}. ` : ''}Thay đổi chính sách sẽ tạo phiên bản mới; chính sách của đơn đã đặt được giữ nguyên.</p>
              <Field label="Tên chính sách"><input className={input} maxLength={255} required={!!form.cancellationPolicy.trim()} value={form.policyName ?? ''} onChange={e => set('policyName', e.target.value)} /></Field>
              <Field label="Nội dung chính sách"><textarea className={input} rows={4} maxLength={10000} required={!!form.policyVersion || !!form.policyName?.trim() || form.freeCancelCutoffHours != null || form.refundOnLateCancel != null} value={form.cancellationPolicy} onChange={e => set('cancellationPolicy', e.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hủy miễn phí trước giờ nhận phòng (số giờ)"><input className={input} type="number" min={0} max={2147483647} step={1} required={!!form.cancellationPolicy.trim()} value={form.freeCancelCutoffHours ?? ''} onChange={e => set('freeCancelCutoffHours', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                <Field label="Hoàn tiền khi hủy muộn"><select className={input} required={!!form.cancellationPolicy.trim()} value={form.refundOnLateCancel ?? ''} onChange={e => set('refundOnLateCancel', e.target.value === 'FULL_REFUND' ? 'FULL_REFUND' : e.target.value === 'NO_REFUND' ? 'NO_REFUND' : null)}>
                  <option value="">Chọn mức hoàn tiền</option><option value="NO_REFUND">Không hoàn tiền</option><option value="FULL_REFUND">Hoàn toàn bộ</option>
                </select></Field>
              </div>
            </Section>
            {saveError && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{saveError}</p>}
            <div className="flex justify-end gap-3">
              <Link to={id ? `/partner/homestay/${id}` : '/partner'} className="rounded-md border border-border px-4 py-2 text-sm">Quay lại</Link>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-teal)] transition-colors duration-200 hover:bg-primary-700"><Save size={16} />{saving ? 'Đang lưu...' : id ? 'Lưu thay đổi' : 'Tạo bản nháp'}</button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]"><h2 className="font-semibold text-primary">{title}</h2>{children}</section>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-2 text-sm font-medium text-ink">{label}{children}</label>;
}
