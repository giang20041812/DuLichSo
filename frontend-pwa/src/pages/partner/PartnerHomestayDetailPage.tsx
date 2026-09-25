import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin } from 'lucide-react';
import type { PartnerHomestayDetailDto, UpdateStatusRequest } from '@/types/partner';
import { fetchPartnerHomestayDetail, homestayError, updateHomestayStatus } from '@/services/partnerHomestayService';
import PartnerServicesPanel from '@/components/partner/PartnerServicesPanel';
import MediaManager from '@/components/partner/MediaManager';

export default function PartnerHomestayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [homestay, setHomestay] = useState<PartnerHomestayDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
      setLoadError('Mã Homestay không hợp lệ.'); setLoading(false); return;
    }
    fetchPartnerHomestayDetail(Number(id)).then(data => { if (active) setHomestay(data); })
      .catch((error: unknown) => { if (active) setLoadError(homestayError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);
  async function changeStatus(request: UpdateStatusRequest) {
    if (!homestay || saving) return;
    setSaving(true); setActionMessage('');
    try {
      const result = await updateHomestayStatus(homestay.id, request);
      setHomestay(prev => prev ? { ...prev, visibility: result.visibility, operationStatus: result.operationStatus, isReadyToPublish: result.isReadyToPublish, alertNote: result.alertNote } : prev);
      setActionMessage('Đã cập nhật trạng thái.');
    } catch (error: unknown) { setActionMessage(homestayError(error)); }
    finally { setSaving(false); }
  }
  if (loading) return <p role="status" className="py-12 text-center text-muted">Đang tải thông tin Homestay...</p>;
  if (loadError || !homestay) return <div role="alert" className="rounded-lg border border-danger/30 p-5 text-danger">{loadError || 'Không tìm thấy Homestay.'}<button onClick={() => setRetry(n => n + 1)} className="ml-3 rounded-md border px-3 py-1">Thử lại</button><Link to="/partner" className="ml-3 underline">Quay lại</Link></div>;
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-8">
      <Link to="/partner" className="flex items-center gap-2 text-sm text-primary"><ArrowLeft size={16} /> Homestay của tôi</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs text-muted">{homestay.cooperativeName} · {homestay.code}</p><h1 className="mt-1 font-display text-2xl font-bold">{homestay.name}</h1><p className="mt-2 flex items-center gap-2 text-sm text-muted"><MapPin size={16} />{homestay.address}</p></div>
        <Link to={`/partner/homestay/${homestay.id}/edit`} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"><Edit size={16} />Chỉnh sửa</Link>
      </div>
      {homestay.coverImageUrl && <img src={homestay.coverImageUrl} alt={homestay.name} className="max-h-80 w-full rounded-lg object-cover" />}
      <Section title="Hiển thị và vận hành">
        <p className="text-sm">{homestay.visibility === 'PUBLISHED' ? 'Đang hiển thị' : homestay.visibility === 'DRAFT' ? 'Bản nháp' : 'Ngừng hiển thị'} · {homestay.operationStatus === 'OPERATING' ? 'Đang hoạt động' : 'Tạm đóng cửa'}</p>
        {homestay.alertNote && <p className="text-sm text-muted">{homestay.alertNote}</p>}
        <div className="flex flex-wrap gap-3">
          <button disabled={saving} onClick={() => void changeStatus({ visibility: homestay.visibility === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED' })} className="rounded-md border border-primary px-4 py-2 text-sm text-primary disabled:opacity-50">{homestay.visibility === 'PUBLISHED' ? 'Ngừng hiển thị' : 'Xuất bản'}</button>
          <button disabled={saving} onClick={() => void changeStatus({ operationStatus: homestay.operationStatus === 'OPERATING' ? 'TEMP_CLOSED' : 'OPERATING' })} className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50">{homestay.operationStatus === 'OPERATING' ? 'Tạm đóng cửa' : 'Mở hoạt động'}</button>
        </div>
        {actionMessage && <p role="status" className="text-sm">{actionMessage}</p>}
      </Section>
      <Section title="Giới thiệu và liên hệ"><Text value={homestay.description} /><p className="text-sm">Điện thoại: {homestay.contactPhone || 'Chưa có'} · Email: {homestay.contactEmail || 'Chưa có'}</p><p className="text-sm">Khu vực: {homestay.regionName || 'Chưa chọn'}</p><Text value={homestay.accessNote} /></Section>
      <Section title="Tiện nghi và khu vực chung">{homestay.amenities.length ? <ul className="grid list-inside list-disc gap-2 text-sm sm:grid-cols-2">{homestay.amenities.map(a => <li key={a}>{a}</li>)}</ul> : <p className="text-sm text-muted">Chưa khai báo tiện nghi.</p>}</Section>
      <Section title="Quy định và chính sách lưu trú">
        <p className="font-semibold text-sm">Trẻ em</p><Text value={homestay.childrenPolicy}/><p className="font-semibold text-sm">Thú cưng</p><Text value={homestay.petsPolicy}/><p className="font-semibold text-sm">Số khách và đối tượng phù hợp</p><Text value={homestay.guestPolicy}/>
        <p className="text-sm">Nhận phòng: {homestay.checkInFrom || 'Chưa khai báo'} · Trả phòng: {homestay.checkOutUntil || 'Chưa khai báo'}</p>
        <Text value={homestay.houseRules} /><p className="text-sm font-semibold">Phụ thu</p><Text value={homestay.surchargeNote} />
        <p className="text-sm font-semibold">{homestay.policyName || 'Chính sách hủy'}{homestay.policyVersion ? ` · Phiên bản ${homestay.policyVersion}` : ''}</p><Text value={homestay.cancellationPolicy} />
        {homestay.freeCancelCutoffHours != null && <p className="text-sm">Hủy miễn phí trước {homestay.freeCancelCutoffHours} giờ. Hủy muộn: {homestay.refundOnLateCancel === 'FULL_REFUND' ? 'hoàn toàn bộ' : 'không hoàn tiền'}.</p>}
      </Section>
      <Section title="Phòng và hình ảnh"><p className="text-sm">{homestay.roomTypesCount ?? 0} loại phòng.</p>
        <Link to={`/partner/homestay/${homestay.id}/rooms`} className="text-primary underline">Quản lý phòng, giá và lịch bán</Link>
        <MediaManager target={{ placeId: homestay.id }} title="Ảnh Homestay" onChange={(media) => setHomestay(prev => prev ? { ...prev, coverImageUrl: media.find(m => m.role === 'COVER')?.url ?? '', galleryUrls: media.map(m => m.url) } : prev)} />
      </Section>
      <PartnerServicesPanel placeId={homestay.id}/>
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]"><h2 className="font-semibold text-primary">{title}</h2>{children}</section>;
}
function Text({ value }: { value?: string }) { return <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{value || 'Chưa có thông tin.'}</p>; }
