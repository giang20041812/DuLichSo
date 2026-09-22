export type AccountRole = 'ADMIN' | 'PROVIDER';

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export type ProviderStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

export interface ProviderSummaryDto {
  id: number;
  name: string;
  status: ProviderStatus;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
}

export interface PortalLoginRequest {
  identifier: string;
  password: string;
  simulateError500?: boolean;
}

export interface PortalLoginResponse {
  token: string;
  tokenType: string;
  accountId: number;
  email?: string;
  phone?: string;
  fullName?: string;
  role: AccountRole;
  status: AccountStatus;
  provider?: ProviderSummaryDto;
  redirectUrl: string;
  message: string;
}

export interface AuthErrorResponse {
  status: number;
  errorCode: string;
  message: string;
  timestamp?: string;
}
