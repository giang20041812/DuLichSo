import { useEffect, useMemo, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';

const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 30;

/** Kiểm tra loại tệp và dung lượng trước khi tải lên (AGENTS.md: giới hạn loại file và dung lượng). */
function photoProblem(file: File): string | null {
  if (!PHOTO_ACCEPT.split(',').includes(file.type)) return `“${file.name}” không phải ảnh JPG, PNG hoặc WEBP.`;
  if (file.size > MAX_BYTES) return `“${file.name}” lớn hơn 10MB.`;
  return null;
}

/**
 * Chọn trước ảnh cho loại phòng chưa được tạo (UC-NCC-03): xem trước, bỏ bớt; ảnh được tải lên ngay sau khi lưu loại phòng.
 */
export default function PendingPhotoPicker({ files, onChange, disabled, onError }: {
  files: File[]; onChange: (files: File[]) => void; disabled?: boolean; onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function add(list: FileList | null) {
    if (!list?.length) return;
    const accepted: File[] = [];
    for (const file of list) {
      const problem = photoProblem(file);
      if (problem) onError(problem); else accepted.push(file);
    }
    onChange([...files, ...accepted].slice(0, MAX_FILES));
    if (input.current) input.current.value = '';
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-deep">Ảnh phòng <span className="font-normal text-muted">({files.length}/{MAX_FILES})</span></p>
        <label className={`flex cursor-pointer items-center gap-2 rounded-md border border-primary px-3 py-1.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary-50 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
          <ImagePlus size={16} /> Thêm ảnh
          <input ref={input} type="file" accept={PHOTO_ACCEPT} multiple className="sr-only" disabled={disabled} onChange={(e) => add(e.target.files)} />
        </label>
      </div>
      <p className="text-xs text-muted">JPG, PNG hoặc WEBP, tối đa 10MB mỗi ảnh. Ảnh đầu tiên là ảnh đại diện. Cần ít nhất một ảnh toàn phòng để loại phòng được công khai.</p>
      {files.length === 0 ? (
        <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted">Chưa chọn ảnh nào.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((file, i) => (
            <li key={`${file.name}-${file.lastModified}-${i}`} className="relative overflow-hidden rounded-md border border-border">
              <img src={previews[i]} alt={file.name} className="aspect-video w-full object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 rounded-sm bg-sun px-1.5 py-0.5 text-[10px] font-bold text-white">Ảnh đại diện</span>}
              <button type="button" disabled={disabled} aria-label={`Bỏ ảnh ${file.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-sm bg-white/90 text-danger hover:bg-white">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
