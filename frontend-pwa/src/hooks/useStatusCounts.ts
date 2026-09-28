import { useEffect, useState } from 'react';

/**
 * Số lượng cho từng tab trạng thái. `fetchCount('')` trả tổng của tab "Tất cả".
 * Tải lại khi `depsKey` đổi (các bộ lọc khác đổi) hoặc `refreshKey` đổi, nên số đếm luôn khớp với bộ lọc đang áp dụng.
 * Giữ số cũ trong lúc tải để tab không nhấp nháy; một tab lỗi chỉ ẩn số của tab đó.
 */
export function useStatusCounts<T extends string>(
  values: readonly T[],
  fetchCount: (status: T | '') => Promise<number>,
  depsKey: string,
  refreshKey = 0,
): Record<string, number | null> {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const valuesKey = values.join('|');

  useEffect(() => {
    let alive = true;
    const keys: (T | '')[] = ['', ...(valuesKey.split('|').filter(Boolean) as T[])];
    void Promise.allSettled(keys.map((k) => fetchCount(k))).then((results) => {
      if (!alive) return;
      const next: Record<string, number | null> = {};
      keys.forEach((k, i) => {
        const r = results[i];
        next[k] = r && r.status === 'fulfilled' ? r.value : null;
      });
      setCounts(next);
    });
    return () => {
      alive = false;
    };
    // fetchCount được tạo lại mỗi lần render; chỉ phụ thuộc vào khóa bộ lọc để không gọi lặp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey, depsKey, refreshKey]);

  return counts;
}
