import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:3000/api/v1';

// ── Token helpers ────────────────────────────────────────────────────────────

const KEYS = { access: 'accessToken', refresh: 'refreshToken' } as const;

export async function getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(KEYS.access),
    SecureStore.getItemAsync(KEYS.refresh),
  ]);
  return { accessToken, refreshToken };
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.access, accessToken),
    SecureStore.setItemAsync(KEYS.refresh, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.access),
    SecureStore.deleteItemAsync(KEYS.refresh),
  ]);
}

// ── Axios instance ───────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { accessToken } = await getTokens();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// Track in-flight refresh to avoid concurrent refresh storms
let refreshPromise: Promise<string> | null = null;

// Response interceptor — 401 → refresh → retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const { refreshToken } = await getTokens();
          if (!refreshToken) throw new Error('No refresh token');
          const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
            `${BASE_URL}/auth/refresh`,
            { refreshToken },
          );
          await saveTokens(data.accessToken, data.refreshToken);
          return data.accessToken;
        })().finally(() => { refreshPromise = null; });
      }

      const newAccessToken = await refreshPromise;
      original.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiClient(original);
    } catch {
      await clearTokens();
      // Navigation to Login is handled by the app's auth state listener
      return Promise.reject(error);
    }
  },
);
