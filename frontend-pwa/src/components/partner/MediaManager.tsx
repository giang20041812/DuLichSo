import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { partnerMediaService, type MediaTarget } from '@/services/partnerMediaService';
import { homestayError } from '@/services/partnerHomestayService';
import type { MediaDto } from '@/types/partner';

const ACCEPT = 'image/jpeg,image/png,image/webp';

const message = (e: unknown) => (e instanceof Error && !('isAxiosError' in e) ? e.message : homestayError(e));

/**
 * FR-NCC-02 / FR-NCC-07: upload, chọn ảnh đại diện và xóa ảnh cho Homestay hoặc một loại phòng.
 * Ảnh đầu tiên tự thành ảnh đại diện; xóa ảnh đại diện thì ảnh kế tiếp được chọn thay.
 */
export default function MediaManager({ target, title, onChange }: { target: MediaTarget; title: string; onChange?: (media: MediaDto[]) => void }) {
  const [media, setMedia] = useState<MediaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const { placeId, roomId } = target;

  useEffect(() => {
    let active = true;
    partnerMediaService.list({ placeId, roomId })
      .then((data) => { if (active) setMedia(data); })
      .catch((e: unknown) => { if (active) setError(message(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [placeId, roomId]);

  async function run(label: string, action: () => Promise<MediaDto[]>) {
    setBusy(label); setError('');
    try { const next = await action(); setMedia(next); onChange?.(next); }
    catch (e: unknown) { setError(message(e)); }
    finally { setBusy(''); }
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    for (const [i, file] of [...files].entries()) {
      await run(`Đang tải ảnh ${i + 1}/${files.length}...`, () => partnerMediaService.upload({ placeId, roomId }, file));
    }
    if (input.current) input.current.value = '';
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-deep">{title} <span className="font-normal text-muted">({media.length}/30)</span></p>
        <label className={`flex cursor-pointer items-center gap-2 rounded-md border border-primary px-3 py-1.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary-50 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
          <ImagePlus size={16} /> Thêm ảnh
          <input ref={input} type="file" accept={ACCEPT} multiple className="sr-only" disabled={!!busy} onChange={(e) => void upload(e.target.files)} />
        </label>
      </div>
      <p className="text-xs text-muted">JPG, PNG hoặc WEBP, tối đa 10MB mỗi ảnh. Ảnh được tải thẳng lên dịch vụ lưu trữ ảnh.</p>
      {busy && <p role="status" className="text-xs text-primary">{busy}</p>}
      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-2.5 text-sm text-danger">{error}</p>}
      {loading ? <p role="status" className="text-sm text-muted">Đang tải ảnh...</p> : media.length === 0 ? (
        <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted">Chưa có ảnh nào.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => (
            <li key={m.mediaId} className="group relative overflow-hidden rounded-md border border-border">
              <img src={m.url} alt={m.caption ?? title} className="aspect-video w-full object-cover" loading="lazy" />
              {m.role === 'COVER' && <span className="absolute left-2 top-2 rounded-sm bg-sun px-1.5 py-0.5 text-[10px] font-bold text-white">Ảnh đại diện</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                {m.role !== 'COVER' && (
                  <button type="button" disabled={!!busy} onClick={() => void run('Đang đặt ảnh đại diện...', () => partnerMediaService.setCover({ placeId, roomId }, m.mediaId))}
                    className="flex items-center gap-1 rounded-sm bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink-deep hover:bg-white" aria-label="Đặt làm ảnh đại diện">
                    <Star size={12} /> Đại diện
                  </button>
                )}
                <button type="button" disabled={!!busy} onClick={() => { if (window.confirm('Xóa ảnh này?')) void run('Đang xóa ảnh...', () => partnerMediaService.remove({ placeId, roomId }, m.mediaId)); }}
                  className="flex items-center rounded-sm bg-white/90 p-1 text-danger hover:bg-white" aria-label="Xóa ảnh">
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
