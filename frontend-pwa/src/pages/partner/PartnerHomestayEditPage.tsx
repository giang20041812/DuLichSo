import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BedDouble, CheckCircle2, Circle, ClipboardList, Eye, EyeOff, History, Image as ImageIcon, Info, LocateFixed, Lock,
  MapPin, Save, ScrollText, Settings2, Sparkles, Unlock, X, type LucideIcon,
} from 'lucide-react';
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
import { Alert, Card, Field, LoadingBlock, PageHeader, Pill } from '@/components/partner/PartnerUI';
import { ui } from '@/lib/partnerUi';

const EMPTY: PartnerHomestayDetailDto = {
  id: 0, code: '', slug: '', name: '', description: '', address: '', regionName: '', regionId: null,
  latitude: null, longitude: null, contactPhone: '', contactEmail: '', reviewVideoUrl: '', accessNote: '',
  coverImageUrl: '', galleryUrls: [], amenities: [], checkInFrom: '', checkOutUntil: '',
  houseRules: '', cancellationPolicy: '', policyName: '', freeCancelCutoffHours: null, refundOnLateCancel: null,
  surchargeNote: '', visibility: 'DRAFT', operationStatus: 'OPERATING', isReadyToPublish: false,
  cooperativeName: '', providerCode: '',
};

type TabId = 'info' | 'address' | 'amenities' | 'rules' | 'media' | 'services' | 'operation';
type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;
const FORM_TABS: TabId[] = ['info', 'address', 'amenities', 'rules'];

export default function PartnerHomestayEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invalidId = id != null && (!Number.isSafeInteger(Number(id)) || Number(id) <= 0);
  const [form, setForm] = useState<PartnerHomestayDetailDto>(EMPTY);
  const [initialForm, setInitialForm] = useState<PartnerHomestayDetailDto | null>(null);
  const [options, setOptions] = useState<HomestayOptionsDto>({ regions: [], amenities: [] });
  const [loading, setLoading] = useState(!invalidId);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const [geo, setGeo] = useState<{ busy: boolean; text: string; ok: boolean }>({ busy: false, text: '', ok: true });
  const [logKey, setLogKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [mapLink, setMapLink] = useState('');

  useEffect(() => {
    if (invalidId) return;
    let active = true;
    Promise.all([fetchHomestayOptions(), id ? fetchPartnerHomestayDetail(Number(id)) : Promise.resolve({ ...EMPTY })])
      .then(([catalog, detail]) => { if (active) { setOptions(catalog); setForm(detail); setInitialForm(detail); setLoadError(''); } })
      .catch((error: unknown) => { if (active) setLoadError(homestayError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry, invalidId]);

  function set<K extends keyof PartnerHomestayDetailDto>(key: K, value: PartnerHomestayDetailDto[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function openTab(tab: TabId) {
    setActiveTab(tab);
    if (notice?.tone !== 'info') setNotice(null);
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

  const handleMapLinkChange = (url: string) => {
    setMapLink(url);
    const latLngMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const exclamationMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    
    let lat: number | null = null;
    let lng: number | null = null;
    
    if (latLngMatch) {
      lat = Number(latLngMatch[1]);
      lng = Number(latLngMatch[2]);
    } else if (exclamationMatch) {
      lat = Number(exclamationMatch[1]);
      lng = Number(exclamationMatch[2]);
    } else if (qMatch) {
      lat = Number(qMatch[1]);
      lng = Number(qMatch[2]);
    }

    const placeMatch = url.match(/\/place\/([^/@?]+)/);
    
    if (lat !== null || placeMatch) {
      setForm(prev => {
        const next = { ...prev };
        if (lat !== null && lng !== null) {
          next.latitude = lat;
          next.longitude = lng;
        }
        if (placeMatch && placeMatch[1]) {
          try {
            next.address = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
          } catch (e) {
            // ignore malformed URI
          }
        }
        return next;
      });
      setGeo({ busy: false, text: 'Đã trích xuất thông tin từ link Google Map.', ok: true });
    }
  };

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading || loadError) return;
    setSaving(true);
    setNotice(null);
    try {
      const saved = id ? await savePartnerHomestayDetail(Number(id), form) : await createPartnerHomestay(form);
      if (!id) {
        if (isSubmittedChange(saved)) navigate('/partner/homestays', { replace: true, state: { notice: saved.message } });
        else navigate(`/partner/homestay/${saved.id}/edit`, { replace: true });
      } else {
        setNotice(isSubmittedChange(saved) ? { tone: 'info', text: saved.message } : { tone: 'success', text: 'Đã lưu thay đổi.' });
      }
    } catch (error: unknown) { setNotice({ tone: 'error', text: homestayError(error) }); }
    finally { setSaving(false); }
  }

  async function changeStatus(request: UpdateStatusRequest, done: string) {
    if (!id || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const result = await updateHomestayStatus(Number(id), request);
      setForm(prev => ({ ...prev, visibility: result.visibility, operationStatus: result.operationStatus, isReadyToPublish: result.isReadyToPublish, alertNote: result.alertNote }));
      setNotice({ tone: 'success', text: done });
    } catch (error: unknown) { setNotice({ tone: 'error', text: homestayError(error) }); }
    finally { setSaving(false); }
  }

  const amenities = [...new Set([...options.amenities.map(a => a.name), ...form.amenities])];
  const published = form.visibility === 'PUBLISHED';
  const operating = form.operationStatus === 'OPERATING';

  const checklist: { done: boolean; label: string; tab: TabId }[] = [
    { done: !!form.description?.trim(), label: 'Mô tả giới thiệu', tab: 'info' },
    { done: !!form.contactPhone?.trim(), label: 'Số điện thoại liên hệ', tab: 'info' },
    { done: form.latitude != null && form.longitude != null, label: 'Địa chỉ và tọa độ', tab: 'address' },
    { done: form.amenities.length > 0, label: 'Tiện nghi', tab: 'amenities' },
    { done: !!form.cancellationPolicy?.trim(), label: 'Chính sách hủy phòng', tab: 'rules' },
    ...(id ? [{ done: !!form.coverImageUrl, label: 'Ảnh đại diện', tab: 'media' as const }] : []),
  ];
  const doneCount = checklist.filter(c => c.done).length;
  const tabDone = (tab: TabId) => {
    const items = checklist.filter(c => c.tab === tab);
    return items.length > 0 && items.every(c => c.done);
  };

  const tabs: { id: TabId; label: string; icon: LucideIcon; hint: string }[] = [
    { id: 'info', label: 'Thông tin cơ bản', icon: Info, hint: 'Tên, mô tả, liên hệ' },
    { id: 'address', label: 'Vị trí', icon: MapPin, hint: 'Địa chỉ, tọa độ, đường đi' },
    { id: 'amenities', label: 'Tiện nghi', icon: Sparkles, hint: 'Khu vực chung' },
    { id: 'rules', label: 'Chính sách', icon: ScrollText, hint: 'Giờ nhận/trả, nội quy, hủy' },
    ...(id ? [
      { id: 'media' as const, label: 'Hình ảnh', icon: ImageIcon, hint: 'Ảnh bìa và thư viện' },
      { id: 'services' as const, label: 'Dịch vụ', icon: ClipboardList, hint: 'Ăn uống, đưa đón...' },
      { id: 'operation' as const, label: 'Vận hành', icon: Settings2, hint: 'Hiển thị, đóng cửa, lịch sử' },
    ] : []),
  ];

  const isFormTab = FORM_TABS.includes(activeTab);
  const isDirty = initialForm ? JSON.stringify(form) !== JSON.stringify(initialForm) : false;
  const isComplete = doneCount === checklist.length;
  const canSave = id ? isDirty : isComplete;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader
        breadcrumbs={[
          { label: 'Bảng điều khiển', to: '/partner' },
          { label: 'Cơ sở lưu trú', to: '/partner/homestays' },
          { label: id ? form.name || 'Chỉnh sửa Homestay' : 'Tạo Homestay mới' }
        ]}
        title={id ? (
          <div className="flex flex-wrap items-center gap-3">
            <span>{form.name || 'Chỉnh sửa Homestay'}</span>
            <div className="flex items-center gap-2 mt-1 sm:mt-0">
              <button type="button" disabled={saving} onClick={() => void changeStatus({ visibility: published ? 'UNPUBLISHED' : 'PUBLISHED' }, published ? 'Đã ngừng hiển thị Homestay.' : 'Đã xuất bản Homestay.')}
                className={`group inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[12px] font-bold transition-all duration-200 ${published ? 'bg-primary-50 text-primary border-primary/20 hover:border-primary/40' : 'bg-sun-light text-ink-deep border-sun/30 hover:border-sun/50'}`}>
                {published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {published ? 'Đang hiển thị' : 'Bản nháp'}
              </button>
              
              <button type="button" disabled={saving} onClick={() => void changeStatus({ operationStatus: operating ? 'TEMP_CLOSED' : 'OPERATING' }, operating ? 'Đã tạm đóng cửa Homestay.' : 'Homestay đã mở lại.')}
                className={`group inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[12px] font-bold transition-all duration-200 ${operating ? 'bg-accent-50 text-accent-700 border-accent/30 hover:border-accent/50' : 'bg-danger/10 text-danger border-danger/20 hover:border-danger/40'}`}>
                {operating ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {operating ? 'Đang đón khách' : 'Tạm đóng cửa'}
              </button>
            </div>
          </div>
        ) : 'Tạo Homestay mới'}
        description={id ? 'Cập nhật thông tin hiển thị với khách và thiết lập vận hành.' : 'Điền thông tin cơ bản rồi lưu bản nháp. Sau đó bạn thêm ảnh, phòng và dịch vụ.'}
        actions={id && !loading && !loadError ? <>
          <Link to={`/partner/homestay/${id}/rooms`} className="flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary-700 hover:bg-primary/10"><BedDouble className="h-3.5 w-3.5" />Phòng & lịch</Link>
          <button type="submit" form="homestay-edit-form" disabled={saving || !canSave} className="flex items-center justify-center gap-1.5 rounded-md bg-coral/90 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-coral disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? 'Đang lưu...' : 'Yêu cầu duyệt thay đổi'}</button>
        </> : (!id && !loading && !loadError ? <>
          <button type="submit" form="homestay-edit-form" disabled={saving || !canSave} className="flex items-center justify-center gap-1.5 rounded-md bg-coral/90 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-coral disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? 'Đang lưu...' : 'Tạo bản nháp'}</button>
        </> : undefined)} />

      {invalidId ? <Alert tone="error">Mã Homestay không hợp lệ.</Alert>
        : loading ? <LoadingBlock label="Đang tải thông tin..." rows={3} />
        : loadError ? (
          <Alert tone="error" action={<button type="button" className={ui.btnGhost} onClick={() => { setLoading(true); setLoadError(''); setRetry(n => n + 1); }}>Thử lại</button>}>{loadError}</Alert>
        ) : (
          <>
            <div className="flex flex-col gap-6">
              <nav role="tablist" aria-label="Các mục thông tin" className="-mx-1 flex gap-1 overflow-x-auto border-b border-primary/10 px-1 scrollbar-hide">
                {tabs.map(({ id: tabId, label, icon: Icon }) => {
                  const active = activeTab === tabId;
                  const items = checklist.filter(c => c.tab === tabId);
                  const hasItems = items.length > 0;
                  const isDone = hasItems && items.every(c => c.done);

                  return (
                    <button key={tabId} type="button" role="tab" aria-selected={active} onClick={() => openTab(tabId)}
                      className={`relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ${active ? 'text-primary' : 'text-muted hover:text-ink'}`}>
                      <Icon className="h-4 w-4" />
                      <span className="whitespace-nowrap">{label}</span>
                      {hasItems && (isDone ? <CheckCircle2 className="h-4 w-4 text-accent-600" /> : <Circle className="h-4 w-4 text-muted/50" />)}
                      <span className={`absolute inset-x-2 -bottom-px h-0.5 rounded-sm bg-primary transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  );
                })}
              </nav>

              <div className="flex min-w-0 flex-1 flex-col gap-5">
                {!isFormTab && notice && <NoticeBar notice={notice} onClose={() => setNotice(null)} />}

                {isFormTab && (
                  <form id="homestay-edit-form" onSubmit={save} className="flex flex-col gap-5">
                    <fieldset disabled={saving} className="flex flex-col gap-5">
                      {activeTab === 'info' && (
                        <Card title="Thông tin chung" icon={Info} description="Tên và mô tả là thứ khách đọc đầu tiên. Viết ngắn gọn, nêu điểm đặc biệt của nơi ở.">
                          <Field label="Tên Homestay" required><input className={ui.input} required maxLength={255} value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Nhà sàn Bản Lác" /></Field>
                          <Field label="Mô tả tổng quan" hint={`${form.description?.length ?? 0}/10000 ký tự`}>
                            <textarea className={ui.textarea} rows={6} maxLength={10000} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Không gian, cảnh quan, trải nghiệm bản địa, món ăn đặc sản..." />
                          </Field>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Số điện thoại liên hệ" required><input className={ui.input} type="tel" required maxLength={32} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} /></Field>
                            <Field label="Email liên hệ"><input className={ui.input} type="email" maxLength={254} value={form.contactEmail ?? ''} onChange={e => set('contactEmail', e.target.value)} /></Field>
                          </div>
                          <Field label="Link video review TikTok" hint="Dán link TikTok (bắt đầu bằng https://). Link video đầy đủ dạng .../video/số sẽ được nhúng xem trực tiếp; link kênh hoặc link rút gọn (vt.tiktok.com) hiện nút mở TikTok cho khách.">
                            <input className={ui.input} type="url" maxLength={500} placeholder="https://www.tiktok.com/@tenkenh/video/7123456789012345678"
                              value={form.reviewVideoUrl ?? ''} onChange={e => set('reviewVideoUrl', e.target.value)} />
                          </Field>
                        </Card>
                      )}

                      {activeTab === 'address' && (
                        <Card title="Địa chỉ và tiếp cận" icon={MapPin} description="Nhập địa chỉ, hệ thống tự lấy tọa độ để hiện Homestay trên bản đồ.">
                          <Field label="Link Google Map" hint="Dán link Google Map để tự động trích xuất kinh độ, vĩ độ">
                            <input className={ui.input} type="url" value={mapLink} onChange={e => handleMapLinkChange(e.target.value)} placeholder="https://www.google.com/maps/place/..." />
                          </Field>
                          <Field label="Địa chỉ" required hint="Rời khỏi ô này để tự lấy tọa độ khi chưa có.">
                            <input className={ui.input} required maxLength={500} value={form.address} onChange={e => set('address', e.target.value)} onBlur={() => void locate(true)} placeholder="Số nhà / thôn, xã, huyện, tỉnh" />
                          </Field>
                          <Field label="Khu vực">
                            <select className={ui.select} value={form.regionId ?? ''} onChange={e => set('regionId', e.target.value ? Number(e.target.value) : null)}>
                              <option value="">Chưa chọn khu vực</option>
                              {options.regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                          </Field>
                          <div className="flex flex-col gap-3 rounded-md border border-primary/10 bg-canvas p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field label="Vĩ độ"><input className={ui.input} type="number" min={-90} max={90} step="any" value={form.latitude ?? ''} onChange={e => set('latitude', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                              <Field label="Kinh độ"><input className={ui.input} type="number" min={-180} max={180} step="any" value={form.longitude ?? ''} onChange={e => set('longitude', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <button type="button" disabled={geo.busy || form.address.trim().length < 5} onClick={() => void locate(false)} className={ui.btnOutline}>
                                <LocateFixed className="h-4 w-4" /> {geo.busy ? 'Đang tìm...' : 'Lấy tọa độ từ địa chỉ'}
                              </button>
                              {form.latitude != null && form.longitude != null && (
                                <a className="text-sm font-semibold text-primary underline-offset-2 hover:underline" target="_blank" rel="noreferrer"
                                  href={`https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=17/${form.latitude}/${form.longitude}`}>Xem vị trí trên bản đồ</a>
                              )}
                            </div>
                            {geo.text && <p role="status" className={`text-xs ${geo.ok ? 'text-muted' : 'text-danger'}`}>{geo.text}</p>}
                          </div>
                          <Field label="Hướng dẫn đường đi và tiếp cận"><textarea className={ui.textarea} rows={3} maxLength={10000} value={form.accessNote ?? ''} onChange={e => set('accessNote', e.target.value)} placeholder="Đường vào, chỗ gửi xe, mốc dễ nhận biết..." /></Field>
                        </Card>
                      )}

                      {activeTab === 'amenities' && (
                        <Card title="Tiện nghi và khu vực chung" icon={Sparkles} description="Bấm để chọn hoặc bỏ chọn. Tiện nghi riêng từng phòng khai báo ở trang Phòng.">
                          {amenities.length === 0 ? <p className="text-sm text-muted">Chưa có tiện nghi trong danh mục.</p> : (
                            <>
                              <div className="flex flex-wrap gap-2">
                                {amenities.map(name => {
                                  const on = form.amenities.includes(name);
                                  return (
                                    <button key={name} type="button" aria-pressed={on} onClick={() => set('amenities', on ? form.amenities.filter(a => a !== name) : [...form.amenities, name])}
                                      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition-all duration-200 ${on ? 'border-primary bg-primary text-white shadow-[var(--shadow-teal)]' : 'border-border bg-surface text-ink hover:border-primary/50 hover:text-primary'}`}>
                                      {on && <CheckCircle2 className="h-3.5 w-3.5" />}{name}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted">Đã chọn {form.amenities.length}/{amenities.length} tiện nghi.</p>
                            </>
                          )}
                        </Card>
                      )}

                      {activeTab === 'rules' && (
                        <>
                          <Card title="Giờ lưu trú và quy định" icon={ScrollText}>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field label="Nhận phòng từ"><input className={ui.input} type="time" value={form.checkInFrom} onChange={e => set('checkInFrom', e.target.value)} /></Field>
                              <Field label="Trả phòng trước"><input className={ui.input} type="time" value={form.checkOutUntil} onChange={e => set('checkOutUntil', e.target.value)} /></Field>
                            </div>
                            <Field label="Nội quy chung và đối tượng khách phù hợp"><textarea className={ui.textarea} rows={4} maxLength={10000} value={form.houseRules} onChange={e => set('houseRules', e.target.value)} /></Field>
                            <Field label="Quy định phụ thu"><textarea className={ui.textarea} rows={3} maxLength={10000} value={form.surchargeNote ?? ''} onChange={e => set('surchargeNote', e.target.value)} placeholder="Thêm người, thêm giường, ăn uống..." /></Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field label="Chính sách trẻ em"><textarea className={ui.textarea} rows={2} maxLength={10000} value={form.childrenPolicy ?? ''} onChange={e => set('childrenPolicy', e.target.value)} /></Field>
                              <Field label="Chính sách thú cưng"><textarea className={ui.textarea} rows={2} maxLength={10000} value={form.petsPolicy ?? ''} onChange={e => set('petsPolicy', e.target.value)} /></Field>
                            </div>
                            <Field label="Số khách và khách phù hợp"><textarea className={ui.textarea} rows={2} maxLength={10000} value={form.guestPolicy ?? ''} onChange={e => set('guestPolicy', e.target.value)} /></Field>
                          </Card>
                          <Card title="Chính sách hủy phòng" icon={ScrollText}
                            description={`${form.policyVersion ? `Phiên bản hiện tại: ${form.policyVersion}. ` : ''}Thay đổi chính sách sẽ tạo phiên bản mới; đơn đã đặt giữ nguyên chính sách cũ.`}>
                            <Field label="Tên chính sách"><input className={ui.input} maxLength={255} required={!!form.cancellationPolicy.trim()} value={form.policyName ?? ''} onChange={e => set('policyName', e.target.value)} placeholder="VD: Linh hoạt" /></Field>
                            <Field label="Nội dung chính sách"><textarea className={ui.textarea} rows={4} maxLength={10000} required={!!form.policyVersion || !!form.policyName?.trim() || form.freeCancelCutoffHours != null || form.refundOnLateCancel != null} value={form.cancellationPolicy} onChange={e => set('cancellationPolicy', e.target.value)} /></Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field label="Hủy miễn phí trước giờ nhận phòng (số giờ)"><input className={ui.input} type="number" min={0} max={2147483647} step={1} required={!!form.cancellationPolicy.trim()} value={form.freeCancelCutoffHours ?? ''} onChange={e => set('freeCancelCutoffHours', e.target.value === '' ? null : Number(e.target.value))} /></Field>
                              <Field label="Hoàn tiền khi hủy muộn">
                                <select className={ui.select} required={!!form.cancellationPolicy.trim()} value={form.refundOnLateCancel ?? ''} onChange={e => set('refundOnLateCancel', e.target.value === 'FULL_REFUND' ? 'FULL_REFUND' : e.target.value === 'NO_REFUND' ? 'NO_REFUND' : null)}>
                                  <option value="">Chọn mức hoàn tiền</option><option value="NO_REFUND">Không hoàn tiền</option><option value="FULL_REFUND">Hoàn toàn bộ</option>
                                </select>
                              </Field>
                            </div>
                          </Card>
                        </>
                      )}

                      {notice && (
                        <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-3 rounded-lg border border-primary/10 bg-surface/95 px-4 py-3 shadow-[var(--shadow-card-hover)] backdrop-blur sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1">
                            <NoticeBar notice={notice} onClose={() => setNotice(null)} />
                          </div>
                        </div>
                      )}
                    </fieldset>
                  </form>
                )}

                {id && activeTab === 'media' && (
                  <Card title="Ảnh Homestay" icon={ImageIcon} description="Ảnh đầu tiên được đánh dấu là ảnh bìa hiện ở danh sách tìm kiếm. Nên dùng ảnh ngang, sáng, rõ nét.">
                    <MediaManager target={{ placeId: Number(id) }} title="Ảnh Homestay" onChange={(media) => setForm(prev => ({ ...prev, coverImageUrl: media.find(m => m.role === 'COVER')?.url ?? '', galleryUrls: media.map(m => m.url) }))} />
                  </Card>
                )}

                {id && activeTab === 'services' && <PartnerServicesPanel placeId={Number(id)} />}

                {id && activeTab === 'operation' && (
                  <>
                    <Card title="Trạng thái hiển thị và vận hành" icon={Settings2}>
                      {form.alertNote && <Alert tone="info">{form.alertNote}</Alert>}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <StatusCard
                          title="Hiển thị trên web"
                          on={published}
                          text={published ? 'Khách có thể tìm thấy và đặt Homestay này.' : form.isReadyToPublish ? 'Đang là bản nháp. Hồ sơ đã đủ điều kiện để xuất bản.' : 'Đang là bản nháp, không hiển thị với khách.'}
                          button={published
                            ? <button type="button" disabled={saving} className={ui.btnOutline} onClick={() => void changeStatus({ visibility: 'UNPUBLISHED' }, 'Đã ngừng hiển thị Homestay.')}><EyeOff className="h-4 w-4" />Ngừng hiển thị</button>
                            : <button type="button" disabled={saving} className={ui.btnPrimary} onClick={() => void changeStatus({ visibility: 'PUBLISHED' }, 'Đã xuất bản Homestay.')}><Eye className="h-4 w-4" />Xuất bản</button>} />
                        <StatusCard
                          title="Trạng thái đón khách"
                          on={operating}
                          text={operating ? 'Homestay đang hoạt động và nhận khách bình thường.' : 'Homestay đang tạm đóng cửa, khách không đặt được.'}
                          button={operating
                            ? <button type="button" disabled={saving} className={ui.btnDanger} onClick={() => void changeStatus({ operationStatus: 'TEMP_CLOSED' }, 'Đã tạm đóng cửa Homestay.')}><Lock className="h-4 w-4" />Tạm đóng cửa</button>
                            : <button type="button" disabled={saving} className={ui.btnPrimary} onClick={() => void changeStatus({ operationStatus: 'OPERATING' }, 'Homestay đã mở lại.')}><Unlock className="h-4 w-4" />Mở hoạt động</button>} />
                      </div>
                    </Card>

                    <Card title="Lịch phục vụ (đóng/mở dài ngày)" icon={Lock} description="Đóng cả Homestay trong một khoảng ngày, ví dụ sửa chữa hoặc nghỉ lễ.">
                      <HomestayClosurePanel placeId={Number(id)} onChanged={() => setLogKey(n => n + 1)} />
                    </Card>

                    <Card title="Lịch sử thay đổi giá và lịch phòng" icon={History}>
                      <HomestayChangeLogPanel placeId={Number(id)} refreshKey={logKey} />
                    </Card>
                  </>
                )}
              </div>
            </div>
          </>
        )}
    </div>
  );
}

function NoticeBar({ notice, onClose }: { notice: NonNullable<Notice>; onClose: () => void }) {
  return (
    <Alert tone={notice.tone} action={<button type="button" aria-label="Đóng thông báo" className="text-current opacity-60 transition-opacity duration-200 hover:opacity-100" onClick={onClose}><X className="h-4 w-4" /></button>}>
      {notice.text}
    </Alert>
  );
}

function StatusCard({ title, on, text, button }: { title: string; on: boolean; text: string; button: ReactNode }) {
  return (
    <div className={`flex flex-col gap-3 rounded-md border p-4 transition-colors duration-200 ${on ? 'border-accent/30 bg-accent-50/50' : 'border-border bg-canvas'}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-sm ${on ? 'bg-accent' : 'bg-muted'}`} />
        <h3 className="text-sm font-bold text-ink-deep">{title}</h3>
      </div>
      <p className="text-xs leading-relaxed text-muted">{text}</p>
      <div className="mt-auto">{button}</div>
    </div>
  );
}
