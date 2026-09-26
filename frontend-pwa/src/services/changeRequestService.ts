import type { SubmittedChange } from '@/types/changeRequest';

/** Backend trả 202 + SubmittedChange khi thay đổi của NCC được gửi chờ duyệt thay vì ghi trực tiếp. */
export function isSubmittedChange(value: unknown): value is SubmittedChange {
  return typeof value === 'object' && value !== null && 'changeRequestId' in value && 'status' in value;
}
