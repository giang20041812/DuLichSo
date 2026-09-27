import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LocateFixed, Save, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import type { HomestayOptionsDto, PartnerHomestayDetailDto, UpdateStatusRequest } from '@/types/partner';
import { isSubmittedChange } from '@/services/changeRequestService';
import {
  createPartnerHomestay,
  fetchHomestayOptions,
  fetchPartnerHomestayDetail,
  geocodeAddress,
  homestayError,
  savePartnerHomestayDetail,
  updateHomestayStatus
} from '@/services/partnerHomestayService';
import PartnerServicesPanel from '@/components/partner/PartnerServicesPanel';
import MediaManager from '@/components/partner/MediaManager';
import HomestayClosurePanel from '@/components/partner/HomestayClosurePanel';
import HomestayChangeLogPanel from '@/components/partner/HomestayChangeLogPanel';

const EMPTY: PartnerHomestayDetailDto = {
  id: 0, code: '', slug: '', name: '', description: '', address: '', regionName: '', regionId: null,
  latitude: null, longitude: null, contactPhone: '', contactEmail: '', reviewVideoUrl: '', accessNote: '',
  coverImageUrl: '', galleryUrls: [], amenities: [], checkInFrom: '', checkOutUntil: '',
  houseRules: '', cancellationPolicy: '', policyName: '', freeCancelCutoffHours: null, refundOnLateCancel: null,
  surchargeNote: '', visibility: 'DRAFT', operationStatus: 'OPERATING', isReadyToPublish: false,
  cooperativeName: '', providerCode: '',
};
const input = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none';

type TabId = 'info' | 'address' | 'amenities' | 'rules' | 'media' | 'services' | 'operation';

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
  const [geo, setGeo] = useState<{ busy: boolean; text: string; ok: boolean }>({ busy: false, text: '', ok: true });
  const [logKey, setLogKey] = useState(0);

  const [activeTab, setActiveTab] = useState<TabId>('info');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'info', label: 'Cơ bản' },
    { id: 'address', label: 'Vị trí' },
    { id: 'amenities', label: 'Tiện nghi' },
    { id: 'rules', label: 'Chính sách' },
    ...(id ? [
      { id: 'media', label: 'Hình ảnh' } as const,
      { id: 'services', label: 'Dịch vụ' } as const,
      { id: 'operation', label: 'Vận hành' } as const,
    ] : [])
  ];

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

  async function locate(auto: boolean) {
    const address = form.address.trim();
    if (address.length < 5 || geo.busy || (auto && form.latitude != null && form.longitude != null)) return;
    const region = options.regions.find(r => r.id === form.regionId)?.name;
    setGeo({ busy: true, text: 'Đang tìm tọa độ...', ok: true });
    try {
      const found = await geocodeAddress(region && !address.toLowerCase().includes(region.toLowerCase()) ? `${address}, ${region}` : address);
      setForm(prev => ({ ...prev, latitude: Number(found.latitude.toFixed(6)), longitude: Number(found.longitude.toFixed(6)) }));
      setGeo({ busy: false, text: `Đã lấy tọa độ theo: ${found.displayName ?? address}. Hãy kiểm tra lại trên bản đồ.`, ok: true });
    } catch (error: unknown) {
      setGeo({ busy: false, text: homestayError(error), ok: false });
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading || loadError) return;
    setSaving(true);
    setSaveError('');
    try {
      const saved = id ? await savePartnerHomestayDetail(Number(id), form) : await createPartnerHomestay(form);
      if (isSubmittedChange(saved)) {
        window.alert(saved.message);
      }
      if (!id) {
        if (!isSubmittedChange(saved)) {
          navigate(`/partner/homestay/${saved.id}/edit`, { replace: true });
        } else {
          navigate('/partner/homestays', { replace: true });
        }
      } else {
        setSaveError('Đã lưu thành công!');
        setTimeout(() => setSaveError(''), 3000);
      }
    } catch (error: unknown) { setSaveError(homestayError(error)); }
    finally { setSaving(false); }
  }

  async function changeStatus(request: UpdateStatusRequest) {
    if (!id || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const result = await updateHomestayStatus(Number(id), request);
      setForm(prev => ({ ...prev, visibility: result.visibility, operationStatus: result.operationStatus, isReadyToPublish: result.isReadyToPublish, alertNote: result.alertNote }));
      setSaveError('Đã cập nhật trạng thái.');
      setTimeout(() => setSaveError(''), 3000);
    } catch (error: unknown) { setSaveError(homestayError(error)); }
    finally { setSaving(false); }
  }

  const amenities = [...new Set([...options.amenities.map(a => a.name), ...form.amenities])];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-8">
      <Link to="/partner/homestays" className="flex items-center gap-2 text-sm text-primary w-fit"><ArrowLeft size={16} /> Danh sách Homestay</Link>
      
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted">{form.cooperativeName} {form.code && `· ${form.code}`}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-deep">{id ? form.name || 'Chỉnh sửa Homestay' : 'Tạo Homestay'}</h1>
          <p className="mt-2 text-sm text-muted">{id ? 'Quản lý thông tin và thiết lập vận hành.' : 'Homestay mới sẽ được lưu dưới dạng bản nháp.'}</p>
        </div>
        {id && (
          <div className="flex items-center gap-2 text-xs font-semibold">
             <span className={`px-2.5 py-1 rounded-md text-white ${form.visibility === 'PUBLISHED' ? 'bg-primary' : 'bg-sun text-ink-deep'}`}>
                {form.visibility === 'PUBLISHED' ? 'Đang hiển thị' : 'Bản nháp'}
             </span>
             <span className={`px-2.5 py-1 rounded-md text-white ${form.operationStatus === 'OPERATING' ? 'bg-accent' : 'bg-danger'}`}>
                {form.operationStatus === 'OPERATING' ? 'Đang hoạt động' : 'Tạm đóng cửa'}
             </span>
          </div>
        )}
      </div>

      {loading ? <p role="status">Đang tải thông tin...</p> : loadError ? (
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-danger">{loadError}
          <button type="button" onClick={() => setRetry(n => n + 1)} className="ml-3 rounded-md border px-3 py-1 bg-white">Thử lại</button></div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 mt-4">
          {/* Sidebar Tabs */}
          <aside className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap text-left px-4 py-2.5 rounded-md text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-primary text-white shadow-[var(--shadow-teal)]' : 'text-ink hover:bg-surface border border-transparent hover:border-border'}`}
              >
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Tab Content */}
          <div className="flex-1 min-w-0">
            {(activeTab === 'info' || activeTab === 'address' || activeTab === 'amenities' || activeTab === 'rules') && (
              <form onSubmit={save} className="flex flex-col gap-5">
                <fieldset disabled={saving} className="flex flex-col gap-5 disabled:opacity-70">
                  {activeTab === 'info' && (
                    <Section title="Thông tin chung">
                      <Field label="Tên Homestay *"><input className={input} required maxLength={255} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
                      <Field label="Mô tả tổng quan"><textarea className={input} rows={5} maxLength={10000} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Số điện thoại liên hệ *"><input className={input} type="tel" required maxLength={32} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} /></Field>
                        <Field label="Email liên hệ"><input className={input} type="email" maxLength={254} value={form.contactEmail ?? ''} onChange={e => set('contactEmail', e.target.value)} /></Field>
                      </div>
                      <Field label="Link video review TikTok">
                        <input className={input} type="url" maxLength={500} placeholder="https://www.tiktok.com/@tenkenh/video/7123456789012345678"
                          value={form.reviewVideoUrl ?? ''} onChange={e => set('reviewVideoUrl', e.target.value)} />
                      </Field>
                      <p className="-mt-2 text-xs text-muted">Mở video trên TikTok, bấm Chia sẻ → Sao chép liên kết rồi dán link đầy đủ có dạng /video/số. Video sẽ hiện ở trang Homestay cho khách xem.</p>
                    </Section>
                  )}

                  {activeTab === 'address' && (
                    <Section title="Địa chỉ và tiếp cận">
                      <Field label="Địa chỉ *"><input className={input} required maxLength={500} value={form.address} onChange={e => set('address', e.target.value)} onBlur={() => void locate(true)} placeholder="Số nhà / thôn, xã, huyện, tỉnh" /></Field>
                      <Field label="Khu vực"><select className={input} value={form.regionId ?? ''} onChange={e => set('regionId', e.target.value ? Number(e.target.value) : null)}>
                        <option value="">Chưa chọn khu vực</option>
                        {options.regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select></Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Vĩ độ"><input className={input} type="number" min={-90} max={90} step="any" value={form.latitude ?? ''} onChange={e => set('latitude', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                        <Field label="Kinh độ"><input className={input} type="number" min={-180} max={180} step="any" value={form.longitude ?? ''} onChange={e => set('longitude', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button type="button" disabled={geo.busy || form.address.trim().length < 5} onClick={() => void locate(false)}
                          className="flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary-50 disabled:opacity-50">
                          <LocateFixed size={16} /> {geo.busy ? 'Đang tìm...' : 'Lấy tọa độ từ địa chỉ'}
                        </button>
                        {form.latitude != null && form.longitude != null && (
                          <a className="text-sm text-primary underline" target="_blank" rel="noreferrer"
                            href={`https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=17/${form.latitude}/${form.longitude}`}>Xem vị trí trên bản đồ</a>
                        )}
                      </div>
                      {geo.text && <p role="status" className={`text-xs ${geo.ok ? 'text-muted' : 'text-danger'}`}>{geo.text}</p>}
                      <Field label="Hướng dẫn đường đi và tiếp cận"><textarea className={input} rows={3} maxLength={10000} value={form.accessNote ?? ''} onChange={e => set('accessNote', e.target.value)} /></Field>
                    </Section>
                  )}

                  {activeTab === 'amenities' && (
                    <Section title="Tiện nghi và khu vực chung">
                      {amenities.length === 0 && <p className="text-sm text-muted">Chưa có tiện nghi trong danh mục.</p>}
                      <div className="grid gap-3 sm:grid-cols-2">{amenities.map(name => (
                        <label key={name} className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                          <input type="checkbox" checked={form.amenities.includes(name)} onChange={e => set('amenities', e.target.checked ? [...form.amenities, name] : form.amenities.filter(a => a !== name))} />{name}
                        </label>
                      ))}</div>
                    </Section>
                  )}

                  {activeTab === 'rules' && (
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
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm font-semibold mb-2 text-primary">Chính sách hủy phòng</p>
                        <p className="text-xs text-muted mb-4">{form.policyVersion ? `Phiên bản hiện tại: ${form.policyVersion}. ` : ''}Thay đổi chính sách sẽ tạo phiên bản mới; chính sách của đơn đã đặt được giữ nguyên.</p>
                        <div className="flex flex-col gap-4">
                          <Field label="Tên chính sách"><input className={input} maxLength={255} required={!!form.cancellationPolicy.trim()} value={form.policyName ?? ''} onChange={e => set('policyName', e.target.value)} /></Field>
                          <Field label="Nội dung chính sách"><textarea className={input} rows={4} maxLength={10000} required={!!form.policyVersion || !!form.policyName?.trim() || form.freeCancelCutoffHours != null || form.refundOnLateCancel != null} value={form.cancellationPolicy} onChange={e => set('cancellationPolicy', e.target.value)} /></Field>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Hủy miễn phí trước giờ nhận phòng (số giờ)"><input className={input} type="number" min={0} max={2147483647} step={1} required={!!form.cancellationPolicy.trim()} value={form.freeCancelCutoffHours ?? ''} onChange={e => set('freeCancelCutoffHours', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                            <Field label="Hoàn tiền khi hủy muộn"><select className={input} required={!!form.cancellationPolicy.trim()} value={form.refundOnLateCancel ?? ''} onChange={e => set('refundOnLateCancel', e.target.value === 'FULL_REFUND' ? 'FULL_REFUND' : e.target.value === 'NO_REFUND' ? 'NO_REFUND' : null)}>
                              <option value="">Chọn mức hoàn tiền</option><option value="NO_REFUND">Không hoàn tiền</option><option value="FULL_REFUND">Hoàn toàn bộ</option>
                            </select></Field>
                          </div>
                        </div>
                      </div>
                    </Section>
                  )}

                  {saveError && <p role="alert" className={`rounded-md border p-3 text-sm ${saveError === 'Đã lưu thành công!' ? 'bg-accent/10 border-accent/30 text-accent' : 'border-danger/30 bg-danger/5 text-danger'}`}>{saveError}</p>}
                  
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-teal)] transition-colors duration-200 hover:bg-primary-700"><Save size={16} />{saving ? 'Đang lưu...' : id ? 'Lưu thay đổi' : 'Tạo bản nháp'}</button>
                  </div>
                </fieldset>
              </form>
            )}

            {id && activeTab === 'media' && (
              <div className="flex flex-col gap-5">
                <Section title="Ảnh Homestay">
                  <MediaManager target={{ placeId: Number(id) }} title="Ảnh Homestay" onChange={(media) => setForm(prev => prev ? { ...prev, coverImageUrl: media.find(m => m.role === 'COVER')?.url ?? '', galleryUrls: media.map(m => m.url) } : prev)} />
                </Section>
              </div>
            )}

            {id && activeTab === 'services' && (
              <div className="flex flex-col gap-5">
                <PartnerServicesPanel placeId={Number(id)}/>
              </div>
            )}

            {id && activeTab === 'operation' && (
              <div className="flex flex-col gap-6">
                <Section title="Trạng thái hiển thị và vận hành">
                  {form.alertNote && <div className="p-3 bg-sun-light border border-sun/30 rounded-md text-sm text-ink-deep mb-2">{form.alertNote}</div>}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-2 p-4 border border-border rounded-lg bg-surface flex-1 min-w-[200px]">
                      <h3 className="font-semibold text-sm text-ink">Hiển thị trên web</h3>
                      <p className="text-xs text-muted mb-2">{form.visibility === 'PUBLISHED' ? 'Khách hàng có thể tìm thấy và xem Homestay này.' : 'Đang ở dạng nháp, không hiển thị với khách.'}</p>
                      <button disabled={saving} onClick={() => void changeStatus({ visibility: form.visibility === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED' })} 
                        className={`mt-auto flex w-fit items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors ${form.visibility === 'PUBLISHED' ? 'border-border text-ink hover:bg-surface' : 'border-primary text-primary hover:bg-primary-50'}`}>
                        {form.visibility === 'PUBLISHED' ? <><EyeOff size={16}/> Ngừng hiển thị</> : <><Eye size={16}/> Xuất bản</>}
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-2 p-4 border border-border rounded-lg bg-surface flex-1 min-w-[200px]">
                      <h3 className="font-semibold text-sm text-ink">Trạng thái đón khách</h3>
                      <p className="text-xs text-muted mb-2">{form.operationStatus === 'OPERATING' ? 'Homestay đang hoạt động và nhận khách bình thường.' : 'Homestay đang tạm đóng cửa.'}</p>
                      <button disabled={saving} onClick={() => void changeStatus({ operationStatus: form.operationStatus === 'OPERATING' ? 'TEMP_CLOSED' : 'OPERATING' })} 
                        className={`mt-auto flex w-fit items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors ${form.operationStatus === 'OPERATING' ? 'border-danger text-danger hover:bg-danger/10' : 'border-accent text-accent hover:bg-accent/10'}`}>
                        {form.operationStatus === 'OPERATING' ? <><Lock size={16}/> Tạm đóng cửa</> : <><Unlock size={16}/> Mở hoạt động</>}
                      </button>
                    </div>
                  </div>
                  {saveError && <p role="status" className="text-sm text-primary mt-2">{saveError}</p>}
                </Section>
                
                <Section title="Lịch phục vụ (Đóng/mở dài ngày)">
                  <HomestayClosurePanel placeId={Number(id)} onChanged={() => setLogKey(n => n + 1)} />
                </Section>
                
                <Section title="Lịch sử thay đổi giá và lịch phòng">
                  <HomestayChangeLogPanel placeId={Number(id)} refreshKey={logKey} />
                </Section>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 md:p-6 shadow-[var(--shadow-card)]"><h2 className="font-semibold text-primary text-lg">{title}</h2>{children}</section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-2 text-sm font-semibold text-ink">{label}{children}</label>;
}
