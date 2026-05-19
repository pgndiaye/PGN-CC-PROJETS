// Shared types for EZVIZ Sénégal
// Used by both backend (NestJS) and mobile (React Native/Expo)
// Note: Role enum lives in @prisma/client on backend; mobile uses UserRole string union.

export type UserRole = 'ADMIN' | 'COMMERCIAL' | 'TECHNICIEN';

export interface UserPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
