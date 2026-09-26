/**
 * Tra cứu Audit Log chỉ đọc (FR-AD-17).
 * Khớp com.dulichso.bookingapi.dto.admin.AdminAuditLogDtos.AuditLogDto (backend-api).
 */
export type AuditActor = 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'SYSTEM';
export type AuditResult = 'SUCCESS' | 'FAILURE' | 'DENIED';

export interface AuditLogItem {
  id: number;
  actor: AuditActor;
  actorId: number | null;
  actorName: string | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  result: AuditResult | null;
  ip: string | null;
  reason: string | null;
  /** Chỉ có ở API chi tiết. */
  beforeData: Record<string, unknown> | null;
  /** Chỉ có ở API chi tiết. */
  afterData: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogSearchParams {
  from?: string;
  to?: string;
  actor?: AuditActor;
  actorId?: number;
  action?: string;
  entityType?: string;
  entityId?: number;
  result?: AuditResult;
  page?: number;
  size?: number;
}
